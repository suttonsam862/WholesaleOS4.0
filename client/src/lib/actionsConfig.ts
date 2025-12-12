import { LucideIcon, FileText, Users, TrendingUp, MessageSquare, ListChecks, ClipboardList, Send, Package, Palette, ShoppingCart, UserPlus, GitMerge, CheckSquare, Mail, Download, Calendar, AlertTriangle, Archive, Sparkles, BarChart3, BookOpen, Phone, Zap, Image, Store, Wand2, Truck, Music, Building, PenTool, Settings, Eye, Layers, QrCode, DollarSign, FileCheck, Printer, Box, Tags, Upload } from "lucide-react";

export type ActionStepType = "pick" | "choose" | "preview" | "confirm" | "done";

export interface ActionStep {
  id: string;
  type: ActionStepType;
  title: string;
  description?: string;
}

export interface ActionConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  pinned: boolean;
  requiresAI?: boolean;
  aiActionId?: string;
  isComingSoon?: boolean;
  steps: ActionStep[];
  requires?: string[];
}

export interface HubActionsConfig {
  hubId: string;
  hubTitle: string;
  fullPageRoute: string;
  actionsRoute: string;
  actions: ActionConfig[];
}

const defaultSteps: ActionStep[] = [
  { id: "pick", type: "pick", title: "Pick", description: "Select items to work with" },
  { id: "choose", type: "choose", title: "Choose", description: "Set your options" },
  { id: "preview", type: "preview", title: "Preview", description: "Review what will change" },
  { id: "confirm", type: "confirm", title: "Confirm", description: "Confirm and save" },
  { id: "done", type: "done", title: "Done", description: "View results" },
];

export const ordersActions: HubActionsConfig = {
  hubId: "orders",
  hubTitle: "Orders",
  fullPageRoute: "/orders/list",
  actionsRoute: "/orders/actions",
  actions: [
    {
      id: "add-pantones",
      title: "Add Pantones to Order",
      description: "Pick colors from images using the eyedropper tool",
      icon: Palette,
      pinned: true,
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select the order to add colors to" },
        { id: "choose", type: "choose", title: "Upload Image", description: "Upload an image to sample colors from" },
        { id: "preview", type: "preview", title: "Pick Colors", description: "Use eyedropper to select colors" },
        { id: "confirm", type: "confirm", title: "Assign", description: "Assign Pantones to line items" },
        { id: "done", type: "done", title: "Done", description: "Colors assigned successfully" },
      ],
    },
    {
      id: "quote-from-order",
      title: "Make Quote from Order",
      description: "Generate a quote draft from an existing order",
      icon: FileText,
      pinned: true,
      requiresAI: true,
      aiActionId: "O1",
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select the order to quote from" },
        { id: "choose", type: "choose", title: "Select Items", description: "Choose which items to include" },
        { id: "preview", type: "preview", title: "Preview Quote", description: "Review the draft quote" },
        { id: "confirm", type: "confirm", title: "Create Quote", description: "Create the quote draft" },
        { id: "done", type: "done", title: "Done", description: "Quote created successfully" },
      ],
    },
    {
      id: "send-customer-link",
      title: "Send Customer Info Link",
      description: "Request sizes, shipping, or billing from customer",
      icon: Send,
      pinned: true,
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select the order" },
        { id: "choose", type: "choose", title: "Choose Info", description: "What do you need from the customer?" },
        { id: "preview", type: "preview", title: "Preview Message", description: "Review the message" },
        { id: "confirm", type: "confirm", title: "Send", description: "Send to customer" },
        { id: "done", type: "done", title: "Done", description: "Link sent successfully" },
      ],
    },
    {
      id: "fix-missing-info",
      title: "Fix Missing Order Info",
      description: "Scan and fix incomplete order data",
      icon: AlertTriangle,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "push-to-printful",
      title: "Push to Printful",
      description: "Send order items to Printful for fulfillment",
      icon: Printer,
      pinned: true,
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select the order to push" },
        { id: "choose", type: "choose", title: "Select Items", description: "Choose items to send to Printful" },
        { id: "preview", type: "preview", title: "Preview", description: "Review Printful order details" },
        { id: "confirm", type: "confirm", title: "Push", description: "Create Printful order" },
        { id: "done", type: "done", title: "Done", description: "Order pushed to Printful" },
      ],
    },
    {
      id: "make-retail-product",
      title: "Make Retail Product",
      description: "Create a Shopify product from an order item",
      icon: ShoppingCart,
      pinned: false,
      isComingSoon: true,
      steps: defaultSteps,
    },
  ],
};

