import { db } from "./db";
import { 
  users, 
  salespersons,
  organizations, 
  contacts, 
  leads, 
  categories, 
  products, 
  productVariants,
  manufacturers,
  designJobs,
  orders,
  orderLineItems,
  manufacturing,
  manufacturingUpdates,
  favorites,
  savedViews
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "admin1234";

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function seedUsers() {
  console.log("Seeding users...");
  
  const usersData = [
    { email: "admin@local", name: "Admin", role: "admin" as const, isActive: true },
    { email: "sam@local", name: "Sam Sutton", role: "admin" as const, isActive: true },
    { email: "carter@local", name: "Carter Vail", role: "sales" as const, isActive: true },
    { email: "nicole@local", name: "Nicole (HoC)", role: "ops" as const, isActive: true },
    { email: "heather@local", name: "Heather", role: "ops" as const, isActive: true },
    { email: "charlie@local", name: "Charlie Reeves", role: "sales" as const, isActive: true },
    { email: "diangelo@local", name: "Diangelo Perry", role: "sales" as const, isActive: true },
    { email: "kg@local", name: "KG", role: "sales" as const, isActive: true },
    { email: "baker@local", name: "Baker Stewart", role: "designer" as const, isActive: true },
    { email: "design1@local", name: "Designer One", role: "designer" as const, isActive: true },
    { email: "design2@local", name: "Designer Two", role: "designer" as const, isActive: true },
    { email: "mfg_hawk@local", name: "Hawk Contact", role: "manufacturer" as const, isActive: true },
    { email: "mfg_ig@local", name: "ImprintGenie", role: "manufacturer" as const, isActive: true }
  ];

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  
  for (const userData of usersData) {
    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email!));
    
    if (!existingUser) {
      await db.insert(users).values({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: userData.isActive,
        passwordHash: hashedPassword,
        firstName: userData.name.split(" ")[0],
        lastName: userData.name.split(" ").slice(1).join(" ") || null,
        salesMapEnabled: true
      });
      console.log(`  Created user: ${userData.email}`);
    } else {
      console.log(`  User exists: ${userData.email}`);
    }
  }
}

async function seedSalespeople() {
  console.log("Seeding salespeople...");
  
  const salespeopleData = [
    { userEmail: "carter@local", territory: "National / Ops assist", quotaMonthly: "30000", active: true, notes: "Co-founder; daily ops & reviews." },
    { userEmail: "charlie@local", territory: "Southeast (AL/GA/FL)", quotaMonthly: "20000", active: true, notes: "Director of Sales; strong HS football/tennis network." },
    { userEmail: "diangelo@local", territory: "Low-income focus (AL)", quotaMonthly: "12000", active: true, notes: "HS wrestling coach." },
    { userEmail: "kg@local", territory: "Central Texas (DFW)", quotaMonthly: "15000", active: true, notes: "New rep; handles Upwork creatives sync." }
  ];

  for (const spData of salespeopleData) {
    // Get user ID
    const [user] = await db.select().from(users).where(eq(users.email, spData.userEmail!));
    if (!user) {
      console.log(`  Warning: User not found for salesperson: ${spData.userEmail}`);
      continue;
    }

    // Check if salesperson exists
    const [existing] = await db.select().from(salespersons).where(eq(salespersons.userId, user.id));
    
    if (!existing) {
      await db.insert(salespersons).values({
        userId: user.id,
        territory: spData.territory,
        quotaMonthly: spData.quotaMonthly,
        active: spData.active,
        notes: spData.notes
      });
      console.log(`  Created salesperson: ${spData.userEmail}`);
    } else {
      console.log(`  Salesperson exists: ${spData.userEmail}`);
    }
  }
}

