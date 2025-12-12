import { db } from "../server/db";
import {
  users,
  organizations,
  contacts,
  orders,
  quotes,
  quoteLineItems,
  designJobs,
  events,
  productVariants,
  salespersons
} from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

const HIGH_SCHOOLS = [
  { name: "Lincoln High School", city: "Portland", state: "OR", sports: "Football, Basketball" },
  { name: "Jefferson Academy", city: "Denver", state: "CO", sports: "Wrestling, Track" },
  { name: "Roosevelt High School", city: "Seattle", state: "WA", sports: "Soccer, Baseball" },
  { name: "Washington Prep", city: "Chicago", state: "IL", sports: "Basketball, Football" },
  { name: "Kennedy High School", city: "Sacramento", state: "CA", sports: "Wrestling, Swimming" },
  { name: "Franklin High School", city: "Nashville", state: "TN", sports: "Football, Track" },
  { name: "Madison Academy", city: "Phoenix", state: "AZ", sports: "Baseball, Basketball" },
  { name: "Adams High School", city: "Dallas", state: "TX", sports: "Football, Wrestling" },
  { name: "Jackson High School", city: "Atlanta", state: "GA", sports: "Track, Soccer" },
  { name: "Monroe Prep", city: "Miami", state: "FL", sports: "Swimming, Basketball" },
  { name: "Riverside High School", city: "Austin", state: "TX", sports: "Football, Baseball" },
  { name: "Oak Grove Academy", city: "Birmingham", state: "AL", sports: "Wrestling, Football" },
  { name: "Cedar Falls High School", city: "Minneapolis", state: "MN", sports: "Hockey, Basketball" },
  { name: "Pine Ridge High School", city: "Salt Lake City", state: "UT", sports: "Soccer, Wrestling" },
  { name: "Valley View High School", city: "San Diego", state: "CA", sports: "Track, Swimming" },
  { name: "Eastwood Academy", city: "Houston", state: "TX", sports: "Football, Basketball" },
  { name: "Westbrook High School", city: "Philadelphia", state: "PA", sports: "Wrestling, Baseball" },
  { name: "Northside Prep", city: "Boston", state: "MA", sports: "Soccer, Hockey" },
  { name: "Southgate High School", city: "Charlotte", state: "NC", sports: "Basketball, Football" },
  { name: "Sunset High School", city: "Las Vegas", state: "NV", sports: "Wrestling, Track" },
  { name: "Heritage Academy", city: "Tampa", state: "FL", sports: "Swimming, Soccer" },
  { name: "Liberty High School", city: "Indianapolis", state: "IN", sports: "Football, Basketball" },
  { name: "Unity High School", city: "Columbus", state: "OH", sports: "Wrestling, Baseball" },
  { name: "Victory Prep", city: "Memphis", state: "TN", sports: "Basketball, Track" },
  { name: "Pioneer High School", city: "Detroit", state: "MI", sports: "Football, Hockey" },
  { name: "Frontier Academy", city: "Oklahoma City", state: "OK", sports: "Wrestling, Football" },
  { name: "Mountain View High School", city: "Colorado Springs", state: "CO", sports: "Soccer, Track" },
  { name: "Lakeside High School", city: "Milwaukee", state: "WI", sports: "Hockey, Basketball" },
  { name: "Creekside Academy", city: "Kansas City", state: "MO", sports: "Baseball, Football" },
  { name: "Ridgewood High School", city: "Raleigh", state: "NC", sports: "Wrestling, Soccer" },
  { name: "Brookfield Prep", city: "Louisville", state: "KY", sports: "Basketball, Track" },
  { name: "Fairview High School", city: "Albuquerque", state: "NM", sports: "Football, Wrestling" },
  { name: "Clearwater Academy", city: "Jacksonville", state: "FL", sports: "Swimming, Baseball" },
  { name: "Springdale High School", city: "Tucson", state: "AZ", sports: "Soccer, Basketball" },
  { name: "Meadowbrook High School", city: "Fresno", state: "CA", sports: "Wrestling, Football" },
  { name: "Hilltop Academy", city: "Omaha", state: "NE", sports: "Track, Baseball" },
  { name: "Oakwood High School", city: "Cleveland", state: "OH", sports: "Basketball, Football" },
  { name: "Sycamore Prep", city: "Virginia Beach", state: "VA", sports: "Wrestling, Swimming" },
  { name: "Maple Grove High School", city: "New Orleans", state: "LA", sports: "Football, Basketball" },
  { name: "Willow Creek Academy", city: "Portland", state: "ME", sports: "Hockey, Soccer" },
  { name: "Evergreen High School", city: "Boise", state: "ID", sports: "Wrestling, Track" },
  { name: "Summit Prep", city: "Spokane", state: "WA", sports: "Basketball, Baseball" },
  { name: "Central High School", city: "Little Rock", state: "AR", sports: "Football, Wrestling" },
  { name: "Coastal Academy", city: "Charleston", state: "SC", sports: "Swimming, Soccer" },
  { name: "Prairie View High School", city: "Wichita", state: "KS", sports: "Track, Basketball" },
  { name: "Harbor High School", city: "San Francisco", state: "CA", sports: "Baseball, Football" },
  { name: "Forest Hills Academy", city: "Hartford", state: "CT", sports: "Hockey, Wrestling" },
  { name: "Stonebridge High School", city: "Providence", state: "RI", sports: "Soccer, Basketball" },
  { name: "Greenfield Prep", city: "Des Moines", state: "IA", sports: "Wrestling, Football" },
  { name: "Ashland High School", city: "Richmond", state: "VA", sports: "Track, Swimming" }
];

