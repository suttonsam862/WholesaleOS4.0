import { db } from '../server/db';
import { users, licenseAcceptances } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function autoSignAllUsers() {
  console.log('Starting auto-sign for all users...');
  
  try {
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to sign`);
    
    for (const user of allUsers) {
      const existing = await db.query.licenseAcceptances.findFirst({
        where: (la) => sql`${la.userId} = ${user.id}`,
      });
      
      if (!existing) {
        await db.insert(licenseAcceptances).values({
          userId: user.id,
          licenseVersion: '1.0',
          ipAddress: '127.0.0.1',
          userAgent: 'auto-sign-script',
        });
        console.log(`✓ Signed: ${user.email || user.name}`);
      } else {
        console.log(`✓ Already signed: ${user.email || user.name}`);
      }
    }
    
    console.log('✓ Auto-sign complete!');
  } catch (error) {
    console.error('Error during auto-sign:', error);
    throw error;
  }
}

autoSignAllUsers().then(() => process.exit(0)).catch(() => process.exit(1));
