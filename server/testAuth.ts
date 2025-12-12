/**
 * TEST AUTHENTICATION MODULE
 * Provides deterministic authentication for automated testing
 * WITHOUT relying on manual OIDC flows or existing sessions
 */
import { db } from "./db";
import { users, sessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import crypto from "crypto";
import * as signature from "cookie-signature";

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: "admin" | "sales" | "designer" | "ops" | "manufacturer";
  passwordHash: string;
  isActive: boolean;
}

export interface TestSession {
  sessionId: string;
  userId: string;
  sessionData: any;
  expires: Date;
}

export class TestAuthenticationManager {
  private static readonly TEST_USER_EMAIL = "test-admin@automated-testing.local";
  private static readonly TEST_USER_PASSWORD = "AutoTest2024!";
  private static readonly TEST_USER_ID = "test-admin-automated-auth";

  /**
   * Generate test user credentials for a specific role
   */
  private static getTestUserCredentials(role: TestUser["role"]) {
    return {
      email: `test-${role}@automated-testing.local`,
      password: "AutoTest2024!",
      id: `test-${role}-automated-auth`,
      firstName: "Test",
      lastName: role.charAt(0).toUpperCase() + role.slice(1),
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} (Automated)`,
    };
  }

  /**
   * Create or ensure a test user exists for a specific role
   */
  static async ensureTestUserForRole(role: TestUser["role"]): Promise<TestUser> {
    const creds = this.getTestUserCredentials(role);
    console.log(`🔐 [TestAuth] Ensuring test user exists for role: ${role}`);
    
    // Check if test user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, creds.email));
    
    if (existingUser) {
      console.log(`✅ [TestAuth] Test ${role} user already exists: ${existingUser.id}`);
      
      // Ensure the user has the correct role
      if (existingUser.role !== role) {
        console.log(`🔄 [TestAuth] Updating test user role from ${existingUser.role} to ${role}`);
        const [updatedUser] = await db
          .update(users)
          .set({ role })
          .where(eq(users.id, existingUser.id))
          .returning();
        return updatedUser as TestUser;
      }
      
      return existingUser as TestUser;
    }
    
    // Create new test user
    const hashedPassword = await bcrypt.hash(creds.password, 10);
    
    const [newUser] = await db
      .insert(users)
      .values({
        id: creds.id,
        email: creds.email,
        firstName: creds.firstName,
        lastName: creds.lastName,
        name: creds.name,
        role,
        passwordHash: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`✅ [TestAuth] Created new test ${role} user: ${newUser.id}`);
    return newUser as TestUser;
  }

  /**
   * Setup deterministic auth for a specific role
   */
  static async setupDeterministicAuthForRole(role: TestUser["role"]): Promise<{
    user: TestUser;
    session: TestSession;
    sessionCookie: string;
    authenticationVerified: boolean;
  }> {
    console.log(`🚨 [TestAuth] Setting up DETERMINISTIC AUTHENTICATION for role: ${role}`);
    console.log(`============================================`);
    
    try {
      // Step 1: Ensure test user exists for this role
      const user = await this.ensureTestUserForRole(role);
      
      // Step 2: Create authenticated session
      const session = await this.createTestSession(user);
      
      // Step 3: Generate session cookie
      const cookieData = this.generateSessionCookie(session.sessionId);
      
      console.log(`✅ [TestAuth] DETERMINISTIC AUTHENTICATION COMPLETE for ${role}`);
      console.log(`   User: ${user.email} (${user.role})`);
      console.log(`   Session: ${session.sessionId}`);
      
      return {
        user,
        session,
        sessionCookie: cookieData.value,
        authenticationVerified: true
      };
      
    } catch (error) {
      console.error(`❌ [TestAuth] DETERMINISTIC AUTHENTICATION FAILED for ${role}:`, error);
      throw error;
    }
  }

  /**
   * CRITICAL: Create or ensure test admin user exists for deterministic testing
   */
  static async ensureTestUser(): Promise<TestUser> {
    console.log(`🔐 [TestAuth] Ensuring test user exists: ${this.TEST_USER_EMAIL}`);
    
    // Check if test user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, this.TEST_USER_EMAIL));
    
    if (existingUser) {
      console.log(`✅ [TestAuth] Test user already exists: ${existingUser.id} with role: ${existingUser.role}`);
      
      // Ensure the user has admin role - update if necessary
      if (existingUser.role !== "admin") {
        console.log(`🔄 [TestAuth] Updating test user role from ${existingUser.role} to admin`);
        const [updatedUser] = await db
          .update(users)
          .set({ role: "admin" })
          .where(eq(users.id, existingUser.id))
          .returning();
        return updatedUser as TestUser;
      }
      
      return existingUser as TestUser;
    }
    
    // Create new test user with admin privileges
    const hashedPassword = await bcrypt.hash(this.TEST_USER_PASSWORD, 10);
    
    const [newUser] = await db
      .insert(users)
      .values({
        id: this.TEST_USER_ID,
        email: this.TEST_USER_EMAIL,
        firstName: "Test",
        lastName: "Admin",
        name: "Test Admin (Automated)",
        role: "admin",
        passwordHash: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`✅ [TestAuth] Created new test user: ${newUser.id}`);
    return newUser as TestUser;
  }

  /**
   * CRITICAL: Create authenticated session for test user
   * This bypasses OIDC and creates a valid session directly
   */
  static async createTestSession(user: TestUser): Promise<TestSession> {
    console.log(`🔐 [TestAuth] Creating test session for user: ${user.id}`);
    
    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString("hex");
    
    // CRITICAL FIX: Create session data in Passport-compatible format
    const userSessionData = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        aud: "test-audience",
        iat: Math.floor(Date.now() / 1000),
        iss: "test-issuer"
      },
      userData: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileImageUrl: null,
        avatarUrl: null,
        phone: null,
        passwordHash: null
      },
      access_token: `test_access_token_${Date.now()}`,
      refresh_token: `test_refresh_token_${Date.now()}`,
      expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };

    // Create session data that matches Passport's expected structure  
    const sessionData = {
      passport: {
        user: userSessionData
      },
      cookie: {
        originalMaxAge: 7 * 24 * 60 * 60 * 1000,
        expires: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Match session configuration
        path: "/"
      }
    };
    
    const expires = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    // Insert session into database
    await db
      .insert(sessions)
      .values({
        sid: sessionId,
        sess: sessionData,
        expire: expires
      })
      .onConflictDoUpdate({
        target: sessions.sid,
        set: {
          sess: sessionData,
          expire: expires
        }
      });
    
    console.log(`✅ [TestAuth] Created session: ${sessionId}`);
    
    return {
      sessionId,
      userId: user.id,
      sessionData,
      expires
    };
  }

  /**
   * CRITICAL: Clean up test sessions and users after testing
   */
  static async cleanup(): Promise<void> {
    console.log(`🧹 [TestAuth] Cleaning up test authentication data`);
    
    try {
      // Delete test user sessions
      await db
        .delete(sessions)
        .where(eq(sessions.sid, `test-session-${this.TEST_USER_ID}`));
      
      console.log(`✅ [TestAuth] Cleaned up test sessions`);
    } catch (error) {
      console.error(`❌ [TestAuth] Cleanup error:`, error);
    }
  }

  /**
   * CRITICAL: Verify test user has admin permissions for all protected routes
   */
  static async verifyTestUserPermissions(user: TestUser): Promise<boolean> {
    console.log(`🔍 [TestAuth] Verifying test user permissions: ${user.role}`);
    
    if (user.role !== "admin") {
      console.error(`❌ [TestAuth] Test user must be admin, got: ${user.role}`);
      return false;
    }
    
    if (!user.isActive) {
      console.error(`❌ [TestAuth] Test user is not active`);
      return false;
    }
    
    console.log(`✅ [TestAuth] Test user permissions verified`);
    return true;
  }

  /**
   * CRITICAL: Generate session cookie data for browser injection
   * Express-session uses format: s%3A<signedValue> (URL encoded "s:" prefix)
   */
  static generateSessionCookie(sessionId: string): { value: string; fullCookie: string } {
    // Get the session secret from environment
    const sessionSecret = process.env.SESSION_SECRET!;
    
    // Use cookie-signature library to sign the session ID (same as express-session)
    const signedSessionValue = signature.sign(sessionId, sessionSecret);
    
    // CRITICAL: express-session expects the cookie to be prefixed with "s:" and URL-encoded
    // Format: s%3A<signedSessionId>
    const formattedCookieValue = `s:${signedSessionValue}`;
    const urlEncodedValue = encodeURIComponent(formattedCookieValue);
    
    // Return both the signed value and the complete cookie string
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return {
      value: urlEncodedValue, // URL-encoded session value for programmatic injection
      fullCookie: `connect.sid=${urlEncodedValue}; Path=/; HttpOnly${secureFlag}` // Full cookie for manual use
    };
  }

  /**
   * CRITICAL: Complete deterministic authentication setup
   * Returns all data needed for authenticated testing
   */
  static async setupDeterministicAuth(): Promise<{
    user: TestUser;
    session: TestSession;
    sessionCookie: string;
    authenticationVerified: boolean;
  }> {
    console.log(`🚨 [TestAuth] Setting up DETERMINISTIC AUTHENTICATION`);
    console.log(`============================================`);
    
    try {
      // Step 1: Ensure test user exists
      const user = await this.ensureTestUser();
      
      // Step 2: Verify user permissions
      const hasPermissions = await this.verifyTestUserPermissions(user);
      if (!hasPermissions) {
        throw new Error("Test user does not have required permissions");
      }
      
      // Step 3: Create authenticated session
      const session = await this.createTestSession(user);
      
      // Step 4: Generate session cookie
      const cookieData = this.generateSessionCookie(session.sessionId);
      
      console.log(`✅ [TestAuth] DETERMINISTIC AUTHENTICATION COMPLETE`);
      console.log(`   User: ${user.email} (${user.role})`);
      console.log(`   Session: ${session.sessionId}`);
      console.log(`   SessionCookieValue: ${cookieData.value}`);
      console.log(`   SessionCookieFull: ${cookieData.fullCookie}`);
      console.log(`   Expires: ${session.expires}`);
      
      return {
        user,
        session,
        sessionCookie: cookieData.value, // Return just the signed value for injection
        authenticationVerified: true
      };
      
    } catch (error) {
      console.error(`❌ [TestAuth] DETERMINISTIC AUTHENTICATION FAILED:`, error);
      throw error;
    }
  }
}

export default TestAuthenticationManager;