const COLLEGES = [
  { name: "Pacific State University", city: "Los Angeles", state: "CA", sports: "Football, Basketball" },
  { name: "Northern Tech Institute", city: "Boston", state: "MA", sports: "Wrestling, Rowing" },
  { name: "Midwest State College", city: "Chicago", state: "IL", sports: "Basketball, Track" },
  { name: "Southern University", city: "Atlanta", state: "GA", sports: "Football, Baseball" },
  { name: "Eastern State College", city: "New York", state: "NY", sports: "Soccer, Wrestling" },
  { name: "Rocky Mountain University", city: "Denver", state: "CO", sports: "Hockey, Skiing" },
  { name: "Coastal Tech", city: "Miami", state: "FL", sports: "Swimming, Tennis" },
  { name: "Prairie State University", city: "Lincoln", state: "NE", sports: "Football, Wrestling" },
  { name: "Valley Tech Institute", city: "Phoenix", state: "AZ", sports: "Basketball, Golf" },
  { name: "Great Lakes College", city: "Detroit", state: "MI", sports: "Hockey, Basketball" },
  { name: "Central Plains University", city: "Dallas", state: "TX", sports: "Football, Track" },
  { name: "Mountain State College", city: "Salt Lake City", state: "UT", sports: "Wrestling, Skiing" },
  { name: "Gulf Coast University", city: "Houston", state: "TX", sports: "Baseball, Swimming" },
  { name: "Northeast Tech", city: "Philadelphia", state: "PA", sports: "Wrestling, Soccer" },
  { name: "Southwest State College", city: "Albuquerque", state: "NM", sports: "Basketball, Football" },
  { name: "Lakeshore University", city: "Milwaukee", state: "WI", sports: "Hockey, Wrestling" },
  { name: "Appalachian Tech", city: "Charlotte", state: "NC", sports: "Basketball, Track" },
  { name: "Pacific Northwest College", city: "Seattle", state: "WA", sports: "Soccer, Rowing" },
  { name: "Heartland State University", city: "Kansas City", state: "MO", sports: "Football, Wrestling" },
  { name: "Capital Region Tech", city: "Sacramento", state: "CA", sports: "Basketball, Baseball" }
];

const TOUR_EVENTS = [
  { name: "Summer Music Fest 2025", eventType: "large-scale" as const, location: "Various Cities, USA" },
  { name: "Rock Festival Tour", eventType: "large-scale" as const, location: "Stadium Circuit, USA" },
  { name: "Country Roads Tour 2025", eventType: "large-scale" as const, location: "Southern States, USA" },
  { name: "Hip Hop Unity Tour", eventType: "large-scale" as const, location: "Major Cities, USA" },
  { name: "Indie Vibes Festival", eventType: "small-scale" as const, location: "Pacific Northwest, USA" },
  { name: "Metal Mayhem Tour 2025", eventType: "large-scale" as const, location: "Northeast Circuit, USA" },
  { name: "Jazz & Soul Experience", eventType: "seminar" as const, location: "New Orleans, LA" },
  { name: "Electronic Dance Festival", eventType: "large-scale" as const, location: "Las Vegas, NV" },
  { name: "Reggae Sunshine Tour", eventType: "small-scale" as const, location: "Florida, USA" },
  { name: "Punk Revival Festival 2025", eventType: "small-scale" as const, location: "California, USA" }
];

