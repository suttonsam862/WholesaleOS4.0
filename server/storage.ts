import {
  users,
  organizations,
  leads,
  products,
  orders,
  contacts,
  categories,
  productVariants,
  designJobs,
  manufacturers,
  orderLineItems,
  auditLogs,
  savedViews,
  favorites,
  userManufacturerAssociations,
  notifications,
  orderTrackingNumbers,
  orderFormSubmissions,
  orderFormLineItemSizes,
  customerComments,
  sizeAdjustmentRequests,
  fabrics,
  productVariantFabrics,
  fabricSubmissions,
  pantoneAssignments,
  manufacturerJobs,
  manufacturerEvents,
  licenseAcceptances,
  type User,
  type UpsertUser,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Lead,
  type InsertLead,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Contact,
  type InsertContact,
  type Category,
  type InsertCategory,
  type ProductVariant,
  type InsertProductVariant,
  type DesignJob,
  type Manufacturer,
  type OrderLineItem,
  type AuditLog,
  type SavedView,
  type InsertDesignJob,
  type InsertManufacturer,
  type Manufacturing,
  type InsertManufacturing,
  type ManufacturingUpdate,
  type InsertManufacturingUpdate,
  type InsertOrderLineItem,
  type Salesperson,
  type InsertSalesperson,
  type UserManufacturerAssociation,
  type InsertUserManufacturerAssociation,
  type ManufacturingBatch,
  type InsertManufacturingBatch,
  type ManufacturingBatchItem,
  type InsertManufacturingBatchItem,
  type ManufacturingQualityCheckpoint,
  type InsertManufacturingQualityCheckpoint,
  type ManufacturingNotification,
  type InsertManufacturingNotification,
  type ManufacturingAttachment,
  type InsertManufacturingAttachment,
  type ManufacturingUpdateLineItem,
  type InsertManufacturingUpdateLineItem,
  type ProductionSchedule,
  type InsertProductionSchedule,
  type Notification,
  type InsertNotification,
  designResources,
  type DesignResource,
  type InsertDesignResource,
  salesResources,
  type SalesResource,
  type InsertSalesResource,
  tasks,
  type Task,
  type InsertTask,
  salespersons,
  manufacturing,
  manufacturingUpdates,
  manufacturingUpdateLineItems,
  manufacturingBatches,
  manufacturingBatchItems,
  manufacturingQualityCheckpoints,
  manufacturingNotifications,
  manufacturingAttachments,
  productionSchedules,
  teamStores,
  teamStoreLineItems,
  type TeamStore,
  type InsertTeamStore,
  type TeamStoreLineItem,
  type InsertTeamStoreLineItem,
  type OrderFormSubmission,
  type InsertOrderFormSubmission,
  type OrderFormLineItemSizes,
  type InsertOrderFormLineItemSizes,
  designJobComments,
  type DesignJobComment,
  type InsertDesignJobComment,
  quotes,
  quoteLineItems,
  type Quote,
  type InsertQuote,
  type QuoteLineItem,
  type InsertQuoteLineItem,
  financialTransactions,
  commissions,
  budgets,
  financialReports,
  financialAlerts,
  type FinancialTransaction,
  type InsertFinancialTransaction,
  type Commission,
  type InsertCommission,
  type Budget,
  type InsertBudget,
  type FinancialReport,
  type InsertFinancialReport,
  type FinancialAlert,
  type InsertFinancialAlert,
  roles,
  resources,
  rolePermissions,
  type Role,
  type InsertRole,
  type Resource,
  type InsertResource,
  type RolePermission,
  type InsertRolePermission,
  invitations,
  type Invitation,
  type InsertInvitation,
  orderLineItemManufacturers,
  type OrderLineItemManufacturer,
  type InsertOrderLineItemManufacturer,
  invoices,
  invoicePayments,
  commissionPayments,
  productCogs,
  type Invoice,
  type InsertInvoice,
  type InvoicePayment,
  type InsertInvoicePayment,
  type CommissionPayment,
  type InsertCommissionPayment,
  type ProductCogs,
  type InsertProductCogs,
  type LicenseAcceptance,
  type InsertLicenseAcceptance,
  events,
  eventStages,
  eventStaff,
  eventContractors,
  contractorPayments,
  contractorFiles,
  eventMerchandise,
  eventInventoryMovements,
  eventBudgets,
  eventCampaigns,
  eventRegistrations,
  eventSponsors,
  eventVolunteers,
  eventGraphics,
  eventVenues,
  eventSchedules,
  eventEquipment,
  eventTravel,
  eventTasks,
  eventDocuments,
  eventTicketTiers,
  eventExpenses,
  eventNotes,
  eventChecklists,
  communicationLogs,
  userPermissions,
  designPortfolios,
  variantSpecifications,
  type Event,
  type InsertEvent,
  type EventStage,
  type InsertEventStage,
  type EventStaff,
  type InsertEventStaff,
  type EventContractor,
  type InsertEventContractor,
  type ContractorPayment,
  type InsertContractorPayment,
  type ContractorFile,
  type InsertContractorFile,
  type EventMerchandise,
  type InsertEventMerchandise,
  type EventInventoryMovement,
  type InsertEventInventoryMovement,
  type EventBudget,
  type InsertEventBudget,
  type EventCampaign,
  type InsertEventCampaign,
  type EventRegistration,
  type InsertEventRegistration,
  type EventSponsor,
  type InsertEventSponsor,
  type EventVolunteer,
  type InsertEventVolunteer,
  type EventGraphic,
  type InsertEventGraphic,
  type EventVenue,
  type InsertEventVenue,
  type EventSchedule,
  type InsertEventSchedule,
  type EventEquipment,
  type InsertEventEquipment,
  type EventTravel,
  type InsertEventTravel,
  type EventTask,
  type InsertEventTask,
  type EventDocument,
  type InsertEventDocument,
  type EventTicketTier,
  type InsertEventTicketTier,
  type EventExpense,
  type InsertEventExpense,
  type EventNote,
  type InsertEventNote,
  type EventChecklist,
  type InsertEventChecklist,
  type CommunicationLog,
  type InsertCommunicationLog,
  type UserPermission,
  type InsertUserPermission,
  type DesignPortfolio,
  type InsertDesignPortfolio,
  type VariantSpecification,
  type InsertVariantSpecification,
  type Fabric,
  type InsertFabric,
  type ProductVariantFabric,
  type InsertProductVariantFabric,
  type FabricSubmission,
  type InsertFabricSubmission,
  type PantoneAssignment,
  type InsertPantoneAssignment,
  type ManufacturerJob,
  type InsertManufacturerJob,
  type ManufacturerEvent,
  type InsertManufacturerEvent,
  printfulSyncRecords,
  type PrintfulSyncRecord,
  type InsertPrintfulSyncRecord,
  tourMerchBundles,
  type TourMerchBundle,
  type InsertTourMerchBundle,
  manufacturingNoteCategories,
  type ManufacturingNoteCategory,
  type InsertManufacturingNoteCategory,
  type ManufacturingNote,
  manufacturingFinishedImages,
  type ManufacturingFinishedImage,
  type InsertManufacturingFinishedImage,
  designTemplates,
  designLockedOverlays,
  designProjects,
  designVersions,
  designLayers,
  designGenerationRequests,
  designAiTrainingSets,
  designAiTrainingImages,
  designStylePresets,
  type DesignTemplate,
  type InsertDesignTemplate,
  type DesignLockedOverlay,
  type InsertDesignLockedOverlay,
  type DesignProject,
  type InsertDesignProject,
  type DesignVersion,
  type InsertDesignVersion,
  type DesignLayer,
  type InsertDesignLayer,
  type DesignGenerationRequest,
  type InsertDesignGenerationRequest,
  type DesignAiTrainingSet,
  type InsertDesignAiTrainingSet,
  type DesignAiTrainingImage,
  type InsertDesignAiTrainingImage,
  type DesignStylePreset,
  type InsertDesignStylePreset,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, or, and, sql, count, getTableColumns, gte, lte, lt, inArray, isNotNull, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // User management operations (admin only)
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  countAdmins(): Promise<number>;

  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  findOrganizationByName(name: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: number): Promise<void>;

  // Contact operations
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  findContactByEmail(email: string): Promise<Contact | undefined>;
  findContactByNameAndOrg(name: string, orgId: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  getContactsByOrganization(orgId: number): Promise<Contact[]>;
  getContactsByRole(role: string): Promise<Contact[]>;
  getCustomerContactsByOrganization(orgId: number): Promise<Contact[]>;

  // Lead operations
  getLeads(): Promise<(Lead & { organization?: Organization; contact?: Contact; owner?: User })[]>;
  getLead(id: number): Promise<(Lead & { organization?: Organization; contact?: Contact; owner?: User }) | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number, forceDelete?: boolean): Promise<{ success: boolean; archived?: boolean; dependencies?: { orders: number; designJobs: number } }>;
  archiveLead(id: number, archivedBy: string): Promise<Lead>;
  getLeadDependencies(id: number): Promise<{ orders: number; designJobs: number }>;
  getLeadsByStage(stage: string): Promise<Lead[]>;
  getLeadsBySalesperson(userId: string): Promise<(Lead & { organization?: Organization; contact?: Contact })[]>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Catalog operations (products with categories)
  getCatalogProducts(): Promise<(Product & { category?: Category })[]>;
  getCatalogProduct(id: number): Promise<(Product & { category?: Category }) | undefined>;

  // Product variant operations
  getProductVariants(productId?: number): Promise<ProductVariant[]>;
  getProductVariant(id: number): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant>;
  deleteProductVariant(id: number): Promise<void>;

  // Order operations
  getOrders(): Promise<(Order & { salespersonName?: string | null })[]>;
  getOrder(id: number): Promise<(Order & { salespersonName?: string | null }) | undefined>;
  getOrderWithLineItems(id: number): Promise<(Order & { lineItems: OrderLineItem[]; salespersonName?: string | null }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderWithLineItems(order: InsertOrder, lineItems: InsertOrderLineItem[]): Promise<Order & { lineItems: OrderLineItem[] }>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | null>;
  deleteOrder(id: number): Promise<void>;
  getOrdersBySalesperson(userId: string): Promise<(Order & { organization?: Organization; contact?: Contact; salespersonName?: string | null })[]>;

  // Order tracking number operations
  getOrderTrackingNumbers(orderId: number): Promise<any[]>;
  addOrderTrackingNumber(tracking: { orderId: number; trackingNumber: string; carrierCompany: string }): Promise<any>;
  deleteOrderTrackingNumber(id: number): Promise<void>;

  // Order line item operations
  getOrderLineItems(orderId: number): Promise<OrderLineItem[]>;
  getOrderLineItemsWithVariants(orderId: number): Promise<(OrderLineItem & { variant?: ProductVariant })[]>;
  getOrderLineItemsWithManufacturers(orderId: number): Promise<any[]>;
  createOrderLineItem(lineItem: InsertOrderLineItem): Promise<OrderLineItem>;
  updateOrderLineItem(id: number, lineItem: Partial<InsertOrderLineItem>): Promise<OrderLineItem>;
  deleteOrderLineItem(id: number): Promise<void>;

  // Design job operations
  getDesignJobs(): Promise<(DesignJob & { organization?: Organization; designer?: User })[]>;
  getDesignJob(id: number): Promise<(DesignJob & { organization?: Organization; designer?: User }) | undefined>;
  getDesignJobWithComments(id: number): Promise<(DesignJob & { organization?: Organization; designer?: User; comments: DesignJobComment[] }) | undefined>;
  getDesignJobsByDesigner(userId: string): Promise<(DesignJob & { organization?: Organization; designer?: User })[]>;
  getDesignJobsBySalesperson(userId: string): Promise<(DesignJob & { organization?: Organization; designer?: User })[]>;
  getDesignJobsByOrder(orderId: number): Promise<(DesignJob & { organization?: Organization; designer?: User })[]>;
  createDesignJob(job: InsertDesignJob): Promise<DesignJob>;
  updateDesignJob(id: number, job: Partial<InsertDesignJob>): Promise<DesignJob>;
  updateDesignJobStatus(id: number, status: string): Promise<DesignJob>;
  addDesignJobRendition(id: number, url: string): Promise<DesignJob>;
  deleteDesignJob(id: number): Promise<void>;

  // Design job comment operations
  getDesignJobComments(jobId: number): Promise<DesignJobComment[]>;
  createDesignJobComment(comment: InsertDesignJobComment): Promise<DesignJobComment>;
  updateDesignJobComment(id: number, comment: Partial<InsertDesignJobComment>): Promise<DesignJobComment>;
  deleteDesignJobComment(id: number): Promise<void>;

  // Manufacturing operations
  getManufacturing(user?: User): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User })[]>;
  getManufacturingRecord(id: number, user?: User): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User }) | undefined>;
  getManufacturingRecordStrict(id: number): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User }) | undefined>;
  getManufacturingByOrder(orderId: number): Promise<Manufacturing | undefined>;
  createManufacturing(record: InsertManufacturing): Promise<Manufacturing>;
  updateManufacturing(id: number, record: Partial<InsertManufacturing>): Promise<Manufacturing>;
  deleteManufacturing(id: number): Promise<void>;
  archiveManufacturing(id: number, userId: string): Promise<Manufacturing>;
  unarchiveManufacturing(id: number): Promise<Manufacturing>;
  getArchivedManufacturing(user?: User): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User })[]>;

  // Manufacturing status updates
  getManufacturingUpdates(manufacturingId?: number, user?: User): Promise<(ManufacturingUpdate & { updatedByUser?: User })[]>;
  createManufacturingUpdate(update: InsertManufacturingUpdate): Promise<ManufacturingUpdate>;
  getManufacturingUpdateById(id: number): Promise<ManufacturingUpdate | undefined>;
  updateManufacturingUpdate(id: number, update: Partial<InsertManufacturingUpdate>): Promise<ManufacturingUpdate>;
  deleteManufacturingUpdate(id: number): Promise<void>;

  // Manufacturing Update Line Item operations
  updateManufacturingUpdateLineItem(id: number, update: Partial<InsertManufacturingUpdateLineItem>): Promise<ManufacturingUpdateLineItem>;
  getManufacturingUpdateLineItemsByOrderLineItemId(orderLineItemId: number): Promise<ManufacturingUpdateLineItem[]>;

  // Manufacturing Batch operations
  getManufacturingBatches(manufacturerId?: number): Promise<(ManufacturingBatch & { manufacturer?: Manufacturer; items?: ManufacturingBatchItem[] })[]>;
  getManufacturingBatch(id: number): Promise<(ManufacturingBatch & { manufacturer?: Manufacturer; items?: ManufacturingBatchItem[] }) | undefined>;
  createManufacturingBatch(batch: InsertManufacturingBatch): Promise<ManufacturingBatch>;
  updateManufacturingBatch(id: number, batch: Partial<InsertManufacturingBatch>): Promise<ManufacturingBatch>;
  deleteManufacturingBatch(id: number): Promise<void>;

  // Manufacturing Batch Item operations
  getBatchItems(batchId: number): Promise<ManufacturingBatchItem[]>;
  createBatchItem(item: InsertManufacturingBatchItem): Promise<ManufacturingBatchItem>;
  updateBatchItem(id: number, item: Partial<InsertManufacturingBatchItem>): Promise<ManufacturingBatchItem>;
  deleteBatchItem(id: number): Promise<void>;

  // Quality Control Checkpoint operations
  getQualityCheckpoints(manufacturingId: number): Promise<ManufacturingQualityCheckpoint[]>;
  createQualityCheckpoint(checkpoint: InsertManufacturingQualityCheckpoint): Promise<ManufacturingQualityCheckpoint>;
  updateQualityCheckpoint(id: number, checkpoint: Partial<InsertManufacturingQualityCheckpoint>): Promise<ManufacturingQualityCheckpoint>;
  deleteQualityCheckpoint(id: number): Promise<void>;

  // Manufacturing Notification operations
  getManufacturingNotifications(recipientId?: string, manufacturingId?: number): Promise<ManufacturingNotification[]>;
  createManufacturingNotification(notification: InsertManufacturingNotification): Promise<ManufacturingNotification>;
  markManufacturingNotificationAsRead(id: number): Promise<ManufacturingNotification>;
  deleteManufacturingNotification(id: number): Promise<void>;

  // Manufacturing Attachment operations
  getManufacturingAttachments(manufacturingId?: number, batchId?: number): Promise<ManufacturingAttachment[]>;
  createManufacturingAttachment(attachment: InsertManufacturingAttachment): Promise<ManufacturingAttachment>;
  updateManufacturingAttachment(id: number, attachment: Partial<InsertManufacturingAttachment>): Promise<ManufacturingAttachment>;
  deleteManufacturingAttachment(id: number): Promise<void>;

  // Manufacturing Finished Images operations
  getFinishedImages(lineItemId: number): Promise<ManufacturingFinishedImage[]>;
  createFinishedImage(image: InsertManufacturingFinishedImage): Promise<ManufacturingFinishedImage>;
  deleteFinishedImage(id: number): Promise<void>;
  getFinishedImage(id: number): Promise<ManufacturingFinishedImage | undefined>;

  // Order Line Item Manufacturer operations
  getLineItemManufacturers(lineItemId: number): Promise<(OrderLineItemManufacturer & { manufacturer?: Manufacturer })[]>;
  getLineItemManufacturersByOrder(orderId: number): Promise<(OrderLineItemManufacturer & { manufacturer?: Manufacturer; lineItem?: OrderLineItem })[]>;
  assignManufacturerToLineItem(assignment: InsertOrderLineItemManufacturer): Promise<OrderLineItemManufacturer>;
  updateLineItemManufacturer(id: number, assignment: Partial<InsertOrderLineItemManufacturer>): Promise<OrderLineItemManufacturer>;
  deleteLineItemManufacturer(id: number): Promise<void>;
  deleteLineItemManufacturersByLineItem(lineItemId: number): Promise<void>;

  // Production Schedule operations
  getProductionSchedules(manufacturerId?: number): Promise<ProductionSchedule[]>;
  createProductionSchedule(schedule: InsertProductionSchedule): Promise<ProductionSchedule>;
  updateProductionSchedule(id: number, schedule: Partial<InsertProductionSchedule>): Promise<ProductionSchedule>;
  deleteProductionSchedule(id: number): Promise<void>;

  // Team Store operations
  getTeamStores(user?: User): Promise<(TeamStore & { order?: Order; salesperson?: User; organization?: Organization })[]>;
  getTeamStore(id: number, user?: User): Promise<(TeamStore & { order?: Order; salesperson?: User; organization?: Organization; lineItems?: TeamStoreLineItem[] }) | undefined>;
  createTeamStore(teamStore: InsertTeamStore, lineItemIds: number[]): Promise<TeamStore>;
  updateTeamStore(id: number, teamStore: Partial<InsertTeamStore>): Promise<TeamStore>;
  deleteTeamStore(id: number): Promise<void>;
  archiveTeamStore(id: number, userId: string): Promise<TeamStore>;
  unarchiveTeamStore(id: number): Promise<TeamStore>;
  getArchivedTeamStores(user?: User): Promise<(TeamStore & { order?: Order; salesperson?: User; organization?: Organization })[]>;

  // Team Store Line Item operations
  getTeamStoreLineItems(teamStoreId: number): Promise<TeamStoreLineItem[]>;
  updateTeamStoreLineItem(id: number, update: Partial<InsertTeamStoreLineItem>): Promise<TeamStoreLineItem>;

  // User-Manufacturer associations
  getUserManufacturerAssociations(userId: string): Promise<UserManufacturerAssociation[]>;
  getUserManufacturerAssociationsByManufacturer(manufacturerId: number): Promise<UserManufacturerAssociation[]>;
  createUserManufacturerAssociation(association: InsertUserManufacturerAssociation): Promise<UserManufacturerAssociation>;
  deleteUserManufacturerAssociation(userId: string, manufacturerId: number): Promise<void>;
  getUserAssociatedManufacturerIds(userId: string): Promise<number[]>;

  // Manufacturer operations
  getManufacturers(): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer>;

  // Invitation operations
  getInvitations(): Promise<Invitation[]>;
  getInvitation(id: number): Promise<Invitation | undefined>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getInvitationByUserId(userId: string): Promise<Invitation | undefined>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  updateInvitation(id: number, invitation: Partial<InsertInvitation>): Promise<Invitation>;
  deleteInvitation(id: number): Promise<void>;
  expireOldInvitations(): Promise<void>;

  // Salesperson operations
  getSalespeople(): Promise<Salesperson[]>;
  getSalesperson(id: number): Promise<Salesperson | undefined>;
  getSalespersonByUserId(userId: string): Promise<Salesperson | undefined>;
  createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson>;
  updateSalesperson(id: number, salesperson: Partial<InsertSalesperson>): Promise<Salesperson>;
  deleteSalesperson(id: number): Promise<void>;
  getSalespersonPerformance(id: number): Promise<{
    totalLeads: number;
    leadsWon: number;
    conversionRate: number;
    totalOrdersValue: number;
    commissionEarned: number;
    quotaAttainment: number;
    averageDealSize: number;
    activeLeads: number;
    ordersCount: number;
  }>;
  getSalespeopleWithMetrics(): Promise<(Salesperson & {
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    totalLeads: number;
    leadsWon: number;
    ordersCount: number;
    revenue: number;
    quotaAttainment: number;
    commissionEarned: number;
    commissionPaid: number;
    commissionOwed: number;
  })[]>;

  // Business logic operations
  suggestSalespersonForLead(territory?: string, clientType?: string): Promise<Salesperson | null>;
  calculateCommission(orderId: number): Promise<{ commission: number; rate: number }>;
  getInventoryLevels(): Promise<{ variantId: number; available: number; reserved: number }[]>;

  // Dashboard stats
  getDashboardStats(user?: User): Promise<{
    totalLeads: number;
    totalOrders: number;
    designJobs: number;
    revenue: number;
    leadsByStage: Record<string, number>;
    ordersByStatus: Record<string, number>;
    // Admin specific
    totalUsers?: number;
    systemRevenue?: number;
    systemHealth?: string;
    usersByRole?: Record<string, number>;
    // Sales specific
    myLeads?: number;
    conversionRate?: number;
    commissionEarned?: number;
    quotaProgress?: number;
    myPipeline?: { stage: string; value: number; count: number }[];
    // Designer specific
    activeJobs?: number;
    pendingReview?: number;
    completedThisMonth?: number;
    approvalRate?: number;
    jobsByStatus?: Record<string, number>;
    // Ops specific
    ordersInProduction?: number;
    shippingToday?: number;
    overdueItems?: number;
    capacity?: number;
    productionPipeline?: Record<string, number>;
    // Manufacturer specific
    activeProductions?: number;
    onTimeRate?: number;
    capacityUsed?: number;
    dueThisWeek?: number;
    productionSchedule?: { date: string; count: number }[];
  }>;

  // Global search
  globalSearch(query: string, user?: User): Promise<{
    leads: Lead[];
    organizations: Organization[];
    orders: Order[];
    products: Product[];
  }>;

  // Code generation
  getNextCode(prefix: string): Promise<string>;

  // Quote operations
  getQuotes(): Promise<Quote[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  getQuoteWithLineItems(id: number): Promise<(Quote & { lineItems: QuoteLineItem[]; organization?: Organization }) | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  createQuoteWithLineItems(quote: InsertQuote, lineItems: InsertQuoteLineItem[]): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: number): Promise<void>;
  getQuotesBySalesperson(userId: string): Promise<(Quote & { organization?: Organization; contact?: Contact })[]>;

  // Quote line item operations
  getQuoteLineItems(quoteId: number): Promise<QuoteLineItem[]>;
  createQuoteLineItem(lineItem: InsertQuoteLineItem): Promise<QuoteLineItem>;
  updateQuoteLineItem(id: number, lineItem: Partial<InsertQuoteLineItem>): Promise<QuoteLineItem>;
  deleteQuoteLineItem(id: number): Promise<void>;

  // Quote calculation operations
  recalculateQuoteTotals(quoteId: number, tx?: any): Promise<Quote>;

  // Audit logging
  logActivity(actorUserId: string, entity: string, entityId: number, action: string, before?: any, after?: any): Promise<AuditLog>;
  getRecentActivity(limit?: number, user?: User): Promise<AuditLog[]>;
  getOrderActivity(orderId: number): Promise<AuditLog[]>;

  // Permission Management operations
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  getResourceByName(name: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;

  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  getAllRolePermissions(): Promise<RolePermission[]>;
  getPermissionsByRole(roleName: string): Promise<RolePermission[]>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(id: number, permission: Partial<InsertRolePermission>): Promise<RolePermission>;
  upsertRolePermission(roleId: number, resourceId: number, permission: Partial<InsertRolePermission>): Promise<RolePermission>;
  deleteRolePermission(id: number): Promise<void>;
  deleteRolePermissionsByRole(roleId: number): Promise<void>;

  // Invoice operations
  getInvoices(filters?: { revenueSource?: "order" | "team_store" | "other" }): Promise<(Invoice & { organization?: Organization; salesperson?: User })[]>;
  getInvoice(id: number): Promise<(Invoice & { organization?: Organization; salesperson?: User }) | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoicesByOrganization(orgId: number): Promise<Invoice[]>;
  getInvoicesBySalesperson(salespersonId: string): Promise<Invoice[]>;
  getInvoicesByOrderId(orderId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;

  // Invoice Payment operations
  getInvoicePayments(invoiceId?: number): Promise<InvoicePayment[]>;
  getInvoicePayment(id: number): Promise<InvoicePayment | undefined>;
  createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment>;
  updateInvoicePayment(id: number, payment: Partial<InsertInvoicePayment>): Promise<InvoicePayment>;
  deleteInvoicePayment(id: number): Promise<void>;

  // Commission Payment operations
  getCommissionPayments(salespersonId?: string): Promise<CommissionPayment[]>;
  getCommissionPayment(id: number): Promise<CommissionPayment | undefined>;
  createCommissionPayment(payment: InsertCommissionPayment): Promise<CommissionPayment>;
  updateCommissionPayment(id: number, payment: Partial<InsertCommissionPayment>): Promise<CommissionPayment>;
  deleteCommissionPayment(id: number): Promise<void>;

  // Product COGS operations
  getProductCogs(variantId?: number): Promise<ProductCogs[]>;
  getProductCogsById(id: number): Promise<ProductCogs | undefined>;
  getProductCogsByVariant(variantId: number): Promise<ProductCogs | undefined>;
  createProductCogs(cogs: InsertProductCogs): Promise<ProductCogs>;
  updateProductCogs(id: number, cogs: Partial<InsertProductCogs>): Promise<ProductCogs>;
  deleteProductCogs(id: number): Promise<void>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: number): Promise<void>;

  // Event Management operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Event Stage operations
  getEventStages(eventId: number): Promise<EventStage[]>;
  getEventStage(id: number): Promise<EventStage | undefined>;
  createEventStage(stage: InsertEventStage): Promise<EventStage>;
  updateEventStage(id: number, stage: Partial<InsertEventStage>): Promise<EventStage>;
  deleteEventStage(id: number): Promise<void>;

  // Event Staff operations
  getEventStaff(eventId: number): Promise<EventStaff[]>;
  createEventStaff(staff: InsertEventStaff): Promise<EventStaff>;
  updateEventStaff(id: number, staff: Partial<InsertEventStaff>): Promise<EventStaff>;
  deleteEventStaff(id: number): Promise<void>;

  // Event Contractor operations
  getEventContractors(eventId: number): Promise<EventContractor[]>;
  getEventContractor(id: number): Promise<EventContractor | undefined>;
  createEventContractor(contractor: InsertEventContractor): Promise<EventContractor>;
  updateEventContractor(id: number, contractor: Partial<InsertEventContractor>): Promise<EventContractor>;
  deleteEventContractor(id: number): Promise<void>;

  // Contractor Payment operations
  getContractorPayments(contractorId: number): Promise<ContractorPayment[]>;
  createContractorPayment(payment: InsertContractorPayment): Promise<ContractorPayment>;

  // Contractor File operations
  getContractorFiles(contractorId: number): Promise<ContractorFile[]>;
  createContractorFile(file: InsertContractorFile): Promise<ContractorFile>;
  deleteContractorFile(id: number): Promise<void>;

  // Event Merchandise operations
  getEventMerchandise(eventId: number): Promise<EventMerchandise[]>;
  createEventMerchandise(merchandise: InsertEventMerchandise): Promise<EventMerchandise>;
  updateEventMerchandise(id: number, merchandise: Partial<InsertEventMerchandise>): Promise<EventMerchandise>;
  deleteEventMerchandise(id: number): Promise<void>;

  // Event Inventory Movement operations
  getEventInventoryMovements(eventId: number): Promise<EventInventoryMovement[]>;
  createEventInventoryMovement(movement: InsertEventInventoryMovement): Promise<EventInventoryMovement>;

  // Event Budget operations
  getEventBudgets(eventId: number): Promise<EventBudget[]>;
  createEventBudget(budget: InsertEventBudget): Promise<EventBudget>;
  updateEventBudget(id: number, budget: Partial<InsertEventBudget>): Promise<EventBudget>;
  deleteEventBudget(id: number): Promise<void>;

  // Event Campaign operations
  getEventCampaigns(eventId: number): Promise<EventCampaign[]>;
  createEventCampaign(campaign: InsertEventCampaign): Promise<EventCampaign>;
  updateEventCampaign(id: number, campaign: Partial<InsertEventCampaign>): Promise<EventCampaign>;
  deleteEventCampaign(id: number): Promise<void>;

  // Event Registration operations
  getEventRegistrations(eventId: number): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistration(id: number, registration: Partial<InsertEventRegistration>): Promise<EventRegistration>;
  deleteEventRegistration(id: number): Promise<void>;

  // Event Sponsors
  getEventSponsors(eventId: number): Promise<EventSponsor[]>;
  createEventSponsor(sponsor: InsertEventSponsor): Promise<EventSponsor>;
  updateEventSponsor(id: number, sponsor: Partial<InsertEventSponsor>): Promise<EventSponsor>;
  deleteEventSponsor(id: number): Promise<void>;

  // Event Volunteers
  getEventVolunteers(eventId: number): Promise<EventVolunteer[]>;
  createEventVolunteer(volunteer: InsertEventVolunteer): Promise<EventVolunteer>;
  updateEventVolunteer(id: number, volunteer: Partial<InsertEventVolunteer>): Promise<EventVolunteer>;
  deleteEventVolunteer(id: number): Promise<void>;

  // Event Graphics
  getEventGraphics(eventId: number): Promise<EventGraphic[]>;
  createEventGraphic(graphic: InsertEventGraphic): Promise<EventGraphic>;
  updateEventGraphic(id: number, graphic: Partial<InsertEventGraphic>): Promise<EventGraphic>;
  deleteEventGraphic(id: number): Promise<void>;

  // Event Venues
  getEventVenues(eventId: number): Promise<EventVenue[]>;
  createEventVenue(venue: InsertEventVenue): Promise<EventVenue>;
  updateEventVenue(id: number, venue: Partial<InsertEventVenue>): Promise<EventVenue>;
  deleteEventVenue(id: number): Promise<void>;

  // Event Schedules
  getEventSchedules(eventId: number): Promise<EventSchedule[]>;
  createEventSchedule(schedule: InsertEventSchedule): Promise<EventSchedule>;
  updateEventSchedule(id: number, schedule: Partial<InsertEventSchedule>): Promise<EventSchedule>;
  deleteEventSchedule(id: number): Promise<void>;

  // Event Equipment
  getEventEquipment(eventId: number): Promise<EventEquipment[]>;
  createEventEquipment(equipment: InsertEventEquipment): Promise<EventEquipment>;
  updateEventEquipment(id: number, equipment: Partial<InsertEventEquipment>): Promise<EventEquipment>;
  deleteEventEquipment(id: number): Promise<void>;

  // Event Travel
  getEventTravel(eventId: number): Promise<EventTravel[]>;
  createEventTravel(travel: InsertEventTravel): Promise<EventTravel>;
  updateEventTravel(id: number, travel: Partial<InsertEventTravel>): Promise<EventTravel>;
  deleteEventTravel(id: number): Promise<void>;

  // Event Tasks
  getEventTasks(eventId: number): Promise<EventTask[]>;
  createEventTask(task: InsertEventTask): Promise<EventTask>;
  updateEventTask(id: number, task: Partial<InsertEventTask>): Promise<EventTask>;
  deleteEventTask(id: number): Promise<void>;

  // Event Documents
  getEventDocuments(eventId: number): Promise<EventDocument[]>;
  createEventDocument(document: InsertEventDocument): Promise<EventDocument>;
  updateEventDocument(id: number, document: Partial<InsertEventDocument>): Promise<EventDocument>;
  deleteEventDocument(id: number): Promise<void>;

  // Event Ticket Tiers
  getEventTicketTiers(eventId: number): Promise<EventTicketTier[]>;
  createEventTicketTier(tier: InsertEventTicketTier): Promise<EventTicketTier>;
  updateEventTicketTier(id: number, tier: Partial<InsertEventTicketTier>): Promise<EventTicketTier>;
  deleteEventTicketTier(id: number): Promise<void>;

  // Event Expenses
  getEventExpenses(eventId: number): Promise<EventExpense[]>;
  createEventExpense(expense: InsertEventExpense): Promise<EventExpense>;
  updateEventExpense(id: number, expense: Partial<InsertEventExpense>): Promise<EventExpense>;
  deleteEventExpense(id: number): Promise<void>;

  // Event Notes
  getEventNotes(eventId: number): Promise<EventNote[]>;
  createEventNote(note: InsertEventNote): Promise<EventNote>;
  updateEventNote(id: number, note: Partial<InsertEventNote>): Promise<EventNote>;
  deleteEventNote(id: number): Promise<void>;

  // Event Checklists
  getEventChecklists(eventId: number): Promise<EventChecklist[]>;
  createEventChecklist(checklist: InsertEventChecklist): Promise<EventChecklist>;
  updateEventChecklist(id: number, checklist: Partial<InsertEventChecklist>): Promise<EventChecklist>;
  deleteEventChecklist(id: number): Promise<void>;

  // Tour Merch Bundle operations
  getTourMerchBundles(): Promise<TourMerchBundle[]>;
  getTourMerchBundle(id: number): Promise<TourMerchBundle | undefined>;
  getTourMerchBundlesByEvent(eventId: number): Promise<TourMerchBundle[]>;
  createTourMerchBundle(bundle: InsertTourMerchBundle): Promise<TourMerchBundle>;
  updateTourMerchBundle(id: number, bundle: Partial<InsertTourMerchBundle>): Promise<TourMerchBundle>;
  deleteTourMerchBundle(id: number): Promise<void>;

  // Task management operations
  getTasks(filters?: { userId?: string; pageKey?: string; status?: string }): Promise<(Task & { assignedTo?: User; createdBy?: User })[]>;
  getTask(id: number): Promise<(Task & { assignedTo?: User; createdBy?: User }) | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getTasksByUser(userId: string): Promise<(Task & { assignedTo?: User; createdBy?: User })[]>;
  getTasksByPage(pageKey: string): Promise<(Task & { assignedTo?: User; createdBy?: User })[]>;

  // Communication log operations
  getCommunicationLogs(leadId?: number): Promise<CommunicationLog[]>;
  getCommunicationLogsByUser(userId: string): Promise<CommunicationLog[]>;
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;

  // User permission operations
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  getUserPermissionForResource(userId: string, resourceId: number): Promise<UserPermission | undefined>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  updateUserPermission(id: number, permission: Partial<InsertUserPermission>): Promise<UserPermission>;
  deleteUserPermission(id: number): Promise<void>;

  // Design portfolio operations
  getDesignPortfolios(designerId?: string): Promise<DesignPortfolio[]>;
  getDesignPortfolio(id: number): Promise<DesignPortfolio | undefined>;
  createDesignPortfolio(portfolio: InsertDesignPortfolio): Promise<DesignPortfolio>;
  updateDesignPortfolio(id: number, portfolio: Partial<InsertDesignPortfolio>): Promise<DesignPortfolio>;
  deleteDesignPortfolio(id: number): Promise<void>;

  // Variant specification operations
  getVariantSpecifications(variantId?: number): Promise<VariantSpecification[]>;
  getVariantSpecification(id: number): Promise<VariantSpecification | undefined>;
  createVariantSpecification(spec: InsertVariantSpecification): Promise<VariantSpecification>;
  updateVariantSpecification(id: number, spec: Partial<InsertVariantSpecification>): Promise<VariantSpecification>;
  deleteVariantSpecification(id: number): Promise<void>;

  // Sales Resource operations
  getSalesResources(): Promise<SalesResource[]>;
  getSalesResource(id: number): Promise<SalesResource | undefined>;
  createSalesResource(resource: InsertSalesResource): Promise<SalesResource>;
  updateSalesResource(id: number, resource: Partial<InsertSalesResource>): Promise<SalesResource>;
  deleteSalesResource(id: number): Promise<void>;
  incrementResourceDownloads(id: number): Promise<void>;

  // Lead archiving operations
  archiveLead(id: number, userId: string): Promise<Lead>;
  getArchivedLeads(userId?: string): Promise<Lead[]>;

  // Category archiving operations
  archiveCategory(id: number, userId: string): Promise<Category>;
  unarchiveCategory(id: number): Promise<Category>;
  getArchivedCategories(): Promise<Category[]>;

  // Product archiving operations
  archiveProduct(id: number, userId: string): Promise<Product>;
  unarchiveProduct(id: number): Promise<Product>;
  getArchivedProducts(): Promise<Product[]>;

  // Product variant archiving operations
  archiveProductVariant(id: number, userId: string): Promise<ProductVariant>;
  unarchiveProductVariant(id: number): Promise<ProductVariant>;
  getArchivedProductVariants(): Promise<ProductVariant[]>;

  // Fabric Management operations
  getFabrics(approvedOnly?: boolean): Promise<Fabric[]>;
  getFabric(id: number): Promise<Fabric | undefined>;
  createFabric(fabric: InsertFabric): Promise<Fabric>;
  updateFabric(id: number, fabric: Partial<InsertFabric>): Promise<Fabric>;
  deleteFabric(id: number): Promise<void>;
  approveFabric(id: number, userId: string): Promise<Fabric>;

  // Product Variant Fabric operations
  getProductVariantFabrics(variantId: number): Promise<(ProductVariantFabric & { fabric?: Fabric })[]>;
  assignFabricToVariant(assignment: InsertProductVariantFabric): Promise<ProductVariantFabric>;
  removeFabricFromVariant(id: number): Promise<void>;

  // Fabric Submission operations
  getFabricSubmissions(filters?: { manufacturingId?: number; lineItemId?: number; status?: string }): Promise<(FabricSubmission & { submitter?: User; reviewer?: User })[]>;
  getFabricSubmission(id: number): Promise<(FabricSubmission & { submitter?: User; reviewer?: User }) | undefined>;
  createFabricSubmission(submission: InsertFabricSubmission): Promise<FabricSubmission>;
  reviewFabricSubmission(id: number, reviewerId: string, status: "approved" | "rejected", reviewNotes?: string): Promise<FabricSubmission>;

  // Pantone Assignment operations
  getPantoneAssignments(filters?: { lineItemId?: number; manufacturingUpdateId?: number; orderId?: number }): Promise<PantoneAssignment[]>;
  getPantoneAssignment(id: number): Promise<PantoneAssignment | undefined>;
  createPantoneAssignment(assignment: InsertPantoneAssignment): Promise<PantoneAssignment>;
  updatePantoneAssignment(id: number, assignment: Partial<InsertPantoneAssignment>): Promise<PantoneAssignment>;
  deletePantoneAssignment(id: number): Promise<void>;

  // Manufacturer Portal - Job operations
  getManufacturerJobs(manufacturerId?: number): Promise<(ManufacturerJob & { manufacturing?: Manufacturing; order?: Order; manufacturer?: Manufacturer })[]>;
  getManufacturerJob(id: number): Promise<(ManufacturerJob & { manufacturing?: Manufacturing; order?: Order; manufacturer?: Manufacturer; events?: ManufacturerEvent[] }) | undefined>;
  getManufacturerJobByManufacturingId(manufacturingId: number): Promise<ManufacturerJob | undefined>;
  createManufacturerJob(job: InsertManufacturerJob): Promise<ManufacturerJob>;
  updateManufacturerJob(id: number, job: Partial<InsertManufacturerJob>): Promise<ManufacturerJob>;
  deleteManufacturerJob(id: number): Promise<void>;

  // Manufacturer Portal - Event operations
  getManufacturerEvents(jobId: number): Promise<(ManufacturerEvent & { createdByUser?: User })[]>;
  createManufacturerEvent(event: InsertManufacturerEvent): Promise<ManufacturerEvent>;

  // Printful Sync Record operations
  getPrintfulSyncRecords(orderId?: number): Promise<PrintfulSyncRecord[]>;
  getPrintfulSyncRecord(id: number): Promise<PrintfulSyncRecord | undefined>;
  getPrintfulSyncRecordByOrderId(orderId: number): Promise<PrintfulSyncRecord | undefined>;
  createPrintfulSyncRecord(record: InsertPrintfulSyncRecord): Promise<PrintfulSyncRecord>;
  updatePrintfulSyncRecord(id: number, record: Partial<InsertPrintfulSyncRecord>): Promise<PrintfulSyncRecord>;

  // Manufacturing Note Category operations
  getManufacturingNoteCategories(): Promise<ManufacturingNoteCategory[]>;
  getManufacturingNoteCategory(id: number): Promise<ManufacturingNoteCategory | undefined>;
  createManufacturingNoteCategory(category: InsertManufacturingNoteCategory): Promise<ManufacturingNoteCategory>;
  updateManufacturingNoteCategory(id: number, category: Partial<InsertManufacturingNoteCategory>): Promise<ManufacturingNoteCategory>;
  deleteManufacturingNoteCategory(id: number): Promise<void>;

  // Design Lab - Projects
  getDesignProjects(userId?: string): Promise<DesignProject[]>;
  getDesignProject(id: number): Promise<DesignProject | undefined>;
  createDesignProject(data: InsertDesignProject): Promise<DesignProject>;
  updateDesignProject(id: number, data: Partial<InsertDesignProject>): Promise<DesignProject | undefined>;

  // Design Lab - Versions
  getDesignVersions(projectId: number): Promise<DesignVersion[]>;
  getDesignVersion(id: number): Promise<DesignVersion | undefined>;
  createDesignVersion(data: InsertDesignVersion): Promise<DesignVersion>;
  updateDesignVersion(id: number, data: Partial<InsertDesignVersion>): Promise<DesignVersion | undefined>;

  // Design Lab - Layers
  getDesignLayers(versionId: number): Promise<DesignLayer[]>;
  getDesignLayer(id: number): Promise<DesignLayer | undefined>;
  createDesignLayer(data: InsertDesignLayer): Promise<DesignLayer>;
  updateDesignLayer(id: number, data: Partial<InsertDesignLayer>): Promise<DesignLayer | undefined>;
  deleteDesignLayer(id: number): Promise<boolean>;

  // Design Lab - Templates (Admin)
  getDesignTemplates(variantId?: number): Promise<DesignTemplate[]>;
  getDesignTemplate(id: number): Promise<DesignTemplate | undefined>;
  createDesignTemplate(data: InsertDesignTemplate): Promise<DesignTemplate>;
  updateDesignTemplate(id: number, data: Partial<InsertDesignTemplate>): Promise<DesignTemplate | undefined>;

  // Design Lab - Locked Overlays (Admin)
  getDesignLockedOverlays(variantId?: number): Promise<DesignLockedOverlay[]>;
  getDesignLockedOverlay(id: number): Promise<DesignLockedOverlay | undefined>;
  createDesignLockedOverlay(data: InsertDesignLockedOverlay): Promise<DesignLockedOverlay>;
  updateDesignLockedOverlay(id: number, data: Partial<InsertDesignLockedOverlay>): Promise<DesignLockedOverlay | undefined>;

  // Design Lab - Generation Requests
  getDesignGenerationRequest(id: number): Promise<DesignGenerationRequest | undefined>;
  getDesignGenerationRequestByCode(code: string): Promise<DesignGenerationRequest | undefined>;
  createDesignGenerationRequest(data: InsertDesignGenerationRequest): Promise<DesignGenerationRequest>;
  updateDesignGenerationRequest(id: number, data: Partial<InsertDesignGenerationRequest>): Promise<DesignGenerationRequest | undefined>;

  // Design Lab - AI Training Sets
  getDesignAiTrainingSets(): Promise<DesignAiTrainingSet[]>;
  getDesignAiTrainingSet(id: number): Promise<DesignAiTrainingSet | undefined>;
  createDesignAiTrainingSet(data: InsertDesignAiTrainingSet): Promise<DesignAiTrainingSet>;
  updateDesignAiTrainingSet(id: number, data: Partial<InsertDesignAiTrainingSet>): Promise<DesignAiTrainingSet | undefined>;
  deleteDesignAiTrainingSet(id: number): Promise<boolean>;

  // Design Lab - AI Training Images
  getDesignAiTrainingImages(trainingSetId: number): Promise<DesignAiTrainingImage[]>;
  getDesignAiTrainingImage(id: number): Promise<DesignAiTrainingImage | undefined>;
  createDesignAiTrainingImage(data: InsertDesignAiTrainingImage): Promise<DesignAiTrainingImage>;
  deleteDesignAiTrainingImage(id: number): Promise<boolean>;

  // Design Lab - Style Presets
  getDesignStylePresets(): Promise<DesignStylePreset[]>;
  getDesignStylePreset(id: number): Promise<DesignStylePreset | undefined>;
  createDesignStylePreset(data: InsertDesignStylePreset): Promise<DesignStylePreset>;
  updateDesignStylePreset(id: number, data: Partial<InsertDesignStylePreset>): Promise<DesignStylePreset | undefined>;
  deleteDesignStylePreset(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First, try to find existing user by ID or email
    const existingById = userData.id ? await this.getUser(userData.id) : null;
    const existingByEmail = userData.email ? await this.getUserByEmail(userData.email) : null;

    // If user exists by email but different ID, update the existing user WITHOUT changing ID
    // (Changing primary key IDs violates foreign key constraints)
    if (existingByEmail && (!userData.id || existingByEmail.id !== userData.id)) {
      const { id, ...updateData } = userData; // Exclude ID from update
      const [user] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingByEmail.id))
        .returning();
      return user;
    }

    // Otherwise, use normal upsert by ID
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management operations (admin only)
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      role: userData.role as "admin" | "sales" | "designer" | "ops" | "manufacturer"
    }).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const updateData: any = { ...userData, updatedAt: new Date() };
    if (userData.role) {
      updateData.role = userData.role as "admin" | "sales" | "designer" | "ops" | "manufacturer";
    }
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new Error(`User with id ${id} not found`);
    }

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async countAdmins(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    return result[0]?.count || 0;
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    // By default, don't show archived organizations
    return await db
      .select()
      .from(organizations)
      .where(eq(organizations.archived, false))
      .orderBy(desc(organizations.createdAt));
  }
  
  // Get all organizations including archived ones
  async getAllOrganizationsIncludingArchived(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async findOrganizationByName(name: string): Promise<Organization | undefined> {
    const normalizedName = name.trim().toLowerCase();
    const orgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.archived, false));
    
    // Find by case-insensitive name match
    const match = orgs.find(org => org.name.trim().toLowerCase() === normalizedName);
    return match;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    try {
      const [created] = await db.insert(organizations).values(org as any).returning();
      if (!created) {
        throw new Error("Failed to create organization - no data returned");
      }
      return created;
    } catch (error) {
      console.error("Database error creating organization:", error);
      throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown database error'}`);
    }
  }

  async updateOrganization(id: number, org: Partial<InsertOrganization>): Promise<Organization> {
    console.log(`[STORAGE] updateOrganization called with ID: ${id}`);
    console.log(`[STORAGE] Input org param:`, JSON.stringify(org, null, 2));

    const updateData: any = { ...org, updatedAt: new Date() };
    if (org.clientType) {
      updateData.clientType = org.clientType as "retail" | "wholesale" | "enterprise" | "government";
    }

    console.log(`[STORAGE] updateData before DB call:`, JSON.stringify(updateData, null, 2));
    console.log(`[STORAGE] updateData.notes:`, updateData.notes);
    console.log(`[STORAGE] updateData.shippingAddress:`, updateData.shippingAddress);

    const [updated] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    console.log(`[STORAGE] Updated org from DB:`, JSON.stringify(updated, null, 2));
    console.log(`[STORAGE] updated.notes:`, updated.notes);
    console.log(`[STORAGE] updated.shippingAddress:`, updated.shippingAddress);

    if (!updated) {
      throw new Error(`Organization with id ${id} not found`);
    }
    return updated;
  }

  // Archive organization (soft delete)
  async archiveOrganization(id: number, userId: string): Promise<Organization> {
    console.log(`[STORAGE] archiveOrganization called with ID: ${id}`);
    
    const [archived] = await db
      .update(organizations)
      .set({
        archived: true,
        archivedAt: new Date(),
        archivedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();

    if (!archived) {
      throw new Error(`Organization with id ${id} not found`);
    }
    
    console.log(`[STORAGE] Organization ${id} archived successfully`);
    return archived;
  }
  
  // Unarchive organization
  async unarchiveOrganization(id: number): Promise<Organization> {
    console.log(`[STORAGE] unarchiveOrganization called with ID: ${id}`);
    
    const [unarchived] = await db
      .update(organizations)
      .set({
        archived: false,
        archivedAt: null,
        archivedBy: null,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();

    if (!unarchived) {
      throw new Error(`Organization with id ${id} not found`);
    }
    
    console.log(`[STORAGE] Organization ${id} unarchived successfully`);
    return unarchived;
  }

  // Legacy hard delete - kept for backward compatibility but should not be used
  async deleteOrganization(id: number): Promise<void> {
    console.log(`[STORAGE] deleteOrganization called with ID: ${id} - DEPRECATED: use archiveOrganization instead`);
    console.log(`[STORAGE] ID type: ${typeof id}, value: ${id}`);

    try {
      console.log(`[STORAGE] Starting database transaction for organization deletion`);

      await db.transaction(async (tx) => {
        console.log(`[STORAGE] Inside transaction - deleting organization ${id}`);

        // Check for foreign key dependencies and handle them
        console.log(`[STORAGE] Step 1: Updating leads to remove organization reference`);
        const leadUpdateResult = await tx.update(leads)
          .set({ orgId: null })
          .where(eq(leads.orgId, id));
        console.log(`[STORAGE] Lead update result:`, leadUpdateResult);
        console.log(`[STORAGE] Updated ${leadUpdateResult.rowCount || 0} leads to remove organization reference`);

        console.log(`[STORAGE] Step 2: Updating contacts to remove organization reference`);
        const contactUpdateResult = await tx.update(contacts)
          .set({ orgId: null })
          .where(eq(contacts.orgId, id));
        console.log(`[STORAGE] Contact update result:`, contactUpdateResult);
        console.log(`[STORAGE] Updated ${contactUpdateResult.rowCount || 0} contacts to remove organization reference`);

        console.log(`[STORAGE] Step 3: Updating orders to remove organization reference`);
        const orderUpdateResult = await tx.update(orders)
          .set({ orgId: null })
          .where(eq(orders.orgId, id));
        console.log(`[STORAGE] Order update result:`, orderUpdateResult);
        console.log(`[STORAGE] Updated ${orderUpdateResult.rowCount || 0} orders to remove organization reference`);

        console.log(`[STORAGE] Step 4: Updating design jobs to remove organization reference`);
        const designJobUpdateResult = await tx.update(designJobs)
          .set({ orgId: null })
          .where(eq(designJobs.orgId, id));
        console.log(`[STORAGE] Design job update result:`, designJobUpdateResult);
        console.log(`[STORAGE] Updated ${designJobUpdateResult.rowCount || 0} design jobs to remove organization reference`);

        console.log(`[STORAGE] Step 5: Updating quotes to remove organization reference`);
        const quoteUpdateResult = await tx.update(quotes)
          .set({ orgId: null })
          .where(eq(quotes.orgId, id));
        console.log(`[STORAGE] Quote update result:`, quoteUpdateResult);
        console.log(`[STORAGE] Updated ${quoteUpdateResult.rowCount || 0} quotes to remove organization reference`);

        console.log(`[STORAGE] Step 6: Finally deleting the organization`);
        const deleteResult = await tx.delete(organizations).where(eq(organizations.id, id));
        console.log(`[STORAGE] Organization delete result:`, deleteResult);
        console.log(`[STORAGE] Delete result rowCount:`, deleteResult.rowCount);

        if (deleteResult.rowCount === 0) {
          const errorMsg = `Organization with ID ${id} was not found or could not be deleted`;
          console.error(`[STORAGE] ${errorMsg}`);
          throw new Error(errorMsg);
        }

        console.log(`[STORAGE] Organization ${id} deleted successfully from database`);
      });

      console.log(`[STORAGE] Transaction completed successfully for organization ${id}`);
    } catch (error) {
      console.error(`[STORAGE] Error deleting organization ${id}:`, error);
      console.error(`[STORAGE] Error type:`, typeof error);
      console.error(`[STORAGE] Error instanceof Error:`, error instanceof Error);
      console.error(`[STORAGE] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      const newError = new Error(`Failed to delete organization: ${errorMessage}`);
      console.error(`[STORAGE] Throwing new error:`, newError.message);
      throw newError;
    }
  }

  // Lead operations
  async getLeads(): Promise<(Lead & { organization?: Organization; contact?: Contact; owner?: User })[]> {
    const result = await db
      .select({
        lead: leads,
        organization: organizations,
        contact: contacts,
        owner: users
      })
      .from(leads)
      .leftJoin(organizations, eq(leads.orgId, organizations.id))
      .leftJoin(contacts, eq(leads.contactId, contacts.id))
      .leftJoin(users, eq(leads.ownerUserId, users.id))
      .orderBy(desc(leads.createdAt));

    return result.map(row => ({
      ...row.lead,
      organization: row.organization || undefined,
      contact: row.contact || undefined,
      owner: row.owner || undefined
    }));
  }

  async getLead(id: number): Promise<(Lead & { organization?: Organization; contact?: Contact; owner?: User }) | undefined> {
    const [result] = await db
      .select({
        lead: leads,
        organization: organizations,
        contact: contacts,
        owner: users
      })
      .from(leads)
      .leftJoin(organizations, eq(leads.orgId, organizations.id))
      .leftJoin(contacts, eq(leads.contactId, contacts.id))
      .leftJoin(users, eq(leads.ownerUserId, users.id))
      .where(eq(leads.id, id));

    if (!result) return undefined;

    return {
      ...result.lead,
      organization: result.organization || undefined,
      contact: result.contact || undefined,
      owner: result.owner || undefined
    };
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const leadCode = await this.getNextCode("L");
    const [created] = await db.insert(leads).values({
      ...lead,
      leadCode,
    }).returning();
    return created;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Lead with id ${id} not found`);
    }

    return updated;
  }

  async getLeadDependencies(id: number): Promise<{ orders: number; designJobs: number }> {
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.leadId, id));
    
    const [designJobCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(designJobs)
      .where(eq(designJobs.leadId, id));
    
    return {
      orders: orderCount?.count || 0,
      designJobs: designJobCount?.count || 0,
    };
  }

  async deleteLead(id: number, forceDelete: boolean = false): Promise<{ success: boolean; archived?: boolean; dependencies?: { orders: number; designJobs: number } }> {
    const dependencies = await this.getLeadDependencies(id);
    const hasDependencies = dependencies.orders > 0 || dependencies.designJobs > 0;
    
    if (hasDependencies && !forceDelete) {
      return {
        success: false,
        archived: false,
        dependencies,
      };
    }
    
    if (hasDependencies) {
      await db.update(orders).set({ leadId: null }).where(eq(orders.leadId, id));
      await db.update(designJobs).set({ leadId: null }).where(eq(designJobs.leadId, id));
    }
    
    await db.delete(leads).where(eq(leads.id, id));
    return { success: true };
  }

  async getLeadsByStage(stage: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.stage, stage as any));
  }

  async getLeadsBySalesperson(userId: string): Promise<(Lead & { organization?: Organization; contact?: Contact })[]> {
    const results = await db
      .select({
        ...getTableColumns(leads),
        organization: organizations,
        contact: contacts,
      })
      .from(leads)
      .leftJoin(organizations, eq(leads.orgId, organizations.id))
      .leftJoin(contacts, eq(leads.contactId, contacts.id))
      .where(eq(leads.ownerUserId, userId));

    return results.map(row => ({
      ...row,
      organization: row.organization || undefined,
      contact: row.contact || undefined,
    }));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    let sku = product.sku;

    // Auto-generate SKU if not provided
    if (!sku) {
      // Get the category to use its name for SKU generation
      const category = await this.getCategory(product.categoryId);
      if (!category) {
        throw new Error(`Category with ID ${product.categoryId} not found`);
      }

      // Generate SKU components
      const categoryPart = category.name.substring(0, 3).toUpperCase();
      const stylePart = (product.style || product.name).substring(0, 3).toUpperCase();

      // Keep generating until we find a unique SKU
      let attempts = 0;
      const maxAttempts = 10;
      while (!sku && attempts < maxAttempts) {
        const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
        const generatedSku = `${categoryPart}-${stylePart}-${randomPart}`;

        // Check if this SKU already exists
        const [existingProduct] = await db
          .select()
          .from(products)
          .where(eq(products.sku, generatedSku));

        if (!existingProduct) {
          sku = generatedSku;
        }
        attempts++;
      }

      if (!sku) {
        throw new Error("Failed to generate unique SKU after multiple attempts");
      }
    }

    const [created] = await db.insert(products).values({ ...product, sku }).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Catalog operations (products with categories)
  async getCatalogProducts(): Promise<(Product & { category?: Category })[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    return results.map(row => ({
      ...row.products,
      category: row.categories || undefined
    }));
  }

  async getCatalogProduct(id: number): Promise<(Product & { category?: Category }) | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      ...result.products,
      category: result.categories || undefined
    };
  }

  // Product variant operations
  async getProductVariants(productId?: number): Promise<ProductVariant[]> {
    if (productId) {
      return await db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(desc(productVariants.createdAt));
    }
    return await db.select().from(productVariants).orderBy(desc(productVariants.createdAt));
  }

  async getProductVariant(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return variant;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(productVariants).values(variant).returning();
    return created;
  }

  async updateProductVariant(id: number, variant: Partial<InsertProductVariant>): Promise<ProductVariant> {
    const [updated] = await db
      .update(productVariants)
      .set({ ...variant, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return updated;
  }

  async deleteProductVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  // Contact operations
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async findContactByEmail(email: string): Promise<Contact | undefined> {
    const normalizedEmail = email.trim().toLowerCase();
    const [contact] = await db
      .select()
      .from(contacts)
      .where(sql`lower(${contacts.email}) = ${normalizedEmail}`);
    return contact;
  }

  async findContactByNameAndOrg(name: string, orgId: number): Promise<Contact | undefined> {
    const normalizedName = name.trim().toLowerCase();
    const orgContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.orgId, orgId));
    
    // Find by case-insensitive name match within the organization
    const match = orgContacts.find(c => c.name.trim().toLowerCase() === normalizedName);
    return match;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact> {
    const [updated] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  async getContactsByOrganization(orgId: number): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.orgId, orgId))
      .orderBy(desc(contacts.isPrimary), desc(contacts.createdAt));
  }

  async getContactsByRole(role: string): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.role, role as "admin" | "customer" | "billing" | "technical" | "executive" | "other"))
      .orderBy(desc(contacts.createdAt));
  }

  async getCustomerContactsByOrganization(orgId: number): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(and(eq(contacts.orgId, orgId), eq(contacts.role, 'customer')))
      .orderBy(desc(contacts.isPrimary), desc(contacts.createdAt));
  }

  // Order operations
  async getOrders(): Promise<(Order & { salespersonName?: string | null })[]> {
    const results = await db
      .select({
        ...getTableColumns(orders),
        salespersonName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.salespersonId, users.id))
      .orderBy(desc(orders.createdAt));

    return results;
  }

  async getOrder(id: number): Promise<(Order & { salespersonName?: string | null }) | undefined> {
    const [order] = await db
      .select({
        ...getTableColumns(orders),
        salespersonName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.salespersonId, users.id))
      .where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderCode = await this.getNextCode("O");
    const [created] = await db.insert(orders).values({
      ...order,
      orderCode,
    }).returning();
    return created;
  }

  async createOrderWithLineItems(order: InsertOrder, lineItems: InsertOrderLineItem[]): Promise<Order & { lineItems: OrderLineItem[] }> {
    // Use a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Generate order code
      const orderCode = await this.getNextCode("O");

      // Create the order
      const [createdOrder] = await tx.insert(orders).values({
        ...order,
        orderCode,
      }).returning();

      // Create line items if provided
      const createdLineItems: OrderLineItem[] = [];
      if (lineItems && lineItems.length > 0) {
        for (const lineItem of lineItems) {
          const [createdLineItem] = await tx.insert(orderLineItems).values({
            ...lineItem,
            orderId: createdOrder.id,
          } as any).returning();
          createdLineItems.push(createdLineItem);

          // Auto-assign manufacturer from variant's defaultManufacturerId if it exists
          if (lineItem.variantId) {
            const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, lineItem.variantId));
            if (variant?.defaultManufacturerId) {
              await tx.insert(orderLineItemManufacturers).values({
                lineItemId: createdLineItem.id,
                manufacturerId: variant.defaultManufacturerId,
              });
            }
          }
        }
      }

      return {
        ...createdOrder,
        lineItems: createdLineItems,
      };
    });
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | null> {
    console.log(`[Storage] updateOrder called for id=${id} with fields:`, Object.keys(order));
    
    try {
      const [updated] = await db
        .update(orders)
        .set({ ...order, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      
      if (!updated) {
        console.log(`[Storage] updateOrder: No order found with id=${id}`);
        return null;
      }
      
      console.log(`[Storage] updateOrder success for id=${id}`);
      return updated;
    } catch (error) {
      console.error(`[Storage] updateOrder error for id=${id}:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async deleteOrder(id: number): Promise<void> {
    // Delete in transaction to handle foreign key constraints
    await db.transaction(async (tx) => {
      // Delete related line items first
      await tx.delete(orderLineItems).where(eq(orderLineItems.orderId, id));
      // Delete tracking numbers (will cascade delete automatically with onDelete: 'cascade')
      await tx.delete(orderTrackingNumbers).where(eq(orderTrackingNumbers.orderId, id));
      // Delete manufacturing record if exists (updates will cascade)
      const [manufacturingRecord] = await tx.select().from(manufacturing).where(eq(manufacturing.orderId, id));
      if (manufacturingRecord) {
        await tx.delete(manufacturingUpdates).where(eq(manufacturingUpdates.manufacturingId, manufacturingRecord.id));
        await tx.delete(manufacturing).where(eq(manufacturing.orderId, id));
      }
      // Delete design jobs references (set to null)
      await tx.update(designJobs)
        .set({ orderId: null })
        .where(eq(designJobs.orderId, id));
      // Finally delete the order
      await tx.delete(orders).where(eq(orders.id, id));
    });
  }

  async getOrdersBySalesperson(userId: string): Promise<(Order & { organization?: Organization; contact?: Contact; salespersonName?: string | null })[]> {
    // Get orders where salesperson_id matches the user's ID
    // Also check the salespersons table to find orders that might be linked via:
    // 1. The user's ID directly (orders.salesperson_id = users.id)
    // 2. The salesperson's numeric ID (orders.salesperson_id = salespersons.id as string)
    // 3. The salesperson's user_id field (orders.salesperson_id = salespersons.user_id)
    
    // Build list of all possible IDs to match
    const idsToMatch = new Set<string>([userId]);
    
    // Get salesperson records for this user to find their numeric ID and user_id
    const salespersonRecords = await db
      .select({ 
        spId: salespersons.id, 
        spUserId: salespersons.userId 
      })
      .from(salespersons)
      .where(eq(salespersons.userId, userId));
    
    // Add both the numeric salesperson ID (as string) and the user_id from salesperson records
    for (const sp of salespersonRecords) {
      if (sp.spId) {
        idsToMatch.add(String(sp.spId)); // Numeric ID as string
      }
      if (sp.spUserId) {
        idsToMatch.add(sp.spUserId);
      }
    }

    const results = await db
      .select({
        ...getTableColumns(orders),
        organization: organizations,
        contact: contacts,
        salespersonName: users.name,
      })
      .from(orders)
      .leftJoin(organizations, eq(orders.orgId, organizations.id))
      .leftJoin(leads, eq(orders.leadId, leads.id))
      .leftJoin(contacts, eq(leads.contactId, contacts.id))
      .leftJoin(users, eq(orders.salespersonId, users.id))
      .where(inArray(orders.salespersonId, Array.from(idsToMatch)));

    return results.map(row => ({
      ...row,
      organization: row.organization || undefined,
      contact: row.contact || undefined,
    }));
  }

  // Order tracking number operations
  async getOrderTrackingNumbers(orderId: number): Promise<any[]> {
    return await db
      .select()
      .from(orderTrackingNumbers)
      .where(eq(orderTrackingNumbers.orderId, orderId))
      .orderBy(desc(orderTrackingNumbers.createdAt));
  }

  async addOrderTrackingNumber(tracking: { orderId: number; trackingNumber: string; carrierCompany: string }): Promise<any> {
    const [result] = await db
      .insert(orderTrackingNumbers)
      .values(tracking)
      .returning();
    return result;
  }

  async deleteOrderTrackingNumber(id: number): Promise<void> {
    await db.delete(orderTrackingNumbers).where(eq(orderTrackingNumbers.id, id));
  }

  // Alias for portal API
  async getTrackingNumbersByOrder(orderId: number): Promise<any[]> {
    return this.getOrderTrackingNumbers(orderId);
  }

  // Customer comments operations
  async getCustomerComments(orderId: number): Promise<any[]> {
    return await db
      .select()
      .from(customerComments)
      .where(eq(customerComments.orderId, orderId))
      .orderBy(asc(customerComments.createdAt));
  }

  async createCustomerComment(data: { orderId: number; message: string; isFromCustomer?: boolean }): Promise<any> {
    const [result] = await db
      .insert(customerComments)
      .values({
        orderId: data.orderId,
        message: data.message,
        isFromCustomer: data.isFromCustomer ?? true,
      })
      .returning();
    return result;
  }

  // Size adjustment requests operations
  async getSizeAdjustmentRequests(orderId: number): Promise<any[]> {
    return await db
      .select()
      .from(sizeAdjustmentRequests)
      .where(eq(sizeAdjustmentRequests.orderId, orderId))
      .orderBy(desc(sizeAdjustmentRequests.createdAt));
  }

  async createSizeAdjustmentRequest(data: { orderId: number; requestMessage: string }): Promise<any> {
    const [result] = await db
      .insert(sizeAdjustmentRequests)
      .values({
        orderId: data.orderId,
        requestMessage: data.requestMessage,
        status: "pending",
      })
      .returning();
    return result;
  }

  async updateSizeAdjustmentRequest(id: number, data: { status?: string; adminResponse?: string; respondedBy?: string }): Promise<any> {
    const [result] = await db
      .update(sizeAdjustmentRequests)
      .set({
        ...data,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sizeAdjustmentRequests.id, id))
      .returning();
    return result;
  }

  // Alias for portal API - get order activity log
  async getOrderActivityLog(orderId: number): Promise<any[]> {
    return this.getOrderActivity(orderId);
  }

  // Order form submissions operations
  async getOrderFormSubmission(orderId: number): Promise<OrderFormSubmission | null> {
    const [submission] = await db
      .select()
      .from(orderFormSubmissions)
      .where(eq(orderFormSubmissions.orderId, orderId))
      .orderBy(desc(orderFormSubmissions.submittedAt))
      .limit(1);
    return submission || null;
  }

  async getOrderFormSubmissions(orderId: number): Promise<OrderFormSubmission[]> {
    return await db
      .select()
      .from(orderFormSubmissions)
      .where(eq(orderFormSubmissions.orderId, orderId))
      .orderBy(desc(orderFormSubmissions.submittedAt));
  }

  async createOrderFormSubmission(data: InsertOrderFormSubmission): Promise<OrderFormSubmission> {
    const [submission] = await db
      .insert(orderFormSubmissions)
      .values(data)
      .returning();
    return submission;
  }

  async updateOrderFormSubmission(id: number, data: Partial<InsertOrderFormSubmission>): Promise<OrderFormSubmission | null> {
    const [updated] = await db
      .update(orderFormSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orderFormSubmissions.id, id))
      .returning();
    return updated || null;
  }

  // Order form line item sizes operations
  async getOrderFormLineItemSizes(submissionId: number): Promise<OrderFormLineItemSizes[]> {
    return await db
      .select()
      .from(orderFormLineItemSizes)
      .where(eq(orderFormLineItemSizes.submissionId, submissionId));
  }

  async createOrderFormLineItemSizes(data: InsertOrderFormLineItemSizes): Promise<OrderFormLineItemSizes> {
    const [sizes] = await db
      .insert(orderFormLineItemSizes)
      .values(data)
      .returning();
    return sizes;
  }

  async bulkCreateOrderFormLineItemSizes(items: InsertOrderFormLineItemSizes[]): Promise<OrderFormLineItemSizes[]> {
    if (items.length === 0) return [];
    return await db
      .insert(orderFormLineItemSizes)
      .values(items)
      .returning();
  }

  // Get order for public form (no auth required, limited data)
  async getOrderForPublicForm(orderId: number): Promise<{
    order: Order | null;
    organization: Organization | null;
    lineItems: (OrderLineItem & { variant?: ProductVariant; product?: Product })[];
  } | null> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return null;

    const [organization] = order.orgId 
      ? await db.select().from(organizations).where(eq(organizations.id, order.orgId))
      : [null];

    const lineItemResults = await db
      .select({
        lineItem: orderLineItems,
        variant: productVariants,
        product: products,
      })
      .from(orderLineItems)
      .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(eq(orderLineItems.orderId, orderId));

    const lineItems = lineItemResults.map(row => ({
      ...row.lineItem,
      variant: row.variant || undefined,
      product: row.product || undefined,
    }));

    return { order, organization, lineItems };
  }

  async getOrderWithLineItems(id: number): Promise<(Order & { lineItems: (OrderLineItem & { variant?: ProductVariant; product?: Product })[]; salespersonName?: string | null }) | undefined> {
    try {
      const [order] = await db
        .select({
          ...getTableColumns(orders),
          salespersonName: users.name,
        })
        .from(orders)
        .leftJoin(users, eq(orders.salespersonId, users.id))
        .where(eq(orders.id, id));

      if (!order) return undefined;

      const lineItemResults = await db
        .select({
          lineItem: orderLineItems,
          variant: productVariants,
          product: products,
        })
        .from(orderLineItems)
        .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
        .leftJoin(products, eq(productVariants.productId, products.id))
        .where(eq(orderLineItems.orderId, id));

      const lineItems = lineItemResults.map(row => ({
        ...row.lineItem,
        variant: row.variant || undefined,
        product: row.product || undefined,
      }));

      return { ...order, lineItems };
    } catch (error) {
      console.error(`Error fetching order ${id} with line items:`, error);
      throw error;
    }
  }

  // Order line item operations
  async getOrderLineItems(orderId: number): Promise<OrderLineItem[]> {
    return await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, orderId));
  }

  async getOrderLineItemsWithVariants(orderId: number): Promise<(OrderLineItem & { variant?: ProductVariant })[]> {
    const results = await db
      .select()
      .from(orderLineItems)
      .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
      .where(eq(orderLineItems.orderId, orderId));

    return results.map(row => ({
      ...row.order_line_items,
      variant: row.product_variants || undefined
    }));
  }

  async getOrderLineItemsWithManufacturers(orderId: number): Promise<any[]> {
    const results = await db
      .select()
      .from(orderLineItems)
      .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
      .leftJoin(orderLineItemManufacturers, eq(orderLineItems.id, orderLineItemManufacturers.lineItemId))
      .leftJoin(manufacturers, eq(orderLineItemManufacturers.manufacturerId, manufacturers.id))
      .where(eq(orderLineItems.orderId, orderId));

    // For each line item, if there's no explicit manufacturer assignment, 
    // fetch the default manufacturer from the variant
    const lineItemsWithManufacturers = await Promise.all(results.map(async (row) => {
      let manufacturer = row.manufacturers || undefined;

      // If no manufacturer from assignment, try to get default from variant
      if (!manufacturer && row.product_variants?.defaultManufacturerId) {
        const [defaultManufacturer] = await db
          .select()
          .from(manufacturers)
          .where(eq(manufacturers.id, row.product_variants.defaultManufacturerId));
        manufacturer = defaultManufacturer || undefined;
      }

      return {
        ...row.order_line_items,
        variant: row.product_variants || undefined,
        manufacturerAssignment: row.order_line_item_manufacturers || undefined,
        manufacturer
      };
    }));

    return lineItemsWithManufacturers;
  }

  async createOrderLineItem(lineItem: InsertOrderLineItem): Promise<OrderLineItem> {
    const [created] = await db.insert(orderLineItems).values(lineItem as any).returning();

    // Auto-assign manufacturer from variant's defaultManufacturerId if it exists
    if (lineItem.variantId) {
      const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, lineItem.variantId));
      if (variant?.defaultManufacturerId) {
        await db.insert(orderLineItemManufacturers).values({
          lineItemId: created.id,
          manufacturerId: variant.defaultManufacturerId,
        });
      }
    }

    return created;
  }

  async updateOrderLineItem(id: number, lineItem: Partial<InsertOrderLineItem>): Promise<OrderLineItem> {
    const [updated] = await db
      .update(orderLineItems)
      .set({ ...lineItem, updatedAt: new Date() } as any)
      .where(eq(orderLineItems.id, id))
      .returning();
    return updated;
  }

  async deleteOrderLineItem(id: number): Promise<void> {
    await db.delete(orderLineItems).where(eq(orderLineItems.id, id));
  }

  // Design job operations
  async getDesignJobs(): Promise<(DesignJob & { organization?: Organization; designer?: User })[]> {
    const jobs = await db
      .select({
        designJob: designJobs,
        organization: organizations,
        designer: users,
      })
      .from(designJobs)
      .leftJoin(organizations, eq(designJobs.orgId, organizations.id))
      .leftJoin(users, eq(designJobs.assignedDesignerId, users.id))
      .orderBy(desc(designJobs.createdAt));

    return jobs.map(row => ({
      ...row.designJob,
      organization: row.organization || undefined,
      designer: row.designer || undefined,
    }));
  }

  async getDesignJob(id: number): Promise<(DesignJob & { organization?: Organization; designer?: User }) | undefined> {
    const [result] = await db
      .select({
        designJob: designJobs,
        organization: organizations,
        designer: users,
      })
      .from(designJobs)
      .leftJoin(organizations, eq(designJobs.orgId, organizations.id))
      .leftJoin(users, eq(designJobs.assignedDesignerId, users.id))
      .where(eq(designJobs.id, id));

    if (!result) return undefined;

    return {
      ...result.designJob,
      organization: result.organization || undefined,
      designer: result.designer || undefined,
    };
  }

  async getDesignJobsByDesigner(userId: string): Promise<(DesignJob & { organization?: Organization; designer?: User })[]> {
    const jobs = await db
      .select({
        designJob: designJobs,
        organization: organizations,
        designer: users,
      })
      .from(designJobs)
      .leftJoin(organizations, eq(designJobs.orgId, organizations.id))
      .leftJoin(users, eq(designJobs.assignedDesignerId, users.id))
      .where(eq(designJobs.assignedDesignerId, userId))
      .orderBy(desc(designJobs.createdAt));

    return jobs.map(row => ({
      ...row.designJob,
      organization: row.organization || undefined,
      designer: row.designer || undefined,
    }));
  }

  async getDesignJobsBySalesperson(userId: string): Promise<(DesignJob & { organization?: Organization; designer?: User })[]> {
    const jobs = await db
      .select({
        designJob: designJobs,
        organization: organizations,
        designer: users,
      })
      .from(designJobs)
      .leftJoin(organizations, eq(designJobs.orgId, organizations.id))
      .leftJoin(users, eq(designJobs.assignedDesignerId, users.id))
      .where(eq(designJobs.salespersonId, userId))
      .orderBy(desc(designJobs.createdAt));

    return jobs.map(row => ({
      ...row.designJob,
      organization: row.organization || undefined,
      designer: row.designer || undefined,
    }));
  }

  async getDesignJobsByOrder(orderId: number): Promise<(DesignJob & { organization?: Organization; designer?: User })[]> {
    const jobs = await db
      .select({
        designJob: designJobs,
        organization: organizations,
        designer: users,
      })
      .from(designJobs)
      .leftJoin(organizations, eq(designJobs.orgId, organizations.id))
      .leftJoin(users, eq(designJobs.assignedDesignerId, users.id))
      .where(eq(designJobs.orderId, orderId))
      .orderBy(desc(designJobs.createdAt));

    return jobs.map(row => ({
      ...row.designJob,
      organization: row.organization || undefined,
      designer: row.designer || undefined,
    }));
  }

  async getDesignJobWithComments(id: number): Promise<(DesignJob & { organization?: Organization; designer?: User; comments: DesignJobComment[] }) | undefined> {
    const [result] = await db
      .select({
        designJob: designJobs,
        organization: organizations,
        designer: users,
      })
      .from(designJobs)
      .leftJoin(organizations, eq(designJobs.orgId, organizations.id))
      .leftJoin(users, eq(designJobs.assignedDesignerId, users.id))
      .where(eq(designJobs.id, id));

    if (!result) return undefined;

    const comments = await db.select().from(designJobComments)
      .where(eq(designJobComments.jobId, id))
      .orderBy(desc(designJobComments.createdAt));

    return {
      ...result.designJob,
      organization: result.organization || undefined,
      designer: result.designer || undefined,
      comments
    };
  }

  async createDesignJob(job: InsertDesignJob): Promise<DesignJob> {
    const jobCode = await this.getNextCode("DJ");
    const jobData: any = {
      ...job,
      jobCode,
    };
    const [created] = await db.insert(designJobs).values(jobData).returning();
    return created;
  }

  async updateDesignJob(id: number, job: Partial<InsertDesignJob>): Promise<DesignJob> {
    const updateData: any = { ...job, updatedAt: new Date() };
    if ('status' in job && job.status) {
      updateData.statusChangedAt = new Date();
    }
    const [updated] = await db
      .update(designJobs)
      .set(updateData)
      .where(eq(designJobs.id, id))
      .returning();
    return updated;
  }

  async updateDesignJobStatus(id: number, status: string): Promise<DesignJob> {
    const [updated] = await db
      .update(designJobs)
      .set({ status: status as any, statusChangedAt: new Date(), updatedAt: new Date() })
      .where(eq(designJobs.id, id))
      .returning();
    return updated;
  }

  async addDesignJobRendition(id: number, url: string): Promise<DesignJob> {
    const [job] = await db.select().from(designJobs).where(eq(designJobs.id, id));
    if (!job) throw new Error("Design job not found");

    const currentUrls = job.renditionUrls || [];
    const [updated] = await db
      .update(designJobs)
      .set({ 
        renditionCount: (job.renditionCount || 0) + 1, 
        renditionUrls: [...currentUrls, url],
        updatedAt: new Date() 
      })
      .where(eq(designJobs.id, id))
      .returning();
    return updated;
  }

  async deleteDesignJob(id: number): Promise<void> {
    await db.delete(designJobs).where(eq(designJobs.id, id));
  }

  // Design job comment operations
  async getDesignJobComments(jobId: number): Promise<DesignJobComment[]> {
    return await db.select().from(designJobComments)
      .where(eq(designJobComments.jobId, jobId))
      .orderBy(desc(designJobComments.createdAt));
  }

  async createDesignJobComment(comment: InsertDesignJobComment): Promise<DesignJobComment> {
    const [created] = await db.insert(designJobComments).values(comment).returning();
    return created;
  }

  async updateDesignJobComment(id: number, comment: Partial<InsertDesignJobComment>): Promise<DesignJobComment> {
    const [updated] = await db
      .update(designJobComments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(designJobComments.id, id))
      .returning();
    return updated;
  }

  async deleteDesignJobComment(id: number): Promise<void> {
    await db.delete(designJobComments).where(eq(designJobComments.id, id));
  }

  // Manufacturing operations
  async getManufacturing(user?: User): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User })[]> {
    console.log('[getManufacturing] Fetching manufacturing records for user:', user?.id, 'role:', user?.role);

    // Role-based filtering - manufacturer users now see all records like admin/ops/sales
    if (user?.role === 'admin' || user?.role === 'ops' || user?.role === 'sales' || user?.role === 'manufacturer') {
      console.log(`[getManufacturing] Admin/Ops/Sales/Manufacturer user - fetching all non-archived records`);
      const results = await db
        .select({
          manufacturing: manufacturing,
          order: orders,
          manufacturer: manufacturers,
          assignedUser: users,
        })
        .from(manufacturing)
        .leftJoin(orders, eq(manufacturing.orderId, orders.id))
        .leftJoin(manufacturers, eq(manufacturing.manufacturerId, manufacturers.id))
        .leftJoin(users, eq(manufacturing.assignedTo, users.id))
        .where(eq(manufacturing.archived, false));

      console.log(`[getManufacturing] Found ${results.length} total manufacturing records`);
      return results.map((r: any) => ({
        ...r.manufacturing,
        order: r.order || undefined,
        manufacturer: r.manufacturer || undefined,
        assignedUser: r.assignedUser || undefined,
      }));
    } else if (user?.role === 'designer') {
      // Designer users only see manufacturing jobs for orders with design jobs assigned to them
      const designerOrders = await db
        .select({ orderId: designJobs.orderId })
        .from(designJobs)
        .where(
          and(
            eq(designJobs.assignedDesignerId, user.id),
            isNotNull(designJobs.orderId)
          )
        );

      const orderIds = designerOrders.map(d => d.orderId).filter((id): id is number => id !== null);
      console.log('[getManufacturing] Designer user - associated order IDs:', orderIds);

      if (orderIds.length === 0) {
        console.log('[getManufacturing] No orders assigned to designer, returning empty array');
        return [];
      }

      const results = await db
        .select({
          manufacturing: manufacturing,
          order: orders,
          manufacturer: manufacturers,
          assignedUser: users,
        })
        .from(manufacturing)
        .leftJoin(orders, eq(manufacturing.orderId, orders.id))
        .leftJoin(manufacturers, eq(manufacturing.manufacturerId, manufacturers.id))
        .leftJoin(users, eq(manufacturing.assignedTo, users.id))
        .where(
          and(
            eq(manufacturing.archived, false),
            inArray(manufacturing.orderId, orderIds)
          )
        );

      console.log('[getManufacturing] Found', results.length, 'records for designer user');
      return results.map((r: any) => ({
        ...r.manufacturing,
        order: r.order || undefined,
        manufacturer: r.manufacturer || undefined,
        assignedUser: r.assignedUser || undefined,
      }));
    } else {
      console.log('[getManufacturing] Unknown or unauthorized role - returning empty array');
      return [];
    }
  }

  async getManufacturingRecord(id: number, user?: User): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User }) | undefined> {
    const baseQuery = db
      .select({
        manufacturing: manufacturing,
        order: orders,
        manufacturer: manufacturers,
        assignedUser: users,
      })
      .from(manufacturing)
      .leftJoin(orders, eq(manufacturing.orderId, orders.id))
      .leftJoin(manufacturers, eq(manufacturing.manufacturerId, manufacturers.id))
      .leftJoin(users, eq(manufacturing.assignedTo, users.id));

    // Role-based filtering for security
    // Manufacturer users see ALL manufacturing records system-wide (like admin)
    let result;
    if (user?.role === 'admin' || user?.role === 'ops' || user?.role === 'sales' || user?.role === 'manufacturer') {
      [result] = await baseQuery.where(eq(manufacturing.id, id));
    } else if (user?.role === 'designer') {
      // Designer users only see manufacturing jobs for orders with design jobs assigned to them
      const designJobsSubquery = db
        .select({ orderId: designJobs.orderId })
        .from(designJobs)
        .where(eq(designJobs.assignedDesignerId, user.id));
      [result] = await baseQuery.where(and(
        eq(manufacturing.id, id),
        sql`${manufacturing.orderId} IN (${designJobsSubquery})`
      ));
    } else {
      return undefined; // Unknown role
    }

    if (!result) return undefined;

    return {
      ...result.manufacturing,
      order: result.order || undefined,
      manufacturer: result.manufacturer || undefined,
      assignedUser: result.assignedUser || undefined,
    };
  }

  /**
   * INTERNAL USE ONLY - Fetches a manufacturing record by ID without role-based filtering.
   * Use getManufacturingRecord(id, user) for user-facing operations to enforce RBAC.
   * This method is intended for internal service layer operations where authorization
   * has already been verified at the route handler level.
   */
  async getManufacturingRecordStrict(id: number): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User }) | undefined> {
    const [result] = await db
      .select({
        manufacturing: manufacturing,
        order: orders,
        manufacturer: manufacturers,
        assignedUser: users,
      })
      .from(manufacturing)
      .leftJoin(orders, eq(manufacturing.orderId, orders.id))
      .leftJoin(manufacturers, eq(manufacturing.manufacturerId, manufacturers.id))
      .leftJoin(users, eq(manufacturing.assignedTo, users.id))
      .where(eq(manufacturing.id, id));

    if (!result) return undefined;

    return {
      ...result.manufacturing,
      order: result.order || undefined,
      manufacturer: result.manufacturer || undefined,
      assignedUser: result.assignedUser || undefined,
    };
  }

  async getManufacturingByOrder(orderId: number): Promise<Manufacturing | undefined> {
    const [record] = await db.select().from(manufacturing).where(eq(manufacturing.orderId, orderId));
    return record;
  }

  async createManufacturing(record: InsertManufacturing): Promise<Manufacturing> {
    const [created] = await db.insert(manufacturing).values(record).returning();
    return created;
  }

  async updateManufacturing(id: number, record: Partial<InsertManufacturing>): Promise<Manufacturing> {
    const updateData: any = { ...record, updatedAt: new Date() };

    // Track status change in manufacturing updates table if status changed
    if (record.status) {
      const [currentRecord] = await db.select().from(manufacturing).where(eq(manufacturing.id, id));
      if (currentRecord && currentRecord.status !== record.status) {
        // We'll need to manually create an update record when status changes
        // This will be handled by the route handler
      }
    }

    const [updated] = await db
      .update(manufacturing)
      .set(updateData)
      .where(eq(manufacturing.id, id))
      .returning();
    return updated;
  }

  async deleteManufacturing(id: number): Promise<void> {
    // First delete all related updates
    await db.delete(manufacturingUpdates).where(eq(manufacturingUpdates.manufacturingId, id));
    // Then delete the manufacturing record
    await db.delete(manufacturing).where(eq(manufacturing.id, id));
  }

  async archiveManufacturing(id: number, userId: string): Promise<Manufacturing> {
    const [archived] = await db
      .update(manufacturing)
      .set({ archived: true, archivedAt: new Date(), archivedBy: userId, updatedAt: new Date() })
      .where(eq(manufacturing.id, id))
      .returning();
    if (!archived) throw new Error(`Manufacturing record with id ${id} not found`);
    return archived;
  }

  async unarchiveManufacturing(id: number): Promise<Manufacturing> {
    const [unarchived] = await db
      .update(manufacturing)
      .set({ archived: false, archivedAt: null, archivedBy: null, updatedAt: new Date() })
      .where(eq(manufacturing.id, id))
      .returning();
    if (!unarchived) throw new Error(`Manufacturing record with id ${id} not found`);
    return unarchived;
  }

  async getArchivedManufacturing(user?: User): Promise<(Manufacturing & { order?: Order; manufacturer?: Manufacturer; assignedUser?: User })[]> {
    // Manufacturer users see ALL archived manufacturing records system-wide (like admin)
    const results = await db
      .select({
        manufacturing: manufacturing,
        order: orders,
        manufacturer: manufacturers,
        assignedUser: users,
      })
      .from(manufacturing)
      .leftJoin(orders, eq(manufacturing.orderId, orders.id))
      .leftJoin(manufacturers, eq(manufacturing.manufacturerId, manufacturers.id))
      .leftJoin(users, eq(manufacturing.assignedTo, users.id))
      .where(eq(manufacturing.archived, true))
      .orderBy(desc(manufacturing.archivedAt));

    return results.map((r: any) => ({
      ...r.manufacturing,
      order: r.order || undefined,
      manufacturer: r.manufacturer || undefined,
      assignedUser: r.assignedUser || undefined,
    }));
  }

  // Manufacturing status updates
  async getManufacturingUpdates(manufacturingId?: number, user?: User): Promise<(ManufacturingUpdate & { updatedByUser?: User })[]> {
    const baseQuery = db
      .select({
        update: manufacturingUpdates,
        updatedByUser: users,
      })
      .from(manufacturingUpdates)
      .leftJoin(users, eq(manufacturingUpdates.updatedBy, users.id));

    // Build where conditions
    const conditions = [];

    // Role-based filtering for security
    // Manufacturer users see ALL manufacturing updates system-wide (like admin)
    if (user?.role === 'designer') {
      // Designer users only see updates for manufacturing jobs related to their design jobs
      const designJobOrdersSubquery = db
        .select({ orderId: designJobs.orderId })
        .from(designJobs)
        .where(eq(designJobs.assignedDesignerId, user.id));

      const manufacturingIdsSubquery = db
        .select({ id: manufacturing.id })
        .from(manufacturing)
        .where(sql`${manufacturing.orderId} IN (${designJobOrdersSubquery})`);

      conditions.push(sql`${manufacturingUpdates.manufacturingId} IN (${manufacturingIdsSubquery})`);
    }

    if (manufacturingId) {
      conditions.push(eq(manufacturingUpdates.manufacturingId, manufacturingId));
    }

    const results = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(manufacturingUpdates.createdAt))
      : await baseQuery.orderBy(desc(manufacturingUpdates.createdAt));

    return results.map(r => ({
      ...r.update,
      updatedByUser: r.updatedByUser || undefined,
    }));
  }

  async createManufacturingUpdate(update: InsertManufacturingUpdate): Promise<ManufacturingUpdate> {
    // Auto-populate orderId if not provided but manufacturingId is available
    let updateData = { ...update };
    if (!updateData.orderId && updateData.manufacturingId) {
      const [manufacturingRecord] = await db.select({ orderId: manufacturing.orderId }).from(manufacturing).where(eq(manufacturing.id, updateData.manufacturingId));
      if (manufacturingRecord) {
        updateData.orderId = manufacturingRecord.orderId;
      }
    }

    const [created] = await db.insert(manufacturingUpdates).values(updateData).returning();
    return created;
  }

  async getManufacturingUpdateById(id: number): Promise<ManufacturingUpdate | undefined> {
    const [result] = await db
      .select()
      .from(manufacturingUpdates)
      .where(eq(manufacturingUpdates.id, id));
    return result;
  }

  async updateManufacturingUpdate(id: number, update: Partial<InsertManufacturingUpdate>): Promise<ManufacturingUpdate> {
    const [updated] = await db
      .update(manufacturingUpdates)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(manufacturingUpdates.id, id))
      .returning();
    return updated;
  }

  async deleteManufacturingUpdate(id: number): Promise<void> {
    // First delete related manufacturing update line items (if cascade delete is not configured)
    // This ensures no foreign key constraint violations
    await db.delete(manufacturingUpdateLineItems).where(eq(manufacturingUpdateLineItems.manufacturingUpdateId, id));

    // Then delete the manufacturing update itself
    await db.delete(manufacturingUpdates).where(eq(manufacturingUpdates.id, id));
  }

  // Manufacturing Update Line Item operations
  async updateManufacturingUpdateLineItem(id: number, update: Partial<InsertManufacturingUpdateLineItem>): Promise<ManufacturingUpdateLineItem> {
    const [updated] = await db
      .update(manufacturingUpdateLineItems)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(manufacturingUpdateLineItems.id, id))
      .returning();
    return updated;
  }

  async getManufacturingUpdateLineItemsByOrderLineItemId(orderLineItemId: number): Promise<ManufacturingUpdateLineItem[]> {
    const results = await db
      .select()
      .from(manufacturingUpdateLineItems)
      .where(eq(manufacturingUpdateLineItems.lineItemId, orderLineItemId));
    return results;
  }

  // Manufacturing Batch operations
  async getManufacturingBatches(manufacturerId?: number): Promise<(ManufacturingBatch & { manufacturer?: Manufacturer; items?: ManufacturingBatchItem[] })[]> {
    const baseQuery = db
      .select({
        batch: manufacturingBatches,
        manufacturer: manufacturers,
      })
      .from(manufacturingBatches)
      .leftJoin(manufacturers, eq(manufacturingBatches.manufacturerId, manufacturers.id));

    const results = manufacturerId
      ? await baseQuery.where(eq(manufacturingBatches.manufacturerId, manufacturerId)).orderBy(desc(manufacturingBatches.createdAt))
      : await baseQuery.orderBy(desc(manufacturingBatches.createdAt));

    // Get batch items for each batch
    const batches = await Promise.all(
      results.map(async (r) => {
        const items = await this.getBatchItems(r.batch.id);
        return {
          ...r.batch,
          manufacturer: r.manufacturer || undefined,
          items,
        };
      })
    );

    return batches;
  }

  async getManufacturingBatch(id: number): Promise<(ManufacturingBatch & { manufacturer?: Manufacturer; items?: ManufacturingBatchItem[] }) | undefined> {
    const [result] = await db
      .select({
        batch: manufacturingBatches,
        manufacturer: manufacturers,
      })
      .from(manufacturingBatches)
      .leftJoin(manufacturers, eq(manufacturingBatches.manufacturerId, manufacturers.id))
      .where(eq(manufacturingBatches.id, id));

    if (!result) return undefined;

    const items = await this.getBatchItems(id);

    return {
      ...result.batch,
      manufacturer: result.manufacturer || undefined,
      items,
    };
  }

  async createManufacturingBatch(batch: InsertManufacturingBatch): Promise<ManufacturingBatch> {
    const [created] = await db.insert(manufacturingBatches).values(batch).returning();
    return created;
  }

  async updateManufacturingBatch(id: number, batch: Partial<InsertManufacturingBatch>): Promise<ManufacturingBatch> {
    const [updated] = await db
      .update(manufacturingBatches)
      .set({ ...batch, updatedAt: new Date() })
      .where(eq(manufacturingBatches.id, id))
      .returning();
    return updated;
  }

  async deleteManufacturingBatch(id: number): Promise<void> {
    // First delete all batch items
    await db.delete(manufacturingBatchItems).where(eq(manufacturingBatchItems.batchId, id));
    // Then delete the batch
    await db.delete(manufacturingBatches).where(eq(manufacturingBatches.id, id));
  }

  // Manufacturing Batch Item operations
  async getBatchItems(batchId: number): Promise<ManufacturingBatchItem[]> {
    return await db.select().from(manufacturingBatchItems).where(eq(manufacturingBatchItems.batchId, batchId));
  }

  async createBatchItem(item: InsertManufacturingBatchItem): Promise<ManufacturingBatchItem> {
    const [created] = await db.insert(manufacturingBatchItems).values(item).returning();
    return created;
  }

  async updateBatchItem(id: number, item: Partial<InsertManufacturingBatchItem>): Promise<ManufacturingBatchItem> {
    const [updated] = await db
      .update(manufacturingBatchItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(manufacturingBatchItems.id, id))
      .returning();
    return updated;
  }

  async deleteBatchItem(id: number): Promise<void> {
    await db.delete(manufacturingBatchItems).where(eq(manufacturingBatchItems.id, id));
  }

  // Quality Control Checkpoint operations
  async getQualityCheckpoints(manufacturingId: number): Promise<ManufacturingQualityCheckpoint[]> {
    return await db.select().from(manufacturingQualityCheckpoints).where(eq(manufacturingQualityCheckpoints.manufacturingId, manufacturingId));
  }

  async createQualityCheckpoint(checkpoint: InsertManufacturingQualityCheckpoint): Promise<ManufacturingQualityCheckpoint> {
    const [created] = await db.insert(manufacturingQualityCheckpoints).values(checkpoint).returning();
    return created;
  }

  async updateQualityCheckpoint(id: number, checkpoint: Partial<InsertManufacturingQualityCheckpoint>): Promise<ManufacturingQualityCheckpoint> {
    const [updated] = await db
      .update(manufacturingQualityCheckpoints)
      .set({ ...checkpoint, updatedAt: new Date() })
      .where(eq(manufacturingQualityCheckpoints.id, id))
      .returning();
    return updated;
  }

  async deleteQualityCheckpoint(id: number): Promise<void> {
    await db.delete(manufacturingQualityCheckpoints).where(eq(manufacturingQualityCheckpoints.id, id));
  }

  // Manufacturing Notification operations
  async getManufacturingNotifications(recipientId?: string, manufacturingId?: number): Promise<ManufacturingNotification[]> {
    const conditions = [];
    if (recipientId) {
      conditions.push(eq(manufacturingNotifications.recipientId, recipientId));
    }
    if (manufacturingId) {
      conditions.push(eq(manufacturingNotifications.manufacturingId, manufacturingId));
    }

    if (conditions.length > 0) {
      return await db.select().from(manufacturingNotifications).where(and(...conditions)).orderBy(desc(manufacturingNotifications.createdAt));
    }

    return await db.select().from(manufacturingNotifications).orderBy(desc(manufacturingNotifications.createdAt));
  }

  async createManufacturingNotification(notification: InsertManufacturingNotification): Promise<ManufacturingNotification> {
    const [created] = await db.insert(manufacturingNotifications).values(notification).returning();
    return created;
  }

  async markManufacturingNotificationAsRead(id: number): Promise<ManufacturingNotification> {
    const [updated] = await db
      .update(manufacturingNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(manufacturingNotifications.id, id))
      .returning();
    return updated;
  }

  async deleteManufacturingNotification(id: number): Promise<void> {
    await db.delete(manufacturingNotifications).where(eq(manufacturingNotifications.id, id));
  }

  // Manufacturing Attachment operations
  async getManufacturingAttachments(manufacturingId?: number, batchId?: number): Promise<ManufacturingAttachment[]> {
    const conditions = [];
    if (manufacturingId) {
      conditions.push(eq(manufacturingAttachments.manufacturingId, manufacturingId));
    }
    if (batchId) {
      conditions.push(eq(manufacturingAttachments.batchId, batchId));
    }

    if (conditions.length > 0) {
      return await db.select().from(manufacturingAttachments).where(and(...conditions)).orderBy(desc(manufacturingAttachments.createdAt));
    }

    return await db.select().from(manufacturingAttachments).orderBy(desc(manufacturingAttachments.createdAt));
  }

  async createManufacturingAttachment(attachment: InsertManufacturingAttachment): Promise<ManufacturingAttachment> {
    const [created] = await db.insert(manufacturingAttachments).values(attachment).returning();
    return created;
  }

  async updateManufacturingAttachment(id: number, attachment: Partial<InsertManufacturingAttachment>): Promise<ManufacturingAttachment> {
    const [updated] = await db
      .update(manufacturingAttachments)
      .set({ ...attachment, updatedAt: new Date() })
      .where(eq(manufacturingAttachments.id, id))
      .returning();
    return updated;
  }

  async deleteManufacturingAttachment(id: number): Promise<void> {
    await db.delete(manufacturingAttachments).where(eq(manufacturingAttachments.id, id));
  }

  // Manufacturing Finished Images operations
  async getFinishedImages(lineItemId: number): Promise<ManufacturingFinishedImage[]> {
    return await db
      .select()
      .from(manufacturingFinishedImages)
      .where(eq(manufacturingFinishedImages.manufacturingUpdateLineItemId, lineItemId))
      .orderBy(desc(manufacturingFinishedImages.uploadedAt));
  }

  async createFinishedImage(image: InsertManufacturingFinishedImage): Promise<ManufacturingFinishedImage> {
    const [created] = await db.insert(manufacturingFinishedImages).values(image).returning();
    return created;
  }

  async deleteFinishedImage(id: number): Promise<void> {
    await db.delete(manufacturingFinishedImages).where(eq(manufacturingFinishedImages.id, id));
  }

  async getFinishedImage(id: number): Promise<ManufacturingFinishedImage | undefined> {
    const [result] = await db
      .select()
      .from(manufacturingFinishedImages)
      .where(eq(manufacturingFinishedImages.id, id));
    return result;
  }

  // Production Schedule operations
  async getProductionSchedules(manufacturerId?: number): Promise<ProductionSchedule[]> {
    if (manufacturerId) {
      return await db.select().from(productionSchedules).where(eq(productionSchedules.manufacturerId, manufacturerId)).orderBy(desc(productionSchedules.createdAt));
    }

    return await db.select().from(productionSchedules).orderBy(desc(productionSchedules.createdAt));
  }

  async createProductionSchedule(schedule: InsertProductionSchedule): Promise<ProductionSchedule> {
    const [created] = await db.insert(productionSchedules).values(schedule).returning();
    return created;
  }

  async updateProductionSchedule(id: number, schedule: Partial<InsertProductionSchedule>): Promise<ProductionSchedule> {
    const [updated] = await db
      .update(productionSchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(productionSchedules.id, id))
      .returning();
    return updated;
  }

  async deleteProductionSchedule(id: number): Promise<void> {
    await db.delete(productionSchedules).where(eq(productionSchedules.id, id));
  }

  // Team Store operations
  async getTeamStores(user?: User): Promise<(TeamStore & { order?: Order; salesperson?: User; organization?: Organization })[]> {
    const query = db
      .select()
      .from(teamStores)
      .leftJoin(orders, eq(teamStores.orderId, orders.id))
      .leftJoin(users, eq(teamStores.salespersonId, users.id))
      .leftJoin(organizations, eq(teamStores.orgId, organizations.id))
      .where(eq(teamStores.archived, false))
      .orderBy(desc(teamStores.createdAt));

    const results = await query;
    return results.map(r => ({
      ...r.team_stores,
      order: r.orders ?? undefined,
      salesperson: r.users ?? undefined,
      organization: r.organizations ?? undefined
    }));
  }

  async getTeamStore(id: number, user?: User): Promise<(TeamStore & { order?: Order; salesperson?: User; organization?: Organization; lineItems?: TeamStoreLineItem[] }) | undefined> {
    const [result] = await db
      .select()
      .from(teamStores)
      .leftJoin(orders, eq(teamStores.orderId, orders.id))
      .leftJoin(users, eq(teamStores.salespersonId, users.id))
      .leftJoin(organizations, eq(teamStores.orgId, organizations.id))
      .where(eq(teamStores.id, id));

    if (!result) return undefined;

    const lineItems = await this.getTeamStoreLineItems(id);

    return {
      ...result.team_stores,
      order: result.orders ?? undefined,
      salesperson: result.users ?? undefined,
      organization: result.organizations ?? undefined,
      lineItems
    };
  }

  async createTeamStore(teamStore: InsertTeamStore, lineItemIds: number[]): Promise<TeamStore> {
    // Generate store code if not provided
    if (!teamStore.storeCode) {
      const timestamp = Date.now();
      teamStore.storeCode = `TS-${timestamp}`;
    }

    // Create the team store
    const [created] = await db.insert(teamStores).values(teamStore as any).returning();

    // Create line items by copying data from order line items
    if (lineItemIds.length > 0) {
      for (const lineItemId of lineItemIds) {
        // Get order line item with variant info
        const [orderLineItem] = await db
          .select()
          .from(orderLineItems)
          .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .leftJoin(products, eq(productVariants.productId, products.id))
          .where(eq(orderLineItems.id, lineItemId));

        if (orderLineItem) {
          const lineItemData: InsertTeamStoreLineItem = {
            teamStoreId: created.id,
            lineItemId: lineItemId,
            productName: orderLineItem.products?.name || orderLineItem.order_line_items.itemName || '',
            variantCode: orderLineItem.product_variants?.variantCode || '',
            variantColor: orderLineItem.product_variants?.color || '',
            imageUrl: orderLineItem.order_line_items.imageUrl || orderLineItem.product_variants?.imageUrl || '',
            yxs: orderLineItem.order_line_items.yxs || 0,
            ys: orderLineItem.order_line_items.ys || 0,
            ym: orderLineItem.order_line_items.ym || 0,
            yl: orderLineItem.order_line_items.yl || 0,
            xs: orderLineItem.order_line_items.xs || 0,
            s: orderLineItem.order_line_items.s || 0,
            m: orderLineItem.order_line_items.m || 0,
            l: orderLineItem.order_line_items.l || 0,
            xl: orderLineItem.order_line_items.xl || 0,
            xxl: orderLineItem.order_line_items.xxl || 0,
            xxxl: orderLineItem.order_line_items.xxxl || 0,
            unitPrice: orderLineItem.order_line_items.unitPrice.toString(),
            notes: orderLineItem.order_line_items.notes || ''
          };

          await db.insert(teamStoreLineItems).values(lineItemData);
        }
      }
    }

    return created;
  }

  async updateTeamStore(id: number, teamStore: Partial<InsertTeamStore>): Promise<TeamStore> {
    const [updated] = await db
      .update(teamStores)
      .set({ ...teamStore, updatedAt: new Date() })
      .where(eq(teamStores.id, id))
      .returning();
    return updated;
  }

  async deleteTeamStore(id: number): Promise<void> {
    // Delete related line items (cascade should handle this, but being explicit)
    await db.delete(teamStoreLineItems).where(eq(teamStoreLineItems.teamStoreId, id));
    // Delete the team store
    await db.delete(teamStores).where(eq(teamStores.id, id));
  }

  async archiveTeamStore(id: number, userId: string): Promise<TeamStore> {
    const [archived] = await db
      .update(teamStores)
      .set({
        archived: true,
        archivedAt: new Date(),
        archivedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(teamStores.id, id))
      .returning();
    return archived;
  }

  async unarchiveTeamStore(id: number): Promise<TeamStore> {
    const [unarchived] = await db
      .update(teamStores)
      .set({
        archived: false,
        archivedAt: null,
        archivedBy: null,
        updatedAt: new Date()
      })
      .where(eq(teamStores.id, id))
      .returning();
    return unarchived;
  }

  async getArchivedTeamStores(user?: User): Promise<(TeamStore & { order?: Order; salesperson?: User; organization?: Organization })[]> {
    const query = db
      .select()
      .from(teamStores)
      .leftJoin(orders, eq(teamStores.orderId, orders.id))
      .leftJoin(users, eq(teamStores.salespersonId, users.id))
      .leftJoin(organizations, eq(teamStores.orgId, organizations.id))
      .where(eq(teamStores.archived, true))
      .orderBy(desc(teamStores.archivedAt));

    const results = await query;
    return results.map(r => ({
      ...r.team_stores,
      order: r.orders ?? undefined,
      salesperson: r.users ?? undefined,
      organization: r.organizations ?? undefined
    }));
  }

  // Team Store Line Item operations
  async getTeamStoreLineItems(teamStoreId: number): Promise<TeamStoreLineItem[]> {
    return await db
      .select()
      .from(teamStoreLineItems)
      .where(eq(teamStoreLineItems.teamStoreId, teamStoreId))
      .orderBy(teamStoreLineItems.id);
  }

  async updateTeamStoreLineItem(id: number, update: Partial<InsertTeamStoreLineItem>): Promise<TeamStoreLineItem> {
    const [updated] = await db
      .update(teamStoreLineItems)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(teamStoreLineItems.id, id))
      .returning();
    return updated;
  }

  // Order Line Item Manufacturer operations
  async getLineItemManufacturers(lineItemId: number): Promise<(OrderLineItemManufacturer & { manufacturer?: Manufacturer })[]> {
    const results = await db
      .select()
      .from(orderLineItemManufacturers)
      .leftJoin(manufacturers, eq(orderLineItemManufacturers.manufacturerId, manufacturers.id))
      .where(eq(orderLineItemManufacturers.lineItemId, lineItemId))
      .orderBy(desc(orderLineItemManufacturers.createdAt));

    return results.map(row => ({
      ...row.order_line_item_manufacturers,
      manufacturer: row.manufacturers || undefined
    }));
  }

  async getLineItemManufacturersByOrder(orderId: number): Promise<(OrderLineItemManufacturer & { manufacturer?: Manufacturer; lineItem?: OrderLineItem })[]> {
    const results = await db
      .select()
      .from(orderLineItemManufacturers)
      .leftJoin(manufacturers, eq(orderLineItemManufacturers.manufacturerId, manufacturers.id))
      .leftJoin(orderLineItems, eq(orderLineItemManufacturers.lineItemId, orderLineItems.id))
      .where(eq(orderLineItems.orderId, orderId))
      .orderBy(desc(orderLineItemManufacturers.createdAt));

    return results.map(row => ({
      ...row.order_line_item_manufacturers,
      manufacturer: row.manufacturers || undefined,
      lineItem: row.order_line_items || undefined
    }));
  }

  async assignManufacturerToLineItem(assignment: InsertOrderLineItemManufacturer): Promise<OrderLineItemManufacturer> {
    const [created] = await db.insert(orderLineItemManufacturers).values([assignment]).returning();
    return created;
  }

  async updateLineItemManufacturer(id: number, assignment: Partial<InsertOrderLineItemManufacturer>): Promise<OrderLineItemManufacturer> {
    const [updated] = await db
      .update(orderLineItemManufacturers)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(orderLineItemManufacturers.id, id))
      .returning();
    return updated;
  }

  async deleteLineItemManufacturer(id: number): Promise<void> {
    await db.delete(orderLineItemManufacturers).where(eq(orderLineItemManufacturers.id, id));
  }

  async deleteLineItemManufacturersByLineItem(lineItemId: number): Promise<void> {
    await db.delete(orderLineItemManufacturers).where(eq(orderLineItemManufacturers.lineItemId, lineItemId));
  }

  // User-Manufacturer association operations
  async getUserManufacturerAssociations(userId: string): Promise<UserManufacturerAssociation[]> {
    return await db.select().from(userManufacturerAssociations)
      .where(and(
        eq(userManufacturerAssociations.userId, userId),
        eq(userManufacturerAssociations.isActive, true)
      ));
  }

  async getUserManufacturerAssociationsByManufacturer(manufacturerId: number): Promise<UserManufacturerAssociation[]> {
    return await db.select().from(userManufacturerAssociations)
      .where(and(
        eq(userManufacturerAssociations.manufacturerId, manufacturerId),
        eq(userManufacturerAssociations.isActive, true)
      ));
  }

  async createUserManufacturerAssociation(association: InsertUserManufacturerAssociation): Promise<UserManufacturerAssociation> {
    const [created] = await db.insert(userManufacturerAssociations).values(association).returning();
    return created;
  }

  async deleteUserManufacturerAssociation(userId: string, manufacturerId: number): Promise<void> {
    await db.delete(userManufacturerAssociations)
      .where(and(
        eq(userManufacturerAssociations.userId, userId),
        eq(userManufacturerAssociations.manufacturerId, manufacturerId)
      ));
  }

  async getUserAssociatedManufacturerIds(userId: string): Promise<number[]> {
    const associations = await this.getUserManufacturerAssociations(userId);
    return associations.map(assoc => assoc.manufacturerId);
  }

  async getManufacturers(): Promise<Manufacturer[]> {
    return await db.select().from(manufacturers).orderBy(desc(manufacturers.createdAt));
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id));
    return manufacturer;
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const [created] = await db.insert(manufacturers).values(manufacturer).returning();
    return created;
  }

  async updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer> {
    const [updated] = await db
      .update(manufacturers)
      .set({ ...manufacturer, updatedAt: new Date() })
      .where(eq(manufacturers.id, id))
      .returning();
    return updated;
  }

  // Invitation operations
  async getInvitations(): Promise<Invitation[]> {
    return await db.select().from(invitations).orderBy(desc(invitations.createdAt));
  }

  async getInvitation(id: number): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.id, id));
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token));
    return invitation;
  }

  async getInvitationByUserId(userId: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.userId, userId),
          eq(invitations.status, 'pending')
        )
      )
      .orderBy(desc(invitations.createdAt));
    return invitation;
  }

  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [created] = await db.insert(invitations).values(invitation as any).returning();
    return created;
  }

  async updateInvitation(id: number, invitation: Partial<InsertInvitation>): Promise<Invitation> {
    const updateData: any = { ...invitation, updatedAt: new Date() };
    const [updated] = await db
      .update(invitations)
      .set(updateData)
      .where(eq(invitations.id, id))
      .returning();
    return updated;
  }

  async deleteInvitation(id: number): Promise<void> {
    await db.delete(invitations).where(eq(invitations.id, id));
  }

  async expireOldInvitations(): Promise<void> {
    await db
      .update(invitations)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(invitations.status, 'pending'),
          sql`${invitations.expiresAt} < NOW()`
        )
      );
  }

  // Salesperson operations
  async getSalespeople(): Promise<Salesperson[]> {
    return await db.select().from(salespersons).orderBy(desc(salespersons.createdAt));
  }

  async getSalespeopleWithUserData(): Promise<(Salesperson & { userName?: string; userEmail?: string })[]> {
    const result = await db
      .select({
        id: salespersons.id,
        userId: salespersons.userId,
        territory: salespersons.territory,
        quotaMonthly: salespersons.quotaMonthly,
        commissionRate: salespersons.commissionRate,
        active: salespersons.active,
        notes: salespersons.notes,
        defaultOrgScope: salespersons.defaultOrgScope,
        maxLeadsPerWeek: salespersons.maxLeadsPerWeek,
        autoAssignLeads: salespersons.autoAssignLeads,
        workloadScore: salespersons.workloadScore,
        lastAssignedAt: salespersons.lastAssignedAt,
        preferredClientTypes: salespersons.preferredClientTypes,
        skills: salespersons.skills,
        createdAt: salespersons.createdAt,
        updatedAt: salespersons.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(salespersons)
      .innerJoin(users, eq(salespersons.userId, users.id))
      .orderBy(desc(salespersons.createdAt));

    return result as any;
  }

  async getSalesperson(id: number): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.id, id));
    return salesperson;
  }

  async getSalespersonByUserId(userId: string): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.userId, userId));
    return salesperson;
  }

  async createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson> {
    const [created] = await db.insert(salespersons).values(salesperson).returning();
    return created;
  }

  async updateSalesperson(id: number, salesperson: Partial<InsertSalesperson>): Promise<Salesperson> {
    const [updated] = await db
      .update(salespersons)
      .set({ ...salesperson, updatedAt: new Date() })
      .where(eq(salespersons.id, id))
      .returning();
    return updated;
  }

  async deleteSalesperson(id: number): Promise<void> {
    await db.delete(salespersons).where(eq(salespersons.id, id));
  }

  async getSalespersonPerformance(id: number): Promise<{
    totalLeads: number;
    leadsWon: number;
    conversionRate: number;
    totalOrdersValue: number;
    commissionEarned: number;
    quotaAttainment: number;
    averageDealSize: number;
    activeLeads: number;
    ordersCount: number;
  }> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.id, id));
    if (!salesperson) throw new Error("Salesperson not found");

    // Get leads statistics
    const leadsResult = await db.select({
      total: count(),
      won: count(sql`CASE WHEN ${leads.stage} = 'won' THEN 1 END`),
      active: count(sql`CASE WHEN ${leads.stage} NOT IN ('won', 'lost') THEN 1 END`)
    }).from(leads)
      .where(eq(leads.ownerUserId, salesperson.userId));

    const totalLeads = leadsResult[0]?.total || 0;
    const leadsWon = leadsResult[0]?.won || 0;
    const activeLeads = leadsResult[0]?.active || 0;

    // Get orders statistics
    const ordersResult = await db.select({
      count: count(),
      totalValue: sql<number>`COALESCE(SUM((SELECT COALESCE(SUM(${orderLineItems.qtyTotal} * ${orderLineItems.unitPrice}), 0) FROM ${orderLineItems} WHERE ${orderLineItems.orderId} = ${orders.id})), 0)`
    }).from(orders)
      .where(eq(orders.salespersonId, salesperson.userId));

    const ordersCount = ordersResult[0]?.count || 0;
    const totalOrdersValue = parseFloat(ordersResult[0]?.totalValue?.toString() || "0");

    // Calculate metrics
    const conversionRate = totalLeads > 0 ? (leadsWon / totalLeads) * 100 : 0;
    const averageDealSize = ordersCount > 0 ? totalOrdersValue / ordersCount : 0;
    const quotaAttainment = parseFloat(salesperson.quotaMonthly || "0") > 0 
      ? (totalOrdersValue / parseFloat(salesperson.quotaMonthly || "0")) * 100 
      : 0;

    // Commission calculation using the salesperson's commission rate
    const commissionRate = parseFloat(salesperson.commissionRate || '0.1');
    const commissionEarned = totalOrdersValue * commissionRate;

    return {
      totalLeads,
      leadsWon,
      conversionRate,
      totalOrdersValue,
      commissionEarned,
      quotaAttainment,
      averageDealSize,
      activeLeads,
      ordersCount
    };
  }

  async getSalespeopleWithMetrics(): Promise<(Salesperson & {
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    totalLeads: number;
    leadsWon: number;
    ordersCount: number;
    revenue: number;
    quotaAttainment: number;
    commissionEarned: number;
    commissionPaid: number;
    commissionOwed: number;
  })[]> {
    console.log('🔍 [Storage] Getting salespeople with metrics...');

    try {
      const allSalespeople = await db.select().from(salespersons).orderBy(desc(salespersons.createdAt));
      console.log('🔍 [Storage] Found salespeople:', allSalespeople.length);

      const results = await Promise.all(allSalespeople.map(async (sp) => {
        try {
          // Get user info
          const [user] = await db.select().from(users).where(eq(users.id, sp.userId));

          // Get leads statistics
          const leadsResult = await db.select({
            total: count(),
            won: count(sql`CASE WHEN ${leads.stage} = 'won' THEN 1 END`)
          }).from(leads)
            .where(eq(leads.ownerUserId, sp.userId));

          const totalLeads = leadsResult[0]?.total || 0;
          const leadsWon = leadsResult[0]?.won || 0;

          // Get orders assigned to this salesperson
          const salespersonOrders = await db.select().from(orders)
            .where(eq(orders.salespersonId, sp.userId));

          const ordersCount = salespersonOrders.length;

          // Calculate revenue from line items using lineTotal column
          let totalRevenue = 0;
          for (const order of salespersonOrders) {
            const lineItemsResult = await db.select({
              total: sql<string>`COALESCE(SUM(CAST(${orderLineItems.lineTotal} AS DECIMAL)), 0)`
            }).from(orderLineItems)
              .where(eq(orderLineItems.orderId, order.id));
            
            totalRevenue += parseFloat(lineItemsResult[0]?.total?.toString() || "0");
          }

          // Calculate commission earned (revenue * commission rate)
          const commissionRate = parseFloat(sp.commissionRate || "0.1");
          const commissionEarned = totalRevenue * commissionRate;

          // Get commission payments made to this salesperson
          const commissionPaymentsResult = await db.select({
            total: sql<string>`COALESCE(SUM(CAST(${commissionPayments.totalAmount} AS DECIMAL)), 0)`
          }).from(commissionPayments)
            .where(eq(commissionPayments.salespersonId, sp.userId));
          
          const commissionPaid = parseFloat(commissionPaymentsResult[0]?.total?.toString() || "0");
          const commissionOwed = commissionEarned - commissionPaid;

          const quotaAttainment = parseFloat(sp.quotaMonthly || "0") > 0 
            ? (totalRevenue / parseFloat(sp.quotaMonthly || "0")) * 100 
            : 0;

          return {
            ...sp,
            userName: user?.name,
            userEmail: user?.email || undefined,
            userPhone: user?.phone || undefined,
            totalLeads,
            leadsWon,
            ordersCount,
            revenue: totalRevenue,
            quotaAttainment,
            commissionEarned,
            commissionPaid,
            commissionOwed
          };
        } catch (error) {
          console.error(`🔍 [Storage] Error processing salesperson ${sp.id}:`, error);
          return {
            ...sp,
            userName: undefined,
            userEmail: undefined,
            userPhone: undefined,
            totalLeads: 0,
            leadsWon: 0,
            ordersCount: 0,
            revenue: 0,
            quotaAttainment: 0,
            commissionEarned: 0,
            commissionPaid: 0,
            commissionOwed: 0
          };
        }
      }));

      console.log('🔍 [Storage] Processed all salespeople metrics');
      return results;
    } catch (error) {
      console.error('🔍 [Storage] Error in getSalespeopleWithMetrics:', error);
      throw error;
    }
  }

  // Business logic operations
  async suggestSalespersonForLead(territory?: string, clientType?: string): Promise<Salesperson | null> {
    // Find salespeople with matching territory and auto-assignment enabled
    let query = db.select().from(salespersons)
      .where(and(
        eq(salespersons.active, true),
        eq(salespersons.autoAssignLeads, true),
        territory ? eq(salespersons.territory, territory) : sql`1=1`
      ));

    const salespeople = await query;

    if (salespeople.length === 0) return null;

    // Get lead counts and workload scores for each salesperson
    const salespersonMetrics = await Promise.all(
      salespeople.map(async (sp) => {
        // Get current lead count for this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());

        const [leadCount] = await db.select({ count: count() })
          .from(leads)
          .where(and(
            eq(leads.ownerUserId, sp.userId),
            sql`${leads.createdAt} >= ${weekStart.toISOString()}`
          ));

        const currentLeads = leadCount.count;
        const maxLeads = sp.maxLeadsPerWeek || 50;
        const utilization = currentLeads / maxLeads;

        // Calculate preference score for client type
        let preferenceScore = 1;
        if (clientType && sp.preferredClientTypes) {
          preferenceScore = sp.preferredClientTypes.includes(clientType) ? 1.2 : 0.8;
        }

        // Calculate overall score (lower is better)
        const score = (utilization * 100) + (parseFloat(sp.workloadScore || "0")) - (preferenceScore * 10);

        return { 
          salesperson: sp, 
          currentLeads,
          maxLeads,
          utilization,
          score,
          preferenceScore
        };
      })
    );

    // Filter out salespeople who have reached their capacity
    const availableSalespeople = salespersonMetrics.filter(metric => 
      metric.currentLeads < metric.maxLeads
    );

    if (availableSalespeople.length === 0) {
      // If all are at capacity, return the one with lowest utilization
      const sorted = salespersonMetrics.sort((a, b) => a.utilization - b.utilization);
      return sorted[0].salesperson;
    }

    // Return salesperson with best score (lowest)
    availableSalespeople.sort((a, b) => a.score - b.score);
    return availableSalespeople[0].salesperson;
  }

  async calculateCommission(orderId: number): Promise<{ commission: number; rate: number }> {
    const order = await this.getOrderWithLineItems(orderId);
    if (!order) throw new Error("Order not found");

    // Calculate total order value
    let totalValue = 0;
    for (const lineItem of order.lineItems) {
      totalValue += parseFloat(lineItem.lineTotal || '0');
    }

    // Get salesperson's commission rate
    let rate = 0.10; // Default 10% if no salesperson found
    if (order.salespersonId) {
      const salesperson = await this.getSalespersonByUserId(order.salespersonId);
      if (salesperson) {
        rate = parseFloat(salesperson.commissionRate || '0.10');
      }
    }

    return {
      commission: totalValue * rate,
      rate,
    };
  }

  async getInventoryLevels(): Promise<{ variantId: number; available: number; reserved: number }[]> {
    // This would typically connect to an inventory system
    // For now, return sample data
    const variants = await db.select().from(productVariants).limit(10);

    return variants.map(v => ({
      variantId: v.id,
      available: Math.floor(Math.random() * 1000),
      reserved: Math.floor(Math.random() * 100),
    }));
  }

  // Financial Transaction operations
  async getFinancialTransactions(filters?: {
    type?: string;
    status?: string;
    salespersonId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions);

    if (filters) {
      const conditions = [];
      if (filters.type) conditions.push(eq(financialTransactions.type, filters.type as any));
      if (filters.status) conditions.push(eq(financialTransactions.status, filters.status as any));
      if (filters.salespersonId) conditions.push(eq(financialTransactions.salespersonId, filters.salespersonId));
      if (filters.startDate) conditions.push(gte(financialTransactions.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(financialTransactions.createdAt, new Date(filters.endDate)));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    return await query.orderBy(desc(financialTransactions.createdAt));
  }

  async getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id));
    return transaction;
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    // Auto-generate transaction number
    const transactionNumber = await this.getNextCode("T");
    const [created] = await db.insert(financialTransactions).values({
      ...transaction,
      transactionNumber,
    }).returning();
    return created;
  }

  async updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
    const [updated] = await db
      .update(financialTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(financialTransactions.id, id))
      .returning();
    return updated;
  }

  async deleteFinancialTransaction(id: number): Promise<void> {
    await db.delete(financialTransactions).where(eq(financialTransactions.id, id));
  }

  // Commission operations
  async getCommissions(filters?: {
    salespersonId?: string;
    status?: string;
    period?: string;
  }): Promise<(Commission & { salesperson?: User; order?: Order; quote?: Quote })[]> {
    let query = db
      .select()
      .from(commissions)
      .leftJoin(users, eq(commissions.salespersonId, users.id))
      .leftJoin(orders, eq(commissions.orderId, orders.id))
      .leftJoin(quotes, eq(commissions.quoteId, quotes.id));

    if (filters) {
      const conditions = [];
      if (filters.salespersonId) conditions.push(eq(commissions.salespersonId, filters.salespersonId));
      if (filters.status) conditions.push(eq(commissions.status, filters.status as any));
      if (filters.period) conditions.push(eq(commissions.period, filters.period));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    const results = await query.orderBy(desc(commissions.createdAt));

    return results.map(r => ({
      ...r.commissions,
      salesperson: r.users || undefined,
      order: r.orders || undefined,
      quote: r.quotes || undefined,
    }));
  }

  async createCommission(commission: InsertCommission): Promise<Commission> {
    const [created] = await db.insert(commissions).values(commission).returning();
    return created;
  }

  async updateCommission(id: number, commission: Partial<InsertCommission>): Promise<Commission> {
    const [updated] = await db
      .update(commissions)
      .set({ ...commission, updatedAt: new Date() })
      .where(eq(commissions.id, id))
      .returning();
    return updated;
  }

  async deleteCommission(id: number): Promise<void> {
    await db.delete(commissions).where(eq(commissions.id, id));
  }

  // Budget operations
  async getBudgets(filters?: { type?: string; status?: string; period?: string }): Promise<Budget[]> {
    let query = db.select().from(budgets);

    if (filters) {
      const conditions = [];
      if (filters.type) conditions.push(eq(budgets.type, filters.type as any));
      if (filters.status) conditions.push(eq(budgets.status, filters.status as any));
      if (filters.period) conditions.push(eq(budgets.period, filters.period));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    return await query.orderBy(desc(budgets.createdAt));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget;
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [created] = await db.insert(budgets).values(budget).returning();
    return created;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget> {
    const [updated] = await db
      .update(budgets)
      .set({ ...budget, updatedAt: new Date() })
      .where(eq(budgets.id, id))
      .returning();
    return updated;
  }

  async deleteBudget(id: number): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  // Financial Report operations
  async getFinancialReports(filters?: { reportType?: string; generatedBy?: string }): Promise<FinancialReport[]> {
    let query = db.select().from(financialReports);

    if (filters) {
      const conditions = [];
      if (filters.reportType) conditions.push(eq(financialReports.reportType, filters.reportType as any));
      if (filters.generatedBy) conditions.push(eq(financialReports.generatedBy, filters.generatedBy));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }

    return await query.orderBy(desc(financialReports.createdAt));
  }

  async createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport> {
    const [created] = await db.insert(financialReports).values(report).returning();
    return created;
  }

  async updateFinancialReport(id: number, report: Partial<InsertFinancialReport>): Promise<FinancialReport> {
    const [updated] = await db
      .update(financialReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(financialReports.id, id))
      .returning();
    return updated;
  }

  // Financial Alert operations
  async getFinancialAlerts(recipientId?: string, unreadOnly?: boolean): Promise<FinancialAlert[]> {
    let query = db.select().from(financialAlerts);

    const conditions = [];
    if (recipientId) conditions.push(eq(financialAlerts.recipientId, recipientId));
    if (unreadOnly) conditions.push(eq(financialAlerts.isRead, false));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(financialAlerts.createdAt));
  }

  async createFinancialAlert(alert: InsertFinancialAlert): Promise<FinancialAlert> {
    const [created] = await db.insert(financialAlerts).values(alert).returning();
    return created;
  }

  async markFinancialAlertAsRead(id: number): Promise<void> {
    await db
      .update(financialAlerts)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(financialAlerts.id, id));
  }

  // Financial Analytics and Dashboard methods
  async getFinancialOverview(startDate?: string, endDate?: string, salespersonId?: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingCommissions: number;
    paidCommissions: number;
    budgetUtilization: number;
    cashFlow: { month: string; income: number; expenses: number }[];
  }> {
    const dateConditions = [];
    if (startDate) dateConditions.push(gte(orders.createdAt, new Date(startDate)));
    if (endDate) dateConditions.push(lte(orders.createdAt, new Date(endDate)));

    // Add salesperson filter if provided
    const whereConditions = [
      inArray(orders.status, ["production", "shipped", "completed"]),
      ...(dateConditions.length > 0 ? dateConditions : [])
    ];
    if (salespersonId) {
      whereConditions.push(eq(orders.salespersonId, salespersonId));
    }

    // Get revenue from orders in production, shipped, or completed status
    // Revenue = sum of all order line items for qualifying orders
    const revenueOrders = await db
      .select({
        orderId: orders.id,
        salespersonId: orders.salespersonId,
        commissionRate: salespersons.commissionRate,
      })
      .from(orders)
      .leftJoin(salespersons, eq(orders.salespersonId, salespersons.userId))
      .where(and(...whereConditions));

    let totalRevenue = 0;
    let totalCommissions = 0;

    // Calculate revenue and commissions for each order
    for (const order of revenueOrders) {
      const lineItemsResult = await db
        .select({
          total: sql<number>`sum(quantity * unit_price)`
        })
        .from(orderLineItems)
        .where(eq(orderLineItems.orderId, order.orderId));

      const orderRevenue = Number(lineItemsResult[0]?.total || 0);
      totalRevenue += orderRevenue;

      // Calculate commission for this order
      const commissionRate = Number(order.commissionRate || 0);
      totalCommissions += orderRevenue * commissionRate;
    }

    // Get design costs ($50 per design job)
    const designDateConditions = [];
    if (startDate) designDateConditions.push(gte(designJobs.createdAt, new Date(startDate)));
    if (endDate) designDateConditions.push(lte(designJobs.createdAt, new Date(endDate)));
    
    const designJobsResult = await db
      .select({ count: count() })
      .from(designJobs)
      .where(designDateConditions.length > 0 ? and(...designDateConditions) : undefined);

    const designCosts = (designJobsResult[0]?.count || 0) * 50;

    // Total expenses = commissions + design costs
    const totalExpenses = totalCommissions + designCosts;

    // For pending/paid commissions, we'll use the revenue-based calculation
    // Pending = commissions from orders in "production" status
    // Paid = commissions from orders in "shipped" or "completed" status
    const pendingConditions = [eq(orders.status, "production")];
    if (salespersonId) {
      pendingConditions.push(eq(orders.salespersonId, salespersonId));
    }

    const pendingOrders = await db
      .select({
        orderId: orders.id,
        commissionRate: salespersons.commissionRate,
      })
      .from(orders)
      .leftJoin(salespersons, eq(orders.salespersonId, salespersons.userId))
      .where(and(...pendingConditions));

    let pendingCommissions = 0;
    for (const order of pendingOrders) {
      const lineItemsResult = await db
        .select({ total: sql<number>`sum(quantity * unit_price)` })
        .from(orderLineItems)
        .where(eq(orderLineItems.orderId, order.orderId));

      const orderRevenue = Number(lineItemsResult[0]?.total || 0);
      const commissionRate = Number(order.commissionRate || 0);
      pendingCommissions += orderRevenue * commissionRate;
    }

    const paidCommissions = totalCommissions - pendingCommissions;

    // Get budget utilization
    const budgetResult = await db
      .select({ 
        totalBudget: sql<number>`sum(total_budget)`,
        spentAmount: sql<number>`sum(spent_amount)`
      })
      .from(budgets)
      .where(eq(budgets.status, "active"));

    const totalBudget = budgetResult[0]?.totalBudget || 1;
    const spentAmount = budgetResult[0]?.spentAmount || 0;

    // Generate cash flow data (last 6 months)
    const cashFlow = await this.generateCashFlowData(salespersonId);

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      pendingCommissions,
      paidCommissions,
      budgetUtilization: (spentAmount / totalBudget) * 100,
      cashFlow,
    };
  }

  private async generateCashFlowData(salespersonId?: string): Promise<{ month: string; income: number; expenses: number }[]> {
    const cashFlow = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);

      // Build conditions for month filter
      const monthConditions = [
        inArray(orders.status, ["production", "shipped", "completed"]),
        gte(orders.createdAt, month),
        lt(orders.createdAt, nextMonth)
      ];
      if (salespersonId) {
        monthConditions.push(eq(orders.salespersonId, salespersonId));
      }

      // Get revenue from orders in the month
      const monthOrders = await db
        .select({
          orderId: orders.id,
          commissionRate: salespersons.commissionRate,
        })
        .from(orders)
        .leftJoin(salespersons, eq(orders.salespersonId, salespersons.userId))
        .where(and(...monthConditions));

      let monthIncome = 0;
      let monthCommissions = 0;

      for (const order of monthOrders) {
        const lineItemsResult = await db
          .select({ total: sql<number>`sum(quantity * unit_price)` })
          .from(orderLineItems)
          .where(eq(orderLineItems.orderId, order.orderId));

        const orderRevenue = Number(lineItemsResult[0]?.total || 0);
        monthIncome += orderRevenue;

        const commissionRate = Number(order.commissionRate || 0);
        monthCommissions += orderRevenue * commissionRate;
      }

      // Get design costs for the month
      const designJobsResult = await db
        .select({ count: count() })
        .from(designJobs)
        .where(and(
          gte(designJobs.createdAt, month),
          lt(designJobs.createdAt, nextMonth)
        ));

      const monthDesignCosts = (designJobsResult[0]?.count || 0) * 50;
      const monthExpenses = monthCommissions + monthDesignCosts;

      cashFlow.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses,
      });
    }

    return cashFlow;
  }

  // Territory management operations
  async getTerritories(): Promise<any[]> {
    // Get all unique territories with metrics
    const territoriesData = await db.select({
      territory: salespersons.territory,
      salespersonCount: count(salespersons.id)
    })
    .from(salespersons)
    .where(and(
      isNotNull(salespersons.territory),
      eq(salespersons.active, true)
    ))
    .groupBy(salespersons.territory);

    const territories = await Promise.all(
      territoriesData.map(async (territoryData) => {
        if (!territoryData.territory) return null;

        // Get salespeople in this territory
        const territoryPeople = await db.select({
          id: salespersons.id,
          name: users.name,
          workloadScore: salespersons.workloadScore
        })
        .from(salespersons)
        .leftJoin(users, eq(salespersons.userId, users.id))
        .where(eq(salespersons.territory, territoryData.territory));

        // Get lead count for territory
        const [leadCount] = await db.select({ count: count() })
          .from(leads)
          .leftJoin(salespersons, eq(leads.ownerUserId, salespersons.userId))
          .where(eq(salespersons.territory, territoryData.territory));

        // Calculate conversion rate
        const [wonLeads] = await db.select({ count: count() })
          .from(leads)
          .leftJoin(salespersons, eq(leads.ownerUserId, salespersons.userId))
          .where(and(
            eq(salespersons.territory, territoryData.territory),
            eq(leads.stage, 'current_clients' as any) // Won leads become current clients
          ));

        const totalLeads = leadCount.count || 0;
        const conversionRate = totalLeads > 0 ? ((wonLeads.count || 0) / totalLeads) * 100 : 0;

        return {
          id: territoryData.territory,
          name: territoryData.territory,
          states: [], // Would be populated from organization data
          cities: [], // Would be populated from organization data
          clientTypes: [], // Would be populated from preferences
          salespeople: territoryPeople.map(sp => ({
            id: sp.id,
            name: sp.name || 'Unknown',
            workload: parseFloat(sp.workloadScore || '0')
          })),
          totalLeads,
          conversionRate: Math.round(conversionRate * 10) / 10
        };
      })
    );

    return territories.filter(Boolean);
  }

  // Salesperson action logging
  async recordSalespersonAction(data: {
    entityType: string;
    entityId: number;
    salespersonId: string;
    action: string;
    notes: string;
    followUpDate?: string;
    nextStage?: string;
  }): Promise<any> {
    // For now, log to audit logs
    const actionData = {
      action: data.action,
      notes: data.notes,
      followUpDate: data.followUpDate,
      nextStage: data.nextStage,
      timestamp: new Date().toISOString()
    };

    await this.logActivity(
      data.salespersonId,
      data.entityType,
      data.entityId,
      data.action,
      null,
      actionData
    );

    // Update entity if needed
    if (data.nextStage) {
      if (data.entityType === 'lead') {
        await this.updateLead(data.entityId, { stage: data.nextStage as any });
      } else if (data.entityType === 'order') {
        await this.updateOrder(data.entityId, { status: data.nextStage as any });
      }
    }

    return { success: true };
  }

  // Auto-assignment logic
  async autoAssignLead(leadId: number): Promise<{ assigned: boolean; salespersonId?: string }> {
    const lead = await this.getLead(leadId);
    if (!lead || lead.ownerUserId) {
      return { assigned: false };
    }

    // Get organization to determine territory
    if (!lead.orgId) {
      return { assigned: false, salespersonId: undefined };
    }
    const org = await this.getOrganization(lead.orgId);
    const territory = org?.territory ?? undefined;
    const clientType = org?.clientType ?? undefined;

    const suggestedSalesperson = await this.suggestSalespersonForLead(territory, clientType);

    if (suggestedSalesperson) {
      await this.updateLead(leadId, {
        ownerUserId: suggestedSalesperson.userId,
        stage: 'hot_lead', // Use valid stage instead of 'claimed'
        claimedAt: new Date()
      });

      // Update salesperson workload
      const currentWorkload = parseFloat(suggestedSalesperson.workloadScore || '0');
      await this.updateSalesperson(suggestedSalesperson.id, {
        workloadScore: (currentWorkload + 1).toString(),
        lastAssignedAt: new Date()
      });

      return { assigned: true, salespersonId: suggestedSalesperson.userId };
    }

    return { assigned: false };
  }

  // Update salesperson workload when lead is won/lost
  async updateSalespersonWorkloadForLeadStage(leadId: number, newStage: string): Promise<void> {
    const lead = await this.getLead(leadId);
    if (!lead?.ownerUserId) return;

    const salesperson = await this.getSalespersonByUserId(lead.ownerUserId);
    if (!salesperson) return;

    let workloadChange = 0;
    if (newStage === 'won') {
      workloadChange = -2; // Reduce workload significantly for won leads
    } else if (newStage === 'lost') {
      workloadChange = -1; // Reduce workload for lost leads
    }

    if (workloadChange !== 0) {
      const currentWorkload = parseFloat(salesperson.workloadScore || '0');
      const newWorkload = Math.max(0, currentWorkload + workloadChange);

      await this.updateSalesperson(salesperson.id, {
        workloadScore: newWorkload.toString()
      });
    }
  }

  // Dashboard stats
  async getDashboardStats(user?: User): Promise<{
    totalLeads: number;
    totalOrders: number;
    designJobs: number;
    revenue: number;
    leadsByStage: Record<string, number>;
    ordersByStatus: Record<string, number>;
    // Admin specific
    totalUsers?: number;
    systemRevenue?: number;
    systemHealth?: string;
    usersByRole?: Record<string, number>;
    // Sales specific
    myLeads?: number;
    conversionRate?: number;
    commissionEarned?: number;
    quotaProgress?: number;
    myPipeline?: { stage: string; value: number; count: number }[];
    // Designer specific
    activeJobs?: number;
    pendingReview?: number;
    completedThisMonth?: number;
    approvalRate?: number;
    jobsByStatus?: Record<string, number>;
    // Ops specific
    ordersInProduction?: number;
    shippingToday?: number;
    overdueItems?: number;
    capacity?: number;
    productionPipeline?: Record<string, number>;
    // Manufacturer specific
    activeProductions?: number;
    onTimeRate?: number;
    capacityUsed?: number;
    dueThisWeek?: number;
    productionSchedule?: { date: string; count: number }[];
  }> {
    const userRole = user?.role;
    const userId = user?.id;
    const now = new Date();

    // Base metrics that vary by role
    let baseStats: any = {
      totalLeads: 0,
      totalOrders: 0,
      designJobs: 0,
      revenue: 0,
      leadsByStage: {},
      ordersByStatus: {},
    };

    // Admin Dashboard
    if (userRole === 'admin') {
      const [usersCount] = await db.select({ count: count() }).from(users);
      const [leadsCount] = await db.select({ count: count() }).from(leads);
      const [ordersCount] = await db.select({ count: count() }).from(orders);
      const [designJobsCount] = await db.select({ count: count() }).from(designJobs);

      // Calculate system revenue from all orders
      const allOrders = await db.select({ id: orders.id }).from(orders);
      let systemRevenue = 0;
      for (const order of allOrders) {
        // Calculate revenue from order line items
        const lineItems = await db.select({ 
          id: orderLineItems.id, 
          orderId: orderLineItems.orderId, 
          lineTotal: orderLineItems.lineTotal 
        }).from(orderLineItems).where(eq(orderLineItems.orderId, order.id));
        let orderTotal = 0;
        for (const item of lineItems) {
          orderTotal += parseFloat(item.lineTotal || '0');
        }
        systemRevenue += orderTotal;
      }

      // Get users by role
      const usersByRoleData = await db
        .select({ role: users.role, count: count() })
        .from(users)
        .groupBy(users.role);
      const usersByRole = usersByRoleData.reduce((acc, { role, count }) => {
        acc[role] = count;
        return acc;
      }, {} as Record<string, number>);

      // Get lead and order distributions
      const leadStages = await db
        .select({ stage: leads.stage, count: count() })
        .from(leads)
        .groupBy(leads.stage);
      const orderStatuses = await db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .groupBy(orders.status);

      baseStats = {
        totalLeads: leadsCount.count,
        totalOrders: ordersCount.count,
        designJobs: designJobsCount.count,
        revenue: systemRevenue,
        leadsByStage: leadStages.reduce((acc, { stage, count }) => ({ ...acc, [stage]: count }), {}),
        ordersByStatus: orderStatuses.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {}),
        totalUsers: usersCount.count,
        systemRevenue,
        systemHealth: 'Good',
        usersByRole,
      };
    }

    // Sales Dashboard
    else if (userRole === 'sales') {
      const [myLeadsCount] = await db.select({ count: count() }).from(leads).where(eq(leads.ownerUserId, userId!));
      const [myOrdersCount] = await db.select({ count: count() }).from(orders).where(eq(orders.salespersonId, userId!));

      // Get conversion rate (using current_clients as won stage)
      const wonLeads = await db.select({ count: count() }).from(leads)
        .where(and(eq(leads.ownerUserId, userId!), eq(leads.stage, 'current_clients' as any)));
      const conversionRate = myLeadsCount.count > 0 ? (wonLeads[0].count / myLeadsCount.count) * 100 : 0;

      // Calculate commission from orders
      const myOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.salespersonId, userId!));
      let totalRevenue = 0;
      let commissionEarned = 0;
      for (const order of myOrders) {
        // Calculate order amount from line items
        const lineItems = await db.select({ 
          id: orderLineItems.id, 
          orderId: orderLineItems.orderId, 
          lineTotal: orderLineItems.lineTotal 
        }).from(orderLineItems).where(eq(orderLineItems.orderId, order.id));
        let orderAmount = 0;
        for (const item of lineItems) {
          orderAmount += parseFloat(item.lineTotal || '0');
        }
        totalRevenue += orderAmount;
        // Commission calculation using salesperson's commission rate
        const salesperson = await db.select({ userId: salespersons.userId, commissionRate: salespersons.commissionRate }).from(salespersons).where(eq(salespersons.userId, userId!)).then(res => res[0]);
        const commissionRate = salesperson ? parseFloat(salesperson.commissionRate || '0.1') : 0.1;
        commissionEarned += orderAmount * commissionRate;
      }

      // Calculate quota progress (assuming $100k quarterly quota)
      const quotaProgress = (totalRevenue / 100000) * 100;

      // Get pipeline by stage with values
      const myPipeline = await db
        .select({ 
          stage: leads.stage, 
          count: count(),
          value: sql<number>`SUM(COALESCE(0, 0))`.as('value')
        })
        .from(leads)
        .where(eq(leads.ownerUserId, userId!))
        .groupBy(leads.stage);

      const leadStages = await db
        .select({ stage: leads.stage, count: count() })
        .from(leads)
        .where(eq(leads.ownerUserId, userId!))
        .groupBy(leads.stage);

      const orderStatuses = await db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .where(eq(orders.salespersonId, userId!))
        .groupBy(orders.status);

      baseStats = {
        totalLeads: myLeadsCount.count,
        totalOrders: myOrdersCount.count,
        designJobs: 0,
        revenue: totalRevenue,
        leadsByStage: leadStages.reduce((acc, { stage, count }) => ({ ...acc, [stage]: count }), {}),
        ordersByStatus: orderStatuses.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {}),
        myLeads: myLeadsCount.count,
        conversionRate,
        commissionEarned,
        quotaProgress,
        myPipeline: myPipeline.map(p => ({ stage: p.stage, value: p.value || 0, count: p.count })),
      };
    }

    // Designer Dashboard
    else if (userRole === 'designer') {
      const [activeJobsCount] = await db.select({ count: count() }).from(designJobs)
        .where(and(eq(designJobs.assignedDesignerId, userId!), sql`${designJobs.status} = 'in_progress'`));
      const [pendingReviewCount] = await db.select({ count: count() }).from(designJobs)
        .where(and(eq(designJobs.assignedDesignerId, userId!), sql`${designJobs.status} = 'review'`));

      // Get jobs completed this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const [completedThisMonthCount] = await db.select({ count: count() }).from(designJobs)
        .where(and(
          eq(designJobs.assignedDesignerId, userId!),
          sql`${designJobs.status} = 'approved'`,
          sql`${designJobs.updatedAt} >= ${startOfMonth.toISOString()}`
        ));

      // Calculate approval rate
      const [totalJobs] = await db.select({ count: count() }).from(designJobs)
        .where(eq(designJobs.assignedDesignerId, userId!));
      const [approvedJobs] = await db.select({ count: count() }).from(designJobs)
        .where(and(eq(designJobs.assignedDesignerId, userId!), sql`${designJobs.status} = 'approved'`));
      const approvalRate = totalJobs.count > 0 ? (approvedJobs.count / totalJobs.count) * 100 : 0;

      // Get jobs by status
      const jobsByStatusData = await db
        .select({ status: designJobs.status, count: count() })
        .from(designJobs)
        .where(eq(designJobs.assignedDesignerId, userId!))
        .groupBy(designJobs.status);
      const jobsByStatus = jobsByStatusData.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {});

      baseStats = {
        totalLeads: 0,
        totalOrders: 0,
        designJobs: activeJobsCount.count,
        revenue: 0,
        leadsByStage: {},
        ordersByStatus: {},
        activeJobs: activeJobsCount.count,
        pendingReview: pendingReviewCount.count,
        completedThisMonth: completedThisMonthCount.count,
        approvalRate,
        jobsByStatus,
      };
    }

    // Ops Dashboard
    else if (userRole === 'ops') {
      const [ordersInProductionCount] = await db.select({ count: count() }).from(orders)
        .where(sql`${orders.status} = 'production'`);
      const [shippingTodayCount] = await db.select({ count: count() }).from(orders)
        .where(sql`${orders.status} = 'shipped'`);
      const [overdueItemsCount] = await db.select({ count: count() }).from(orders)
        .where(sql`${orders.status} IN ('new', 'production')`);

      // Get production pipeline
      const productionPipelineData = await db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .where(sql`${orders.status} IN ('new', 'production', 'shipped', 'completed')`)
        .groupBy(orders.status);
      const productionPipeline = productionPipelineData.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {});

      // Calculate capacity (percentage of max capacity - assuming 100 orders max)
      const [totalActiveOrders] = await db.select({ count: count() }).from(orders)
        .where(sql`${orders.status} IN ('new', 'production', 'shipped')`);
      const capacity = parseFloat(((totalActiveOrders.count / 100) * 100).toFixed(2));

      const [ordersCount] = await db.select({ count: count() }).from(orders);
      const orderStatuses = await db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .groupBy(orders.status);

      baseStats = {
        totalLeads: 0,
        totalOrders: ordersCount.count,
        designJobs: 0,
        revenue: 0,
        leadsByStage: {},
        ordersByStatus: orderStatuses.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {}),
        ordersInProduction: ordersInProductionCount.count,
        shippingToday: shippingTodayCount.count,
        overdueItems: overdueItemsCount.count,
        capacity,
        productionPipeline,
      };
    }

    // Manufacturer Dashboard
    else if (userRole === 'manufacturer') {
      // Get user's associated manufacturer IDs for security
      const manufacturerIds = await this.getUserAssociatedManufacturerIds(userId!);
      if (manufacturerIds.length === 0) {
        // No manufacturer associations, return empty stats
        baseStats = {
          totalLeads: 0,
          totalOrders: 0,
          designJobs: 0,
          revenue: 0,
          leadsByStage: {},
          ordersByStatus: {},
          activeProductions: 0,
          onTimeRate: 100,
          capacityUsed: 0,
          dueThisWeek: 0,
          productionSchedule: [],
        };
        return baseStats;
      }

      // Get manufacturing updates assigned to this manufacturer's associated IDs (using new 7-stage workflow)
      const [activeProductionsCount] = await db.select({ count: count() }).from(manufacturingUpdates)
        .where(and(
          sql`${manufacturingUpdates.manufacturerId} IN (${manufacturerIds.join(',')})`,
          sql`${manufacturingUpdates.status} IN ('awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'final_packing_press', 'shipped')`
        ));

      // Calculate on-time rate
      const [totalProductions] = await db.select({ count: count() }).from(manufacturingUpdates)
        .where(sql`${manufacturingUpdates.manufacturerId} IN (${manufacturerIds.join(',')})`);
      const [onTimeProductions] = await db.select({ count: count() }).from(manufacturingUpdates)
        .where(and(
          sql`${manufacturingUpdates.manufacturerId} IN (${manufacturerIds.join(',')})`,
          eq(manufacturingUpdates.status, 'complete')
          // Ideally we'd check if completed before due date, but we need a due date field
        ));
      const onTimeRate = totalProductions.count > 0 ? (onTimeProductions.count / totalProductions.count) * 100 : 100;

      // Calculate capacity used (percentage of max capacity - assuming 50 productions max)
      const capacityUsed = (activeProductionsCount.count / 50) * 100;

      // Get productions due this week (using new 7-stage workflow)
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      const [dueThisWeekCount] = await db.select({ count: count() }).from(manufacturingUpdates)
        .where(and(
          sql`${manufacturingUpdates.manufacturerId} IN (${manufacturerIds.join(',')})`,
          sql`${manufacturingUpdates.status} IN ('awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'final_packing_press', 'shipped')`
        ));

      // Get production schedule for next 7 days (simplified)
      const productionSchedule = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        productionSchedule.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5) + 1, // Simulated data
        });
      }

      baseStats = {
        totalLeads: 0,
        totalOrders: 0,
        designJobs: 0,
        revenue: 0,
        leadsByStage: {},
        ordersByStatus: {},
        activeProductions: activeProductionsCount.count,
        onTimeRate,
        capacityUsed,
        dueThisWeek: dueThisWeekCount.count,
        productionSchedule,
      };
    }

    return {
      ...baseStats,
      // If the user is not an admin, set revenue to 0
      revenue: userRole === 'admin' ? (baseStats.revenue || 0) : 0,
    };
  }

  // Global search
  async globalSearch(query: string, user?: User): Promise<{
    leads: Lead[];
    organizations: Organization[];
    orders: Order[];
    products: Product[];
  }> {
    const userRole = user?.role;
    const userId = user?.id;
    const searchPattern = `%${query}%`;

    // Filter search based on role
    let searchLeadsPromise: Promise<Lead[]>;
    if (userRole === 'designer' || userRole === 'manufacturer' || userRole === 'ops') {
      // No access to leads
      searchLeadsPromise = Promise.resolve([]);
    } else if (userRole === 'sales') {
      searchLeadsPromise = db.select().from(leads).where(
        and(
          eq(leads.ownerUserId, userId!),
          or(
            like(leads.leadCode, searchPattern),
            like(leads.notes, searchPattern)
          )
        )
      ).limit(5);
    } else {
      searchLeadsPromise = db.select().from(leads).where(
        or(
          like(leads.leadCode, searchPattern),
          like(leads.notes, searchPattern)
        )
      ).limit(5);
    }

    const [searchLeads, searchOrganizations, searchOrders, searchProducts] = await Promise.all([
      searchLeadsPromise,

      db.select().from(organizations).where(
        like(organizations.name, searchPattern)
      ).limit(5),

      userRole === 'sales' 
        ? db.select().from(orders).where(
            and(
              eq(orders.salespersonId, userId!),
              or(
                like(orders.orderCode, searchPattern),
                like(orders.orderName, searchPattern)
              )
            )
          ).limit(5)
        : db.select().from(orders).where(
            or(
              like(orders.orderCode, searchPattern),
              like(orders.orderName, searchPattern)
            )
          ).limit(5),

      db.select().from(products).where(
        or(
          like(products.name, searchPattern),
          like(products.sku, searchPattern)
        )
      ).limit(5),
    ]);

    return {
      leads: searchLeads,
      organizations: searchOrganizations,
      orders: searchOrders,
      products: searchProducts,
    };
  }

  // Code generation
  async getNextCode(prefix: string): Promise<string> {
    return await db.transaction(async (tx) => {
      let nextNumber = 1;

      if (prefix === "L") {
        const [result] = await tx.select({ 
          maxCode: sql<string>`MAX(${leads.leadCode})` 
        }).from(leads);
        if (result.maxCode) {
          const match = result.maxCode.match(/L-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      } else if (prefix === "O") {
        const [result] = await tx.select({ 
          maxCode: sql<string>`MAX(${orders.orderCode})` 
        }).from(orders).where(sql`${orders.orderCode} LIKE 'O-%'`);
        console.log(`getNextCode: maxCode found: ${result.maxCode}`);
        if (result.maxCode) {
          const match = result.maxCode.match(/O-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
            console.log(`getNextCode: extracted number ${match[1]}, nextNumber: ${nextNumber}`);
          }
        }
      } else if (prefix === "DJ") {
        // Get all job codes that start with DJ and extract the numbers
        const results = await tx.select({ 
          jobCode: designJobs.jobCode
        }).from(designJobs)
        .where(sql`${designJobs.jobCode} LIKE 'DJ-%'`);

        if (results.length > 0) {
          const numbers = results
            .map(r => {
              const match = r.jobCode.match(/DJ-(\d+)/);
              return match ? parseInt(match[1]) : 0;
            })
            .filter(n => n > 0);

          if (numbers.length > 0) {
            nextNumber = Math.max(...numbers) + 1;
          }
        }
      } else if (prefix === "INV") {
        const [result] = await tx.select({ 
          maxCode: sql<string>`MAX(${invoices.invoiceNumber})` 
        }).from(invoices).where(sql`${invoices.invoiceNumber} LIKE 'INV-%'`);
        if (result.maxCode) {
          const match = result.maxCode.match(/INV-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      } else if (prefix === "PMT") {
        const [result] = await tx.select({ 
          maxCode: sql<string>`MAX(${invoicePayments.paymentNumber})` 
        }).from(invoicePayments).where(sql`${invoicePayments.paymentNumber} LIKE 'PMT-%'`);
        if (result.maxCode) {
          const match = result.maxCode.match(/PMT-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      } else if (prefix === "COM") {
        const [result] = await tx.select({ 
          maxCode: sql<string>`MAX(${commissionPayments.paymentNumber})` 
        }).from(commissionPayments).where(sql`${commissionPayments.paymentNumber} LIKE 'COM-%'`);
        if (result.maxCode) {
          const match = result.maxCode.match(/COM-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      }

      return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
    });
  }

  // Audit logging
  async logActivity(actorUserId: string, entity: string, entityId: number, action: string, before?: any, after?: any): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values({
      actorUserId,
      entity,
      entityId,
      action,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null,
    }).returning();
    return log;
  }

  async getRecentActivity(limit: number = 10, user?: User): Promise<AuditLog[]> {
    // Filter activity based on role
    if (user?.role === 'sales') {
      // Sales users only see their own activity
      return await db.select().from(auditLogs)
        .where(eq(auditLogs.actorUserId, user.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    } else if (user?.role === 'designer' || user?.role === 'manufacturer') {
      // Limited access to activity logs
      return await db.select().from(auditLogs)
        .where(eq(auditLogs.actorUserId, user.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    }

    // Admin and ops see all activity
    return await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getOrderActivity(orderId: number): Promise<AuditLog[]> {
    // Get activities related to this specific order
    return await db.select().from(auditLogs)
      .where(
        or(
          // Direct order activities
          and(eq(auditLogs.entity, 'order'), eq(auditLogs.entityId, orderId)),
          // Order line item activities
          and(eq(auditLogs.entity, 'order_line_item')),
          // Note activities for this order
          and(eq(auditLogs.entity, 'order'), eq(auditLogs.entityId, orderId), eq(auditLogs.action, 'note_added'))
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
  }

  // Quote operations
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async getQuoteWithLineItems(id: number): Promise<(Quote & { lineItems: QuoteLineItem[]; organization?: Organization }) | undefined> {
    const quote = await this.getQuote(id);
    if (!quote) return undefined;

    const lineItems = await this.getQuoteLineItems(id);

    // Fetch organization if available
    let organization: Organization | undefined;
    if (quote.orgId) {
      organization = await this.getOrganization(quote.orgId);
    }

    return { ...quote, lineItems, organization };
  }

  async createQuote(quoteData: InsertQuote): Promise<Quote> {
    const dataWithCode = {
      ...quoteData,
      quoteCode: quoteData.quoteCode || `Q-${Date.now()}`
    };
    const [quote] = await db.insert(quotes).values(dataWithCode).returning();
    return quote;
  }

  async createQuoteWithLineItems(quoteData: InsertQuote, lineItemsData: InsertQuoteLineItem[]): Promise<Quote> {
    try {
      console.log("[STORAGE] createQuoteWithLineItems - Starting transaction");
      console.log("[STORAGE] Quote data:", JSON.stringify(quoteData, null, 2));
      console.log("[STORAGE] Line items count:", lineItemsData.length);

      return await db.transaction(async (tx) => {
        console.log("[STORAGE] Inserting quote into database...");
        const dataWithCode = {
          ...quoteData,
          quoteCode: quoteData.quoteCode || `Q-${Date.now()}`
        };
        const [quote] = await tx.insert(quotes).values(dataWithCode).returning();
        console.log("[STORAGE] Quote inserted with ID:", quote.id);

        if (lineItemsData.length > 0) {
          const lineItemsWithQuoteId = lineItemsData.map(item => ({
            ...item,
            quoteId: quote.id
          }));
          console.log("[STORAGE] Inserting", lineItemsWithQuoteId.length, "line items...");
          await tx.insert(quoteLineItems).values(lineItemsWithQuoteId);
          console.log("[STORAGE] Line items inserted successfully");

          // Calculate totals properly after inserting line items using the same transaction
          console.log("[STORAGE] Recalculating quote totals...");
          const finalQuote = await this.recalculateQuoteTotals(quote.id, tx);
          console.log("[STORAGE] Quote totals recalculated successfully");
          return finalQuote;
        }

        console.log("[STORAGE] No line items to insert, returning quote");
        return quote;
      });
    } catch (error) {
      console.error("[STORAGE] Error in createQuoteWithLineItems:", error);
      console.error("[STORAGE] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async updateQuote(id: number, quoteData: Partial<InsertQuote>): Promise<Quote> {
    const [updated] = await db
      .update(quotes)
      .set({ ...quoteData, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Quote with id ${id} not found`);
    }

    // If financial fields were updated (taxRate, discount), recalculate totals
    const financialFields = ['taxRate', 'discount'];
    const hasFinancialChanges = financialFields.some(field => field in quoteData);

    if (hasFinancialChanges) {
      return await this.recalculateQuoteTotals(id);
    }

    return updated;
  }

  async deleteQuote(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete line items first
      await tx.delete(quoteLineItems).where(eq(quoteLineItems.quoteId, id));
      // Then delete the quote
      await tx.delete(quotes).where(eq(quotes.id, id));
    });
  }

  async getQuotesBySalesperson(userId: string): Promise<(Quote & { organization?: Organization; contact?: Contact })[]> {
    const result = await db
      .select({
        ...getTableColumns(quotes),
        organization: organizations,
        contact: contacts,
      })
      .from(quotes)
      .leftJoin(organizations, eq(quotes.orgId, organizations.id))
      .leftJoin(contacts, eq(quotes.contactId, contacts.id))
      .where(eq(quotes.salespersonId, userId));
    return result as any;
  }

  // Quote line item operations
  async getQuoteLineItems(quoteId: number): Promise<QuoteLineItem[]> {
    return await db.select().from(quoteLineItems).where(eq(quoteLineItems.quoteId, quoteId));
  }

  async createQuoteLineItem(lineItemData: InsertQuoteLineItem): Promise<QuoteLineItem> {
    if (!(lineItemData as any).quoteId) {
      throw new Error('quoteId is required for line item');
    }
    const [lineItem] = await db.insert(quoteLineItems).values(lineItemData as any).returning();

    // Trigger quote recalculation after creating line item
    await this.recalculateQuoteTotals(lineItem.quoteId);

    return lineItem;
  }

  async updateQuoteLineItem(id: number, lineItemData: Partial<InsertQuoteLineItem>): Promise<QuoteLineItem> {
    const [updated] = await db
      .update(quoteLineItems)
      .set(lineItemData)
      .where(eq(quoteLineItems.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Quote line item with id ${id} not found`);
    }

    // Trigger quote recalculation after updating line item
    await this.recalculateQuoteTotals(updated.quoteId);

    return updated;
  }

  async deleteQuoteLineItem(id: number): Promise<void> {
    // Get the quote ID before deleting the line item
    const [lineItem] = await db.select().from(quoteLineItems).where(eq(quoteLineItems.id, id));
    if (!lineItem) {
      throw new Error(`Quote line item with id ${id} not found`);
    }

    const quoteId = lineItem.quoteId;

    // Delete the line item
    await db.delete(quoteLineItems).where(eq(quoteLineItems.id, id));

    // Trigger quote recalculation after deleting line item
    await this.recalculateQuoteTotals(quoteId);
  }

  // Quote calculation operations
  async recalculateQuoteTotals(quoteId: number, existingTx?: any): Promise<Quote> {
    const executeRecalculation = async (tx: any) => {
      try {
        console.log("[STORAGE] recalculateQuoteTotals - Quote ID:", quoteId);

        // Get current quote
        const [quote] = await tx.select().from(quotes).where(eq(quotes.id, quoteId));
        if (!quote) {
          throw new Error(`Quote with id ${quoteId} not found`);
        }
        console.log("[STORAGE] Quote found:", JSON.stringify(quote, null, 2));

        // Get all line items for this quote
        const lineItems = await tx.select().from(quoteLineItems).where(eq(quoteLineItems.quoteId, quoteId));
        console.log("[STORAGE] Found", lineItems.length, "line items");

        // Calculate subtotal from line items (sum of all line totals)
        const subtotal = lineItems.reduce((sum: number, item: any) => {
          const lineTotal = Number(item.unitPrice) * item.quantity;
          console.log(`[STORAGE] Line item: unitPrice=${item.unitPrice}, quantity=${item.quantity}, lineTotal=${lineTotal}`);
          return sum + lineTotal;
        }, 0);
        console.log("[STORAGE] Calculated subtotal:", subtotal);

        // Apply discount to get taxable amount
        const discountAmount = Number(quote.discount) || 0;
        const taxableAmount = subtotal - discountAmount;
        console.log("[STORAGE] Discount:", discountAmount, "Taxable amount:", taxableAmount);

        // Calculate tax on the discounted amount (not full subtotal)
        const taxRate = Number(quote.taxRate) || 0;
        const taxAmount = taxableAmount * taxRate;
        console.log("[STORAGE] Tax rate:", taxRate, "Tax amount:", taxAmount);

        // Calculate final total
        const total = taxableAmount + taxAmount;
        console.log("[STORAGE] Final total:", total);

        // Update quote with recalculated values
        console.log("[STORAGE] Updating quote with new totals...");
        const [updatedQuote] = await tx
          .update(quotes)
          .set({
            subtotal: subtotal.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            total: total.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, quoteId))
          .returning();

        console.log("[STORAGE] Quote updated successfully:", JSON.stringify(updatedQuote, null, 2));
        return updatedQuote;
      } catch (error) {
        console.error("[STORAGE] Error in recalculateQuoteTotals:", error);
        console.error("[STORAGE] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    };

    // If transaction is provided, use it; otherwise create a new one
    if (existingTx) {
      console.log("[STORAGE] Using existing transaction for recalculation");
      return await executeRecalculation(existingTx);
    } else {
      console.log("[STORAGE] Creating new transaction for recalculation");
      return await db.transaction(executeRecalculation);
    }
  }

  // Permission Management operations
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db
      .update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    if (!role) {
      throw new Error(`Role with id ${id} not found`);
    }
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.getRole(id);
    if (!role) {
      throw new Error(`Role with id ${id} not found`);
    }
    if (role.isSystem) {
      throw new Error(`Cannot delete system role: ${role.name}`);
    }
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(resources.resourceType, resources.name);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResourceByName(name: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.name, name));
    return resource;
  }

  async createResource(resourceData: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(resourceData).returning();
    return resource;
  }

  async updateResource(id: number, resourceData: Partial<InsertResource>): Promise<Resource> {
    const [resource] = await db
      .update(resources)
      .set({ ...resourceData, updatedAt: new Date() })
      .where(eq(resources.id, id))
      .returning();
    if (!resource) {
      throw new Error(`Resource with id ${id} not found`);
    }
    return resource;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.resourceId, id));
    await db.delete(resources).where(eq(resources.id, id));
  }

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async getPermissionsByRole(roleName: string): Promise<RolePermission[]> {
    const role = await this.getRoleByName(roleName);
    if (!role) {
      return [];
    }
    return await this.getRolePermissions(role.id);
  }

  async createRolePermission(permissionData: InsertRolePermission): Promise<RolePermission> {
    const [permission] = await db.insert(rolePermissions).values(permissionData).returning();
    return permission;
  }

  async updateRolePermission(id: number, permissionData: Partial<InsertRolePermission>): Promise<RolePermission> {
    const [permission] = await db
      .update(rolePermissions)
      .set({ ...permissionData, updatedAt: new Date() })
      .where(eq(rolePermissions.id, id))
      .returning();
    if (!permission) {
      throw new Error(`Permission with id ${id} not found`);
    }
    return permission;
  }

  async upsertRolePermission(roleId: number, resourceId: number, permissionData: Partial<InsertRolePermission>): Promise<RolePermission> {
    const [existing] = await db
      .select()
      .from(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.resourceId, resourceId)));

    if (existing) {
      return await this.updateRolePermission(existing.id, permissionData);
    } else {
      return await this.createRolePermission({
        roleId,
        resourceId,
        ...permissionData,
      } as InsertRolePermission);
    }
  }

  async deleteRolePermission(id: number): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.id, id));
  }

  async deleteRolePermissionsByRole(roleId: number): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  // Invoice operations
  async getInvoices(filters?: { revenueSource?: "order" | "team_store" | "other" }): Promise<(Invoice & { organization?: Organization; salesperson?: User })[]> {
    const conditions = [];
    
    if (filters?.revenueSource) {
      conditions.push(eq(invoices.revenueSource, filters.revenueSource));
    }
    
    const results = await db
      .select({
        ...getTableColumns(invoices),
        organization: organizations,
        salesperson: users,
      })
      .from(invoices)
      .leftJoin(organizations, eq(invoices.orgId, organizations.id))
      .leftJoin(users, eq(invoices.salespersonId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt));

    return results.map((row) => ({
      ...row,
      organization: row.organization || undefined,
      salesperson: row.salesperson || undefined,
    }));
  }

  async getInvoice(id: number): Promise<(Invoice & { organization?: Organization; salesperson?: User }) | undefined> {
    const [result] = await db
      .select({
        ...getTableColumns(invoices),
        organization: organizations,
        salesperson: users,
      })
      .from(invoices)
      .leftJoin(organizations, eq(invoices.orgId, organizations.id))
      .leftJoin(users, eq(invoices.salespersonId, users.id))
      .where(eq(invoices.id, id));

    if (!result) return undefined;

    return {
      ...result,
      organization: result.organization || undefined,
      salesperson: result.salesperson || undefined,
    };
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getInvoicesByOrganization(orgId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.orgId, orgId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesBySalesperson(salespersonId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.salespersonId, salespersonId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByOrderId(orderId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.orderId, orderId)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // Generate invoice number if not provided
    const dataWithNumber = {
      ...invoiceData,
      invoiceNumber: invoiceData.invoiceNumber || await this.getNextCode("INV")
    };

    const [invoice] = await db.insert(invoices).values(dataWithNumber).returning();
    return invoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    if (!invoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }
    return invoice;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // Invoice Payment operations
  async getInvoicePayments(invoiceId?: number): Promise<InvoicePayment[]> {
    if (invoiceId) {
      return await db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, invoiceId)).orderBy(desc(invoicePayments.paymentDate));
    }
    return await db.select().from(invoicePayments).orderBy(desc(invoicePayments.paymentDate));
  }

  async getInvoicePayment(id: number): Promise<InvoicePayment | undefined> {
    const [payment] = await db.select().from(invoicePayments).where(eq(invoicePayments.id, id));
    return payment;
  }

  async createInvoicePayment(paymentData: InsertInvoicePayment): Promise<InvoicePayment> {
    // Generate payment number if not provided
    const dataWithNumber = {
      ...paymentData,
      paymentNumber: paymentData.paymentNumber || await this.getNextCode("PMT")
    };

    const [payment] = await db.insert(invoicePayments).values(dataWithNumber).returning();

    // Update invoice amountPaid
    const allPayments = await this.getInvoicePayments(payment.invoiceId);
    const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    await db
      .update(invoices)
      .set({ 
        amountPaid: totalPaid.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, payment.invoiceId));

    return payment;
  }

  async updateInvoicePayment(id: number, paymentData: Partial<InsertInvoicePayment>): Promise<InvoicePayment> {
    const [payment] = await db
      .update(invoicePayments)
      .set({ ...paymentData, updatedAt: new Date() })
      .where(eq(invoicePayments.id, id))
      .returning();
    if (!payment) {
      throw new Error(`Invoice payment with id ${id} not found`);
    }

    // Recalculate invoice amountPaid
    const allPayments = await this.getInvoicePayments(payment.invoiceId);
    const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    await db
      .update(invoices)
      .set({ 
        amountPaid: totalPaid.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, payment.invoiceId));

    return payment;
  }

  async deleteInvoicePayment(id: number): Promise<void> {
    const payment = await this.getInvoicePayment(id);
    if (!payment) return;

    await db.delete(invoicePayments).where(eq(invoicePayments.id, id));

    // Recalculate invoice amountPaid
    const allPayments = await this.getInvoicePayments(payment.invoiceId);
    const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    await db
      .update(invoices)
      .set({ 
        amountPaid: totalPaid.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, payment.invoiceId));
  }

  // Commission Payment operations
  async getCommissionPayments(salespersonId?: string): Promise<CommissionPayment[]> {
    if (salespersonId) {
      return await db.select().from(commissionPayments).where(eq(commissionPayments.salespersonId, salespersonId)).orderBy(desc(commissionPayments.paymentDate));
    }
    return await db.select().from(commissionPayments).orderBy(desc(commissionPayments.paymentDate));
  }

  async getCommissionPayment(id: number): Promise<CommissionPayment | undefined> {
    const [payment] = await db.select().from(commissionPayments).where(eq(commissionPayments.id, id));
    return payment;
  }

  async createCommissionPayment(paymentData: InsertCommissionPayment): Promise<CommissionPayment> {
    // Generate payment number if not provided
    const dataWithNumber = {
      ...paymentData,
      paymentNumber: paymentData.paymentNumber || await this.getNextCode("COM")
    };

    const [payment] = await db.insert(commissionPayments).values(dataWithNumber).returning();
    return payment;
  }

  async updateCommissionPayment(id: number, paymentData: Partial<InsertCommissionPayment>): Promise<CommissionPayment> {
    const [payment] = await db
      .update(commissionPayments)
      .set({ ...paymentData, updatedAt: new Date() })
      .where(eq(commissionPayments.id, id))
      .returning();
    if (!payment) {
      throw new Error(`Commission payment with id ${id} not found`);
    }
    return payment;
  }

  async deleteCommissionPayment(id: number): Promise<void> {
    await db.delete(commissionPayments).where(eq(commissionPayments.id, id));
  }

  // Product COGS operations
  async getProductCogs(variantId?: number): Promise<ProductCogs[]> {
    if (variantId) {
      return await db.select().from(productCogs).where(eq(productCogs.variantId, variantId));
    }
    return await db.select().from(productCogs).orderBy(desc(productCogs.lastUpdated));
  }

  async getProductCogsById(id: number): Promise<ProductCogs | undefined> {
    const [cogs] = await db.select().from(productCogs).where(eq(productCogs.id, id));
    return cogs;
  }

  async getProductCogsByVariant(variantId: number): Promise<ProductCogs | undefined> {
    const [cogs] = await db.select().from(productCogs).where(eq(productCogs.variantId, variantId));
    return cogs;
  }

  async createProductCogs(cogsData: InsertProductCogs): Promise<ProductCogs> {
    const [cogs] = await db.insert(productCogs).values(cogsData).returning();
    return cogs;
  }

  async updateProductCogs(id: number, cogsData: Partial<InsertProductCogs>): Promise<ProductCogs> {
    const [cogs] = await db
      .update(productCogs)
      .set({ ...cogsData, lastUpdated: new Date(), updatedAt: new Date() })
      .where(eq(productCogs.id, id))
      .returning();
    if (!cogs) {
      throw new Error(`Product COGS with id ${id} not found`);
    }
    return cogs;
  }

  async deleteProductCogs(id: number): Promise<void> {
    await db.delete(productCogs).where(eq(productCogs.id, id));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Notification with id ${id} not found`);
    }
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Design Resources methods
  async getDesignResources(): Promise<DesignResource[]> {
    return db
      .select()
      .from(designResources)
      .orderBy(desc(designResources.createdAt));
  }

  async getDesignResource(id: number): Promise<DesignResource | undefined> {
    const [resource] = await db
      .select()
      .from(designResources)
      .where(eq(designResources.id, id));
    return resource;
  }

  async createDesignResource(resource: InsertDesignResource): Promise<DesignResource> {
    const [created] = await db
      .insert(designResources)
      .values(resource)
      .returning();
    return created;
  }

  async updateDesignResource(id: number, resource: Partial<InsertDesignResource>): Promise<DesignResource> {
    const [updated] = await db
      .update(designResources)
      .set({ ...resource, updatedAt: new Date() })
      .where(eq(designResources.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Design resource with id ${id} not found`);
    }
    return updated;
  }

  async deleteDesignResource(id: number): Promise<void> {
    await db.delete(designResources).where(eq(designResources.id, id));
  }

  async incrementDesignResourceDownloads(id: number): Promise<void> {
    await db
      .update(designResources)
      .set({ downloads: sql`${designResources.downloads} + 1` })
      .where(eq(designResources.id, id));
  }

  // Event Management implementations
  async getEvents(): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .orderBy(desc(events.createdAt));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const eventCode = event.eventCode || `EVT-${Date.now()}`;
    const [created] = await db
      .insert(events)
      .values({ ...event, eventCode } as any)
      .returning();
    return created;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const updateData: any = { ...event, updatedAt: new Date() };
    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event with id ${id} not found`);
    }
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getEventStages(eventId: number): Promise<EventStage[]> {
    return await db
      .select()
      .from(eventStages)
      .where(eq(eventStages.eventId, eventId))
      .orderBy(eventStages.stageNumber);
  }

  async getEventStage(id: number): Promise<EventStage | undefined> {
    const [stage] = await db
      .select()
      .from(eventStages)
      .where(eq(eventStages.id, id));
    return stage;
  }

  async createEventStage(stage: InsertEventStage): Promise<EventStage> {
    const [created] = await db.insert(eventStages).values(stage).returning();
    return created;
  }

  async updateEventStage(id: number, stage: Partial<InsertEventStage>): Promise<EventStage> {
    const [updated] = await db
      .update(eventStages)
      .set({ ...stage, updatedAt: new Date() })
      .where(eq(eventStages.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event stage with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventStage(id: number): Promise<void> {
    await db.delete(eventStages).where(eq(eventStages.id, id));
  }

  async getEventStaff(eventId: number): Promise<EventStaff[]> {
    return await db
      .select()
      .from(eventStaff)
      .where(eq(eventStaff.eventId, eventId));
  }

  async createEventStaff(staff: InsertEventStaff): Promise<EventStaff> {
    const [created] = await db.insert(eventStaff).values(staff).returning();
    return created;
  }

  async updateEventStaff(id: number, staff: Partial<InsertEventStaff>): Promise<EventStaff> {
    const [updated] = await db
      .update(eventStaff)
      .set({ ...staff, updatedAt: new Date() })
      .where(eq(eventStaff.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event staff with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventStaff(id: number): Promise<void> {
    await db.delete(eventStaff).where(eq(eventStaff.id, id));
  }

  async getEventContractors(eventId: number): Promise<EventContractor[]> {
    return await db
      .select()
      .from(eventContractors)
      .where(eq(eventContractors.eventId, eventId));
  }

  async getEventContractor(id: number): Promise<EventContractor | undefined> {
    const [contractor] = await db
      .select()
      .from(eventContractors)
      .where(eq(eventContractors.id, id));
    return contractor;
  }

  async createEventContractor(contractor: InsertEventContractor): Promise<EventContractor> {
    const [created] = await db.insert(eventContractors).values(contractor).returning();
    return created;
  }

  async updateEventContractor(id: number, contractor: Partial<InsertEventContractor>): Promise<EventContractor> {
    const [updated] = await db
      .update(eventContractors)
      .set({ ...contractor, updatedAt: new Date() })
      .where(eq(eventContractors.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event contractor with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventContractor(id: number): Promise<void> {
    await db.delete(eventContractors).where(eq(eventContractors.id, id));
  }

  async getContractorPayments(contractorId: number): Promise<ContractorPayment[]> {
    return await db
      .select()
      .from(contractorPayments)
      .where(eq(contractorPayments.contractorId, contractorId))
      .orderBy(desc(contractorPayments.paymentDate));
  }

  async createContractorPayment(payment: InsertContractorPayment): Promise<ContractorPayment> {
    const paymentData: any = {
      ...payment,
      paymentDate: typeof payment.paymentDate === 'string' ? new Date(payment.paymentDate) : payment.paymentDate
    };
    const [created] = await db.insert(contractorPayments).values(paymentData).returning();
    return created;
  }

  async getContractorFiles(contractorId: number): Promise<ContractorFile[]> {
    return await db
      .select()
      .from(contractorFiles)
      .where(eq(contractorFiles.contractorId, contractorId));
  }

  async createContractorFile(file: InsertContractorFile): Promise<ContractorFile> {
    const [created] = await db.insert(contractorFiles).values(file).returning();
    return created;
  }

  async deleteContractorFile(id: number): Promise<void> {
    await db.delete(contractorFiles).where(eq(contractorFiles.id, id));
  }

  async getEventMerchandise(eventId: number): Promise<EventMerchandise[]> {
    return await db
      .select()
      .from(eventMerchandise)
      .where(eq(eventMerchandise.eventId, eventId));
  }

  async createEventMerchandise(merchandise: InsertEventMerchandise): Promise<EventMerchandise> {
    const [created] = await db.insert(eventMerchandise).values(merchandise).returning();
    return created;
  }

  async updateEventMerchandise(id: number, merchandise: Partial<InsertEventMerchandise>): Promise<EventMerchandise> {
    const [updated] = await db
      .update(eventMerchandise)
      .set({ ...merchandise, updatedAt: new Date() })
      .where(eq(eventMerchandise.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event merchandise with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventMerchandise(id: number): Promise<void> {
    await db.delete(eventMerchandise).where(eq(eventMerchandise.id, id));
  }

  async getEventInventoryMovements(eventId: number): Promise<EventInventoryMovement[]> {
    return await db
      .select()
      .from(eventInventoryMovements)
      .where(eq(eventInventoryMovements.eventId, eventId))
      .orderBy(desc(eventInventoryMovements.createdAt));
  }

  async createEventInventoryMovement(movement: InsertEventInventoryMovement): Promise<EventInventoryMovement> {
    const [created] = await db.insert(eventInventoryMovements).values(movement).returning();
    return created;
  }

  async getEventBudgets(eventId: number): Promise<EventBudget[]> {
    return await db
      .select()
      .from(eventBudgets)
      .where(eq(eventBudgets.eventId, eventId));
  }

  async createEventBudget(budget: InsertEventBudget): Promise<EventBudget> {
    const [created] = await db.insert(eventBudgets).values(budget).returning();
    return created;
  }

  async updateEventBudget(id: number, budget: Partial<InsertEventBudget>): Promise<EventBudget> {
    const [updated] = await db
      .update(eventBudgets)
      .set({ ...budget, updatedAt: new Date() })
      .where(eq(eventBudgets.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event budget with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventBudget(id: number): Promise<void> {
    await db.delete(eventBudgets).where(eq(eventBudgets.id, id));
  }

  async getEventCampaigns(eventId: number): Promise<EventCampaign[]> {
    return await db
      .select()
      .from(eventCampaigns)
      .where(eq(eventCampaigns.eventId, eventId))
      .orderBy(desc(eventCampaigns.createdAt));
  }

  async createEventCampaign(campaign: InsertEventCampaign): Promise<EventCampaign> {
    const campaignData: any = {
      ...campaign,
      sentAt: campaign.sentAt ? (typeof campaign.sentAt === 'string' ? new Date(campaign.sentAt) : campaign.sentAt) : null,
      scheduledAt: campaign.scheduledAt ? (typeof campaign.scheduledAt === 'string' ? new Date(campaign.scheduledAt) : campaign.scheduledAt) : null
    };
    const [created] = await db.insert(eventCampaigns).values(campaignData).returning();
    return created;
  }

  async updateEventCampaign(id: number, campaign: Partial<InsertEventCampaign>): Promise<EventCampaign> {
    const updateData: any = {
      ...campaign,
      updatedAt: new Date(),
      sentAt: campaign.sentAt ? (typeof campaign.sentAt === 'string' ? new Date(campaign.sentAt) : campaign.sentAt) : undefined,
      scheduledAt: campaign.scheduledAt ? (typeof campaign.scheduledAt === 'string' ? new Date(campaign.scheduledAt) : campaign.scheduledAt) : undefined
    };
    const [updated] = await db
      .update(eventCampaigns)
      .set(updateData)
      .where(eq(eventCampaigns.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event campaign with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventCampaign(id: number): Promise<void> {
    await db.delete(eventCampaigns).where(eq(eventCampaigns.id, id));
  }

  async getEventRegistrations(eventId: number): Promise<EventRegistration[]> {
    return await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId))
      .orderBy(desc(eventRegistrations.registeredAt));
  }

  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const [created] = await db.insert(eventRegistrations).values(registration).returning();
    return created;
  }

  async updateEventRegistration(id: number, registration: Partial<InsertEventRegistration>): Promise<EventRegistration> {
    const [updated] = await db
      .update(eventRegistrations)
      .set({ ...registration, updatedAt: new Date() })
      .where(eq(eventRegistrations.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Event registration with id ${id} not found`);
    }
    return updated;
  }

  async deleteEventRegistration(id: number): Promise<void> {
    await db.delete(eventRegistrations).where(eq(eventRegistrations.id, id));
  }

  // Event Sponsors
  async getEventSponsors(eventId: number): Promise<EventSponsor[]> {
    return await db
      .select()
      .from(eventSponsors)
      .where(eq(eventSponsors.eventId, eventId))
      .orderBy(desc(eventSponsors.createdAt));
  }

  async createEventSponsor(sponsor: InsertEventSponsor): Promise<EventSponsor> {
    const [created] = await db.insert(eventSponsors).values(sponsor).returning();
    return created;
  }

  async updateEventSponsor(id: number, sponsor: Partial<InsertEventSponsor>): Promise<EventSponsor> {
    const [updated] = await db
      .update(eventSponsors)
      .set({ ...sponsor, updatedAt: new Date() })
      .where(eq(eventSponsors.id, id))
      .returning();
    if (!updated) throw new Error("Sponsor not found");
    return updated;
  }

  async deleteEventSponsor(id: number): Promise<void> {
    await db.delete(eventSponsors).where(eq(eventSponsors.id, id));
  }

  // Event Volunteers
  async getEventVolunteers(eventId: number): Promise<EventVolunteer[]> {
    return await db
      .select()
      .from(eventVolunteers)
      .where(eq(eventVolunteers.eventId, eventId))
      .orderBy(desc(eventVolunteers.createdAt));
  }

  async createEventVolunteer(volunteer: InsertEventVolunteer): Promise<EventVolunteer> {
    const [created] = await db.insert(eventVolunteers).values(volunteer).returning();
    return created;
  }

  async updateEventVolunteer(id: number, volunteer: Partial<InsertEventVolunteer>): Promise<EventVolunteer> {
    const [updated] = await db
      .update(eventVolunteers)
      .set({ ...volunteer, updatedAt: new Date() })
      .where(eq(eventVolunteers.id, id))
      .returning();
    if (!updated) throw new Error("Volunteer not found");
    return updated;
  }

  async deleteEventVolunteer(id: number): Promise<void> {
    await db.delete(eventVolunteers).where(eq(eventVolunteers.id, id));
  }

  // Event Graphics
  async getEventGraphics(eventId: number): Promise<EventGraphic[]> {
    return await db
      .select()
      .from(eventGraphics)
      .where(eq(eventGraphics.eventId, eventId))
      .orderBy(desc(eventGraphics.createdAt));
  }

  async createEventGraphic(graphic: InsertEventGraphic): Promise<EventGraphic> {
    const [created] = await db.insert(eventGraphics).values(graphic).returning();
    return created;
  }

  async updateEventGraphic(id: number, graphic: Partial<InsertEventGraphic>): Promise<EventGraphic> {
    const [updated] = await db
      .update(eventGraphics)
      .set({ ...graphic, updatedAt: new Date() })
      .where(eq(eventGraphics.id, id))
      .returning();
    if (!updated) throw new Error("Graphic not found");
    return updated;
  }

  async deleteEventGraphic(id: number): Promise<void> {
    await db.delete(eventGraphics).where(eq(eventGraphics.id, id));
  }

  // Event Venues
  async getEventVenues(eventId: number): Promise<EventVenue[]> {
    return await db
      .select()
      .from(eventVenues)
      .where(eq(eventVenues.eventId, eventId))
      .orderBy(desc(eventVenues.createdAt));
  }

  async createEventVenue(venue: InsertEventVenue): Promise<EventVenue> {
    const [created] = await db.insert(eventVenues).values(venue).returning();
    return created;
  }

  async updateEventVenue(id: number, venue: Partial<InsertEventVenue>): Promise<EventVenue> {
    const [updated] = await db
      .update(eventVenues)
      .set({ ...venue, updatedAt: new Date() })
      .where(eq(eventVenues.id, id))
      .returning();
    if (!updated) throw new Error("Venue not found");
    return updated;
  }

  async deleteEventVenue(id: number): Promise<void> {
    await db.delete(eventVenues).where(eq(eventVenues.id, id));
  }

  // Event Schedules
  async getEventSchedules(eventId: number): Promise<EventSchedule[]> {
    return await db
      .select()
      .from(eventSchedules)
      .where(eq(eventSchedules.eventId, eventId))
      .orderBy(desc(eventSchedules.createdAt));
  }

  async createEventSchedule(schedule: InsertEventSchedule): Promise<EventSchedule> {
    const scheduleData: any = {
      ...schedule,
      startTime: schedule.startTime ? (typeof schedule.startTime === 'string' ? new Date(schedule.startTime) : schedule.startTime) : null,
      endTime: schedule.endTime ? (typeof schedule.endTime === 'string' ? new Date(schedule.endTime) : schedule.endTime) : null
    };
    const [created] = await db.insert(eventSchedules).values(scheduleData).returning();
    return created;
  }

  async updateEventSchedule(id: number, schedule: Partial<InsertEventSchedule>): Promise<EventSchedule> {
    const updateData: any = {
      ...schedule,
      updatedAt: new Date(),
      startTime: schedule.startTime ? (typeof schedule.startTime === 'string' ? new Date(schedule.startTime) : schedule.startTime) : undefined,
      endTime: schedule.endTime ? (typeof schedule.endTime === 'string' ? new Date(schedule.endTime) : schedule.endTime) : undefined
    };
    const [updated] = await db
      .update(eventSchedules)
      .set(updateData)
      .where(eq(eventSchedules.id, id))
      .returning();
    if (!updated) throw new Error("Schedule not found");
    return updated;
  }

  async deleteEventSchedule(id: number): Promise<void> {
    await db.delete(eventSchedules).where(eq(eventSchedules.id, id));
  }

  // Event Equipment
  async getEventEquipment(eventId: number): Promise<EventEquipment[]> {
    return await db
      .select()
      .from(eventEquipment)
      .where(eq(eventEquipment.eventId, eventId))
      .orderBy(desc(eventEquipment.createdAt));
  }

  async createEventEquipment(equipment: InsertEventEquipment): Promise<EventEquipment> {
    const [created] = await db.insert(eventEquipment).values(equipment).returning();
    return created;
  }

  async updateEventEquipment(id: number, equipment: Partial<InsertEventEquipment>): Promise<EventEquipment> {
    const [updated] = await db
      .update(eventEquipment)
      .set({ ...equipment, updatedAt: new Date() })
      .where(eq(eventEquipment.id, id))
      .returning();
    if (!updated) throw new Error("Equipment not found");
    return updated;
  }

  async deleteEventEquipment(id: number): Promise<void> {
    await db.delete(eventEquipment).where(eq(eventEquipment.id, id));
  }

  // Event Travel
  async getEventTravel(eventId: number): Promise<EventTravel[]> {
    return await db
      .select()
      .from(eventTravel)
      .where(eq(eventTravel.eventId, eventId))
      .orderBy(desc(eventTravel.createdAt));
  }

  async createEventTravel(travel: InsertEventTravel): Promise<EventTravel> {
    const [created] = await db.insert(eventTravel).values(travel).returning();
    return created;
  }

  async updateEventTravel(id: number, travel: Partial<InsertEventTravel>): Promise<EventTravel> {
    const [updated] = await db
      .update(eventTravel)
      .set({ ...travel, updatedAt: new Date() })
      .where(eq(eventTravel.id, id))
      .returning();
    if (!updated) throw new Error("Travel record not found");
    return updated;
  }

  async deleteEventTravel(id: number): Promise<void> {
    await db.delete(eventTravel).where(eq(eventTravel.id, id));
  }

  // Event Tasks
  async getEventTasks(eventId: number): Promise<EventTask[]> {
    return await db
      .select()
      .from(eventTasks)
      .where(eq(eventTasks.eventId, eventId))
      .orderBy(desc(eventTasks.createdAt));
  }

  async createEventTask(task: InsertEventTask): Promise<EventTask> {
    const [created] = await db.insert(eventTasks).values(task).returning();
    return created;
  }

  async updateEventTask(id: number, task: Partial<InsertEventTask>): Promise<EventTask> {
    const [updated] = await db
      .update(eventTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(eventTasks.id, id))
      .returning();
    if (!updated) throw new Error("Task not found");
    return updated;
  }

  async deleteEventTask(id: number): Promise<void> {
    await db.delete(eventTasks).where(eq(eventTasks.id, id));
  }

  // Event Documents
  async getEventDocuments(eventId: number): Promise<EventDocument[]> {
    return await db
      .select()
      .from(eventDocuments)
      .where(eq(eventDocuments.eventId, eventId))
      .orderBy(desc(eventDocuments.createdAt));
  }

  async createEventDocument(document: InsertEventDocument): Promise<EventDocument> {
    const [created] = await db.insert(eventDocuments).values(document).returning();
    return created;
  }

  async updateEventDocument(id: number, document: Partial<InsertEventDocument>): Promise<EventDocument> {
    const [updated] = await db
      .update(eventDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(eventDocuments.id, id))
      .returning();
    if (!updated) throw new Error("Document not found");
    return updated;
  }

  async deleteEventDocument(id: number): Promise<void> {
    await db.delete(eventDocuments).where(eq(eventDocuments.id, id));
  }

  // Event Ticket Tiers
  async getEventTicketTiers(eventId: number): Promise<EventTicketTier[]> {
    return await db
      .select()
      .from(eventTicketTiers)
      .where(eq(eventTicketTiers.eventId, eventId))
      .orderBy(desc(eventTicketTiers.createdAt));
  }

  async createEventTicketTier(tier: InsertEventTicketTier): Promise<EventTicketTier> {
    const [created] = await db.insert(eventTicketTiers).values(tier).returning();
    return created;
  }

  async updateEventTicketTier(id: number, tier: Partial<InsertEventTicketTier>): Promise<EventTicketTier> {
    const [updated] = await db
      .update(eventTicketTiers)
      .set({ ...tier, updatedAt: new Date() })
      .where(eq(eventTicketTiers.id, id))
      .returning();
    if (!updated) throw new Error("Ticket tier not found");
    return updated;
  }

  async deleteEventTicketTier(id: number): Promise<void> {
    await db.delete(eventTicketTiers).where(eq(eventTicketTiers.id, id));
  }

  // Event Expenses
  async getEventExpenses(eventId: number): Promise<EventExpense[]> {
    return await db
      .select()
      .from(eventExpenses)
      .where(eq(eventExpenses.eventId, eventId))
      .orderBy(desc(eventExpenses.createdAt));
  }

  async createEventExpense(expense: InsertEventExpense): Promise<EventExpense> {
    const [created] = await db.insert(eventExpenses).values(expense).returning();
    return created;
  }

  async updateEventExpense(id: number, expense: Partial<InsertEventExpense>): Promise<EventExpense> {
    const [updated] = await db
      .update(eventExpenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(eventExpenses.id, id))
      .returning();
    if (!updated) throw new Error("Expense not found");
    return updated;
  }

  async deleteEventExpense(id: number): Promise<void> {
    await db.delete(eventExpenses).where(eq(eventExpenses.id, id));
  }

  // Event Notes
  async getEventNotes(eventId: number): Promise<EventNote[]> {
    return await db
      .select()
      .from(eventNotes)
      .where(eq(eventNotes.eventId, eventId))
      .orderBy(desc(eventNotes.createdAt));
  }

  async createEventNote(note: InsertEventNote): Promise<EventNote> {
    const [created] = await db.insert(eventNotes).values(note).returning();
    return created;
  }

  async updateEventNote(id: number, note: Partial<InsertEventNote>): Promise<EventNote> {
    const [updated] = await db
      .update(eventNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(eventNotes.id, id))
      .returning();
    if (!updated) throw new Error("Note not found");
    return updated;
  }

  async deleteEventNote(id: number): Promise<void> {
    await db.delete(eventNotes).where(eq(eventNotes.id, id));
  }

  // Event Checklists
  async getEventChecklists(eventId: number): Promise<EventChecklist[]> {
    return await db
      .select()
      .from(eventChecklists)
      .where(eq(eventChecklists.eventId, eventId))
      .orderBy(desc(eventChecklists.createdAt));
  }

  async createEventChecklist(checklist: InsertEventChecklist): Promise<EventChecklist> {
    const [created] = await db.insert(eventChecklists).values(checklist).returning();
    return created;
  }

  async updateEventChecklist(id: number, checklist: Partial<InsertEventChecklist>): Promise<EventChecklist> {
    const [updated] = await db
      .update(eventChecklists)
      .set({ ...checklist, updatedAt: new Date() })
      .where(eq(eventChecklists.id, id))
      .returning();
    if (!updated) throw new Error("Checklist item not found");
    return updated;
  }

  async deleteEventChecklist(id: number): Promise<void> {
    await db.delete(eventChecklists).where(eq(eventChecklists.id, id));
  }

  // Tour Merch Bundle operations
  async getTourMerchBundles(): Promise<TourMerchBundle[]> {
    return await db
      .select()
      .from(tourMerchBundles)
      .orderBy(desc(tourMerchBundles.createdAt));
  }

  async getTourMerchBundle(id: number): Promise<TourMerchBundle | undefined> {
    const [bundle] = await db
      .select()
      .from(tourMerchBundles)
      .where(eq(tourMerchBundles.id, id));
    return bundle;
  }

  async getTourMerchBundlesByEvent(eventId: number): Promise<TourMerchBundle[]> {
    return await db
      .select()
      .from(tourMerchBundles)
      .where(eq(tourMerchBundles.eventId, eventId))
      .orderBy(desc(tourMerchBundles.createdAt));
  }

  async createTourMerchBundle(bundle: InsertTourMerchBundle): Promise<TourMerchBundle> {
    const [created] = await db.insert(tourMerchBundles).values(bundle).returning();
    return created;
  }

  async updateTourMerchBundle(id: number, bundle: Partial<InsertTourMerchBundle>): Promise<TourMerchBundle> {
    const [updated] = await db
      .update(tourMerchBundles)
      .set({ ...bundle, updatedAt: new Date() })
      .where(eq(tourMerchBundles.id, id))
      .returning();
    if (!updated) {
      throw new Error(`Tour merch bundle with id ${id} not found`);
    }
    return updated;
  }

  async deleteTourMerchBundle(id: number): Promise<void> {
    await db.delete(tourMerchBundles).where(eq(tourMerchBundles.id, id));
  }

  // Task management operations
  async getTasks(filters?: { userId?: string; pageKey?: string; status?: string }): Promise<(Task & { assignedTo?: User; createdBy?: User })[]> {
    let query = db
      .select({
        task: tasks,
        assignedTo: users,
        createdBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToUserId, users.id))
      .$dynamic();

    if (filters?.userId) {
      query = query.where(
        or(
          eq(tasks.assignedToUserId, filters.userId),
          eq(tasks.createdByUserId, filters.userId)
        )
      );
    }

    if (filters?.pageKey) {
      query = query.where(eq(tasks.pageKey, filters.pageKey));
    }

    if (filters?.status) {
      query = query.where(eq(tasks.status, filters.status as "pending" | "in_progress" | "completed" | "cancelled"));
    }

    const results = await query.orderBy(desc(tasks.createdAt));

    // Get creator info separately to avoid conflicts
    const tasksWithCreators = await Promise.all(
      (results as any[]).map(async (result: any) => {
        const [creator] = await db.select().from(users).where(eq(users.id, result.task.createdByUserId));
        return {
          ...result.task,
          assignedTo: result.assignedTo,
          createdBy: creator
        };
      })
    );

    return tasksWithCreators as any;
  }

  async getTask(id: number): Promise<(Task & { assignedTo?: User; createdBy?: User }) | undefined> {
    const [result] = await db
      .select({
        task: tasks,
        assignedTo: users
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedToUserId, users.id))
      .where(eq(tasks.id, id));

    if (!result) return undefined;

    const [creator] = await db.select().from(users).where(eq(users.id, result.task.createdByUserId));

    return {
      ...result.task,
      assignedTo: result.assignedTo || undefined,
      createdBy: creator
    } as any;
  }

  async createTask(task: InsertTask): Promise<Task> {
    if (!(task as any).createdByUserId) {
      throw new Error('createdByUserId is required for task creation');
    }
    const [created] = await db.insert(tasks).values(task as any).returning();
    return created;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    const updateData: any = { ...task, updatedAt: new Date() };

    // If marking as completed, set completedAt
    if (task.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Task with id ${id} not found`);
    }

    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByUser(userId: string): Promise<(Task & { assignedTo?: User; createdBy?: User })[]> {
    return this.getTasks({ userId });
  }

  async getTasksByPage(pageKey: string): Promise<(Task & { assignedTo?: User; createdBy?: User })[]> {
    return this.getTasks({ pageKey });
  }

  // Communication log operations
  async getCommunicationLogs(leadId?: number): Promise<CommunicationLog[]> {
    if (leadId) {
      return db.select().from(communicationLogs).where(eq(communicationLogs.leadId, leadId)).orderBy(desc(communicationLogs.createdAt));
    }
    return db.select().from(communicationLogs).orderBy(desc(communicationLogs.createdAt));
  }

  async getCommunicationLogsByUser(userId: string): Promise<CommunicationLog[]> {
    return db.select().from(communicationLogs).where(eq(communicationLogs.userId, userId)).orderBy(desc(communicationLogs.createdAt));
  }

  async createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog> {
    const [created] = await db.insert(communicationLogs).values(log).returning();
    return created;
  }

  // User permission operations
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async getUserPermissionForResource(userId: string, resourceId: number): Promise<UserPermission | undefined> {
    const [permission] = await db
      .select()
      .from(userPermissions)
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.resourceId, resourceId)));
    return permission;
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [created] = await db.insert(userPermissions).values(permission).returning();
    return created;
  }

  async updateUserPermission(id: number, permission: Partial<InsertUserPermission>): Promise<UserPermission> {
    const [updated] = await db
      .update(userPermissions)
      .set({ ...permission, updatedAt: new Date() })
      .where(eq(userPermissions.id, id))
      .returning();
    if (!updated) throw new Error(`UserPermission with id ${id} not found`);
    return updated;
  }

  async deleteUserPermission(id: number): Promise<void> {
    await db.delete(userPermissions).where(eq(userPermissions.id, id));
  }

  // Design portfolio operations
  async getDesignPortfolios(designerId?: string): Promise<DesignPortfolio[]> {
    if (designerId) {
      return db
        .select()
        .from(designPortfolios)
        .where(and(eq(designPortfolios.designerId, designerId), eq(designPortfolios.archived, false)))
        .orderBy(desc(designPortfolios.completedDate));
    }
    return db
      .select()
      .from(designPortfolios)
      .where(eq(designPortfolios.archived, false))
      .orderBy(desc(designPortfolios.completedDate));
  }

  async getDesignPortfolio(id: number): Promise<DesignPortfolio | undefined> {
    const [portfolio] = await db.select().from(designPortfolios).where(eq(designPortfolios.id, id));
    return portfolio;
  }

  async createDesignPortfolio(portfolio: InsertDesignPortfolio): Promise<DesignPortfolio> {
    const [created] = await db.insert(designPortfolios).values(portfolio).returning();
    return created;
  }

  async updateDesignPortfolio(id: number, portfolio: Partial<InsertDesignPortfolio>): Promise<DesignPortfolio> {
    const [updated] = await db
      .update(designPortfolios)
      .set({ ...portfolio, updatedAt: new Date() })
      .where(eq(designPortfolios.id, id))
      .returning();
    if (!updated) throw new Error(`DesignPortfolio with id ${id} not found`);
    return updated;
  }

  async deleteDesignPortfolio(id: number): Promise<void> {
    await db.delete(designPortfolios).where(eq(designPortfolios.id, id));
  }

  // Variant specification operations
  async getVariantSpecifications(variantId?: number): Promise<VariantSpecification[]> {
    if (variantId) {
      return db.select().from(variantSpecifications).where(eq(variantSpecifications.variantId, variantId));
    }
    return db.select().from(variantSpecifications);
  }

  async getVariantSpecification(id: number): Promise<VariantSpecification | undefined> {
    const [spec] = await db.select().from(variantSpecifications).where(eq(variantSpecifications.id, id));
    return spec;
  }

  async createVariantSpecification(spec: InsertVariantSpecification): Promise<VariantSpecification> {
    const [created] = await db.insert(variantSpecifications).values(spec).returning();
    return created;
  }

  async updateVariantSpecification(id: number, spec: Partial<InsertVariantSpecification>): Promise<VariantSpecification> {
    const [updated] = await db
      .update(variantSpecifications)
      .set({ ...spec, updatedAt: new Date() })
      .where(eq(variantSpecifications.id, id))
      .returning();
    if (!updated) throw new Error(`VariantSpecification with id ${id} not found`);
    return updated;
  }

  async deleteVariantSpecification(id: number): Promise<void> {
    await db.delete(variantSpecifications).where(eq(variantSpecifications.id, id));
  }

  // Sales Resources operations
  async getSalesResources(): Promise<SalesResource[]> {
    return db.select().from(salesResources).orderBy(desc(salesResources.createdAt));
  }

  async getSalesResource(id: number): Promise<SalesResource | undefined> {
    const [resource] = await db.select().from(salesResources).where(eq(salesResources.id, id));
    return resource;
  }

  async createSalesResource(resource: InsertSalesResource): Promise<SalesResource> {
    const [created] = await db.insert(salesResources).values(resource).returning();
    return created;
  }

  async updateSalesResource(id: number, resource: Partial<InsertSalesResource>): Promise<SalesResource> {
    const [updated] = await db
      .update(salesResources)
      .set({ ...resource, updatedAt: new Date() })
      .where(eq(salesResources.id, id))
      .returning();
    if (!updated) throw new Error(`SalesResource with id ${id} not found`);
    return updated;
  }

  async deleteSalesResource(id: number): Promise<void> {
    await db.delete(salesResources).where(eq(salesResources.id, id));
  }

  async incrementResourceDownloads(id: number): Promise<void> {
    await db
      .update(salesResources)
      .set({ downloads: sql`${salesResources.downloads} + 1` })
      .where(eq(salesResources.id, id));
  }

  // Lead archiving operations
  async archiveLead(id: number, userId: string): Promise<Lead> {
    const [archived] = await db
      .update(leads)
      .set({ archived: true, archivedAt: new Date(), archivedBy: userId, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    if (!archived) throw new Error(`Lead with id ${id} not found`);
    return archived;
  }

  async getArchivedLeads(userId?: string): Promise<Lead[]> {
    if (userId) {
      return db.select().from(leads).where(and(eq(leads.archived, true), eq(leads.ownerUserId, userId))).orderBy(desc(leads.archivedAt));
    }
    return db.select().from(leads).where(eq(leads.archived, true)).orderBy(desc(leads.archivedAt));
  }

  // Category archiving operations
  async archiveCategory(id: number, userId: string): Promise<Category> {
    const [archived] = await db
      .update(categories)
      .set({ archived: true, archivedAt: new Date(), archivedBy: userId, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    if (!archived) throw new Error(`Category with id ${id} not found`);
    return archived;
  }

  async unarchiveCategory(id: number): Promise<Category> {
    const [unarchived] = await db
      .update(categories)
      .set({ archived: false, archivedAt: null, archivedBy: null, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    if (!unarchived) throw new Error(`Category with id ${id} not found`);
    return unarchived;
  }

  async getArchivedCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.archived, true)).orderBy(desc(categories.archivedAt));
  }

  // Product archiving operations
  async archiveProduct(id: number, userId: string): Promise<Product> {
    const [archived] = await db
      .update(products)
      .set({ archived: true, archivedAt: new Date(), archivedBy: userId, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (!archived) throw new Error(`Product with id ${id} not found`);
    return archived;
  }

  async unarchiveProduct(id: number): Promise<Product> {
    const [unarchived] = await db
      .update(products)
      .set({ archived: false, archivedAt: null, archivedBy: null, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    if (!unarchived) throw new Error(`Product with id ${id} not found`);
    return unarchived;
  }

  async getArchivedProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.archived, true)).orderBy(desc(products.archivedAt));
  }

  // Product variant archiving operations
  async archiveProductVariant(id: number, userId: string): Promise<ProductVariant> {
    const [archived] = await db
      .update(productVariants)
      .set({ archived: true, archivedAt: new Date(), archivedBy: userId, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    if (!archived) throw new Error(`Product variant with id ${id} not found`);
    return archived;
  }

  async unarchiveProductVariant(id: number): Promise<ProductVariant> {
    const [unarchived] = await db
      .update(productVariants)
      .set({ archived: false, archivedAt: null, archivedBy: null, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    if (!unarchived) throw new Error(`Product variant with id ${id} not found`);
    return unarchived;
  }

  async getArchivedProductVariants(): Promise<ProductVariant[]> {
    return db.select().from(productVariants).where(eq(productVariants.archived, true)).orderBy(desc(productVariants.archivedAt));
  }

  // Fabric Management operations
  async getFabrics(approvedOnly: boolean = false): Promise<Fabric[]> {
    if (approvedOnly) {
      return db.select().from(fabrics).where(eq(fabrics.isApproved, true)).orderBy(desc(fabrics.createdAt));
    }
    return db.select().from(fabrics).orderBy(desc(fabrics.createdAt));
  }

  async getFabric(id: number): Promise<Fabric | undefined> {
    const [fabric] = await db.select().from(fabrics).where(eq(fabrics.id, id));
    return fabric;
  }

  async createFabric(fabric: InsertFabric): Promise<Fabric> {
    const [created] = await db.insert(fabrics).values(fabric as any).returning();
    return created;
  }

  async updateFabric(id: number, fabric: Partial<InsertFabric>): Promise<Fabric> {
    const [updated] = await db
      .update(fabrics)
      .set({ ...fabric, updatedAt: new Date() })
      .where(eq(fabrics.id, id))
      .returning();
    if (!updated) throw new Error(`Fabric with id ${id} not found`);
    return updated;
  }

  async deleteFabric(id: number): Promise<void> {
    await db.delete(fabrics).where(eq(fabrics.id, id));
  }

  async approveFabric(id: number, userId: string): Promise<Fabric> {
    const [approved] = await db
      .update(fabrics)
      .set({ isApproved: true, approvedBy: userId, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(fabrics.id, id))
      .returning();
    if (!approved) throw new Error(`Fabric with id ${id} not found`);
    return approved;
  }

  // Product Variant Fabric operations
  async getProductVariantFabrics(variantId: number): Promise<(ProductVariantFabric & { fabric?: Fabric })[]> {
    const assignments = await db
      .select({
        id: productVariantFabrics.id,
        variantId: productVariantFabrics.variantId,
        fabricId: productVariantFabrics.fabricId,
        assignedAt: productVariantFabrics.assignedAt,
        assignedBy: productVariantFabrics.assignedBy,
        fabric: fabrics,
      })
      .from(productVariantFabrics)
      .leftJoin(fabrics, eq(productVariantFabrics.fabricId, fabrics.id))
      .where(eq(productVariantFabrics.variantId, variantId));

    return assignments.map(a => ({
      id: a.id,
      variantId: a.variantId,
      fabricId: a.fabricId,
      assignedAt: a.assignedAt,
      assignedBy: a.assignedBy,
      fabric: a.fabric || undefined,
    }));
  }

  async assignFabricToVariant(assignment: InsertProductVariantFabric): Promise<ProductVariantFabric> {
    const [created] = await db.insert(productVariantFabrics).values(assignment as any).returning();
    return created;
  }

  async removeFabricFromVariant(id: number): Promise<void> {
    await db.delete(productVariantFabrics).where(eq(productVariantFabrics.id, id));
  }

  // Fabric Submission operations
  async getFabricSubmissions(filters?: { manufacturingId?: number; lineItemId?: number; status?: string }): Promise<(FabricSubmission & { submitter?: User; reviewer?: User })[]> {
    const submitter = db.select().from(users).as('submitter');
    const reviewer = db.select().from(users).as('reviewer');

    let query = db
      .select({
        submission: fabricSubmissions,
        submitter: users,
      })
      .from(fabricSubmissions)
      .leftJoin(users, eq(fabricSubmissions.submittedBy, users.id))
      .$dynamic();

    const conditions: any[] = [];
    if (filters?.manufacturingId) {
      conditions.push(eq(fabricSubmissions.manufacturingId, filters.manufacturingId));
    }
    if (filters?.lineItemId) {
      conditions.push(eq(fabricSubmissions.lineItemId, filters.lineItemId));
    }
    if (filters?.status) {
      conditions.push(eq(fabricSubmissions.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(fabricSubmissions.createdAt));

    return results.map(r => ({
      ...r.submission,
      submitter: r.submitter || undefined,
    }));
  }

  async getFabricSubmission(id: number): Promise<(FabricSubmission & { submitter?: User; reviewer?: User }) | undefined> {
    const [result] = await db
      .select({
        submission: fabricSubmissions,
        submitter: users,
      })
      .from(fabricSubmissions)
      .leftJoin(users, eq(fabricSubmissions.submittedBy, users.id))
      .where(eq(fabricSubmissions.id, id));

    if (!result) return undefined;

    return {
      ...result.submission,
      submitter: result.submitter || undefined,
    };
  }

  async createFabricSubmission(submission: InsertFabricSubmission): Promise<FabricSubmission> {
    const [created] = await db.insert(fabricSubmissions).values(submission as any).returning();
    return created;
  }

  async reviewFabricSubmission(id: number, reviewerId: string, status: "approved" | "rejected", reviewNotes?: string): Promise<FabricSubmission> {
    const submission = await this.getFabricSubmission(id);
    if (!submission) throw new Error(`Fabric submission with id ${id} not found`);

    let createdFabricId: number | null = null;

    // If approved, create a new fabric from the submission
    if (status === "approved") {
      const newFabric = await this.createFabric({
        name: submission.fabricName,
        gsm: submission.gsm,
        blend: submission.blend,
        vendorName: submission.vendorName,
        vendorLocation: submission.vendorLocation,
        vendorCountry: submission.vendorCountry,
        fabricType: submission.fabricType,
        weight: submission.weight,
        stretchType: submission.stretchType,
        notes: submission.notes,
        isApproved: true,
        approvedBy: reviewerId,
        createdBy: submission.submittedBy,
      });
      createdFabricId = newFabric.id;
    }

    const [updated] = await db
      .update(fabricSubmissions)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
        createdFabricId,
        updatedAt: new Date(),
      })
      .where(eq(fabricSubmissions.id, id))
      .returning();

    return updated;
  }

  // Pantone Assignment operations
  async getPantoneAssignments(filters?: { lineItemId?: number; manufacturingUpdateId?: number; orderId?: number }): Promise<PantoneAssignment[]> {
    // If filtering by orderId, we need to join with order_line_items to get pantones for that order
    if (filters?.orderId) {
      const results = await db
        .select({ pantone: pantoneAssignments })
        .from(pantoneAssignments)
        .innerJoin(orderLineItems, eq(pantoneAssignments.lineItemId, orderLineItems.id))
        .where(eq(orderLineItems.orderId, filters.orderId))
        .orderBy(desc(pantoneAssignments.createdAt));
      return results.map(r => r.pantone);
    }

    let query = db.select().from(pantoneAssignments).$dynamic();

    const conditions: any[] = [];
    if (filters?.lineItemId) {
      conditions.push(eq(pantoneAssignments.lineItemId, filters.lineItemId));
    }
    if (filters?.manufacturingUpdateId) {
      conditions.push(eq(pantoneAssignments.manufacturingUpdateId, filters.manufacturingUpdateId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query.orderBy(desc(pantoneAssignments.createdAt));
  }

  async getPantoneAssignment(id: number): Promise<PantoneAssignment | undefined> {
    const [assignment] = await db.select().from(pantoneAssignments).where(eq(pantoneAssignments.id, id));
    return assignment;
  }

  async createPantoneAssignment(assignment: InsertPantoneAssignment): Promise<PantoneAssignment> {
    const [created] = await db.insert(pantoneAssignments).values(assignment as any).returning();
    return created;
  }

  async updatePantoneAssignment(id: number, assignment: Partial<InsertPantoneAssignment>): Promise<PantoneAssignment> {
    const [updated] = await db
      .update(pantoneAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(pantoneAssignments.id, id))
      .returning();
    if (!updated) throw new Error(`Pantone assignment with id ${id} not found`);
    return updated;
  }

  async deletePantoneAssignment(id: number): Promise<void> {
    await db.delete(pantoneAssignments).where(eq(pantoneAssignments.id, id));
  }

  // ==================== MANUFACTURER PORTAL OPERATIONS ====================

  async getManufacturerJobs(manufacturerId?: number): Promise<(ManufacturerJob & { manufacturing?: Manufacturing; order?: Order; manufacturer?: Manufacturer })[]> {
    let query = db
      .select({
        job: manufacturerJobs,
        manufacturing: manufacturing,
        order: orders,
        manufacturer: manufacturers,
      })
      .from(manufacturerJobs)
      .leftJoin(manufacturing, eq(manufacturerJobs.manufacturingId, manufacturing.id))
      .leftJoin(orders, eq(manufacturerJobs.orderId, orders.id))
      .leftJoin(manufacturers, eq(manufacturerJobs.manufacturerId, manufacturers.id))
      .orderBy(desc(manufacturerJobs.createdAt));

    if (manufacturerId) {
      query = query.where(eq(manufacturerJobs.manufacturerId, manufacturerId)) as any;
    }

    const results = await query;
    return results.map(r => ({
      ...r.job,
      manufacturing: r.manufacturing || undefined,
      order: r.order || undefined,
      manufacturer: r.manufacturer || undefined,
    }));
  }

  async getManufacturerJob(id: number): Promise<(ManufacturerJob & { manufacturing?: Manufacturing; order?: Order; manufacturer?: Manufacturer; events?: ManufacturerEvent[] }) | undefined> {
    const [result] = await db
      .select({
        job: manufacturerJobs,
        manufacturing: manufacturing,
        order: orders,
        manufacturer: manufacturers,
      })
      .from(manufacturerJobs)
      .leftJoin(manufacturing, eq(manufacturerJobs.manufacturingId, manufacturing.id))
      .leftJoin(orders, eq(manufacturerJobs.orderId, orders.id))
      .leftJoin(manufacturers, eq(manufacturerJobs.manufacturerId, manufacturers.id))
      .where(eq(manufacturerJobs.id, id));

    if (!result) return undefined;

    const events = await this.getManufacturerEvents(id);

    return {
      ...result.job,
      manufacturing: result.manufacturing || undefined,
      order: result.order || undefined,
      manufacturer: result.manufacturer || undefined,
      events,
    };
  }

  async getManufacturerJobByManufacturingId(manufacturingId: number): Promise<ManufacturerJob | undefined> {
    const [job] = await db
      .select()
      .from(manufacturerJobs)
      .where(eq(manufacturerJobs.manufacturingId, manufacturingId));
    return job;
  }

  async createManufacturerJob(job: InsertManufacturerJob): Promise<ManufacturerJob> {
    const [created] = await db.insert(manufacturerJobs).values(job as any).returning();
    return created;
  }

  async updateManufacturerJob(id: number, job: Partial<InsertManufacturerJob>): Promise<ManufacturerJob> {
    const [updated] = await db
      .update(manufacturerJobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(manufacturerJobs.id, id))
      .returning();
    if (!updated) throw new Error(`Manufacturer job with id ${id} not found`);
    return updated;
  }

  async deleteManufacturerJob(id: number): Promise<void> {
    await db.delete(manufacturerJobs).where(eq(manufacturerJobs.id, id));
  }

  async getManufacturerEvents(jobId: number): Promise<(ManufacturerEvent & { createdByUser?: User })[]> {
    const results = await db
      .select({
        event: manufacturerEvents,
        createdByUser: users,
      })
      .from(manufacturerEvents)
      .leftJoin(users, eq(manufacturerEvents.createdBy, users.id))
      .where(eq(manufacturerEvents.manufacturerJobId, jobId))
      .orderBy(desc(manufacturerEvents.createdAt));

    return results.map(r => ({
      ...r.event,
      createdByUser: r.createdByUser || undefined,
    }));
  }

  async createManufacturerEvent(event: InsertManufacturerEvent): Promise<ManufacturerEvent> {
    const [created] = await db.insert(manufacturerEvents).values(event as any).returning();
    return created;
  }

  // ==================== PRINTFUL SYNC RECORD OPERATIONS ====================

  async getPrintfulSyncRecords(orderId?: number): Promise<PrintfulSyncRecord[]> {
    if (orderId) {
      return await db
        .select()
        .from(printfulSyncRecords)
        .where(eq(printfulSyncRecords.orderId, orderId))
        .orderBy(desc(printfulSyncRecords.createdAt));
    }
    return await db
      .select()
      .from(printfulSyncRecords)
      .orderBy(desc(printfulSyncRecords.createdAt));
  }

  async getPrintfulSyncRecord(id: number): Promise<PrintfulSyncRecord | undefined> {
    const [record] = await db
      .select()
      .from(printfulSyncRecords)
      .where(eq(printfulSyncRecords.id, id));
    return record;
  }

  async getPrintfulSyncRecordByOrderId(orderId: number): Promise<PrintfulSyncRecord | undefined> {
    const [record] = await db
      .select()
      .from(printfulSyncRecords)
      .where(eq(printfulSyncRecords.orderId, orderId))
      .orderBy(desc(printfulSyncRecords.createdAt))
      .limit(1);
    return record;
  }

  async createPrintfulSyncRecord(record: InsertPrintfulSyncRecord): Promise<PrintfulSyncRecord> {
    const [created] = await db.insert(printfulSyncRecords).values(record as any).returning();
    return created;
  }

  async updatePrintfulSyncRecord(id: number, record: Partial<InsertPrintfulSyncRecord>): Promise<PrintfulSyncRecord> {
    const [updated] = await db
      .update(printfulSyncRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(eq(printfulSyncRecords.id, id))
      .returning();
    if (!updated) throw new Error(`Printful sync record with id ${id} not found`);
    return updated;
  }

  // Manufacturing Note Category operations
  async getManufacturingNoteCategories(): Promise<ManufacturingNoteCategory[]> {
    return await db
      .select()
      .from(manufacturingNoteCategories)
      .where(eq(manufacturingNoteCategories.isActive, true))
      .orderBy(asc(manufacturingNoteCategories.sortOrder), asc(manufacturingNoteCategories.name));
  }

  async getManufacturingNoteCategory(id: number): Promise<ManufacturingNoteCategory | undefined> {
    const [category] = await db
      .select()
      .from(manufacturingNoteCategories)
      .where(eq(manufacturingNoteCategories.id, id));
    return category;
  }

  async createManufacturingNoteCategory(category: InsertManufacturingNoteCategory): Promise<ManufacturingNoteCategory> {
    const [created] = await db
      .insert(manufacturingNoteCategories)
      .values(category as any)
      .returning();
    return created;
  }

  async updateManufacturingNoteCategory(id: number, category: Partial<InsertManufacturingNoteCategory>): Promise<ManufacturingNoteCategory> {
    const [updated] = await db
      .update(manufacturingNoteCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(manufacturingNoteCategories.id, id))
      .returning();
    if (!updated) throw new Error(`Manufacturing note category with id ${id} not found`);
    return updated;
  }

  async deleteManufacturingNoteCategory(id: number): Promise<void> {
    await db
      .update(manufacturingNoteCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(manufacturingNoteCategories.id, id));
  }

  // ==================== DESIGN LAB OPERATIONS ====================

  // Design Projects
  async getDesignProjects(userId?: string): Promise<DesignProject[]> {
    if (userId) {
      return await db
        .select()
        .from(designProjects)
        .where(eq(designProjects.userId, userId))
        .orderBy(desc(designProjects.createdAt));
    }
    return await db
      .select()
      .from(designProjects)
      .orderBy(desc(designProjects.createdAt));
  }

  async getDesignProject(id: number): Promise<DesignProject | undefined> {
    const [project] = await db
      .select()
      .from(designProjects)
      .where(eq(designProjects.id, id));
    return project;
  }

  async createDesignProject(data: InsertDesignProject): Promise<DesignProject> {
    const projectCode = `DL-${Date.now()}`;
    const [created] = await db
      .insert(designProjects)
      .values({ ...data, projectCode } as any)
      .returning();
    return created;
  }

  async updateDesignProject(id: number, data: Partial<InsertDesignProject>): Promise<DesignProject | undefined> {
    const [updated] = await db
      .update(designProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designProjects.id, id))
      .returning();
    return updated;
  }

  // Design Versions
  async getDesignVersions(projectId: number): Promise<DesignVersion[]> {
    return await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.projectId, projectId))
      .orderBy(desc(designVersions.versionNumber));
  }

  async getDesignVersion(id: number): Promise<DesignVersion | undefined> {
    const [version] = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.id, id));
    return version;
  }

  async createDesignVersion(data: InsertDesignVersion): Promise<DesignVersion> {
    const [created] = await db
      .insert(designVersions)
      .values(data as any)
      .returning();
    return created;
  }

  async updateDesignVersion(id: number, data: Partial<InsertDesignVersion>): Promise<DesignVersion | undefined> {
    const [updated] = await db
      .update(designVersions)
      .set(data)
      .where(eq(designVersions.id, id))
      .returning();
    return updated;
  }

  // Design Layers
  async getDesignLayers(versionId: number): Promise<DesignLayer[]> {
    return await db
      .select()
      .from(designLayers)
      .where(eq(designLayers.versionId, versionId))
      .orderBy(asc(designLayers.zIndex));
  }

  async getDesignLayer(id: number): Promise<DesignLayer | undefined> {
    const [layer] = await db
      .select()
      .from(designLayers)
      .where(eq(designLayers.id, id));
    return layer;
  }

  async createDesignLayer(data: InsertDesignLayer): Promise<DesignLayer> {
    const [created] = await db
      .insert(designLayers)
      .values(data as any)
      .returning();
    return created;
  }

  async updateDesignLayer(id: number, data: Partial<InsertDesignLayer>): Promise<DesignLayer | undefined> {
    const [updated] = await db
      .update(designLayers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designLayers.id, id))
      .returning();
    return updated;
  }

  async deleteDesignLayer(id: number): Promise<boolean> {
    const result = await db
      .delete(designLayers)
      .where(eq(designLayers.id, id));
    return true;
  }

  // Design Templates
  async getDesignTemplates(variantId?: number): Promise<DesignTemplate[]> {
    if (variantId) {
      return await db
        .select()
        .from(designTemplates)
        .where(and(eq(designTemplates.variantId, variantId), eq(designTemplates.isActive, true)))
        .orderBy(desc(designTemplates.createdAt));
    }
    return await db
      .select()
      .from(designTemplates)
      .where(eq(designTemplates.isActive, true))
      .orderBy(desc(designTemplates.createdAt));
  }

  async getDesignTemplate(id: number): Promise<DesignTemplate | undefined> {
    const [template] = await db
      .select()
      .from(designTemplates)
      .where(eq(designTemplates.id, id));
    return template;
  }

  async createDesignTemplate(data: InsertDesignTemplate): Promise<DesignTemplate> {
    const [created] = await db
      .insert(designTemplates)
      .values(data as any)
      .returning();
    return created;
  }

  async updateDesignTemplate(id: number, data: Partial<InsertDesignTemplate>): Promise<DesignTemplate | undefined> {
    const [updated] = await db
      .update(designTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designTemplates.id, id))
      .returning();
    return updated;
  }

  // Design Locked Overlays
  async getDesignLockedOverlays(variantId?: number): Promise<DesignLockedOverlay[]> {
    if (variantId) {
      return await db
        .select()
        .from(designLockedOverlays)
        .where(and(eq(designLockedOverlays.variantId, variantId), eq(designLockedOverlays.isActive, true)))
        .orderBy(asc(designLockedOverlays.zIndex));
    }
    return await db
      .select()
      .from(designLockedOverlays)
      .where(eq(designLockedOverlays.isActive, true))
      .orderBy(asc(designLockedOverlays.zIndex));
  }

  async getDesignLockedOverlay(id: number): Promise<DesignLockedOverlay | undefined> {
    const [overlay] = await db
      .select()
      .from(designLockedOverlays)
      .where(eq(designLockedOverlays.id, id));
    return overlay;
  }

  async createDesignLockedOverlay(data: InsertDesignLockedOverlay): Promise<DesignLockedOverlay> {
    const [created] = await db
      .insert(designLockedOverlays)
      .values(data as any)
      .returning();
    return created;
  }

  async updateDesignLockedOverlay(id: number, data: Partial<InsertDesignLockedOverlay>): Promise<DesignLockedOverlay | undefined> {
    const [updated] = await db
      .update(designLockedOverlays)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designLockedOverlays.id, id))
      .returning();
    return updated;
  }

  // Design Generation Requests
  async getDesignGenerationRequest(id: number): Promise<DesignGenerationRequest | undefined> {
    const [request] = await db
      .select()
      .from(designGenerationRequests)
      .where(eq(designGenerationRequests.id, id));
    return request;
  }

  async getDesignGenerationRequestByCode(code: string): Promise<DesignGenerationRequest | undefined> {
    const [request] = await db
      .select()
      .from(designGenerationRequests)
      .where(eq(designGenerationRequests.requestCode, code));
    return request;
  }

  async createDesignGenerationRequest(data: InsertDesignGenerationRequest): Promise<DesignGenerationRequest> {
    const requestCode = `GEN-${Date.now()}`;
    const [created] = await db
      .insert(designGenerationRequests)
      .values({ ...data, requestCode } as any)
      .returning();
    return created;
  }

  async updateDesignGenerationRequest(id: number, data: Partial<InsertDesignGenerationRequest>): Promise<DesignGenerationRequest | undefined> {
    const [updated] = await db
      .update(designGenerationRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designGenerationRequests.id, id))
      .returning();
    return updated;
  }

  // ==================== DESIGN AI TRAINING OPERATIONS ====================

  // AI Training Sets
  async getDesignAiTrainingSets(): Promise<DesignAiTrainingSet[]> {
    return await db
      .select()
      .from(designAiTrainingSets)
      .where(eq(designAiTrainingSets.isActive, true))
      .orderBy(desc(designAiTrainingSets.createdAt));
  }

  async getDesignAiTrainingSet(id: number): Promise<DesignAiTrainingSet | undefined> {
    const [set] = await db
      .select()
      .from(designAiTrainingSets)
      .where(eq(designAiTrainingSets.id, id));
    return set;
  }

  async createDesignAiTrainingSet(data: InsertDesignAiTrainingSet): Promise<DesignAiTrainingSet> {
    const [created] = await db
      .insert(designAiTrainingSets)
      .values(data as any)
      .returning();
    return created;
  }

  async updateDesignAiTrainingSet(id: number, data: Partial<InsertDesignAiTrainingSet>): Promise<DesignAiTrainingSet | undefined> {
    const [updated] = await db
      .update(designAiTrainingSets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designAiTrainingSets.id, id))
      .returning();
    return updated;
  }

  async deleteDesignAiTrainingSet(id: number): Promise<boolean> {
    await db
      .update(designAiTrainingSets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(designAiTrainingSets.id, id));
    return true;
  }

  // AI Training Images
  async getDesignAiTrainingImages(trainingSetId: number): Promise<DesignAiTrainingImage[]> {
    return await db
      .select()
      .from(designAiTrainingImages)
      .where(eq(designAiTrainingImages.trainingSetId, trainingSetId))
      .orderBy(desc(designAiTrainingImages.createdAt));
  }

  async getDesignAiTrainingImage(id: number): Promise<DesignAiTrainingImage | undefined> {
    const [image] = await db
      .select()
      .from(designAiTrainingImages)
      .where(eq(designAiTrainingImages.id, id));
    return image;
  }

  async createDesignAiTrainingImage(data: InsertDesignAiTrainingImage): Promise<DesignAiTrainingImage> {
    const [created] = await db
      .insert(designAiTrainingImages)
      .values(data as any)
      .returning();
    
    // Update image count in training set
    await db
      .update(designAiTrainingSets)
      .set({ 
        imageCount: sql`image_count + 1`,
        updatedAt: new Date() 
      })
      .where(eq(designAiTrainingSets.id, data.trainingSetId));
    
    return created;
  }

  async deleteDesignAiTrainingImage(id: number): Promise<boolean> {
    const [image] = await db
      .select()
      .from(designAiTrainingImages)
      .where(eq(designAiTrainingImages.id, id));
    
    if (image) {
      await db
        .delete(designAiTrainingImages)
        .where(eq(designAiTrainingImages.id, id));
      
      // Update image count in training set
      await db
        .update(designAiTrainingSets)
        .set({ 
          imageCount: sql`GREATEST(image_count - 1, 0)`,
          updatedAt: new Date() 
        })
        .where(eq(designAiTrainingSets.id, image.trainingSetId));
    }
    return true;
  }

  // Style Presets
  async getDesignStylePresets(): Promise<DesignStylePreset[]> {
    return await db
      .select()
      .from(designStylePresets)
      .where(eq(designStylePresets.isActive, true))
      .orderBy(asc(designStylePresets.sortOrder), desc(designStylePresets.createdAt));
  }

  async getDesignStylePreset(id: number): Promise<DesignStylePreset | undefined> {
    const [preset] = await db
      .select()
      .from(designStylePresets)
      .where(eq(designStylePresets.id, id));
    return preset;
  }

  async createDesignStylePreset(data: InsertDesignStylePreset): Promise<DesignStylePreset> {
    const [created] = await db
      .insert(designStylePresets)
      .values(data as any)
      .returning();
    return created;
  }

  async updateDesignStylePreset(id: number, data: Partial<InsertDesignStylePreset>): Promise<DesignStylePreset | undefined> {
    const [updated] = await db
      .update(designStylePresets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designStylePresets.id, id))
      .returning();
    return updated;
  }

  async deleteDesignStylePreset(id: number): Promise<boolean> {
    await db
      .update(designStylePresets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(designStylePresets.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();