/**
 * Migration Script: Development to Production
 * 
 * This script exports data from the development database and provides
 * SQL statements to import into production.
 * 
 * USAGE:
 * 1. Run this script in development: npx tsx scripts/migrate-dev-to-prod.ts
 * 2. Review the generated SQL in scripts/migration-output.sql
 * 3. Run the SQL against your production database
 * 
 * WARNING: This will DELETE existing data in production before importing!
 */

import { db } from "../server/db";
import { 
  users, organizations, contacts, leads, categories, products, productVariants,
  designJobs, manufacturers, orders, orderLineItems, quotes, quoteLineItems,
  events, teamStores, teamStoreLineItems, tasks, salespersons, fabrics,
  invoices, invoicePayments, commissions, commissionPayments, financialTransactions,
  manufacturing, manufacturingUpdates, manufacturingUpdateLineItems,
  roles, resources, rolePermissions, userPermissions
} from "../shared/schema";
import * as fs from "fs";

const TABLES_TO_MIGRATE = [
  { name: "users", table: users, hasStringId: true },
  { name: "roles", table: roles },
  { name: "resources", table: resources },
  { name: "role_permissions", table: rolePermissions },
  { name: "user_permissions", table: userPermissions },
  { name: "salespersons", table: salespersons },
  { name: "organizations", table: organizations },
  { name: "contacts", table: contacts },
  { name: "leads", table: leads },
  { name: "categories", table: categories },
  { name: "products", table: products },
  { name: "product_variants", table: productVariants },
  { name: "manufacturers", table: manufacturers },
  { name: "design_jobs", table: designJobs },
  { name: "orders", table: orders },
  { name: "order_line_items", table: orderLineItems },
  { name: "quotes", table: quotes },
  { name: "quote_line_items", table: quoteLineItems },
  { name: "events", table: events },
  { name: "team_stores", table: teamStores },
  { name: "team_store_line_items", table: teamStoreLineItems },
  { name: "tasks", table: tasks },
  { name: "fabrics", table: fabrics },
  { name: "invoices", table: invoices },
  { name: "invoice_payments", table: invoicePayments },
  { name: "commissions", table: commissions },
  { name: "commission_payments", table: commissionPayments },
  { name: "financial_transactions", table: financialTransactions },
  { name: "manufacturing", table: manufacturing },
  { name: "manufacturing_updates", table: manufacturingUpdates },
  { name: "manufacturing_update_line_items", table: manufacturingUpdateLineItems },
];

function escapeValue(value: any): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertSQL(tableName: string, rows: any[]): string {
  if (rows.length === 0) return `-- No data in ${tableName}\n`;
  
  const columns = Object.keys(rows[0]);
  const lines: string[] = [];
  
  lines.push(`-- ${tableName}: ${rows.length} rows`);
  
  for (const row of rows) {
    const values = columns.map(col => escapeValue(row[col]));
    lines.push(`INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT DO NOTHING;`);
  }
  
  lines.push("");
  return lines.join("\n");
}

async function main() {
  console.log("🚀 Starting Development to Production Migration Export...\n");
  
  const output: string[] = [];
  
  output.push("-- ============================================");
  output.push("-- DEVELOPMENT TO PRODUCTION MIGRATION SCRIPT");
  output.push(`-- Generated: ${new Date().toISOString()}`);
  output.push("-- ============================================");
  output.push("");
  output.push("-- WARNING: This script will DELETE existing data!");
  output.push("-- Make sure you have a backup before running.");
  output.push("");
  output.push("BEGIN;");
  output.push("");
  
  output.push("-- ============================================");
  output.push("-- STEP 1: DELETE EXISTING DATA (in reverse order)");
  output.push("-- ============================================");
  output.push("");
  
  const reverseOrder = [...TABLES_TO_MIGRATE].reverse();
  for (const { name } of reverseOrder) {
    output.push(`DELETE FROM ${name};`);
  }
  output.push("");
  
  output.push("-- ============================================");
  output.push("-- STEP 2: RESET SEQUENCES");
  output.push("-- ============================================");
  output.push("");
  
  for (const { name, hasStringId } of TABLES_TO_MIGRATE) {
    if (!hasStringId) {
      output.push(`ALTER SEQUENCE IF EXISTS ${name}_id_seq RESTART WITH 1;`);
    }
  }
  output.push("");
  
  output.push("-- ============================================");
  output.push("-- STEP 3: INSERT DATA FROM DEVELOPMENT");
  output.push("-- ============================================");
  output.push("");
  
  for (const { name, table } of TABLES_TO_MIGRATE) {
    try {
      console.log(`📦 Exporting ${name}...`);
      const rows = await db.select().from(table);
      output.push(generateInsertSQL(name, rows));
      console.log(`   ✅ ${rows.length} rows`);
    } catch (error) {
      console.log(`   ⚠️ Error exporting ${name}: ${error}`);
      output.push(`-- Error exporting ${name}: ${error}\n`);
    }
  }
  
  output.push("-- ============================================");
  output.push("-- STEP 4: UPDATE SEQUENCES TO MAX ID");
  output.push("-- ============================================");
  output.push("");
  
  for (const { name, hasStringId } of TABLES_TO_MIGRATE) {
    if (!hasStringId) {
      output.push(`SELECT setval('${name}_id_seq', COALESCE((SELECT MAX(id) FROM ${name}), 0) + 1, false);`);
    }
  }
  output.push("");
  
  output.push("COMMIT;");
  output.push("");
  output.push("-- Migration complete!");
  
  const outputPath = "scripts/migration-output.sql";
  fs.writeFileSync(outputPath, output.join("\n"));
  
  console.log("\n✅ Migration SQL exported successfully!");
  console.log(`📄 Output file: ${outputPath}`);
  console.log("\nNext steps:");
  console.log("1. Review the generated SQL file");
  console.log("2. Connect to your production database");
  console.log("3. Run the SQL script against production");
  console.log("\n⚠️  WARNING: This will DELETE all existing production data!");
}

main().catch(console.error).finally(() => process.exit(0));