export const quotesActions: HubActionsConfig = {
  hubId: "quotes",
  hubTitle: "Quotes",
  fullPageRoute: "/quotes/list",
  actionsRoute: "/quotes/actions",
  actions: [
    {
      id: "quick-quote-generator",
      title: "Quick Quote Generator",
      description: "Auto-generate quotes with margin guardrails in 60 seconds",
      icon: Zap,
      pinned: true,
      requiresAI: true,
      steps: [
        { id: "pick", type: "pick", title: "Select Order", description: "Pick an existing order or start blank" },
        { id: "choose", type: "choose", title: "Configure", description: "Set margins and upsells" },
        { id: "preview", type: "preview", title: "Preview Quote", description: "Review generated quote with pricing" },
        { id: "confirm", type: "confirm", title: "Send Quote", description: "Generate PDF and send" },
        { id: "done", type: "done", title: "Done", description: "Quote sent, deposit link live" },
      ],
    },
    {
      id: "create-quote",
      title: "Create New Quote",
      description: "Start a new quote from scratch",
      icon: FileText,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "convert-to-order",
      title: "Convert to Order",
      description: "Turn an approved quote into an order",
      icon: ShoppingCart,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "send-quote",
      title: "Send Quote to Client",
      description: "Email the quote to the customer",
      icon: Send,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "duplicate-quote",
      title: "Duplicate Quote",
      description: "Create a copy of an existing quote",
      icon: ClipboardList,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "quote-followup",
      title: "Follow Up on Quote",
      description: "Send a follow-up message about a quote",
      icon: MessageSquare,
      pinned: false,
      steps: defaultSteps,
    },
  ],
};

export const manufacturingActions: HubActionsConfig = {
  hubId: "manufacturing",
  hubTitle: "Manufacturing",
  fullPageRoute: "/manufacturing/list",
  actionsRoute: "/manufacturing/actions",
  actions: [
    {
      id: "push-to-printful",
      title: "Push to Printful",
      description: "Send confirmed orders to Printful for POD fulfillment",
      icon: Printer,
      pinned: true,
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select order with approved designs" },
        { id: "choose", type: "choose", title: "Select Items", description: "Choose items for Printful" },
        { id: "preview", type: "preview", title: "Preview", description: "Review order split and details" },
        { id: "confirm", type: "confirm", title: "Push", description: "Create Printful order" },
        { id: "done", type: "done", title: "Done", description: "No manual entry needed!" },
      ],
    },
    {
      id: "add-pantones",
      title: "Add Pantones",
      description: "Assign Pantone colors from uploaded images",
      icon: Palette,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "update-tracking",
      title: "Update Tracking",
      description: "Add or sync tracking numbers",
      icon: Truck,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "first-piece-approval",
      title: "First Piece Approval",
      description: "Upload and approve first piece samples",
      icon: Eye,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "batch-status-update",
      title: "Batch Status Update",
      description: "Update status for multiple orders at once",
      icon: Layers,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "generate-production-pdf",
      title: "Generate Production PDF",
      description: "Create production sheets for manufacturers",
      icon: FileText,
      pinned: false,
      steps: defaultSteps,
    },
  ],
};

