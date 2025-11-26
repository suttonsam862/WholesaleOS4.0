import { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertTaskSchema, type Task } from "@shared/schema";
import {
  loadUserData,
  requirePermission,
  type AuthenticatedRequest,
  type UserRole,
  PERMISSIONS
} from "../permissions";
import { isAuthenticated } from "../replitAuth";

// Helper function to check if user can view all tasks
function canViewAllTasks(role: UserRole): boolean {
  return PERMISSIONS[role]?.tasks?.viewAll === true;
}

// Helper function to check if user can write tasks
function canWriteTasks(role: UserRole): boolean {
  return PERMISSIONS[role]?.tasks?.write === true;
}

export function registerTaskRoutes(app: Express) {
  // Get all tasks (filtered by user permissions)
  app.get('/api/tasks', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { userId, pageKey, status } = req.query;
      
      // Users with viewAll permission can see all tasks, others only their own
      const filters: any = {};
      if (!canViewAllTasks(user.role as UserRole)) {
        filters.userId = user.id;
      } else if (userId) {
        filters.userId = userId as string;
      }
      
      if (pageKey) filters.pageKey = pageKey as string;
      if (status) filters.status = status as string;
      
      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  // Get tasks for a specific page
  app.get('/api/tasks/page/:pageKey', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { pageKey } = req.params;
      const tasks = await storage.getTasksByPage(pageKey);
      
      // Filter tasks based on user permissions
      const filteredTasks = canViewAllTasks(user.role as UserRole) ? tasks : 
        tasks.filter(t => t.assignedToUserId === user.id || t.createdByUserId === user.id);
      
      res.json(filteredTasks);
    } catch (error) {
      console.error("Error fetching page tasks:", error);
      res.status(500).json({ message: "Failed to fetch page tasks" });
    }
  });
  
  // Get tasks for a specific user
  app.get('/api/tasks/user/:userId', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { userId } = req.params;
      
      // Users can only see their own tasks unless they have viewAll permission
      if (!canViewAllTasks(user.role as UserRole) && user.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });
  
  // Get task statistics for admin dashboard
  app.get('/api/tasks/stats', isAuthenticated, loadUserData, requirePermission('dashboard', 'read'), async (req, res) => {
    try {
      const allTasks = await storage.getTasks();
      
      const stats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length,
        overdue: allTasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching task stats:", error);
      res.status(500).json({ message: "Failed to fetch task statistics" });
    }
  });
  
  // Get single task
  app.get('/api/tasks/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to view this task
      if (!canViewAllTasks(user.role as UserRole) && 
          task.assignedToUserId !== user.id && 
          task.createdByUserId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  
  // Create new task
  app.post('/api/tasks', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate and prepare task data
      const validatedData = insertTaskSchema.parse(req.body);
      const taskData: any = {
        ...validatedData,
        createdByUserId: user.id
      };
      
      // Convert dueDate string to Date object if present and validate it
      if (taskData.dueDate) {
        const date = new Date(taskData.dueDate);
        if (!Number.isFinite(date.getTime())) {
          return res.status(400).json({ message: "Invalid due date format" });
        }
        taskData.dueDate = date;
      }
      
      // Ensure optional fields are properly set
      if (!taskData.assignedToUserId) {
        delete taskData.assignedToUserId;
      }
      if (!taskData.dueDate) {
        delete taskData.dueDate;
      }
      if (!taskData.pageKey) {
        delete taskData.pageKey;
      }
      if (!taskData.description) {
        delete taskData.description;
      }
      
      // If assigning to someone else, check permissions
      if (taskData.assignedToUserId && taskData.assignedToUserId !== user.id) {
        if (!canWriteTasks(user.role as UserRole)) {
          return res.status(403).json({ message: "You don't have permission to assign tasks to other users" });
        }
      }
      
      const task = await storage.createTask(taskData);
      
      // Create notification for assigned user if different from creator
      if (task.assignedToUserId && task.assignedToUserId !== user.id) {
        await storage.createNotification({
          userId: task.assignedToUserId,
          title: "New Task Assigned",
          message: `${user.name} has assigned you a new task: "${task.title}"`,
          type: "action",
          link: `/tasks/${task.id}`
        });
      }
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Task validation error:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  // Update task
  app.put('/api/tasks/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const taskId = parseInt(req.params.id);
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check permissions - creator, assignee, or users with viewAll permission can update
      if (!canViewAllTasks(user.role as UserRole) && 
          existingTask.assignedToUserId !== user.id && 
          existingTask.createdByUserId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertTaskSchema.partial().parse(req.body);
      
      // Convert dueDate string to Date object if present and validate it
      if (validatedData.dueDate) {
        const date = new Date(validatedData.dueDate);
        if (!Number.isFinite(date.getTime())) {
          return res.status(400).json({ message: "Invalid due date format" });
        }
        (validatedData as any).dueDate = date;
      }
      
      // If reassigning task, check permissions
      if (validatedData.assignedToUserId && 
          validatedData.assignedToUserId !== existingTask.assignedToUserId) {
        if (!canWriteTasks(user.role as UserRole) && existingTask.createdByUserId !== user.id) {
          return res.status(403).json({ message: "Only users with write permission or task creators can reassign tasks" });
        }
        
        // Notify new assignee
        if (validatedData.assignedToUserId !== user.id) {
          await storage.createNotification({
            userId: validatedData.assignedToUserId,
            title: "Task Reassigned",
            message: `${user.name} has assigned you the task: "${existingTask.title}"`,
            type: "action",
            link: `/tasks/${taskId}`
          });
        }
      }
      
      // If task is being completed, notify creator
      if (validatedData.status === 'completed' && existingTask.status !== 'completed') {
        if (existingTask.createdByUserId !== user.id) {
          await storage.createNotification({
            userId: existingTask.createdByUserId,
            title: "Task Completed",
            message: `${user.name} has completed the task: "${existingTask.title}"`,
            type: "success",
            link: `/tasks/${taskId}`
          });
        }
      }
      
      const updatedTask = await storage.updateTask(taskId, validatedData);
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  // Delete task
  app.delete('/api/tasks/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const taskId = parseInt(req.params.id);
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check delete permission
      const canDelete = PERMISSIONS[user.role as UserRole]?.tasks?.delete === true;
      if (!canDelete && existingTask.createdByUserId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this task" });
      }
      
      await storage.deleteTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
}