async function seedOrganizations() {
  console.log("Seeding organizations...");
  
  const orgsData = [
    { name: "East Hamilton High School", sports: "Wrestling", city: "Chattanooga", state: "TN", notes: "Spirit pack client" },
    { name: "Mortimer Jordan High School", sports: "Wrestling", city: "Morris", state: "AL" },
    { name: "Weaver Golf", sports: "Golf", city: "Weaver", state: "AL", notes: "Sponsorship interest" },
    { name: "Tarleton State Wrestling", sports: "Wrestling", city: "Stephenville", state: "TX", notes: "Team-worn gear only" },
    { name: "Team GATA", sports: "Wrestling", city: "Gulf Coast", state: "FL" },
    { name: "Gulf Coast Wrestling Club", sports: "Wrestling", city: "Gulf Breeze", state: "FL" },
    { name: "Brooks High School", sports: "Wrestling", city: "Killen", state: "AL" },
    { name: "Fultondale High School", sports: "Wrestling", city: "Fultondale", state: "AL" }
  ];

  for (const orgData of orgsData) {
    // Check if org exists
    const [existing] = await db.select().from(organizations).where(eq(organizations.name, orgData.name));
    
    if (!existing) {
      await db.insert(organizations).values(orgData);
      console.log(`  Created organization: ${orgData.name}`);
    } else {
      console.log(`  Organization exists: ${orgData.name}`);
    }
  }
}

async function seedContacts() {
  console.log("Seeding contacts...");
  
  const contactsData = [
    { orgName: "East Hamilton High School", name: "Head Coach", email: "eham_coach@demo.org", phone: "000-000-0001", roleTitle: "Wrestling Coach" },
    { orgName: "Tarleton State Wrestling", name: "Program Director", email: "tarleton_dir@demo.org", phone: "000-000-0002", roleTitle: "Director" },
    { orgName: "Team GATA", name: "Club Admin", email: "gata_admin@demo.org", phone: "000-000-0003", roleTitle: "Admin" }
  ];

  for (const contactData of contactsData) {
    // Get org ID
    const [org] = await db.select().from(organizations).where(eq(organizations.name, contactData.orgName));
    if (!org) {
      console.log(`  Warning: Organization not found for contact: ${contactData.orgName}`);
      continue;
    }

    // Check if contact exists
    const [existing] = await db.select().from(contacts)
      .where(and(eq(contacts.orgId, org.id), eq(contacts.email, contactData.email!)));
    
    if (!existing) {
      await db.insert(contacts).values({
        orgId: org.id,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        roleTitle: contactData.roleTitle
      });
      console.log(`  Created contact: ${contactData.name} (${contactData.orgName})`);
    } else {
      console.log(`  Contact exists: ${contactData.name} (${contactData.orgName})`);
    }
  }
}

async function seedCategories() {
  console.log("Seeding categories...");
  
  const categoriesData = [
    { name: "Tees", description: "Short/long sleeve cotton & blends" },
    { name: "Fleece", description: "Hoodies, crewnecks, sweats" },
    { name: "Shorts", description: "Practice & lifestyle shorts" },
    { name: "Tech Suits", description: "Two-piece compression sets" },
    { name: "Singlets", description: "Performance wrestling singlets" },
    { name: "Bags", description: "Backpacks and gear bags" }
  ];

  for (const catData of categoriesData) {
    // Check if category exists
    const [existing] = await db.select().from(categories).where(eq(categories.name, catData.name));
    
    if (!existing) {
      await db.insert(categories).values(catData);
      console.log(`  Created category: ${catData.name}`);
    } else {
      console.log(`  Category exists: ${catData.name}`);
    }
  }
}