export const teamStoresActions: HubActionsConfig = {
  hubId: "team-stores",
  hubTitle: "Team Stores",
  fullPageRoute: "/team-stores/list",
  actionsRoute: "/team-stores/actions",
  actions: [
    {
      id: "launch-store-from-order",
      title: "Launch Store from Order",
      description: "Create a Shopify team store from an accepted order",
      icon: Store,
      pinned: true,
      isComingSoon: true,
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select an accepted order" },
        { id: "choose", type: "choose", title: "Configure Store", description: "Set store settings and close date" },
        { id: "preview", type: "preview", title: "Preview", description: "Review products and branding" },
        { id: "confirm", type: "confirm", title: "Launch", description: "Create Shopify store" },
        { id: "done", type: "done", title: "Done", description: "Store is live!" },
      ],
    },
    {
      id: "add-pantones",
      title: "Add Pantones to Store",
      description: "Pick colors from images for store products",
      icon: Palette,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "create-store",
      title: "Create Team Store",
      description: "Set up a new team store manually",
      icon: Building,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "extend-deadline",
      title: "Extend Store Deadline",
      description: "Change store close date",
      icon: Calendar,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "generate-qr-code",
      title: "Generate QR Codes",
      description: "Create QR codes for store access",
      icon: QrCode,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "store-analytics",
      title: "Store Analytics",
      description: "View store performance and sales",
      icon: BarChart3,
      pinned: false,
      steps: defaultSteps,
    },
  ],
};

export const designJobsActions: HubActionsConfig = {
  hubId: "design-jobs",
  hubTitle: "Design Jobs",
  fullPageRoute: "/design-jobs/list",
  actionsRoute: "/design-jobs/actions",
  actions: [
    {
      id: "ai-design-starter",
      title: "AI Design Starter",
      description: "Generate on-brand concepts using AI and past designs",
      icon: Wand2,
      pinned: true,
      requiresAI: true,
      steps: [
        { id: "pick", type: "pick", title: "Pick Order", description: "Select order or start new job" },
        { id: "choose", type: "choose", title: "Brief", description: "Add design brief and preferences" },
        { id: "preview", type: "preview", title: "Generate", description: "AI generates 3 concepts" },
        { id: "confirm", type: "confirm", title: "Select", description: "Pick a concept and assign designer" },
        { id: "done", type: "done", title: "Done", description: "Design job created" },
      ],
    },
    {
      id: "create-design-job",
      title: "Create Design Job",
      description: "Start a new design job manually",
      icon: PenTool,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "assign-designer",
      title: "Assign Designer",
      description: "Assign or reassign a designer to a job",
      icon: Users,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "upload-designs",
      title: "Upload Designs",
      description: "Upload completed design files",
      icon: Upload,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "request-revision",
      title: "Request Revision",
      description: "Add feedback and request changes",
      icon: MessageSquare,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "approve-design",
      title: "Approve Design",
      description: "Mark design as approved for production",
      icon: CheckSquare,
      pinned: false,
      steps: defaultSteps,
    },
  ],
};

export const eventsActions: HubActionsConfig = {
  hubId: "events",
  hubTitle: "Events",
  fullPageRoute: "/events/list",
  actionsRoute: "/events/actions",
  actions: [
    {
      id: "spin-up-tour-merch",
      title: "Spin Up Tour Merch Bundle",
      description: "Generate designs and create store in under 3 minutes",
      icon: Music,
      pinned: true,
      requiresAI: true,
      steps: [
        { id: "pick", type: "pick", title: "Enter Event", description: "Enter event code or create new" },
        { id: "choose", type: "choose", title: "Configure", description: "Set org colors and preferences" },
        { id: "preview", type: "preview", title: "Generate", description: "AI generates 5-8 designs" },
        { id: "confirm", type: "confirm", title: "Launch", description: "Create store and QR codes" },
        { id: "done", type: "done", title: "Done", description: "Tour merch bundle ready!" },
      ],
    },
    {
      id: "create-event",
      title: "Create New Event",
      description: "Start planning a new event",
      icon: Calendar,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "assign-staff",
      title: "Assign Staff",
      description: "Assign team members to an event",
      icon: Users,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "setup-merch",
      title: "Setup Merchandise",
      description: "Allocate products for event sales",
      icon: Package,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "contractor-payments",
      title: "Manage Contractors",
      description: "View and pay event contractors",
      icon: DollarSign,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "event-summary",
      title: "Event Summary Report",
      description: "Generate post-event summary",
      icon: BarChart3,
      pinned: false,
      steps: defaultSteps,
    },
  ],
};