const CONTACTS_DATA = [
  { orgIndex: 0, name: "Coach Mike Thompson", email: "mthompson@lincoln.edu", phone: "503-555-0101", roleTitle: "Athletic Director" },
  { orgIndex: 1, name: "Sarah Johnson", email: "sjohnson@jefferson.edu", phone: "303-555-0102", roleTitle: "Sports Coordinator" },
  { orgIndex: 2, name: "David Chen", email: "dchen@roosevelt.edu", phone: "206-555-0103", roleTitle: "Head Coach" },
  { orgIndex: 3, name: "Maria Garcia", email: "mgarcia@washingtonprep.edu", phone: "312-555-0104", roleTitle: "Team Manager" },
  { orgIndex: 4, name: "James Wilson", email: "jwilson@kennedy.edu", phone: "916-555-0105", roleTitle: "Wrestling Coach" },
  { orgIndex: 5, name: "Emily Brown", email: "ebrown@franklin.edu", phone: "615-555-0106", roleTitle: "Athletic Trainer" },
  { orgIndex: 10, name: "Robert Taylor", email: "rtaylor@riverside.edu", phone: "512-555-0107", roleTitle: "Football Coach" },
  { orgIndex: 11, name: "Jennifer Martinez", email: "jmartinez@oakgrove.edu", phone: "205-555-0108", roleTitle: "Team Coordinator" },
  { orgIndex: 15, name: "William Anderson", email: "wanderson@eastwood.edu", phone: "713-555-0109", roleTitle: "Athletic Director" },
  { orgIndex: 20, name: "Lisa Thomas", email: "lthomas@heritage.edu", phone: "813-555-0110", roleTitle: "Sports Manager" },
  { orgIndex: 50, name: "Dr. Mark Peters", email: "mpeters@pacificstate.edu", phone: "213-555-0201", roleTitle: "Athletic Department Head" },
  { orgIndex: 51, name: "Prof. Susan Clark", email: "sclark@northerntech.edu", phone: "617-555-0202", roleTitle: "Sports Director" },
  { orgIndex: 52, name: "Dean Tom Richards", email: "trichards@midweststate.edu", phone: "312-555-0203", roleTitle: "Athletic Coordinator" },
  { orgIndex: 53, name: "Coach Pat Murphy", email: "pmurphy@southern.edu", phone: "404-555-0204", roleTitle: "Head Coach" },
  { orgIndex: 54, name: "Angela White", email: "awhite@easternstate.edu", phone: "212-555-0205", roleTitle: "Team Manager" },
  { orgIndex: 60, name: "Steve Harris", email: "sharris@centralplains.edu", phone: "214-555-0206", roleTitle: "Sports Coordinator" },
  { orgIndex: 65, name: "Karen Lee", email: "klee@appalachian.edu", phone: "704-555-0207", roleTitle: "Athletic Trainer" },
  { orgIndex: 70, name: "Brian Scott", email: "bscott@panthertrainllc.com", phone: "205-555-0301", roleTitle: "Operations Manager", isPrimary: true },
  { orgIndex: 70, name: "Michelle Davis", email: "mdavis@panthertrainllc.com", phone: "205-555-0302", roleTitle: "Design Lead" },
  { orgIndex: 70, name: "Kevin Wright", email: "kwright@panthertrainllc.com", phone: "205-555-0303", roleTitle: "Sales Director" }
];

const ORDER_STATUSES = ["new", "waiting_sizes", "invoiced", "production", "shipped", "completed"] as const;

async function getRandomSalespersonId(): Promise<string | null> {
  const [salesperson] = await db.select().from(salespersons).limit(1);
  if (salesperson) {
    return salesperson.userId;
  }
  const [user] = await db.select().from(users).where(eq(users.role, "sales")).limit(1);
  return user?.id || null;
}

async function getRandomVariantId(): Promise<number | null> {
  const [variant] = await db.select().from(productVariants).limit(1);
  return variant?.id || null;
}

