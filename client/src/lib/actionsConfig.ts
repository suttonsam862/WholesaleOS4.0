import { LucideIcon, FileText, Users, TrendingUp, MessageSquare, ListChecks, ClipboardList, Send, Package, Palette, ShoppingCart, UserPlus, GitMerge, CheckSquare, Mail, Download, Calendar, AlertTriangle, Archive, Sparkles, BarChart3, BookOpen, Phone } from "lucide-react";

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
      id: "quote-from-order",
      title: "Make a quote from order",
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
      id: "add-colors",
      title: "Add colors to order",
      description: "Pick colors from images for manufacturing specs",
      icon: Palette,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "send-customer-link",
      title: "Send customer info link",
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
      title: "Fix missing order info",
      description: "Scan and fix incomplete order data",
      icon: AlertTriangle,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "push-to-printful",
      title: "Push to Printful",
      description: "Send order items to Printful for fulfillment",
      icon: Package,
      pinned: false,
      steps: defaultSteps,
    },
    {
      id: "make-retail-product",
      title: "Make retail product",
      description: "Create a Shopify product from an order item",
      icon: ShoppingCart,
      pinned: false,
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
      title: "Client brief",
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
      title: "Follow-up list",
      description: "Generate a list of clients needing follow-up",
      icon: ListChecks,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "write-client-update",
      title: "Write client update",
      description: "Draft an update message for a client",
      icon: MessageSquare,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "explain-numbers",
      title: "Explain my numbers",
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
      title: "Weekly report",
      description: "Generate a weekly sales summary report",
      icon: BarChart3,
      pinned: false,
      requiresAI: true,
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
      id: "add-client",
      title: "Add a new client",
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
      title: "Merge duplicates",
      description: "Find and merge duplicate organizations",
      icon: GitMerge,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "onboarding-checklist",
      title: "Make onboarding checklist",
      description: "Create tasks for new client onboarding",
      icon: CheckSquare,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "client-summary",
      title: "Write client summary",
      description: "Generate an AI summary of client history",
      icon: Sparkles,
      pinned: true,
      requiresAI: true,
      steps: defaultSteps,
    },
    {
      id: "shopify-customer",
      title: "Create Shopify customer",
      description: "Sync organization to Shopify",
      icon: ShoppingCart,
      pinned: false,
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
      title: "Set primary contact",
      description: "Designate a primary contact for an organization",
      icon: Users,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "clean-list",
      title: "Clean contact list",
      description: "Find and fix incomplete contact data",
      icon: AlertTriangle,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "follow-up-message",
      title: "Make follow-up message",
      description: "Draft an AI-powered follow-up message",
      icon: MessageSquare,
      pinned: true,
      requiresAI: true,
      steps: defaultSteps,
    },
    {
      id: "create-tasks",
      title: "Create follow-up tasks",
      description: "Generate tasks for contact follow-ups",
      icon: ListChecks,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "export-contacts",
      title: "Export contact list",
      description: "Export contacts to CSV",
      icon: Download,
      pinned: false,
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
      title: "Plan my follow-ups",
      description: "Generate a follow-up plan for the week",
      icon: Calendar,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "lead-to-quote",
      title: "Turn lead into quote",
      description: "Create a quote from a hot lead",
      icon: FileText,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "ask-missing-info",
      title: "Ask for missing info",
      description: "Request missing details from a lead",
      icon: Phone,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "clean-pipeline",
      title: "Move stale leads",
      description: "Archive or move inactive leads",
      icon: Archive,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "lead-summary",
      title: "Write lead summary",
      description: "Generate an AI summary of a lead",
      icon: Sparkles,
      pinned: false,
      requiresAI: true,
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
      id: "create-event",
      title: "Create new event",
      description: "Start planning a new event",
      icon: Calendar,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "assign-staff",
      title: "Assign staff",
      description: "Assign team members to an event",
      icon: Users,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "setup-merch",
      title: "Setup merchandise",
      description: "Allocate products for event sales",
      icon: Package,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "contractor-payments",
      title: "Manage contractors",
      description: "View and pay event contractors",
      icon: FileText,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "event-summary",
      title: "Event summary report",
      description: "Generate post-event summary",
      icon: BarChart3,
      pinned: false,
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
      id: "create-quote",
      title: "Create new quote",
      description: "Start a new quote from scratch",
      icon: FileText,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "convert-to-order",
      title: "Convert to order",
      description: "Turn an approved quote into an order",
      icon: ShoppingCart,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "send-quote",
      title: "Send quote to client",
      description: "Email the quote to the customer",
      icon: Send,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "duplicate-quote",
      title: "Duplicate quote",
      description: "Create a copy of an existing quote",
      icon: ClipboardList,
      pinned: true,
      steps: defaultSteps,
    },
    {
      id: "quote-followup",
      title: "Follow up on quote",
      description: "Send a follow-up message about a quote",
      icon: MessageSquare,
      pinned: false,
      steps: defaultSteps,
    },
  ],
};

export const allHubActions: Record<string, HubActionsConfig> = {
  orders: ordersActions,
  "sales-analytics": salesAnalyticsActions,
  organizations: organizationsActions,
  contacts: contactsActions,
  leads: leadsActions,
  events: eventsActions,
  quotes: quotesActions,
};

export function getHubActions(hubId: string): HubActionsConfig | undefined {
  return allHubActions[hubId];
}

export function getPinnedActions(hubId: string): ActionConfig[] {
  const hubConfig = getHubActions(hubId);
  if (!hubConfig) return [];
  return hubConfig.actions.filter((action) => action.pinned).slice(0, 4);
}

export function getActionById(hubId: string, actionId: string): ActionConfig | undefined {
  const hubConfig = getHubActions(hubId);
  if (!hubConfig) return undefined;
  return hubConfig.actions.find((action) => action.id === actionId);
}
