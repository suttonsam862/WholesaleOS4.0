import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import { stripFinancialData } from "./shared/utils";

/**
 * System Routes - Dashboard, Search, and Activity
 *
 * NOTE: Health check endpoints (/api/health, /api/ready) are in health.routes.ts
 * These endpoints provide core system functionality for authenticated users.
 */
export function registerSystemRoutes(app: Express): void {
  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, loadUserData, requirePermission('dashboard', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const stats = await storage.getDashboardStats(user);
      
      // Strip financial data for manufacturer role
      const filteredStats = stripFinancialData(stats, user.role);
      res.json(filteredStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Global search
  app.get('/api/search', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const results = await storage.globalSearch(q, (req as AuthenticatedRequest).user.userData!);
      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Recent activity
  app.get('/api/activity/recent', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity(10, (req as AuthenticatedRequest).user.userData!);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
}
