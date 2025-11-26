import type { Express } from "express";
import { PackageCheck, Scissors, Printer, Package, Truck, CheckCircle2, Clock } from "lucide-react";

// Manufacturing stages configuration - single source of truth
export const MANUFACTURING_STAGES = [
  {
    value: 'awaiting_admin_confirmation',
    label: 'Awaiting Admin Confirmation',
    description: 'Order received, pending admin approval to proceed',
    color: '#f59e0b',
    icon: 'Clock',
    order: 1,
    allowedRoles: ['admin', 'ops']
  },
  {
    value: 'confirmed_awaiting_manufacturing',
    label: 'Confirmed, Awaiting Manufacturing',
    description: 'Admin approved, ready for production to start',
    color: '#3b82f6',
    icon: 'PackageCheck',
    order: 2,
    allowedRoles: ['admin', 'ops', 'manufacturer']
  },
  {
    value: 'cutting_sewing',
    label: 'Cutting & Sewing',
    description: 'Fabric cutting and garment assembly in progress',
    color: '#8b5cf6',
    icon: 'Scissors',
    order: 3,
    allowedRoles: ['admin', 'ops', 'manufacturer']
  },
  {
    value: 'printing',
    label: 'Printing',
    description: 'Design printing and application phase',
    color: '#ec4899',
    icon: 'Printer',
    order: 4,
    allowedRoles: ['admin', 'ops', 'manufacturer']
  },
  {
    value: 'final_packing_press',
    label: 'Final Packing & Press',
    description: 'Quality check, pressing, and packaging',
    color: '#06b6d4',
    icon: 'Package',
    order: 5,
    allowedRoles: ['admin', 'ops', 'manufacturer']
  },
  {
    value: 'shipped',
    label: 'Shipped',
    description: 'Order shipped to customer',
    color: '#10b981',
    icon: 'Truck',
    order: 6,
    allowedRoles: ['admin', 'ops', 'manufacturer']
  },
  {
    value: 'complete',
    label: 'Complete',
    description: 'Order delivered and finalized',
    color: '#22c55e',
    icon: 'CheckCircle2',
    order: 7,
    allowedRoles: ['admin', 'ops']
  }
];

// Helper function to get valid status values
export function getValidManufacturingStatuses(): string[] {
  return MANUFACTURING_STAGES.map(stage => stage.value);
}

// Helper function to validate status
export function isValidManufacturingStatus(status: string): boolean {
  return getValidManufacturingStatuses().includes(status);
}

export function registerConfigRoutes(app: Express): void {
  // Get valid user roles
  app.get('/api/config/roles', async (req, res) => {
    try {
      const roles = [
        {
          value: 'admin',
          label: 'Admin',
          description: 'Full system access and user management'
        },
        {
          value: 'sales',
          label: 'Sales',
          description: 'Manage leads, orders, and customer relationships'
        },
        {
          value: 'designer',
          label: 'Designer',
          description: 'Handle design jobs and creative work'
        },
        {
          value: 'ops',
          label: 'Operations',
          description: 'Oversee manufacturing and logistics'
        },
        {
          value: 'manufacturer',
          label: 'Manufacturer',
          description: 'Execute production and update manufacturing status'
        },
        {
          value: 'finance',
          label: 'Finance',
          description: 'Manage invoices, payments, and financial data'
        }
      ];
      
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles config:", error);
      res.status(500).json({ message: "Failed to fetch roles configuration" });
    }
  });

  // Get manufacturing stages with metadata
  app.get('/api/config/manufacturing-stages', async (req, res) => {
    try {
      res.json(MANUFACTURING_STAGES);
    } catch (error) {
      console.error("Error fetching manufacturing stages config:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing stages configuration" });
    }
  });

  // Get team store stages with metadata
  app.get('/api/config/team-store-stages', async (req, res) => {
    try {
      const stages = [
        {
          value: 'pending',
          label: 'Team Store Pending',
          description: 'Team store created, awaiting processing',
          color: '#f59e0b',
          icon: 'Clock',
          order: 1,
          allowedRoles: ['admin', 'ops', 'sales']
        },
        {
          value: 'in_process',
          label: 'Team Store in Process',
          description: 'Team store is currently being processed',
          color: '#3b82f6',
          icon: 'Package',
          order: 2,
          allowedRoles: ['admin', 'ops', 'sales']
        },
        {
          value: 'completed',
          label: 'Team Store Completed',
          description: 'Team store processing completed',
          color: '#22c55e',
          icon: 'CheckCircle2',
          order: 3,
          allowedRoles: ['admin', 'ops', 'sales']
        }
      ];
      
      res.json(stages);
    } catch (error) {
      console.error("Error fetching team store stages config:", error);
      res.status(500).json({ message: "Failed to fetch team store stages configuration" });
    }
  });
}
