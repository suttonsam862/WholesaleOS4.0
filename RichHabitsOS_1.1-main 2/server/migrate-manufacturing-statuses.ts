import { db } from "./db";
import { manufacturing, manufacturingUpdates } from "@shared/schema";
import { eq, or } from "drizzle-orm";

// Migration script to update legacy manufacturing statuses to new 7-stage workflow
async function migrateManufacturingStatuses() {
  console.log('🔄 Starting manufacturing status migration...');
  
  const statusMapping: Record<string, string> = {
    'pending': 'awaiting_admin_confirmation',
    'in_progress': 'cutting_sewing',
    'complete': 'complete'
  };
  
  try {
    // Update manufacturing records
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      const result = await db
        .update(manufacturing)
        .set({ status: newStatus as any })
        .where(eq(manufacturing.status, oldStatus as any));
      
      console.log(`✅ Updated manufacturing records: ${oldStatus} → ${newStatus}`);
    }
    
    // Update manufacturing updates
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      const result = await db
        .update(manufacturingUpdates)
        .set({ status: newStatus as any })
        .where(eq(manufacturingUpdates.status, oldStatus as any));
      
      console.log(`✅ Updated manufacturing updates: ${oldStatus} → ${newStatus}`);
    }
    
    console.log('✅ Manufacturing status migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateManufacturingStatuses();