export const organizationsActions: HubActionsConfig = {
  hubId: "organizations",
  hubTitle: "Organizations",
  fullPageRoute: "/organizations/list",
  actionsRoute: "/organizations/actions",
  actions: [
    {
      id: "instant-org-setup",
      title: "Instant Org Setup",
      description: "Create org with AI-detected brand colors from logo",
      icon: Zap,
      pinned: true,
      requiresAI: true,
      steps: [
        { id: "pick", type: "pick", title: "Type", description: "Select organization type" },
        { id: "choose", type: "choose", title: "Details", description: "Enter name and upload logo" },
        { id: "preview", type: "preview", title: "Auto-Fill", description: "AI extracts colors and suggests defaults" },
        { id: "confirm", type: "confirm", title: "Create", description: "Create organization and contact" },
        { id: "done", type: "done", title: "Done", description: "Ready for first quote!" },
      ],
    },
    {
      id: "add-client",
      title: "Add New Client",
      description: "Guided flow to add a new organization",
      icon: UserPlus,
      pinned: true,
      steps: [
        { id: "pick", type: "pick", title: "Client Type", description: "Choose client type" },
        { id: "choose", type: "choose", title: "Basic Info", description: "Enter organization details" },
        { id: "preview", type: "preview", title: "Add Contact", description: "Add primary contact" },
        { id: "confirm", type: "confirm", title: "Preview", description: "Review and save" },
        { id: "done", type: "done", title: "Done", description: "Client added" },
      ],
    },
    {
      id: "merge-duplicates",
      title: "Merge Duplicates",
      description: "Find and merge duplicate organizations",
      icon: GitMerge,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "onboarding-checklist",
      title: "Make Onboarding Checklist",
      description: "Create tasks for new client onboarding",
      icon: CheckSquare,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "client-summary",
      title: "Write Client Summary",
      description: "Generate an AI summary of client history",
      icon: Sparkles,
      pinned: true,
      requiresAI: true,
      steps: defaultSteps,
    },
    {
      id: "shopify-customer",
      title: "Create Shopify Customer",
      description: "Sync organization to Shopify",
      icon: ShoppingCart,
      pinned: false,
      isComingSoon: true,
      steps: defaultSteps,
    },
  ],
};

export const catalogActions: HubActionsConfig = {
  hubId: "catalog",
  hubTitle: "Catalog",
  fullPageRoute: "/catalog/list",
  actionsRoute: "/catalog/actions",
  actions: [
    {
      id: "add-pantones",
      title: "Add Pantones to Product",
      description: "Pick colors from images for product specs",
      icon: Palette,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "create-product",
      title: "Create Product",
      description: "Add a new product to the catalog",
      icon: Box,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "create-variant",
      title: "Create Variant",
      description: "Add a new variant to an existing product",
      icon: Tags,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "update-cogs",
      title: "Update COGS",
      description: "Update cost of goods sold for products",
      icon: DollarSign,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "bulk-import",
      title: "Bulk Import",
      description: "Import multiple products from CSV",
      icon: Upload,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "sync-to-shopify",
      title: "Sync to Shopify",
      description: "Push products to Shopify store",
      icon: ShoppingCart,
      pinned: false,
      isComingSoon: true,
      steps: defaultSteps,
    },
  ],
};