async function seedProducts() {
  console.log("Seeding products...");
  
  const productsData = [
    { sku: "TEE-C1717", name: "Rich Habits Heavy Tee", categoryName: "Tees", description: "Comfort Colors-style heavyweight tee", basePrice: "25", active: true },
    { sku: "FLEECE-CRW", name: "Rich Habits Crewneck", categoryName: "Fleece", description: "Midweight crewneck fleece", basePrice: "30", active: true },
    { sku: "SHORTS-CORE", name: "Core Training Shorts", categoryName: "Shorts", description: "Lightweight training shorts", basePrice: "20", active: true },
    { sku: "TECH-SET", name: "Performance Tech Suit", categoryName: "Tech Suits", description: "Compression top + bottom", basePrice: "60", active: true },
    { sku: "SINGLET-RH", name: "Performance Wrestling Singlet", categoryName: "Singlets", description: "Pro-cut, sublimated", basePrice: "35", active: true },
    { sku: "BAG-BPK", name: "Team Backpack", categoryName: "Bags", description: "Team backpack with logo", basePrice: "30", active: true }
  ];

  for (const prodData of productsData) {
    // Get category ID
    const [category] = await db.select().from(categories).where(eq(categories.name, prodData.categoryName));
    if (!category) {
      console.log(`  Warning: Category not found for product: ${prodData.categoryName}`);
      continue;
    }

    // Check if product exists
    const [existing] = await db.select().from(products).where(eq(products.sku, prodData.sku));
    
    if (!existing) {
      await db.insert(products).values({
        sku: prodData.sku,
        name: prodData.name,
        categoryId: category.id,
        description: prodData.description,
        basePrice: prodData.basePrice,
        active: prodData.active
      });
      console.log(`  Created product: ${prodData.sku} - ${prodData.name}`);
    } else {
      console.log(`  Product exists: ${prodData.sku} - ${prodData.name}`);
    }
  }
}

async function seedProductVariants() {
  console.log("Seeding product variants...");
  
  const variantsData = [
    { productSku: "TEE-C1717", variantCode: "TEE-C1717-BLK", color: "Black", material: "Cotton", msrp: "25", cost: "11" },
    { productSku: "FLEECE-CRW", variantCode: "FLEECE-CRW-CHR", color: "Charcoal", material: "Fleece", msrp: "30", cost: "14" },
    { productSku: "SHORTS-CORE", variantCode: "SHORTS-CORE-BLK", color: "Black", material: "Poly", msrp: "20", cost: "9" },
    { productSku: "TECH-SET", variantCode: "TECH-SET-PURP", color: "Purple", material: "Comp", msrp: "60", cost: "28" },
    { productSku: "SINGLET-RH", variantCode: "SINGLET-RH-PURP", color: "Purple", material: "Sublimated", msrp: "35", cost: "18" },
    { productSku: "BAG-BPK", variantCode: "BAG-BPK-BLK", color: "Black", material: "Nylon", msrp: "30", cost: "14" }
  ];

  for (const varData of variantsData) {
    // Get product ID
    const [product] = await db.select().from(products).where(eq(products.sku, varData.productSku));
    if (!product) {
      console.log(`  Warning: Product not found for variant: ${varData.productSku}`);
      continue;
    }

    // Check if variant exists
    const [existing] = await db.select().from(productVariants).where(eq(productVariants.variantCode, varData.variantCode));
    
    if (!existing) {
      await db.insert(productVariants).values({
        productId: product.id,
        variantCode: varData.variantCode,
        color: varData.color,
        material: varData.material,
        msrp: varData.msrp,
        cost: varData.cost
      });
      console.log(`  Created variant: ${varData.variantCode}`);
    } else {
      console.log(`  Variant exists: ${varData.variantCode}`);
    }
  }
}


async function seedManufacturers() {
  console.log("Seeding manufacturers...");
  
  const mfgData = [
    { 
      name: "Hawk Manufacturing", 
      contactName: "Hawk Team", 
      email: "hawk@demo.mfg", 
      phone: "000-000-1001", 
      notes: "Pakistan partner; dedicated Rich Habits wing", 
      leadTimeDays: 21, 
      minOrderQty: 12 
    },
    { 
      name: "ImprintGenie", 
      contactName: "Brian Emmen", 
      email: "brian@imprintgenie.demo", 
      phone: "000-000-1002", 
      notes: "Stateside on-demand / parent stores", 
      leadTimeDays: 10, 
      minOrderQty: 1 
    }
  ];

  for (const mfg of mfgData) {
    // Check if manufacturer exists
    const [existing] = await db.select().from(manufacturers).where(eq(manufacturers.name, mfg.name));
    
    if (!existing) {
      await db.insert(manufacturers).values(mfg);
      console.log(`  Created manufacturer: ${mfg.name}`);
    } else {
      console.log(`  Manufacturer exists: ${mfg.name}`);
    }
  }
}

