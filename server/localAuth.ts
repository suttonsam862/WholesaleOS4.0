
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { Request, Response, NextFunction } from "express";

export interface LocalAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: "admin" | "sales" | "designer" | "ops" | "manufacturer";
  isActive: boolean;
}

export class LocalAuthManager {
  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email: string, password: string): Promise<LocalAuthUser | null> {
    try {
      console.log(`[LocalAuth] Attempting to authenticate: ${email}`);
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`[LocalAuth] User not found: ${email}`);
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        console.log(`[LocalAuth] User is inactive: ${email}`);
        return null;
      }

      // Check if user has a password hash
      if (!user.passwordHash) {
        console.log(`[LocalAuth] User has no password set: ${email}`);
        return null;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log(`[LocalAuth] Invalid password for: ${email}`);
        return null;
      }

      console.log(`[LocalAuth] Authentication successful: ${email} (${user.role})`);
      
      return {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name,
        role: user.role as any,
        isActive: user.isActive || true
      };
    } catch (error) {
      console.error(`[LocalAuth] Authentication error:`, error);
      return null;
    }
  }

  /**
   * Create session data compatible with Replit Auth format
   */
  static createLocalSession(user: LocalAuthUser) {
    const now = Math.floor(Date.now() / 1000);
    const expires = now + (7 * 24 * 60 * 60); // 7 days

    return {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        exp: expires,
        aud: "local-auth",
        iat: now,
        iss: "local-auth"
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
      access_token: `local_access_token_${Date.now()}`,
      refresh_token: `local_refresh_token_${Date.now()}`,
      expires_at: expires,
      authMethod: 'local'
    };
  }
}

/**
 * Express middleware for local authentication routes
 */
export const localAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Allow local auth routes without existing authentication
  if (req.path.startsWith('/api/auth/local')) {
    return next();
  }
  next();
};