export const salesAnalyticsActions: HubActionsConfig = {
  hubId: "sales-analytics",
  hubTitle: "Sales Analytics",
  fullPageRoute: "/sales-analytics/full",
  actionsRoute: "/sales-analytics/actions",
  actions: [
    {
      id: "client-brief",
      title: "Client Brief",
      description: "Generate an AI-powered brief for a client",
      icon: BookOpen,
      pinned: true,
      requiresAI: true,
      aiActionId: "SA1",
      steps: [
        { id: "pick", type: "pick", title: "Pick Client", description: "Select the client organization" },
        { id: "choose", type: "choose", title: "Time Window", description: "Choose the time period to analyze" },
        { id: "preview", type: "preview", title: "Preview Brief", description: "Review the AI-generated brief" },
        { id: "confirm", type: "confirm", title: "Save", description: "Save or export the brief" },
        { id: "done", type: "done", title: "Done", description: "Brief ready" },
      ],
    },
    {
      id: "follow-up-list",
      title: "Follow-up List",
      description: "Generate a list of clients needing follow-up",
      icon: ListChecks,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "write-client-update",
      title: "Write Client Update",
      description: "Draft an update message for a client",
      icon: MessageSquare,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "explain-numbers",
      title: "Explain My Numbers",
      description: "Get AI explanations for your sales metrics",
      icon: Sparkles,
      pinned: true,
      requiresAI: true,
      aiActionId: "SA4",
      steps: [
        { id: "pick", type: "pick", title: "Pick Metrics", description: "Select the time period to analyze" },
        { id: "choose", type: "choose", title: "Options", description: "Choose what to explain" },
        { id: "preview", type: "preview", title: "Preview", description: "Review the AI explanation" },
        { id: "confirm", type: "confirm", title: "Save", description: "Save to notes" },
        { id: "done", type: "done", title: "Done", description: "Explanation saved" },
      ],
    },
    {
      id: "weekly-report",
      title: "Weekly Report",
      description: "Generate a weekly sales summary report",
      icon: BarChart3,
      pinned: true,
      requiresAI: true,
      steps: defaultSteps,
    },
  ],
};

export const contactsActions: HubActionsConfig = {
  hubId: "contacts",
  hubTitle: "Contacts",
  fullPageRoute: "/contacts/list",
  actionsRoute: "/contacts/actions",
  actions: [
    {
      id: "set-primary",
      title: "Set Primary Contact",
      description: "Designate a primary contact for an organization",
      icon: Users,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "clean-list",
      title: "Clean Contact List",
      description: "Find and fix incomplete contact data",
      icon: AlertTriangle,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "follow-up-message",
      title: "Make Follow-up Message",
      description: "Draft an AI-powered follow-up message",
      icon: MessageSquare,
      pinned: true,
      requiresAI: true,
      steps: defaultSteps,
    },
    {
      id: "create-tasks",
      title: "Create Follow-up Tasks",
      description: "Generate tasks for contact follow-ups",
      icon: ListChecks,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "export-contacts",
      title: "Export Contact List",
      description: "Export contacts to CSV",
      icon: Download,
      pinned: true,
      steps: defaultSteps,
    },
  ],
};

export const leadsActions: HubActionsConfig = {
  hubId: "leads",
  hubTitle: "Leads",
  fullPageRoute: "/leads/list",
  actionsRoute: "/leads/actions",
  actions: [
    {
      id: "follow-up-plan",
      title: "Plan My Follow-ups",
      description: "Generate a follow-up plan for the week",
      icon: Calendar,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "lead-to-quote",
      title: "Turn Lead into Quote",
      description: "Create a quote from a hot lead",
      icon: FileText,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "ask-missing-info",
      title: "Ask for Missing Info",
      description: "Request missing details from a lead",
      icon: Phone,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "clean-pipeline",
      title: "Move Stale Leads",
      description: "Archive or move inactive leads",
      icon: Archive,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "lead-summary",
      title: "Write Lead Summary",
      description: "Generate an AI summary of a lead",
      icon: Sparkles,
      pinned: true,
      requiresAI: true,
      steps: defaultSteps,
    },
  ],
};

export const allHubActions: Record<string, HubActionsConfig> = {
  orders: ordersActions,
  quotes: quotesActions,
  manufacturing: manufacturingActions,
  "team-stores": teamStoresActions,
  "design-jobs": designJobsActions,
  events: eventsActions,
  organizations: organizationsActions,
  catalog: catalogActions,
  "sales-analytics": salesAnalyticsActions,
  contacts: contactsActions,
  leads: leadsActions,
};

export function getHubActions(hubId: string): HubActionsConfig | undefined {
  return allHubActions[hubId];
}

export function getPinnedActions(hubId: string): ActionConfig[] {
  const hubConfig = getHubActions(hubId);
  if (!hubConfig) return [];
  return hubConfig.actions.filter((action) => action.pinned).slice(0, 5);
}

export function getActionById(hubId: string, actionId: string): ActionConfig | undefined {
  const hubConfig = getHubActions(hubId);
  if (!hubConfig) return undefined;
  return hubConfig.actions.find((action) => action.id === actionId);
}
