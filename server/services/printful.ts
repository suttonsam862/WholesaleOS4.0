/**
 * Printful API Integration Service
 * 
 * Mock implementation for Printful print-on-demand API integration.
 * This service provides order creation, product sync, and shipping estimate functionality.
 * 
 * API Documentation: https://developers.printful.com/docs/
 */

export interface PrintfulConfig {
  apiKey: string;
  storeId?: string;
  baseUrl?: string;
}

export interface PrintfulProduct {
  id: number;
  externalId: string;
  name: string;
  variants: PrintfulVariant[];
  synced: number;
  thumbnail_url?: string;
  isIgnored: boolean;
}

export interface PrintfulVariant {
  id: number;
  externalId: string;
  syncProductId: number;
  name: string;
  synced: boolean;
  variantId: number;
  mainCategoryId: number;
  warehouseProductVariantId?: number;
  retailPrice: string;
  sku?: string;
  currency: string;
  product: {
    variantId: number;
    productId: number;
    image: string;
    name: string;
  };
  files: PrintfulFile[];
  options: PrintfulOption[];
  isIgnored: boolean;
}

export interface PrintfulFile {
  id: number;
  type: string;
  hash: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  size: number;
  width: number;
  height: number;
  dpi?: number;
  status: string;
  created: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  visible: boolean;
  isTemporary: boolean;
}

export interface PrintfulOption {
  id: string;
  value: string | string[];
}

export interface PrintfulOrderRequest {
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  retailCosts?: PrintfulRetailCosts;
  gift?: PrintfulGiftInfo;
  packingSlip?: PrintfulPackingSlip;
  externalId?: string;
}

export interface PrintfulRecipient {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  stateCode?: string;
  stateName?: string;
  countryCode: string;
  countryName?: string;
  zip: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
}

export interface PrintfulOrderItem {
  syncVariantId?: number;
  externalVariantId?: string;
  warehouseProductVariantId?: number;
  quantity: number;
  retailPrice?: string;
  name?: string;
  sku?: string;
  files?: PrintfulFile[];
  options?: PrintfulOption[];
  externalId?: string;
}

export interface PrintfulRetailCosts {
  currency?: string;
  subtotal?: string;
  discount?: string;
  shipping?: string;
  tax?: string;
}

export interface PrintfulGiftInfo {
  subject?: string;
  message?: string;
}

export interface PrintfulPackingSlip {
  email?: string;
  phone?: string;
  message?: string;
  logoUrl?: string;
  storeName?: string;
  customOrderId?: string;
}

export interface PrintfulOrder {
  id: number;
  externalId?: string;
  store: number;
  status: PrintfulOrderStatus;
  shipping: string;
  shippingServiceName: string;
  created: number;
  updated: number;
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  branding?: boolean;
  gift?: PrintfulGiftInfo;
  packingSlip?: PrintfulPackingSlip;
  retailCosts: PrintfulRetailCosts;
  costs: PrintfulCosts;
  shipments: PrintfulShipment[];
  dashboardUrl: string;
}

export type PrintfulOrderStatus = 
  | "draft"
  | "pending"
  | "failed"
  | "canceled"
  | "inprocess"
  | "onhold"
  | "partial"
  | "fulfilled";

export interface PrintfulCosts {
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  digitization: string;
  additionalFee: string;
  fulfillmentFee: string;
  tax: string;
  vat: string;
  total: string;
}

export interface PrintfulShipment {
  id: number;
  carrier: string;
  service: string;
  trackingNumber: string;
  trackingUrl: string;
  created: number;
  shipDate: string;
  reshipment: boolean;
  items: PrintfulShipmentItem[];
}

export interface PrintfulShipmentItem {
  itemId: number;
  quantity: number;
  picked: number;
  printed: number;
}

export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  minDeliveryDate?: string;
  maxDeliveryDate?: string;
}

export interface PrintfulApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    reason?: string;
  };
  paging?: {
    total: number;
    offset: number;
    limit: number;
  };
}

