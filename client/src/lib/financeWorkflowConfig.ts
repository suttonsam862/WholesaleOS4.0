import { 
  BarChart3, 
  FileText, 
  CreditCard, 
  Users, 
  Link2, 
  Receipt,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock
} from "lucide-react";
import type { DomainWorkflowConfig, WorkflowTileConfig, WorkflowQueueConfig } from "./workflowConfig";

export const financeStages = [
  { id: "overview", label: "Overview", icon: BarChart3, color: "#3b82f6", route: "/finance/overview" },
  { id: "invoices", label: "Invoices", icon: FileText, color: "#8b5cf6", route: "/finance/invoices" },
  { id: "payments", label: "Payments", icon: CreditCard, color: "#22c55e", route: "/finance/payments" },
  { id: "commissions", label: "Commissions", icon: Users, color: "#a855f7", route: "/finance/commissions" },
  { id: "matching", label: "Matching", icon: Link2, color: "#f59e0b", route: "/finance/matching" },
  { id: "expenses", label: "Expenses", icon: Receipt, color: "#ef4444", route: "/finance/expenses" },
];

export const financeTiles: WorkflowTileConfig[] = [
  {
    id: "overview",
    title: "Financial Overview",
    description: "Revenue, expenses, and key metrics at a glance",
    icon: BarChart3,
    iconColor: "text-blue-400",
    bgGradient: "from-blue-500/10 to-blue-500/5",
    primaryAction: { label: "View Dashboard", href: "/finance/overview" },
    subActions: [
      { label: "Cash Flow", href: "/finance/overview?view=cashflow" },
      { label: "Trends", href: "/finance/overview?view=trends" },
    ],
    visibleToRoles: ["admin", "finance", "ops"],
  },
  {
    id: "invoices",
    title: "Invoices",
    description: "Create and manage customer invoices",
    icon: FileText,
    iconColor: "text-violet-400",
    bgGradient: "from-violet-500/10 to-violet-500/5",
    primaryAction: { label: "Manage Invoices", href: "/finance/invoices" },
    subActions: [
      { label: "Pending", href: "/finance/invoices?status=pending" },
      { label: "Overdue", href: "/finance/invoices?status=overdue" },
      { label: "Draft", href: "/finance/invoices?status=draft" },
    ],
    visibleToRoles: ["admin", "finance", "ops", "sales"],
  },
  {
    id: "payments",
    title: "Payments",
    description: "Track received payments against invoices",
    icon: CreditCard,
    iconColor: "text-emerald-400",
    bgGradient: "from-emerald-500/10 to-emerald-500/5",
    primaryAction: { label: "View Payments", href: "/finance/payments" },
    subActions: [
      { label: "Recent", href: "/finance/payments?filter=recent" },
      { label: "Record Payment", href: "/finance/payments?action=new" },
    ],
    visibleToRoles: ["admin", "finance", "ops"],
  },
  {
    id: "commissions",
    title: "Commissions",
    description: "Salesperson commission tracking and payouts",
    icon: Users,
    iconColor: "text-purple-400",
    bgGradient: "from-purple-500/10 to-purple-500/5",
    primaryAction: { label: "View Commissions", href: "/finance/commissions" },
    subActions: [
      { label: "Pending", href: "/finance/commissions?status=pending" },
      { label: "Paid", href: "/finance/commissions?status=paid" },
    ],
    visibleToRoles: ["admin", "finance"],
  },
  {
    id: "matching",
    title: "Financial Matching",
    description: "Match orders with invoices and payments",
    icon: Link2,
    iconColor: "text-amber-400",
    bgGradient: "from-amber-500/10 to-amber-500/5",
    primaryAction: { label: "Match Transactions", href: "/finance/matching" },
    subActions: [
      { label: "Unmatched", href: "/finance/matching?status=unmatched" },
      { label: "Partial", href: "/finance/matching?status=partial" },
    ],
    visibleToRoles: ["admin", "finance"],
  },
  {
    id: "expenses",
    title: "Expenses",
    description: "Track business expenses and refunds",
    icon: Receipt,
    iconColor: "text-red-400",
    bgGradient: "from-red-500/10 to-red-500/5",
    primaryAction: { label: "Manage Expenses", href: "/finance/expenses" },
    subActions: [
      { label: "Record Expense", href: "/finance/expenses?action=new" },
      { label: "Pending", href: "/finance/expenses?status=pending" },
    ],
    visibleToRoles: ["admin", "finance", "ops"],
  },
];

export const financeQueues: WorkflowQueueConfig[] = [
  {
    id: "overdue-invoices",
    title: "Overdue Invoices",
    description: "Invoices past due date",
    icon: AlertCircle,
    queryKey: ["/api/invoices"],
    filter: (invoices) => invoices.filter(inv => inv.status === "overdue"),
    columns: [
      { key: "invoiceNumber", label: "Invoice #", className: "font-medium text-white w-24" },
      { key: "organization.name", label: "Organization", className: "text-muted-foreground flex-1" },
      { 
        key: "totalAmount", 
        label: "Amount", 
        className: "text-red-400 font-medium w-24",
        render: (val) => `$${parseFloat(val || 0).toLocaleString()}`
      },
    ],
    rowAction: { href: (row) => `/finance/invoices?selected=${row.id}` },
    emptyState: { message: "No overdue invoices", icon: FileText },
    maxRows: 5,
    viewAllHref: "/finance/invoices?status=overdue",
    visibleToRoles: ["admin", "finance", "ops"],
  },
  {
    id: "pending-commissions",
    title: "Pending Commissions",
    description: "Awaiting payout",
    icon: Clock,
    queryKey: ["/api/commission-payments"],
    filter: (commissions) => commissions.filter(c => c.status === "pending"),
    columns: [
      { key: "salesperson.name", label: "Salesperson", className: "text-white flex-1" },
      { 
        key: "totalAmount", 
        label: "Amount", 
        className: "text-purple-400 font-medium w-24",
        render: (val) => `$${parseFloat(val || 0).toLocaleString()}`
      },
    ],
    rowAction: { href: "/finance/commissions" },
    emptyState: { message: "No pending commissions", icon: Users },
    maxRows: 5,
    viewAllHref: "/finance/commissions?status=pending",
    visibleToRoles: ["admin", "finance"],
  },
];

export const financeWorkflowConfig: DomainWorkflowConfig = {
  domain: "finance",
  title: "Finance",
  description: "Manage invoices, payments, commissions, and financial matching",
  hubRoute: "/finance",
  stages: financeStages,
  tiles: financeTiles,
  queues: financeQueues,
  roleDefaults: {
    admin: { defaultStage: "overview" },
    finance: { defaultStage: "overview" },
    ops: { defaultStage: "invoices" },
    sales: { defaultStage: "invoices" },
  },
};
