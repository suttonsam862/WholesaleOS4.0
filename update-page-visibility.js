
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function updatePageVisibility() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔄 Updating page visibility for all role permissions...');
    
    const result = await pool.query('UPDATE role_permissions SET page_visible = true');
    
    console.log(`✅ Updated ${result.rowCount} role permission records`);
    console.log('📋 All pages are now visible to all roles');
    
    // Verify the update
    const verification = await pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN page_visible = true THEN 1 END) as visible FROM role_permissions');
    const { total, visible } = verification.rows[0];
    
    console.log(`📊 Verification: ${visible}/${total} permissions have page_visible = true`);
    
  } catch (error) {
    console.error('❌ Error updating page visibility:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updatePageVisibility()
  .then(() => {
    console.log('🎉 Page visibility update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update failed:', error);
    process.exit(1);
  });
