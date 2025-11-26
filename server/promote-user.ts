
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function promoteUserToAdmin() {
  const email = "samsutton@rich-habits.com";
  
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email}) - Current role: ${user.role}`);
    
    if (user.role === 'admin') {
      console.log(`✅ User is already an admin`);
      return;
    }
    
    // Update user role to admin
    await db
      .update(users)
      .set({ 
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(users.email, email));
    
    console.log(`🎉 Successfully promoted ${user.name} to admin role!`);
    console.log(`🔄 Please refresh your browser to see the changes`);
    
  } catch (error) {
    console.error('❌ Error promoting user:', error);
  } finally {
    process.exit(0);
  }
}

promoteUserToAdmin();