export class PrintfulService {
  private apiKey: string;
  private storeId?: string;
  private baseUrl: string;

  constructor(config?: Partial<PrintfulConfig>) {
    this.apiKey = config?.apiKey || process.env.PRINTFUL_API_KEY || "";
    this.storeId = config?.storeId || process.env.PRINTFUL_STORE_ID;
    this.baseUrl = config?.baseUrl || "https://api.printful.com";
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: object
  ): Promise<PrintfulApiResponse<T>> {
    if (!this.apiKey) {
      console.warn("[Printful] API key not configured - returning mock data");
      return this.getMockResponse<T>(endpoint, method, body);
    }

    try {
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      };

      if (this.storeId) {
        headers["X-PF-Store-Id"] = this.storeId;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: response.status,
            message: errorData.error?.message || `HTTP ${response.status} error`,
            reason: errorData.error?.reason,
          },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.result,
        paging: data.paging,
      };
    } catch (error) {
      console.error("[Printful] API request failed:", error);
      return {
        success: false,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
      };
    }
  }

  private getMockResponse<T>(
    endpoint: string,
    method: string,
    body?: object
  ): PrintfulApiResponse<T> {
    if (endpoint.includes("/orders") && method === "POST") {
      return {
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000000) + 1000000,
          externalId: `MOCK-${Date.now()}`,
          store: 12345,
          status: "pending" as PrintfulOrderStatus,
          shipping: "STANDARD",
          shippingServiceName: "Standard Shipping",
          created: Math.floor(Date.now() / 1000),
          updated: Math.floor(Date.now() / 1000),
          recipient: (body as PrintfulOrderRequest)?.recipient || {
            name: "Mock Recipient",
            address1: "123 Mock Street",
            city: "Mock City",
            stateCode: "CA",
            countryCode: "US",
            zip: "12345",
          },
          items: (body as PrintfulOrderRequest)?.items || [],
          retailCosts: {
            currency: "USD",
            subtotal: "25.00",
            shipping: "5.00",
            tax: "0.00",
          },
          costs: {
            currency: "USD",
            subtotal: "15.00",
            discount: "0.00",
            shipping: "4.00",
            digitization: "0.00",
            additionalFee: "0.00",
            fulfillmentFee: "0.00",
            tax: "0.00",
            vat: "0.00",
            total: "19.00",
          },
          shipments: [],
          dashboardUrl: "https://www.printful.com/dashboard/orders/mock",
        } as T,
      };
    }

    if (endpoint.includes("/shipping/rates")) {
      return {
        success: true,
        data: [
          {
            id: "STANDARD",
            name: "Standard Shipping",
            rate: "5.99",
            currency: "USD",
            minDeliveryDays: 5,
            maxDeliveryDays: 10,
          },
          {
            id: "EXPRESS",
            name: "Express Shipping",
            rate: "12.99",
            currency: "USD",
            minDeliveryDays: 2,
            maxDeliveryDays: 4,
          },
          {
            id: "OVERNIGHT",
            name: "Overnight Shipping",
            rate: "24.99",
            currency: "USD",
            minDeliveryDays: 1,
            maxDeliveryDays: 1,
          },
        ] as T,
      };
    }

    if (endpoint.includes("/sync/products")) {
      return {
        success: true,
        data: [
          {
            id: 1,
            externalId: "MOCK-PRODUCT-001",
            name: "Custom T-Shirt",
            variants: [],
            synced: 5,
            thumbnail_url: "https://via.placeholder.com/150",
            isIgnored: false,
          },
          {
            id: 2,
            externalId: "MOCK-PRODUCT-002",
            name: "Custom Hoodie",
            variants: [],
            synced: 3,
            thumbnail_url: "https://via.placeholder.com/150",
            isIgnored: false,
          },
        ] as T,
        paging: {
          total: 2,
          offset: 0,
          limit: 20,
        },
      };
    }

    if (endpoint.includes("/orders/")) {
      return {
        success: true,
        data: {
          id: parseInt(endpoint.split("/").pop() || "0"),
          externalId: "MOCK-ORDER",
          store: 12345,
          status: "inprocess" as PrintfulOrderStatus,
          shipping: "STANDARD",
          shippingServiceName: "Standard Shipping",
          created: Math.floor(Date.now() / 1000) - 86400,
          updated: Math.floor(Date.now() / 1000),
          recipient: {
            name: "John Doe",
            address1: "123 Test Street",
            city: "Test City",
            stateCode: "CA",
            countryCode: "US",
            zip: "12345",
          },
          items: [],
          retailCosts: {
            currency: "USD",
            subtotal: "25.00",
            shipping: "5.00",
            tax: "0.00",
          },
          costs: {
            currency: "USD",
            subtotal: "15.00",
            discount: "0.00",
            shipping: "4.00",
            digitization: "0.00",
            additionalFee: "0.00",
            fulfillmentFee: "0.00",
            tax: "0.00",
            vat: "0.00",
            total: "19.00",
          },
          shipments: [],
          dashboardUrl: "https://www.printful.com/dashboard/orders/mock",
        } as T,
      };
    }

    return {
      success: true,
      data: [] as T,
    };
  }

  async getSyncProducts(
    offset = 0,
    limit = 20
  ): Promise<PrintfulApiResponse<PrintfulProduct[]>> {
    return this.makeRequest<PrintfulProduct[]>(
      `/sync/products?offset=${offset}&limit=${limit}`
    );
  }

  async getSyncProduct(id: number): Promise<PrintfulApiResponse<PrintfulProduct>> {
    return this.makeRequest<PrintfulProduct>(`/sync/products/${id}`);
  }

  async createOrder(
    orderRequest: PrintfulOrderRequest,
    confirm = false
  ): Promise<PrintfulApiResponse<PrintfulOrder>> {
    return this.makeRequest<PrintfulOrder>(
      `/orders${confirm ? "?confirm=true" : ""}`,
      "POST",
      orderRequest
    );
  }

  async getOrder(orderId: number): Promise<PrintfulApiResponse<PrintfulOrder>> {
    return this.makeRequest<PrintfulOrder>(`/orders/${orderId}`);
  }

  async getOrders(
    status?: PrintfulOrderStatus,
    offset = 0,
    limit = 20
  ): Promise<PrintfulApiResponse<PrintfulOrder[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("offset", offset.toString());
    params.append("limit", limit.toString());
    
    return this.makeRequest<PrintfulOrder[]>(`/orders?${params.toString()}`);
  }

  async confirmOrder(orderId: number): Promise<PrintfulApiResponse<PrintfulOrder>> {
    return this.makeRequest<PrintfulOrder>(`/orders/${orderId}/confirm`, "POST");
  }

  async cancelOrder(orderId: number): Promise<PrintfulApiResponse<PrintfulOrder>> {
    return this.makeRequest<PrintfulOrder>(`/orders/${orderId}`, "DELETE");
  }

  async getShippingRates(
    recipient: PrintfulRecipient,
    items: PrintfulOrderItem[]
  ): Promise<PrintfulApiResponse<PrintfulShippingRate[]>> {
    return this.makeRequest<PrintfulShippingRate[]>("/shipping/rates", "POST", {
      recipient,
      items,
    });
  }

  async estimateCosts(
    orderRequest: PrintfulOrderRequest
  ): Promise<PrintfulApiResponse<PrintfulOrder>> {
    return this.makeRequest<PrintfulOrder>("/orders/estimate-costs", "POST", orderRequest);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getConfigStatus(): { configured: boolean; message: string } {
    if (this.apiKey) {
      return {
        configured: true,
        message: "Printful API is configured and ready",
      };
    }
    return {
      configured: false,
      message: "PRINTFUL_API_KEY environment variable not set - using mock data",
    };
  }
}

export const printfulService = new PrintfulService();
