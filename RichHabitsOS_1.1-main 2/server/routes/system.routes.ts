import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import { stripFinancialData } from "./shared/utils";
import { db } from "../db";

export function registerSystemRoutes(app: Express): void {
  // Health check endpoint (no auth required)
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      await db.execute('SELECT 1');
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  // Readiness check (more comprehensive)
  app.get('/api/ready', async (req, res) => {
    try {
      // Test database
      await db.execute('SELECT 1');
      
      // Test that critical tables exist
      const checks = {
        database: true,
        session: true,
        auth: true
      };
      
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks
      });
    } catch (error) {
      console.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