async function seedLeads() {
  console.log("Seeding leads...");
  
  const leadsData = [
    { 
      leadCode: "L-00001", 
      orgName: "East Hamilton High School", 
      contactEmail: "eham_coach@demo.org", 
      ownerEmail: "charlie@local", 
      stage: "contacted" as const, 
      source: "cold call", 
      notes: "Interested in spirit pack; wants purple theme", 
      score: 65 
    },
    { 
      leadCode: "L-00002", 
      orgName: "Tarleton State Wrestling", 
      contactEmail: "tarleton_dir@demo.org", 
      ownerEmail: "carter@local", 
      stage: "qualified" as const, 
      source: "inbound", 
      notes: "Team-worn gear only; license questions", 
      score: 80 
    },
    { 
      leadCode: "L-00003", 
      orgName: "Team GATA", 
      contactEmail: "gata_admin@demo.org", 
      ownerEmail: "diangelo@local", 
      stage: "unclaimed" as const, 
      source: "referral", 
      notes: "Club pack + backpacks", 
      score: 55 
    }
  ];

  for (const leadData of leadsData) {
    // Get org ID
    const [org] = await db.select().from(organizations).where(eq(organizations.name, leadData.orgName));
    if (!org) {
      console.log(`  Warning: Organization not found for lead: ${leadData.orgName}`);
      continue;
    }

    // Get contact ID (optional)
    let contactId = null;
    if (leadData.contactEmail) {
      const [contact] = await db.select().from(contacts).where(eq(contacts.email, leadData.contactEmail));
      if (contact) contactId = contact.id;
    }

    // Get owner user ID (optional)
    let ownerUserId = null;
    if (leadData.ownerEmail) {
      const [user] = await db.select().from(users).where(eq(users.email, leadData.ownerEmail));
      if (user) ownerUserId = user.id;
    }

    // Check if lead exists
    const [existing] = await db.select().from(leads).where(eq(leads.leadCode, leadData.leadCode));
    
    if (!existing) {
      await db.insert(leads).values({
        leadCode: leadData.leadCode,
        orgId: org.id,
        contactId: contactId,
        ownerUserId: ownerUserId,
        stage: leadData.stage,
        source: leadData.source,
        notes: leadData.notes,
        score: leadData.score,
        claimedAt: leadData.stage !== "unclaimed" ? new Date() : null,
        createdAt: new Date(),
      } as any);
      console.log(`  Created lead: ${leadData.leadCode} - ${leadData.orgName}`);
    } else {
      console.log(`  Lead exists: ${leadData.leadCode}`);
    }
  }
}

async function seedDesignJobs() {
  console.log("Seeding design jobs...");
  
  const jobsData = [
    { 
      jobCode: "J-00001", 
      orgName: "East Hamilton High School", 
      leadCode: "L-00001",
      brief: "Primary purple, bold RH mark, minimal white accent tee + hoodie mockups",
      urgency: "normal" as const, 
      status: "in_progress" as const, 
      assignedDesignerEmail: "baker@local",
      renditionCount: 0
    }
  ];

  for (const jobData of jobsData) {
    // Get org ID
    const [org] = await db.select().from(organizations).where(eq(organizations.name, jobData.orgName));
    if (!org) {
      console.log(`  Warning: Organization not found for design job: ${jobData.orgName}`);
      continue;
    }

    // Get lead ID (optional)
    let leadId = null;
    if (jobData.leadCode) {
      const [lead] = await db.select().from(leads).where(eq(leads.leadCode, jobData.leadCode));
      if (lead) leadId = lead.id;
    }

    // Get designer user ID (optional)
    let designerId = null;
    if (jobData.assignedDesignerEmail) {
      const [user] = await db.select().from(users).where(eq(users.email, jobData.assignedDesignerEmail));
      if (user) designerId = user.id;
    }

    // Check if job exists
    const [existing] = await db.select().from(designJobs).where(eq(designJobs.jobCode, jobData.jobCode));
    
    if (!existing) {
      await db.insert(designJobs).values({
        jobCode: jobData.jobCode,
        orgId: org.id,
        leadId: leadId,
        brief: jobData.brief,
        urgency: jobData.urgency,
        status: jobData.status,
        assignedDesignerId: designerId,
        renditionCount: jobData.renditionCount
      });
      console.log(`  Created design job: ${jobData.jobCode} - ${jobData.orgName}`);
    } else {
      console.log(`  Design job exists: ${jobData.jobCode}`);
    }
  }
}

