
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
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

neonConfig.webSocketConstructor = ws;

async function exportProductionData() {
  console.log("📦 Exporting production database data...");
  console.log("=========================================");
  
  // Use custom database URL if provided, otherwise use default
  const databaseUrl = process.env.EXPORT_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or EXPORT_DATABASE_URL must be set");
  }
  
  console.log("📍 Using database URL:", databaseUrl.substring(0, 30) + "...");
  console.log("");
  
  try {
    // Create database connection with the specified URL
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle({ client: pool, schema });
    
    const data = {
      users: await db.select().from(users),
      salespersons: await db.select().from(salespersons),
      organizations: await db.select().from(organizations),
      contacts: await db.select().from(contacts),
      leads: await db.select().from(leads),
      categories: await db.select().from(categories),
      products: await db.select().from(products),
      productVariants: await db.select().from(productVariants),
      manufacturers: await db.select().from(manufacturers),
      designJobs: await db.select().from(designJobs),
      orders: await db.select().from(orders),
      orderLineItems: await db.select().from(orderLineItems),
      manufacturing: await db.select().from(manufacturing),
      manufacturingUpdates: await db.select().from(manufacturingUpdates),
      favorites: await db.select().from(favorites),
      savedViews: await db.select().from(savedViews)
    };

    const exportPath = path.join(process.cwd(), "production-data-export.json");
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

    // Also create a text file version
    const textExportPath = path.join(process.cwd(), "production-data-export.txt");
    let textContent = "PRODUCTION DATABASE EXPORT\n";
    textContent += "=".repeat(80) + "\n";
    textContent += `Export Date: ${new Date().toISOString()}\n`;
    textContent += "=".repeat(80) + "\n\n";

    // Export each table
    for (const [tableName, records] of Object.entries(data)) {
      textContent += `\n${"=".repeat(80)}\n`;
      textContent += `TABLE: ${tableName.toUpperCase()}\n`;
      textContent += `Total Records: ${records.length}\n`;
      textContent += `${"=".repeat(80)}\n\n`;
      
      records.forEach((record: any, index: number) => {
        textContent += `--- Record ${index + 1} ---\n`;
        for (const [key, value] of Object.entries(record)) {
          const displayValue = value === null ? "NULL" : 
                              typeof value === 'object' ? JSON.stringify(value) : 
                              String(value);
          textContent += `  ${key}: ${displayValue}\n`;
        }
        textContent += "\n";
      });
    }

    fs.writeFileSync(textExportPath, textContent);

    console.log("✅ Export completed successfully!");
    console.log(`📁 JSON data exported to: ${exportPath}`);
    console.log(`📁 Text data exported to: ${textExportPath}`);
    console.log("");
    console.log("Export summary:");
    console.log(`  Users: ${data.users.length}`);
    console.log(`  Salespersons: ${data.salespersons.length}`);
    console.log(`  Organizations: ${data.organizations.length}`);
    console.log(`  Contacts: ${data.contacts.length}`);
    console.log(`  Leads: ${data.leads.length}`);
    console.log(`  Categories: ${data.categories.length}`);
    console.log(`  Products: ${data.products.length}`);
    console.log(`  Product Variants: ${data.productVariants.length}`);
    console.log(`  Manufacturers: ${data.manufacturers.length}`);
    console.log(`  Design Jobs: ${data.designJobs.length}`);
    console.log(`  Orders: ${data.orders.length}`);
    console.log(`  Order Line Items: ${data.orderLineItems.length}`);
    console.log(`  Manufacturing: ${data.manufacturing.length}`);
    console.log(`  Manufacturing Updates: ${data.manufacturingUpdates.length}`);
    console.log(`  Favorites: ${data.favorites.length}`);
    console.log(`  Saved Views: ${data.savedViews.length}`);
    console.log("");
    console.log("💡 Both files are available in your workspace root directory.");
    console.log("   You can download them by right-clicking the files in the file tree.");
    console.log("");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error exporting data:", error);
    process.exit(1);
  }
}

exportProductionData();
