/**
 * V6 Components Index
 * Export all V6 components for easy importing
 */

// Status components
export {
  StatusBadgeV6,
  ORDER_STATUS_CONFIG,
  DESIGN_JOB_STATUS_CONFIG,
  MANUFACTURING_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  ORDER_STATUS_GROUPS,
  isValidOrderTransition,
  type OrderStatusV6,
  type DesignJobStatusV6,
  type ManufacturingStatusV6,
  type PaymentStatusV6,
} from "./StatusBadgeV6";

// Size grid components
export {
  SizeGrid,
  SizeDisplay,
  SizeTable,
  YOUTH_SIZES,
  ADULT_SIZES,
  ALL_STANDARD_SIZES,
  type SizeQuantities,
  type CustomSize,
  type StandardSize,
} from "./SizeGrid";

// Activity feed components
export {
  ActivityFeed,
  ActivityTimeline,
  type ActivityType,
} from "./ActivityFeed";

// File management components
export {
  FileSection,
  CompactFileList,
  type FileFolder,
} from "./FileSection";

// Validation components
export {
  ValidationPanel,
  ValidationBadge,
  type ValidationSeverity,
  type ValidationStatus,
} from "./ValidationPanel";

// Order modals
export { CreateOrderModalV6 } from "./CreateOrderModalV6";
export { LineItemModalV6 } from "./LineItemModalV6";
export { SizeSheetUpload } from "./SizeSheetUpload";

// Error handling components
export { ErrorBoundaryV6, InlineError, getErrorMessage } from "./ErrorBoundaryV6";

// Skeleton loaders
export {
  Skeleton,
  OrderListSkeleton,
  OrderDetailSkeleton,
  DashboardSkeleton,
  DesignJobListSkeleton,
  ManufacturingDashboardSkeleton,
  CardSkeleton,
  TableSkeleton,
} from "./SkeletonV6";

// Empty state components
export {
  EmptyState,
  EmptyOrderList,
  EmptyOrderSearch,
  EmptyDesignJobList,
  EmptyDesignQueue,
  EmptyManufacturingQueue,
  EmptyProductionQueue,
  EmptyLeadList,
  EmptyEventList,
  EmptyActivityFeed,
  EmptyFileSection,
  EmptyCommentSection,
  EmptyPaymentList,
  EmptyInvoiceList,
  EmptyDashboardQueue,
  EmptySearchResults,
  EmptyFilterResults,
  EmptySalesMetrics,
  InlineEmptyState,
} from "./EmptyStateV6";
