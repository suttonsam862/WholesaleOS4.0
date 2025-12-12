import Finance from "../finance";

interface FinanceTabWrapperProps {
  defaultTab: string;
}

export function FinanceTabWrapper({ defaultTab }: FinanceTabWrapperProps) {
  const searchParams = new URLSearchParams(window.location.search);
  const action = searchParams.get("action");
  const status = searchParams.get("status");
  
  return <Finance defaultTab={defaultTab} action={action} statusFilter={status} />;
}

export function FinanceOverview() {
  return <FinanceTabWrapper defaultTab="overview" />;
}

export function FinanceInvoices() {
  return <FinanceTabWrapper defaultTab="invoices" />;
}

export function FinancePayments() {
  return <FinanceTabWrapper defaultTab="payments" />;
}

export function FinanceCommissions() {
  return <FinanceTabWrapper defaultTab="commissions" />;
}

export function FinanceMatching() {
  return <FinanceTabWrapper defaultTab="matching" />;
}

export function FinanceExpenses() {
  return <FinanceTabWrapper defaultTab="expenses" />;
}
