/**
 * Order Service
 * Handles order business logic, status transitions, and validation
 */

import { storage } from '../storage';
import type { Order, InsertOrder, User } from '@shared/schema';
import {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  isOrderStatus,
  isValidOrderStatusTransition,
  type OrderStatus,
} from '@shared/constants';
import {
  ServiceError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InvalidTransitionError,
  logActivity,
} from './base.service';

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  salespersonId?: string;
  organizationId?: number;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderWithRelations extends Order {
  organization?: { id: number; name: string; logoUrl?: string | null } | null;
  salesperson?: { id: string; name: string } | null;
  lineItems?: unknown[];
}

export class OrderService {
  /**
   * Validate that a status transition is allowed
   */
  static validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (currentStatus === newStatus) {
      return; // No change, always valid
    }

    if (!isOrderStatus(newStatus)) {
      throw new ValidationError(
        `Invalid order status: "${newStatus}". Valid statuses are: ${ORDER_STATUSES.join(', ')}`
      );
    }

    if (!isValidOrderStatusTransition(currentStatus, newStatus)) {
      const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];
      throw new InvalidTransitionError(
        'order',
        currentStatus,
        newStatus
      );
    }
  }

  /**
   * Get allowed next statuses for an order
   */
  static getAllowedNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    if (!isOrderStatus(currentStatus)) {
      return [];
    }
    return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Create a new order with validation
   */
  static async createOrder(
    data: Partial<InsertOrder>,
    userId: string
  ): Promise<Order> {
    // Validate required fields
    if (!data.orderName || data.orderName.trim() === '') {
      throw new ValidationError('Order name is required');
    }

    // Set default status if not provided
    const orderData: InsertOrder = {
      ...data,
      orderName: data.orderName,
      status: data.status || 'new',
      priority: data.priority || 'normal',
      salespersonId: data.salespersonId || userId,
    };

    // Validate status is valid
    if (orderData.status && !isOrderStatus(orderData.status)) {
      throw new ValidationError(
        `Invalid order status: "${orderData.status}". Valid statuses are: ${ORDER_STATUSES.join(', ')}`
      );
    }

    // Create the order
    const order = await storage.createOrder(orderData);

    // Log the activity
    await logActivity({
      entityType: 'order',
      entityId: order.id,
      action: 'order_created',
      userId,
      newState: { status: order.status, orderName: order.orderName },
    });

    return order;
  }

  /**
   * Update an order with status transition validation
   */
  static async updateOrder(
    orderId: number,
    data: Partial<InsertOrder>,
    userId: string
  ): Promise<Order> {
    // Get the existing order
    const existingOrder = await storage.getOrder(orderId);
    if (!existingOrder) {
      throw new NotFoundError('Order', orderId);
    }

    // Validate status transition if status is being changed
    if (data.status && data.status !== existingOrder.status) {
      this.validateStatusTransition(
        existingOrder.status as OrderStatus,
        data.status as OrderStatus
      );
    }

    // Preserve the previous state for audit
    const previousState = {
      status: existingOrder.status,
      priority: existingOrder.priority,
      orderName: existingOrder.orderName,
    };

    // Update the order
    const updatedOrder = await storage.updateOrder(orderId, data);
    if (!updatedOrder) {
      throw new ServiceError('Failed to update order', 500);
    }

    // Log the activity
    const action = data.status !== existingOrder.status 
      ? 'order_status_changed' 
      : 'order_updated';

    await logActivity({
      entityType: 'order',
      entityId: orderId,
      action,
      userId,
      previousState,
      newState: {
        status: updatedOrder.status,
        priority: updatedOrder.priority,
        orderName: updatedOrder.orderName,
      },
    });

    return updatedOrder;
  }

  /**
   * Update only the order status with full transition validation
   */
  static async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
    userId: string
  ): Promise<Order> {
    const existingOrder = await storage.getOrder(orderId);
    if (!existingOrder) {
      throw new NotFoundError('Order', orderId);
    }

    // Validate the transition
    this.validateStatusTransition(
      existingOrder.status as OrderStatus,
      newStatus
    );

    // Update just the status
    const updatedOrder = await storage.updateOrder(orderId, { status: newStatus });
    if (!updatedOrder) {
      throw new ServiceError('Failed to update order status', 500);
    }

    // Log the activity
    await logActivity({
      entityType: 'order',
      entityId: orderId,
      action: 'order_status_changed',
      userId,
      previousState: { status: existingOrder.status },
      newState: { status: newStatus },
    });

    return updatedOrder;
  }

  /**
   * Get an order by ID
   */
  static async getOrderById(orderId: number): Promise<Order> {
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }
    return order;
  }

  /**
   * Delete an order
   */
  static async deleteOrder(orderId: number, userId: string): Promise<void> {
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    await storage.deleteOrder(orderId);

    // Log the activity
    await logActivity({
      entityType: 'order',
      entityId: orderId,
      action: 'order_deleted',
      userId,
      previousState: {
        status: order.status,
        orderName: order.orderName,
        orderCode: order.orderCode,
      },
    });
  }

  /**
   * Check if a user can modify an order based on role and ownership
   */
  static canUserModifyOrder(order: Order, user: User): boolean {
    // Admins and ops can modify any order
    if (user.role === 'admin' || user.role === 'ops') {
      return true;
    }

    // Sales can modify orders they own
    if (user.role === 'sales' && order.salespersonId === user.id) {
      return true;
    }

    return false;
  }

  /**
   * Check if a user can view an order
   */
  static canUserViewOrder(order: Order, user: User): boolean {
    // Admins, ops, and finance can view all orders
    if (['admin', 'ops', 'finance'].includes(user.role)) {
      return true;
    }

    // Sales can view their own orders
    if (user.role === 'sales' && order.salespersonId === user.id) {
      return true;
    }

    // Designers can view orders they're working on (via design jobs)
    // This would need additional logic with design jobs

    return false;
  }
}

export default OrderService;