async function seedOrders() {
  console.log("Seeding orders...");
  
  const ordersData = [
    { 
      orderCode: "O-00001", 
      orgName: "East Hamilton High School", 
      leadCode: "L-00001",
      salespersonEmail: "charlie@local", 
      orderName: "2025 Spirit Pack",
      status: "waiting_sizes" as const, 
      designApproved: true, 
      sizesValidated: false, 
      depositReceived: false,
      manufacturerName: "Hawk Manufacturing",
      priority: "normal" as const
    }
  ];

  for (const orderData of ordersData) {
    // Get org ID
    const [org] = await db.select().from(organizations).where(eq(organizations.name, orderData.orgName));
    if (!org) {
      console.log(`  Warning: Organization not found for order: ${orderData.orgName}`);
      continue;
    }

    // Get lead ID (optional)
    let leadId = null;
    if (orderData.leadCode) {
      const [lead] = await db.select().from(leads).where(eq(leads.leadCode, orderData.leadCode));
      if (lead) leadId = lead.id;
    }

    // Get salesperson user ID (optional)
    let salespersonId = null;
    if (orderData.salespersonEmail) {
      const [user] = await db.select().from(users).where(eq(users.email, orderData.salespersonEmail));
      if (user) salespersonId = user.id;
    }

    // Get manufacturer ID (optional)
    let manufacturerId = null;
    if (orderData.manufacturerName) {
      const [mfg] = await db.select().from(manufacturers).where(eq(manufacturers.name, orderData.manufacturerName));
      if (mfg) manufacturerId = mfg.id;
    }

    // Check if order exists
    const [existing] = await db.select().from(orders).where(eq(orders.orderCode, orderData.orderCode));
    
    if (!existing) {
      await db.insert(orders).values({
        orderCode: orderData.orderCode,
        orgId: org.id,
        leadId: leadId,
        salespersonId: salespersonId,
        orderName: orderData.orderName,
        status: orderData.status,
        designApproved: orderData.designApproved,
        sizesValidated: orderData.sizesValidated,
        depositReceived: orderData.depositReceived,
        manufacturerId: manufacturerId,
        priority: orderData.priority
      });
      console.log(`  Created order: ${orderData.orderCode} - ${orderData.orderName}`);
    } else {
      console.log(`  Order exists: ${orderData.orderCode}`);
    }
  }
}

