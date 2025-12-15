import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { loadUserData, type AuthenticatedRequest } from "../permissions";
import { db } from "../db";
import { organizations, leads, orders } from "@shared/schema";
import { eq, and, isNotNull, isNull, sql, gte, lte, or } from "drizzle-orm";
import { geocodeUSCity, availableCities } from "../utils/geocoding";

const router = Router();

interface MapFeedQuery {
  north?: string;
  south?: string;
  east?: string;
  west?: string;
  zoom?: string;
  myItemsOnly?: string;
  showOrganizations?: string;
  showLeads?: string;
}

function buildLngCondition(lngColumn: any, westVal: number, eastVal: number) {
  if (westVal <= eastVal) {
    return and(
      gte(sql`CAST(${lngColumn} AS FLOAT)`, westVal),
      lte(sql`CAST(${lngColumn} AS FLOAT)`, eastVal)
    );
  } else {
    return or(
      gte(sql`CAST(${lngColumn} AS FLOAT)`, westVal),
      lte(sql`CAST(${lngColumn} AS FLOAT)`, eastVal)
    );
  }
}

router.get("/feed", isAuthenticated, loadUserData, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userData?.id;
    const userData = authReq.user?.userData;
    
    if (!userData?.salesMapEnabled) {
      return res.status(403).json({ message: "Sales Map feature is not enabled for your account" });
    }
    
    const { north, south, east, west, myItemsOnly, showOrganizations, showLeads } = req.query as MapFeedQuery;

    const hasBounds = north && south && east && west;
    const northVal = parseFloat(north || "90");
    const southVal = parseFloat(south || "-90");
    const eastVal = parseFloat(east || "180");
    const westVal = parseFloat(west || "-180");
    
    const wantOrgs = showOrganizations !== "false";
    const wantLeads = showLeads !== "false";

    let orgResults: any[] = [];
    if (wantOrgs) {
      const orgConditions: any[] = [
        eq(organizations.archived, false),
        isNotNull(organizations.geoLat),
        isNotNull(organizations.geoLng),
      ];
      
      if (hasBounds) {
        orgConditions.push(
          gte(sql`CAST(${organizations.geoLat} AS FLOAT)`, southVal),
          lte(sql`CAST(${organizations.geoLat} AS FLOAT)`, northVal),
          buildLngCondition(organizations.geoLng, westVal, eastVal)
        );
      }
      
      orgResults = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          geoLat: organizations.geoLat,
          geoLng: organizations.geoLng,
          city: organizations.city,
          state: organizations.state,
          clientType: organizations.clientType,
          logoUrl: organizations.logoUrl,
        })
        .from(organizations)
        .where(and(...orgConditions))
        .limit(500);
    }

    let leadResults: any[] = [];
    if (wantLeads) {
      const leadConditions: any[] = [
        eq(leads.archived, false),
        isNotNull(leads.geoLat),
        isNotNull(leads.geoLng),
      ];

      if (myItemsOnly === "true" && userId) {
        leadConditions.push(eq(leads.ownerUserId, userId));
      }

      if (hasBounds) {
        leadConditions.push(
          gte(sql`CAST(${leads.geoLat} AS FLOAT)`, southVal),
          lte(sql`CAST(${leads.geoLat} AS FLOAT)`, northVal),
          buildLngCondition(leads.geoLng, westVal, eastVal)
        );
      }

      leadResults = await db
        .select({
          id: leads.id,
          leadCode: leads.leadCode,
          orgId: leads.orgId,
          stage: leads.stage,
          geoLat: leads.geoLat,
          geoLng: leads.geoLng,
          ownerUserId: leads.ownerUserId,
        })
        .from(leads)
        .where(and(...leadConditions))
        .limit(500);
    }

    const orgIds = orgResults.map((o) => o.id);
    let orderCounts: Record<number, number> = {};
    let leadCounts: Record<number, number> = {};

    if (orgIds.length > 0) {
      const orderCountResults = await db
        .select({
          orgId: orders.orgId,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(sql`${orders.orgId} IN (${sql.join(orgIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(orders.orgId);

      orderCountResults.forEach((r) => {
        if (r.orgId) orderCounts[r.orgId] = r.count;
      });

      const leadCountResults = await db
        .select({
          orgId: leads.orgId,
          count: sql<number>`count(*)::int`,
        })
        .from(leads)
        .where(
          and(
            eq(leads.archived, false),
            sql`${leads.orgId} IN (${sql.join(orgIds.map(id => sql`${id}`), sql`, `)})`
          )
        )
        .groupBy(leads.orgId);

      leadCountResults.forEach((r) => {
        if (r.orgId) leadCounts[r.orgId] = r.count;
      });
    }

    const mappedOrgs = orgResults.map((org) => ({
      id: org.id,
      type: "organization" as const,
      name: org.name,
      lat: org.geoLat ? parseFloat(String(org.geoLat)) : 0,
      lng: org.geoLng ? parseFloat(String(org.geoLng)) : 0,
      city: org.city || undefined,
      state: org.state || undefined,
      clientType: org.clientType || undefined,
      orderCount: orderCounts[org.id] || 0,
      leadCount: leadCounts[org.id] || 0,
      logoUrl: org.logoUrl || undefined,
    }));

    const orgNameMap: Record<number, string> = {};
    orgResults.forEach((o) => {
      orgNameMap[o.id] = o.name;
    });

    const mappedLeads = leadResults.map((lead) => ({
      id: lead.id,
      type: "lead" as const,
      name: lead.orgId ? orgNameMap[lead.orgId] || `Lead ${lead.leadCode}` : `Lead ${lead.leadCode}`,
      lat: lead.geoLat ? parseFloat(String(lead.geoLat)) : 0,
      lng: lead.geoLng ? parseFloat(String(lead.geoLng)) : 0,
      stage: lead.stage,
      ownerUserId: lead.ownerUserId || undefined,
    }));

    res.json({
      organizations: mappedOrgs,
      leads: mappedLeads,
      bounds: {
        north: northVal,
        south: southVal,
        east: eastVal,
        west: westVal,
      },
    });
  } catch (error) {
    console.error("Error fetching sales map feed:", error);
    res.status(500).json({ message: "Failed to fetch map feed" });
  }
});

router.post("/geocode-organizations", isAuthenticated, loadUserData, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userData = authReq.user?.userData;
    
    if (!userData?.salesMapEnabled) {
      return res.status(403).json({ message: "Sales Map feature is not enabled for your account" });
    }
    
    const orgsWithoutGeo = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        city: organizations.city,
        state: organizations.state,
      })
      .from(organizations)
      .where(
        and(
          eq(organizations.archived, false),
          isNull(organizations.geoLat),
          isNotNull(organizations.city),
          isNotNull(organizations.state)
        )
      );

    let geocoded = 0;
    let failed = 0;
    const results: { id: number; name: string; success: boolean; coords?: { lat: number; lng: number } }[] = [];

    for (const org of orgsWithoutGeo) {
      const coords = geocodeUSCity(org.city || "", org.state || "");
      
      if (coords) {
        await db
          .update(organizations)
          .set({
            geoLat: String(coords.lat),
            geoLng: String(coords.lng),
          })
          .where(eq(organizations.id, org.id));
        
        geocoded++;
        results.push({ id: org.id, name: org.name, success: true, coords });
      } else {
        failed++;
        results.push({ id: org.id, name: org.name, success: false });
      }
    }

    res.json({
      message: `Geocoded ${geocoded} organizations, ${failed} could not be matched`,
      geocoded,
      failed,
      total: orgsWithoutGeo.length,
      availableCities,
      results,
    });
  } catch (error) {
    console.error("Error geocoding organizations:", error);
    res.status(500).json({ message: "Failed to geocode organizations" });
  }
});

router.post("/geocode-leads", isAuthenticated, loadUserData, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userData = authReq.user?.userData;
    
    if (!userData?.salesMapEnabled) {
      return res.status(403).json({ message: "Sales Map feature is not enabled for your account" });
    }
    
    const leadsWithoutGeo = await db
      .select({
        id: leads.id,
        leadCode: leads.leadCode,
        orgId: leads.orgId,
      })
      .from(leads)
      .where(
        and(
          eq(leads.archived, false),
          isNull(leads.geoLat),
          isNotNull(leads.orgId)
        )
      );

    let geocoded = 0;
    let failed = 0;

    for (const lead of leadsWithoutGeo) {
      if (!lead.orgId) {
        failed++;
        continue;
      }
      
      const [org] = await db
        .select({
          geoLat: organizations.geoLat,
          geoLng: organizations.geoLng,
          city: organizations.city,
          state: organizations.state,
        })
        .from(organizations)
        .where(eq(organizations.id, lead.orgId))
        .limit(1);
      
      if (org?.geoLat && org?.geoLng) {
        await db
          .update(leads)
          .set({
            geoLat: org.geoLat,
            geoLng: org.geoLng,
          })
          .where(eq(leads.id, lead.id));
        geocoded++;
      } else if (org?.city && org?.state) {
        const coords = geocodeUSCity(org.city, org.state);
        if (coords) {
          await db
            .update(leads)
            .set({
              geoLat: String(coords.lat),
              geoLng: String(coords.lng),
            })
            .where(eq(leads.id, lead.id));
          geocoded++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    res.json({
      message: `Geocoded ${geocoded} leads from organization locations, ${failed} could not be matched`,
      geocoded,
      failed,
      total: leadsWithoutGeo.length,
    });
  } catch (error) {
    console.error("Error geocoding leads:", error);
    res.status(500).json({ message: "Failed to geocode leads" });
  }
});

router.get("/orders", isAuthenticated, loadUserData, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userData = authReq.user?.userData;
    
    if (!userData?.salesMapEnabled) {
      return res.status(403).json({ message: "Sales Map feature is not enabled for your account" });
    }
    
    const recentOrders = await db
      .select({
        id: orders.id,
        orderCode: orders.orderCode,
        orgId: orders.orgId,
        status: orders.status,
        estDelivery: orders.estDelivery,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(50);

    const orderOrgIds = recentOrders.map(o => o.orgId).filter((id): id is number => id !== null);
    
    let orgMap: Record<number, { name: string; lat: number | null; lng: number | null }> = {};
    
    if (orderOrgIds.length > 0) {
      const orgsData = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          geoLat: organizations.geoLat,
          geoLng: organizations.geoLng,
        })
        .from(organizations)
        .where(sql`${organizations.id} IN (${sql.join(orderOrgIds.map(id => sql`${id}`), sql`, `)})`);

      orgsData.forEach(org => {
        orgMap[org.id] = {
          name: org.name,
          lat: org.geoLat ? parseFloat(String(org.geoLat)) : null,
          lng: org.geoLng ? parseFloat(String(org.geoLng)) : null,
        };
      });
    }

    const mappedOrders = recentOrders.map(order => ({
      id: order.id,
      orderCode: order.orderCode,
      orgId: order.orgId,
      orgName: order.orgId ? orgMap[order.orgId]?.name : undefined,
      status: order.status,
      estDelivery: order.estDelivery,
      createdAt: order.createdAt,
      lat: order.orgId ? orgMap[order.orgId]?.lat : null,
      lng: order.orgId ? orgMap[order.orgId]?.lng : null,
    }));

    res.json({ orders: mappedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

export default router;