async function getAdminUserId(): Promise<string> {
  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (!admin) {
    throw new Error("No admin user found. Please run the main seed script first.");
  }
  return admin.id;
}

async function getDesignerUserId(): Promise<string | null> {
  const [designer] = await db.select().from(users).where(eq(users.role, "designer")).limit(1);
  return designer?.id || null;
}

async function seedHighSchools() {
  console.log("\n📚 Seeding 50 High Schools...");
  let created = 0;
  let existed = 0;

  for (const school of HIGH_SCHOOLS) {
    const [existing] = await db.select().from(organizations).where(eq(organizations.name, school.name));
    
    if (!existing) {
      await db.insert(organizations).values({
        name: school.name,
        city: school.city,
        state: school.state,
        sports: school.sports,
        clientType: "high_school",
        notes: `High school athletics program`
      });
      created++;
      console.log(`  ✅ Created: ${school.name}`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 High Schools: ${created} created, ${existed} already existed`);
}

async function seedColleges() {
  console.log("\n🎓 Seeding 20 Colleges...");
  let created = 0;
  let existed = 0;

  for (const college of COLLEGES) {
    const [existing] = await db.select().from(organizations).where(eq(organizations.name, college.name));
    
    if (!existing) {
      await db.insert(organizations).values({
        name: college.name,
        city: college.city,
        state: college.state,
        sports: college.sports,
        clientType: "college",
        notes: `University athletics department`
      });
      created++;
      console.log(`  ✅ Created: ${college.name}`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 Colleges: ${created} created, ${existed} already existed`);
}

async function seedPantherTrain() {
  console.log("\n🐆 Seeding Panther Train Organization...");
  
  const [existing] = await db.select().from(organizations).where(eq(organizations.name, "Panther Train LLC"));
  
  if (!existing) {
    await db.insert(organizations).values({
      name: "Panther Train LLC",
      city: "Birmingham",
      state: "AL",
      clientType: "in_house",
      notes: "Rich Habits in-house merch and company gear",
      brandPrimaryColor: "#6B21A8",
      brandSecondaryColor: "#FBBF24"
    });
    console.log(`  ✅ Created: Panther Train LLC`);
  } else {
    console.log(`  ⏭️ Already exists: Panther Train LLC`);
  }
}

async function seedTourEvents() {
  console.log("\n🎸 Seeding 10 Tour Events...");
  let created = 0;
  let existed = 0;

  const adminId = await getAdminUserId();

  for (let i = 0; i < TOUR_EVENTS.length; i++) {
    const tourEvent = TOUR_EVENTS[i];
    const eventCode = `EVT-TOUR-${String(i + 1).padStart(3, '0')}`;
    
    const [existing] = await db.select().from(events).where(eq(events.eventCode, eventCode));
    
    if (!existing) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + i + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);

      await db.insert(events).values({
        eventCode,
        name: tourEvent.name,
        eventType: tourEvent.eventType,
        status: "planning",
        location: tourEvent.location,
        startDate,
        endDate,
        createdBy: adminId
      });
      created++;
      console.log(`  ✅ Created: ${tourEvent.name}`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 Tour Events: ${created} created, ${existed} already existed`);
}

async function seedContacts() {
  console.log("\n👥 Seeding 20+ Contacts...");
  let created = 0;
  let existed = 0;

  const allOrgs = await db.select().from(organizations);
  const highSchools = allOrgs.filter(o => o.clientType === "high_school");
  const colleges = allOrgs.filter(o => o.clientType === "college");
  const pantherTrain = allOrgs.find(o => o.name === "Panther Train LLC");

  for (const contactData of CONTACTS_DATA) {
    let org;
    if (contactData.orgIndex === 70 && pantherTrain) {
      org = pantherTrain;
    } else if (contactData.orgIndex >= 50 && contactData.orgIndex < 70) {
      org = colleges[contactData.orgIndex - 50];
    } else {
      org = highSchools[contactData.orgIndex];
    }

    if (!org) continue;

    const [existing] = await db.select().from(contacts)
      .where(and(eq(contacts.orgId, org.id), eq(contacts.email, contactData.email)));
    
    if (!existing) {
      await db.insert(contacts).values({
        orgId: org.id,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        roleTitle: contactData.roleTitle,
        isPrimary: contactData.isPrimary || false,
        role: "customer"
      });
      created++;
      console.log(`  ✅ Created: ${contactData.name} (${org.name})`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 Contacts: ${created} created, ${existed} already existed`);
}

async function seedOrders() {
  console.log("\n📦 Seeding 10+ Orders...");
  let created = 0;
  let existed = 0;

  const allOrgs = await db.select().from(organizations);
  const salespersonId = await getRandomSalespersonId();

  const ordersToCreate = [
    { orgName: "Lincoln High School", name: "2025 Football Season Pack", status: "new" as const },
    { orgName: "Jefferson Academy", name: "Wrestling Team Gear", status: "waiting_sizes" as const },
    { orgName: "Roosevelt High School", name: "Soccer Spring Collection", status: "invoiced" as const },
    { orgName: "Pacific State University", name: "Championship Apparel", status: "production" as const },
    { orgName: "Northern Tech Institute", name: "Rowing Team Order", status: "shipped" as const },
    { orgName: "Midwest State College", name: "Basketball Season 2025", status: "completed" as const },
    { orgName: "Panther Train LLC", name: "Company Staff Shirts", status: "new" as const },
    { orgName: "Southern University", name: "Baseball Team Uniforms", status: "waiting_sizes" as const },
    { orgName: "Eastern State College", name: "Soccer Team Kit", status: "invoiced" as const },
    { orgName: "Rocky Mountain University", name: "Winter Sports Bundle", status: "production" as const },
    { orgName: "Coastal Tech", name: "Swim Team Apparel", status: "new" as const },
    { orgName: "Prairie State University", name: "Football Fall 2025", status: "waiting_sizes" as const }
  ];

  for (let i = 0; i < ordersToCreate.length; i++) {
    const orderData = ordersToCreate[i];
    const org = allOrgs.find(o => o.name === orderData.orgName);
    if (!org) continue;

    const orderCode = `ORD-SEED-${String(i + 1).padStart(3, '0')}`;
    
    const [existing] = await db.select().from(orders).where(eq(orders.orderCode, orderCode));
    
    if (!existing) {
      const estDelivery = new Date();
      estDelivery.setMonth(estDelivery.getMonth() + 2);

      await db.insert(orders).values({
        orderCode,
        orgId: org.id,
        salespersonId,
        orderName: orderData.name,
        status: orderData.status,
        priority: "normal",
        estDelivery: estDelivery.toISOString().split('T')[0],
        shippingAddress: `${org.city}, ${org.state}`
      });
      created++;
      console.log(`  ✅ Created: ${orderCode} - ${orderData.name}`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 Orders: ${created} created, ${existed} already existed`);
}

async function seedQuotes() {
  console.log("\n💰 Seeding 10+ Quotes...");
  let created = 0;
  let existed = 0;

  const allOrgs = await db.select().from(organizations);
  const salespersonId = await getRandomSalespersonId();

  const quotesToCreate = [
    { orgName: "Washington Prep", name: "Basketball Season Quote", status: "draft" as const },
    { orgName: "Kennedy High School", name: "Swimming Team Estimate", status: "sent" as const },
    { orgName: "Franklin High School", name: "Track & Field Quote", status: "accepted" as const },
    { orgName: "Madison Academy", name: "Baseball Spring 2025", status: "draft" as const },
    { orgName: "Adams High School", name: "Football Package Quote", status: "sent" as const },
    { orgName: "Valley Tech Institute", name: "Golf Team Apparel", status: "accepted" as const },
    { orgName: "Great Lakes College", name: "Hockey Season Quote", status: "draft" as const },
    { orgName: "Central Plains University", name: "Football Program", status: "sent" as const },
    { orgName: "Mountain State College", name: "Ski Team Bundle", status: "draft" as const },
    { orgName: "Gulf Coast University", name: "Baseball Quote 2025", status: "accepted" as const },
    { orgName: "Jackson High School", name: "Soccer Quote", status: "sent" as const },
    { orgName: "Monroe Prep", name: "Swimming Team Quote", status: "draft" as const }
  ];

  for (let i = 0; i < quotesToCreate.length; i++) {
    const quoteData = quotesToCreate[i];
    const org = allOrgs.find(o => o.name === quoteData.orgName);
    if (!org) continue;

    const quoteCode = `QT-SEED-${String(i + 1).padStart(3, '0')}`;
    
    const [existing] = await db.select().from(quotes).where(eq(quotes.quoteCode, quoteCode));
    
    if (!existing) {
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);

      const subtotal = String(Math.floor(Math.random() * 5000) + 1000);
      const taxAmount = String((parseFloat(subtotal) * 0.08).toFixed(2));
      const total = String((parseFloat(subtotal) + parseFloat(taxAmount)).toFixed(2));

      await db.insert(quotes).values({
        quoteCode,
        orgId: org.id,
        salespersonId,
        quoteName: quoteData.name,
        status: quoteData.status,
        validUntil: validUntil.toISOString().split('T')[0],
        subtotal,
        taxRate: "0.0800",
        taxAmount,
        total,
        customerAddress: `${org.city}, ${org.state}`,
        notes: `Quote for ${org.name} - ${quoteData.name}`
      });
      created++;
      console.log(`  ✅ Created: ${quoteCode} - ${quoteData.name}`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 Quotes: ${created} created, ${existed} already existed`);
}

async function seedDesignJobs() {
  console.log("\n🎨 Seeding 5+ Design Jobs...");
  let created = 0;
  let existed = 0;

  const allOrgs = await db.select().from(organizations);
  const designerId = await getDesignerUserId();
  const salespersonId = await getRandomSalespersonId();

  const designJobsToCreate = [
    { orgName: "Lincoln High School", brief: "Modern football logo with school colors (purple and gold)", urgency: "high" as const, status: "in_progress" as const },
    { orgName: "Pacific State University", brief: "Championship merchandise designs - clean, modern aesthetic", urgency: "normal" as const, status: "pending" as const },
    { orgName: "Northern Tech Institute", brief: "Rowing team apparel with vintage nautical theme", urgency: "low" as const, status: "review" as const },
    { orgName: "Panther Train LLC", brief: "New company staff shirts with updated branding", urgency: "normal" as const, status: "approved" as const },
    { orgName: "Jefferson Academy", brief: "Wrestling singlets with aggressive panther design", urgency: "high" as const, status: "in_progress" as const },
    { orgName: "Southern University", brief: "Baseball uniform refresh for 2025 season", urgency: "normal" as const, status: "pending" as const },
    { orgName: "Roosevelt High School", brief: "Soccer kit with modern gradient design", urgency: "low" as const, status: "pending" as const }
  ];

  for (let i = 0; i < designJobsToCreate.length; i++) {
    const jobData = designJobsToCreate[i];
    const org = allOrgs.find(o => o.name === jobData.orgName);
    if (!org) continue;

    const jobCode = `DJ-SEED-${String(i + 1).padStart(3, '0')}`;
    
    const [existing] = await db.select().from(designJobs).where(eq(designJobs.jobCode, jobCode));
    
    if (!existing) {
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 1);

      await db.insert(designJobs).values({
        jobCode,
        orgId: org.id,
        brief: jobData.brief,
        urgency: jobData.urgency,
        status: jobData.status,
        assignedDesignerId: designerId,
        salespersonId,
        deadline: deadline.toISOString().split('T')[0],
        priority: jobData.urgency === "high" ? "high" : "normal",
        renditionCount: 0
      });
      created++;
      console.log(`  ✅ Created: ${jobCode} - ${org.name}`);
    } else {
      existed++;
    }
  }
  console.log(`  📊 Design Jobs: ${created} created, ${existed} already existed`);
}

async function main() {
  console.log("🚀 Starting Rich Habits LLC Database Seed Script");
  console.log("================================================");

  try {
    await seedHighSchools();
    await seedColleges();
    await seedPantherTrain();
    await seedTourEvents();
    await seedContacts();
    await seedOrders();
    await seedQuotes();
    await seedDesignJobs();

    console.log("\n================================================");
    console.log("✅ Seed script completed successfully!");
    console.log("\nSummary:");
    console.log("  - 50 High Schools");
    console.log("  - 20 Colleges");
    console.log("  - 1 Panther Train Organization");
    console.log("  - 10 Tour Events");
    console.log("  - 20+ Contacts");
    console.log("  - 12 Orders");
    console.log("  - 12 Quotes");
    console.log("  - 7 Design Jobs");
    console.log("================================================");
  } catch (error) {
    console.error("\n❌ Error running seed script:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
