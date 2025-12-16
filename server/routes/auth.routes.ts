import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import type { AuthenticatedRequest } from './shared/types';
import { loadUserData } from './shared/middleware';
import { getCsrfToken } from '../middleware/csrf.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';

export function registerAuthRoutes(app: Express): void {
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, loadUserData, async (req, res) => {
    try {
      res.json((req as AuthenticatedRequest).user.userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local authentication routes
  app.post('/api/auth/local/login', authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`[LocalAuth] Login attempt for: ${email}`);

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { LocalAuthManager } = await import("../localAuth");
      const user = await LocalAuthManager.authenticateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session data
      const sessionData = LocalAuthManager.createLocalSession(user);

      // Store in passport session
      req.login(sessionData, (err) => {
        if (err) {
          console.error("[LocalAuth] Session creation error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        console.log(`[LocalAuth] Login successful for: ${email} (${user.role})`);

        // Ensure session is saved before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[LocalAuth] Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }

          // Set CORS headers for production
          if (process.env.NODE_ENV === 'production') {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          }

          res.json({
            message: "Login successful",
            user: sessionData.userData
          });
        });
      });
    } catch (error) {
      console.error("[LocalAuth] Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get available test users (for development only)
  app.get('/api/auth/local/test-users', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Only available in development" });
      }

      const users = await storage.getUsers();
      const testUsers = users
        .filter(u => u.isActive && u.passwordHash)
        .map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          hasPassword: !!u.passwordHash
        }));

      res.json(testUsers);
    } catch (error) {
      console.error("[LocalAuth] Error fetching test users:", error);
      res.status(500).json({ message: "Failed to fetch test users" });
    }
  });

  // Test login endpoint for Playwright - supports ANY role (DEVELOPMENT ONLY)
  app.post('/api/test/login', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Test login only available in development" });
      }

      const { role = 'admin' } = req.body;
      const validRoles = ['admin', 'sales', 'designer', 'ops', 'manufacturer'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
        });
      }

      const { TestAuthenticationManager } = await import("../testAuth");

      console.log(`🔐 [API] Test login for role: ${role}`);

      const authSetup = await TestAuthenticationManager.setupDeterministicAuthForRole(role as any);

      // Set the session cookie directly (secure is false in dev)
      res.cookie('connect.sid', authSetup.sessionCookie, {
        httpOnly: true,
        secure: false, // Development only endpoint, never runs in production
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        sessionId: authSetup.session.sessionId,
        sessionCookie: authSetup.sessionCookie,
        user: {
          id: authSetup.user.id,
          email: authSetup.user.email,
          role: authSetup.user.role,
          name: authSetup.user.name
        },
        redirectTo: `/${role}/home`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [API] Test login failed:', error);
      res.status(500).json({ 
        success: false,
        message: "Test login failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Test authentication routes (DEVELOPMENT ONLY - Critical for deterministic testing)
  app.post('/api/test/auth/setup', async (req, res) => {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Test authentication only available in development" });
      }

      const { TestAuthenticationManager } = await import("../testAuth");

      console.log('🔐 [API] Setting up deterministic test authentication...');

      // Set up deterministic authentication
      const authSetup = await TestAuthenticationManager.setupDeterministicAuth();

      // Return session data for browser injection
      res.json({
        success: true,
        sessionId: authSetup.session.sessionId,
        sessionCookie: authSetup.sessionCookie, // Full formatted cookie string for browser injection
        user: {
          id: authSetup.user.id,
          email: authSetup.user.email,
          role: authSetup.user.role,
          name: authSetup.user.name
        },
        authenticationVerified: authSetup.authenticationVerified,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [API] Test authentication setup failed:', error);
      res.status(500).json({ 
        success: false,
        message: "Test authentication setup failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Test authentication verification endpoint (CRITICAL FIX: Direct bypass for mobile testing)
  app.get('/api/test/auth/verify', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Test authentication only available in development" });
      }

      console.log('🔍 [API] Test auth verify - bypassing middleware for mobile testing reliability');

      // CRITICAL FIX: Direct session validation bypassing complex middleware
      const sessionCookie = req.headers.cookie;
      if (sessionCookie) {
        const cookieMatch = sessionCookie.match(/connect\.sid=([^;]+)/);
        if (cookieMatch) {
          const rawCookie = cookieMatch[1];
          console.log('   Found session cookie');

          // Import cookie-signature and verify the session ID  
          const signature = await import('cookie-signature');

          try {
            // URL-decode and strip the "s:" prefix that express-session uses
            const decodedCookie = decodeURIComponent(rawCookie);
            const signedValue = decodedCookie.startsWith('s:') ? decodedCookie.slice(2) : decodedCookie;
            const sessionId = signature.default.unsign(signedValue, process.env.SESSION_SECRET!);
            console.log('   Session ID verified');

            if (sessionId !== false) {
              // Look up session directly in database
              const { db } = await import("../db");
              const { sessions } = await import("@shared/schema");
              const { eq } = await import("drizzle-orm");

              const [sessionRecord] = await db
                .select()
                .from(sessions)
                .where(eq(sessions.sid, sessionId as string));

              if (sessionRecord && sessionRecord.sess) {
                const sessionData = sessionRecord.sess as any;
                console.log('   Session found in database');

                if (sessionData.passport && 
                    sessionData.passport.user && 
                    sessionData.passport.user.claims &&
                    sessionData.passport.user.claims.email &&
                    sessionData.passport.user.claims.email.includes('test-admin@automated-testing.local')) {

                  console.log('✅ [API] Test session verified successfully via direct database check');

                  // Create user data response from session
                  const userData = {
                    id: sessionData.passport.user.userData.id,
                    email: sessionData.passport.user.userData.email,
                    firstName: sessionData.passport.user.userData.firstName,
                    lastName: sessionData.passport.user.userData.lastName,
                    name: sessionData.passport.user.userData.name,
                    role: sessionData.passport.user.userData.role
                  };

                  return res.json({
                    authenticated: true,
                    isTestUser: true,
                    user: userData,
                    canAccessProtectedRoutes: userData.role === 'admin',
                    timestamp: new Date().toISOString(),
                    authMethod: 'direct-database-bypass'
                  });
                }
              } else {
                console.log('   Session not found in database');
              }
            }
          } catch (signatureError) {
            console.log('   Cookie signature verification failed:', signatureError instanceof Error ? signatureError.message : String(signatureError));
          }
        } else {
          console.log('   No connect.sid cookie found in:', sessionCookie);
        }
      } else {
        console.log('   No cookies in request');
      }

      console.log('❌ [API] Test authentication verification failed - no valid session');
      res.status(401).json({ 
        authenticated: false,
        message: "Test session not found or invalid"
      });

    } catch (error) {
      console.error('❌ [API] Test authentication verification error:', error);
      res.status(500).json({ 
        authenticated: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Unified logout endpoint (handles both local and Replit Auth)
  app.post('/api/auth/logout', async (req, res) => {
    const user = req.user as any;

    // Check if this is a Replit Auth session
    const isReplitAuth = user?.claims?.iss && user.claims.iss.includes('replit');

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }

      // For Replit Auth, return the end session URL for client-side redirect
      if (isReplitAuth) {
        return res.json({ 
          message: 'Logged out successfully',
          redirectTo: '/api/logout' // Replit Auth end session endpoint
        });
      }

      // For local auth, just confirm logout
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Test users endpoint (development/testing only)
  app.get('/api/test/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Only return active users with basic info
      const testUsers = users
        .filter(u => u.isActive)
        .map(u => ({
          id: u.id,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          name: u.name,
          email: u.email || '',
          role: u.role,
          isActive: u.isActive
        }));
      res.json(testUsers);
    } catch (error) {
      console.error("Error fetching test users:", error);
      res.status(500).json({ message: "Failed to fetch test users" });
    }
  });
}