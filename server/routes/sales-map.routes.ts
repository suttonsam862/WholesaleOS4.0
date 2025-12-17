import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { loadUserData, type AuthenticatedRequest } from "../permissions";
import { db } from "../db";
import { organizations, leads, orders, designJobs } from "@shared/schema";
import { eq, and, isNotNull, isNull, sql, gte, lte, or, lt } from "drizzle-orm";
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
  showOrders?: string;
  showDesignJobs?: string;
  showAttentionOnly?: string;
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
    
    // Sales users have access by default; admins/ops/others need explicit flag
    const canAccessSalesMap = userData?.salesMapEnabled || userData?.role === 'sales';
    if (!canAccessSalesMap && userData?.role !== 'admin' && userData?.role !== 'ops') {
      return res.status(403).json({ message: "Sales Map feature is not enabled for your account" });
    }
    
    const { north, south, east, west, myItemsOnly, showOrganizations, showLeads, showOrders, showDesignJobs, showAttentionOnly } = req.query as MapFeedQuery;

    const hasBounds = north && south && east && west;
    const northVal = parseFloat(north || "90");
    const southVal = parseFloat(south || "-90");
    const eastVal = parseFloat(east || "180");
    const westVal = parseFloat(west || "-180");
    
    const wantOrgs = showOrganizations !== "false";
    const wantLeads = showLeads !== "false";
    const wantOrders = showOrders === "true";
    const wantDesignJobs = showDesignJobs === "true";
    const attentionOnly = showAttentionOnly === "true";
    const today = new Date().toISOString().split('T')[0];

    let orgResults: any[] = [];
    if (wantOrgs) {
      const orgConditions: any[] = [
        eq(organizations.archived, false),
      ];
      
      if (hasBounds) {
        orgConditions.push(
          isNotNull(organizations.geoLat),
          isNotNull(organizations.geoLng),
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

    const mappedOrgs = orgResults
      .filter((org) => org.geoLat && org.geoLng)
      .map((org) => ({
        id: org.id,
        type: "organization" as const,
        name: org.name,
        lat: parseFloat(String(org.geoLat)),
        lng: parseFloat(String(org.geoLng)),
        city: org.city || undefined,
        state: org.state || undefined,
        clientType: org.clientType || undefined,
        orderCount: orderCounts[org.id] || 0,
        leadCount: leadCounts[org.id] || 0,
        logoUrl: org.logoUrl || undefined,
      }));

    const orgNameMap: Record<number, string> = {};
    const orgGeoMap: Record<number, { lat: number; lng: number; name: string }> = {};
    orgResults.forEach((o) => {
      orgNameMap[o.id] = o.name;
      if (o.geoLat && o.geoLng) {
        orgGeoMap[o.id] = {
          lat: parseFloat(String(o.geoLat)),
          lng: parseFloat(String(o.geoLng)),
          name: o.name,
        };
      }
    });

    const mappedLeads = leadResults.map((lead) => {
      const isHot = lead.stage === "hot_lead" || lead.stage === "lead" || lead.stage === "mock_up";
      return {
        id: lead.id,
        type: "lead" as const,
        name: lead.orgId ? orgNameMap[lead.orgId] || `Lead ${lead.leadCode}` : `Lead ${lead.leadCode}`,
        lat: lead.geoLat ? parseFloat(String(lead.geoLat)) : 0,
        lng: lead.geoLng ? parseFloat(String(lead.geoLng)) : 0,
        stage: lead.stage,
        ownerUserId: lead.ownerUserId || undefined,
        needsAttention: isHot,
        attentionReason: isHot ? "Active lead needs attention" : undefined,
      };
    });

    let orderResults: any[] = [];
    if (wantOrders) {
      const activeStatuses = ["pending", "confirmed", "in_production", "ready_to_ship"];
      orderResults = await db
        .select({
          id: orders.id,
          orderCode: orders.orderCode,
          orgId: orders.orgId,
          status: orders.status,
          estDelivery: orders.estDelivery,
        })
        .from(orders)
        .where(
          sql`${orders.status} IN (${sql.join(activeStatuses.map(s => sql`${s}`), sql`, `)})`
        )
        .limit(500);

      const orderOrgIds = orderResults
        .map((o) => o.orgId)
        .filter((id): id is number => id !== null && !(id in orgGeoMap));
      
      if (orderOrgIds.length > 0) {
        const uniqueOrderOrgIds = Array.from(new Set(orderOrgIds));
        const orderOrgs = await db
          .select({
            id: organizations.id,
            name: organizations.name,
            geoLat: organizations.geoLat,
            geoLng: organizations.geoLng,
          })
          .from(organizations)
          .where(sql`${organizations.id} IN (${sql.join(uniqueOrderOrgIds.map(id => sql`${id}`), sql`, `)})`);

        orderOrgs.forEach((org) => {
          orgNameMap[org.id] = org.name;
          if (org.geoLat && org.geoLng) {
            orgGeoMap[org.id] = {
              lat: parseFloat(String(org.geoLat)),
              lng: parseFloat(String(org.geoLng)),
              name: org.name,
            };
          }
        });
      }
    }

    const mappedOrders = orderResults.map((order) => {
      const isOverdue = order.estDelivery && new Date(order.estDelivery) < new Date();
      const orgInfo = order.orgId ? orgGeoMap[order.orgId] : null;
      return {
        id: order.id,
        type: "order" as const,
        name: `Order ${order.orderCode}`,
        lat: orgInfo?.lat || 0,
        lng: orgInfo?.lng || 0,
        status: order.status,
        estDelivery: order.estDelivery,
        needsAttention: isOverdue,
        attentionReason: isOverdue ? "Order overdue" : undefined,
      };
    }).filter(o => o.lat !== 0 && o.lng !== 0);

    let designJobResults: any[] = [];
    if (wantDesignJobs) {
      const activeStatuses = ["pending", "assigned", "in_progress", "review"];
      designJobResults = await db
        .select({
          id: designJobs.id,
          jobCode: designJobs.jobCode,
          orgId: designJobs.orgId,
          status: designJobs.status,
          urgency: designJobs.urgency,
          priority: designJobs.priority,
          deadline: designJobs.deadline,
        })
        .from(designJobs)
        .where(
          and(
            sql`${designJobs.status} IN (${sql.join(activeStatuses.map(s => sql`${s}`), sql`, `)})`,
            eq(designJobs.archived, false)
          )
        )
        .limit(500);

      const designJobOrgIds = designJobResults
        .map((j) => j.orgId)
        .filter((id): id is number => id !== null && !(id in orgGeoMap));
      
      if (designJobOrgIds.length > 0) {
        const uniqueDesignJobOrgIds = Array.from(new Set(designJobOrgIds));
        const designJobOrgs = await db
          .select({
            id: organizations.id,
            name: organizations.name,
            geoLat: organizations.geoLat,
            geoLng: organizations.geoLng,
          })
          .from(organizations)
          .where(sql`${organizations.id} IN (${sql.join(uniqueDesignJobOrgIds.map(id => sql`${id}`), sql`, `)})`);

        designJobOrgs.forEach((org) => {
          orgNameMap[org.id] = org.name;
          if (org.geoLat && org.geoLng) {
            orgGeoMap[org.id] = {
              lat: parseFloat(String(org.geoLat)),
              lng: parseFloat(String(org.geoLng)),
              name: org.name,
            };
          }
        });
      }
    }

    const mappedDesignJobs = designJobResults.map((job) => {
      const isOverdue = job.deadline && new Date(job.deadline) < new Date();
      const isUrgent = job.urgency === "high" || job.urgency === "rush";
      const orgInfo = job.orgId ? orgGeoMap[job.orgId] : null;
      return {
        id: job.id,
        type: "designJob" as const,
        name: `Design ${job.jobCode}`,
        lat: orgInfo?.lat || 0,
        lng: orgInfo?.lng || 0,
        status: job.status,
        urgency: job.urgency,
        priority: job.priority,
        deadline: job.deadline,
        needsAttention: isOverdue || isUrgent,
        attentionReason: isOverdue ? "Design job overdue" : isUrgent ? "Urgent design job" : undefined,
      };
    }).filter(j => j.lat !== 0 && j.lng !== 0);

    res.json({
      organizations: mappedOrgs,
      leads: attentionOnly ? mappedLeads.filter(l => l.needsAttention) : mappedLeads,
      orders: attentionOnly ? mappedOrders.filter(o => o.needsAttention) : mappedOrders,
      designJobs: attentionOnly ? mappedDesignJobs.filter(j => j.needsAttention) : mappedDesignJobs,
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
    
    const canAccessSalesMap = userData?.salesMapEnabled || userData?.role === 'sales' || userData?.role === 'admin' || userData?.role === 'ops';
    if (!canAccessSalesMap) {
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
    
    const canAccessSalesMap = userData?.salesMapEnabled || userData?.role === 'sales' || userData?.role === 'admin' || userData?.role === 'ops';
    if (!canAccessSalesMap) {
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
    
    const canAccessSalesMap = userData?.salesMapEnabled || userData?.role === 'sales' || userData?.role === 'admin' || userData?.role === 'ops';
    if (!canAccessSalesMap) {
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

router.get("/attention", isAuthenticated, loadUserData, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userData = authReq.user?.userData;
    const userId = authReq.user?.userData?.id;
    
    const canAccessSalesMap = userData?.salesMapEnabled || userData?.role === 'sales' || userData?.role === 'admin' || userData?.role === 'ops';
    if (!canAccessSalesMap) {
      return res.status(403).json({ message: "Sales Map feature is not enabled for your account" });
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const isAdminOrOps = userData.role === "admin" || userData.role === "ops";

    const overdueOrdersQuery = await db
      .select({
        id: orders.id,
        orderCode: orders.orderCode,
        orgId: orders.orgId,
        status: orders.status,
        estDelivery: orders.estDelivery,
      })
      .from(orders)
      .where(
        and(
          lt(orders.estDelivery, todayStr),
          sql`${orders.status} NOT IN ('delivered', 'cancelled', 'completed')`
        )
      )
      .limit(20);

    const hotLeadsQuery = await db
      .select({
        id: leads.id,
        leadCode: leads.leadCode,
        orgId: leads.orgId,
        stage: leads.stage,
        ownerUserId: leads.ownerUserId,
        geoLat: leads.geoLat,
        geoLng: leads.geoLng,
      })
      .from(leads)
      .where(
        and(
          eq(leads.archived, false),
          sql`${leads.stage} IN ('hot_lead', 'lead', 'mock_up')`,
          isAdminOrOps ? sql`1=1` : eq(leads.ownerUserId, userId || "")
        )
      )
      .limit(20);

    const stalledDesignJobsQuery = await db
      .select({
        id: designJobs.id,
        jobCode: designJobs.jobCode,
        orgId: designJobs.orgId,
        status: designJobs.status,
        urgency: designJobs.urgency,
        deadline: designJobs.deadline,
      })
      .from(designJobs)
      .where(
        and(
          eq(designJobs.archived, false),
          or(
            lt(designJobs.deadline, todayStr),
            sql`${designJobs.urgency} IN ('high', 'rush')`
          ),
          sql`${designJobs.status} IN ('pending', 'assigned', 'in_progress', 'review')`
        )
      )
      .limit(20);

    const orgIds = new Set<number>();
    overdueOrdersQuery.forEach(o => o.orgId && orgIds.add(o.orgId));
    hotLeadsQuery.forEach(l => l.orgId && orgIds.add(l.orgId));
    stalledDesignJobsQuery.forEach(j => j.orgId && orgIds.add(j.orgId));

    const orgGeoMap: Record<number, { name: string; lat: number; lng: number }> = {};
    if (orgIds.size > 0) {
      const orgsData = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          geoLat: organizations.geoLat,
          geoLng: organizations.geoLng,
        })
        .from(organizations)
        .where(sql`${organizations.id} IN (${sql.join(Array.from(orgIds).map(id => sql`${id}`), sql`, `)})`);

      orgsData.forEach(org => {
        if (org.geoLat && org.geoLng) {
          orgGeoMap[org.id] = {
            name: org.name,
            lat: parseFloat(String(org.geoLat)),
            lng: parseFloat(String(org.geoLng)),
          };
        }
      });
    }

    const overdueOrders = overdueOrdersQuery.map(o => {
      const daysOverdue = o.estDelivery ? Math.floor((today.getTime() - new Date(o.estDelivery).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const orgInfo = o.orgId ? orgGeoMap[o.orgId] : null;
      return {
        id: o.id,
        type: "order" as const,
        name: `Order ${o.orderCode}`,
        reason: `${daysOverdue} days overdue`,
        severity: daysOverdue > 7 ? "critical" as const : daysOverdue > 3 ? "high" as const : "medium" as const,
        lat: orgInfo?.lat,
        lng: orgInfo?.lng,
        daysOverdue,
        deadline: o.estDelivery,
      };
    });

    const hotLeads = hotLeadsQuery.map(l => {
      const orgInfo = l.orgId ? orgGeoMap[l.orgId] : null;
      return {
        id: l.id,
        type: "lead" as const,
        name: `Lead ${l.leadCode}`,
        reason: `${l.stage === "hot_lead" ? "Hot" : l.stage === "mock_up" ? "Mock-up" : "Active"} lead needs attention`,
        severity: l.stage === "hot_lead" ? "high" as const : "medium" as const,
        lat: l.geoLat ? parseFloat(String(l.geoLat)) : orgInfo?.lat,
        lng: l.geoLng ? parseFloat(String(l.geoLng)) : orgInfo?.lng,
      };
    });

    const stalledDesignJobs = stalledDesignJobsQuery.map(j => {
      const isOverdue = j.deadline && new Date(j.deadline) < today;
      const daysOverdue = j.deadline ? Math.floor((today.getTime() - new Date(j.deadline).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const orgInfo = j.orgId ? orgGeoMap[j.orgId] : null;
      return {
        id: j.id,
        type: "designJob" as const,
        name: `Design ${j.jobCode}`,
        reason: isOverdue ? `${daysOverdue} days overdue` : `${j.urgency} urgency`,
        severity: j.urgency === "rush" ? "critical" as const : j.urgency === "high" || isOverdue ? "high" as const : "medium" as const,
        lat: orgInfo?.lat,
        lng: orgInfo?.lng,
        daysOverdue: isOverdue ? daysOverdue : undefined,
        deadline: j.deadline,
      };
    });

    res.json({
      overdueOrders,
      hotLeads,
      stalledDesignJobs,
      urgentOrders: [],
      counts: {
        overdueOrders: overdueOrders.length,
        hotLeads: hotLeads.length,
        stalledDesignJobs: stalledDesignJobs.length,
        urgentOrders: 0,
        total: overdueOrders.length + hotLeads.length + stalledDesignJobs.length,
      },
    });
  } catch (error) {
    console.error("Error fetching attention items:", error);
    res.status(500).json({ message: "Failed to fetch attention items" });
  }
});

export default router;