async function seedOrderLineItems() {
  console.log("Seeding order line items...");
  
  const lineItemsData = [
    { 
      orderCode: "O-00001", 
      variantCode: "TEE-C1717-BLK",
      itemName: "Heavy Tee (Black)", 
      colorNotes: "Purple/white print",
      yxs: 2, ys: 6, ym: 10, yl: 12, xs: 4, s: 10, m: 14, l: 14, xl: 8, xxl: 4, xxxl: 2,
      unitPrice: "23.50"
    },
    { 
      orderCode: "O-00001", 
      variantCode: "FLEECE-CRW-CHR",
      itemName: "Crewneck (Charcoal)", 
      colorNotes: "Purple chest print",
      yxs: 0, ys: 4, ym: 8, yl: 10, xs: 2, s: 8, m: 12, l: 12, xl: 6, xxl: 3, xxxl: 1,
      unitPrice: "28.5"
    },
    { 
      orderCode: "O-00001", 
      variantCode: "BAG-BPK-BLK",
      itemName: "Team Backpack", 
      colorNotes: "Logo on pocket",
      yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 10, m: 15, l: 15, xl: 0, xxl: 0, xxxl: 0,
      unitPrice: "28.5"
    }
  ];

  for (const itemData of lineItemsData) {
    // Get order ID
    const [order] = await db.select().from(orders).where(eq(orders.orderCode, itemData.orderCode));
    if (!order) {
      console.log(`  Warning: Order not found for line item: ${itemData.orderCode}`);
      continue;
    }

    // Get variant ID
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.variantCode, itemData.variantCode));
    if (!variant) {
      console.log(`  Warning: Variant not found for line item: ${itemData.variantCode}`);
      continue;
    }

    // Check if line item exists
    const [existing] = await db.select().from(orderLineItems)
      .where(and(eq(orderLineItems.orderId, order.id), eq(orderLineItems.variantId, variant.id)));
    
    if (!existing) {
      await db.insert(orderLineItems).values({
        orderId: order.id,
        variantId: variant.id,
        itemName: itemData.itemName,
        colorNotes: itemData.colorNotes,
        yxs: itemData.yxs,
        ys: itemData.ys,
        ym: itemData.ym,
        yl: itemData.yl,
        xs: itemData.xs,
        s: itemData.s,
        m: itemData.m,
        l: itemData.l,
        xl: itemData.xl,
        xxl: itemData.xxl,
        xxxl: itemData.xxxl,
        unitPrice: itemData.unitPrice,
        notes: ""
      });
      console.log(`  Created line item: ${itemData.orderCode} - ${itemData.itemName}`);
    } else {
      console.log(`  Line item exists: ${itemData.orderCode} - ${itemData.itemName}`);
    }
  }
}

async function seedManufacturingUpdates() {
  console.log("Seeding manufacturing updates...");
  
  const updatesData = [
    { 
      orderCode: "O-00001", 
      manufacturerName: "Hawk Manufacturing",
      status: "pending" as const, 
      notes: "Pending sizes validation" 
    }
  ];

  for (const updateData of updatesData) {
    // Get order ID
    const [order] = await db.select().from(orders).where(eq(orders.orderCode, updateData.orderCode));
    if (!order) {
      console.log(`  Warning: Order not found for mfg update: ${updateData.orderCode}`);
      continue;
    }

    // Get manufacturer ID
    const [mfg] = await db.select().from(manufacturers).where(eq(manufacturers.name, updateData.manufacturerName));
    if (!mfg) {
      console.log(`  Warning: Manufacturer not found for update: ${updateData.manufacturerName}`);
      continue;
    }

    // Find or create manufacturing record first
    let [manufacturingRecord] = await db.select().from(manufacturing).where(eq(manufacturing.orderId, order.id));
    
    if (!manufacturingRecord) {
      [manufacturingRecord] = await db.insert(manufacturing).values({
        orderId: order.id,
        status: updateData.status,
        manufacturerId: mfg.id,
      }).returning();
      console.log(`  Created manufacturing record for order: ${updateData.orderCode}`);
    }

    // Check if update exists
    const [existing] = await db.select().from(manufacturingUpdates)
      .where(and(eq(manufacturingUpdates.manufacturingId, manufacturingRecord.id), eq(manufacturingUpdates.status, updateData.status)));
    
    if (!existing) {
      // Get admin user for updatedBy
      const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@local"));
      
      await db.insert(manufacturingUpdates).values({
        manufacturingId: manufacturingRecord.id,
        manufacturerId: mfg.id,
        status: updateData.status,
        notes: updateData.notes,
        updatedBy: adminUser?.id || "admin"
      });
      console.log(`  Created mfg update: ${updateData.orderCode} - ${updateData.status}`);
    } else {
      console.log(`  Mfg update exists: ${updateData.orderCode} - ${updateData.status}`);
    }
  }
}

