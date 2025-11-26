
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
import * as fs from "fs";
import * as path from "path";

async function importProductionData() {
  console.log("📥 Importing production database data...");
  console.log("=========================================");
  console.log("⚠️  WARNING: This will delete all existing data in development database!");
  console.log("");
  
  try {
    const exportPath = path.join(process.cwd(), "production-data-export.json");
    
    if (!fs.existsSync(exportPath)) {
      console.error("❌ Export file not found. Please run export script first.");
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(exportPath, "utf-8"));

    // Delete existing data in reverse dependency order
    console.log("🗑️  Clearing existing data...");
    await db.delete(savedViews);
    await db.delete(favorites);
    await db.delete(manufacturingUpdates);
    await db.delete(manufacturing);
    await db.delete(orderLineItems);
    await db.delete(orders);
    await db.delete(designJobs);
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(manufacturers);
    await db.delete(leads);
    await db.delete(contacts);
    await db.delete(organizations);
    await db.delete(salespersons);
    await db.delete(users);

    // Insert data in dependency order
    console.log("📝 Importing data...");
    
    if (data.users.length > 0) {
      await db.insert(users).values(data.users);
      console.log(`  ✓ Imported ${data.users.length} users`);
    }
    
    if (data.salespersons.length > 0) {
      await db.insert(salespersons).values(data.salespersons);
      console.log(`  ✓ Imported ${data.salespersons.length} salespersons`);
    }
    
    if (data.organizations.length > 0) {
      await db.insert(organizations).values(data.organizations);
      console.log(`  ✓ Imported ${data.organizations.length} organizations`);
    }
    
    if (data.contacts.length > 0) {
      await db.insert(contacts).values(data.contacts);
      console.log(`  ✓ Imported ${data.contacts.length} contacts`);
    }
    
    if (data.leads.length > 0) {
      await db.insert(leads).values(data.leads);
      console.log(`  ✓ Imported ${data.leads.length} leads`);
    }
    
    if (data.categories.length > 0) {
      await db.insert(categories).values(data.categories);
      console.log(`  ✓ Imported ${data.categories.length} categories`);
    }
    
    if (data.products.length > 0) {
      await db.insert(products).values(data.products);
      console.log(`  ✓ Imported ${data.products.length} products`);
    }
    
    if (data.productVariants.length > 0) {
      await db.insert(productVariants).values(data.productVariants);
      console.log(`  ✓ Imported ${data.productVariants.length} product variants`);
    }
    
    if (data.manufacturers.length > 0) {
      await db.insert(manufacturers).values(data.manufacturers);
      console.log(`  ✓ Imported ${data.manufacturers.length} manufacturers`);
    }
    
    if (data.designJobs.length > 0) {
      await db.insert(designJobs).values(data.designJobs);
      console.log(`  ✓ Imported ${data.designJobs.length} design jobs`);
    }
    
    if (data.orders.length > 0) {
      await db.insert(orders).values(data.orders);
      console.log(`  ✓ Imported ${data.orders.length} orders`);
    }
    
    if (data.orderLineItems.length > 0) {
      await db.insert(orderLineItems).values(data.orderLineItems);
      console.log(`  ✓ Imported ${data.orderLineItems.length} order line items`);
    }
    
    if (data.manufacturing.length > 0) {
      await db.insert(manufacturing).values(data.manufacturing);
      console.log(`  ✓ Imported ${data.manufacturing.length} manufacturing records`);
    }
    
    if (data.manufacturingUpdates.length > 0) {
      await db.insert(manufacturingUpdates).values(data.manufacturingUpdates);
      console.log(`  ✓ Imported ${data.manufacturingUpdates.length} manufacturing updates`);
    }
    
    if (data.favorites.length > 0) {
      await db.insert(favorites).values(data.favorites);
      console.log(`  ✓ Imported ${data.favorites.length} favorites`);
    }
    
    if (data.savedViews.length > 0) {
      await db.insert(savedViews).values(data.savedViews);
      console.log(`  ✓ Imported ${data.savedViews.length} saved views`);
    }

    console.log("");
    console.log("✅ Import completed successfully!");
    console.log("");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  }
}

importProductionData();