async function seedFavorites() {
  console.log("Seeding favorites...");
  
  const favoritesData = [
    { userEmail: "sam@local", entityType: "organization", entityName: "Tarleton State Wrestling" },
    { userEmail: "carter@local", entityType: "lead", entityCode: "L-00002" }
  ];

  for (const favData of favoritesData) {
    // Get user ID
    const [user] = await db.select().from(users).where(eq(users.email, favData.userEmail));
    if (!user) {
      console.log(`  Warning: User not found for favorite: ${favData.userEmail}`);
      continue;
    }

    // Get entity ID based on type
    let entityId = null;
    if (favData.entityType === "organization" && favData.entityName) {
      const [org] = await db.select().from(organizations).where(eq(organizations.name, favData.entityName));
      if (org) entityId = org.id;
    } else if (favData.entityType === "lead" && favData.entityCode) {
      const [lead] = await db.select().from(leads).where(eq(leads.leadCode, favData.entityCode));
      if (lead) entityId = lead.id;
    }

    if (!entityId) {
      console.log(`  Warning: Entity not found for favorite: ${favData.entityType}`);
      continue;
    }

    // Check if favorite exists
    const [existing] = await db.select().from(favorites)
      .where(and(
        eq(favorites.userId, user.id), 
        eq(favorites.entityType, favData.entityType),
        eq(favorites.entityId, entityId)
      ));
    
    if (!existing) {
      await db.insert(favorites).values({
        userId: user.id,
        entityType: favData.entityType,
        entityId: entityId
      });
      console.log(`  Created favorite: ${favData.userEmail} - ${favData.entityType}`);
    } else {
      console.log(`  Favorite exists: ${favData.userEmail} - ${favData.entityType}`);
    }
  }
}

async function seedSavedViews() {
  console.log("Seeding saved views...");
  
  const viewsData = [
    { 
      userEmail: "charlie@local", 
      pageKey: "orders", 
      name: "My Open Orders",
      queryBlob: { 
        filters: { 
          salesperson_email: "charlie@local", 
          status_in: ["new", "waiting_sizes", "invoiced", "production"] 
        }, 
        sort: [["est_delivery", "asc"]] 
      }
    }
  ];

  for (const viewData of viewsData) {
    // Get user ID
    const [user] = await db.select().from(users).where(eq(users.email, viewData.userEmail));
    if (!user) {
      console.log(`  Warning: User not found for saved view: ${viewData.userEmail}`);
      continue;
    }

    // Check if view exists
    const [existing] = await db.select().from(savedViews)
      .where(and(
        eq(savedViews.userId, user.id),
        eq(savedViews.pageKey, viewData.pageKey),
        eq(savedViews.name, viewData.name)
      ));
    
    if (!existing) {
      await db.insert(savedViews).values({
        userId: user.id,
        pageKey: viewData.pageKey,
        name: viewData.name,
        queryBlob: viewData.queryBlob
      });
      console.log(`  Created saved view: ${viewData.userEmail} - ${viewData.name}`);
    } else {
      console.log(`  Saved view exists: ${viewData.userEmail} - ${viewData.name}`);
    }
  }
}

async function seed() {
  console.log("Starting Rich Habits database seeding...");
  console.log("=========================================");
  
  try {
    // Seed in dependency order
    await seedUsers();
    await seedSalespeople();
    await seedOrganizations();
    await seedContacts();
    await seedCategories();
    await seedProducts();
    await seedProductVariants();
    await seedManufacturers();
    await seedLeads();
    await seedDesignJobs();
    await seedOrders();
    await seedOrderLineItems();
    await seedManufacturingUpdates();
    await seedFavorites();
    await seedSavedViews();
    
    // Seed permissions
    console.log("\n🌱 Seeding permissions...");
    const { storage } = await import("./storage");
    const { seedPermissions } = await import("./seedPermissions");
    await seedPermissions(storage);
    
    console.log("=========================================");
    console.log("✅ Database seeding completed successfully!");
    console.log("");
    console.log("Test user credentials:");
    console.log("  Email: admin@local");
    console.log("  Password: admin1234");
    console.log("");
    console.log("Other test users use the same password:");
    console.log("  - sam@local (admin)");
    console.log("  - carter@local (sales)");
    console.log("  - charlie@local (sales)"); 
    console.log("  - nicole@local (ops)");
    console.log("  - baker@local (designer)");
    console.log("  - mfg_hawk@local (manufacturer)");
    console.log("");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeder
seed();