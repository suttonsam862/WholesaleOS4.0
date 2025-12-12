import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import Finance from "../finance";

interface FinanceTabWrapperProps {
  defaultTab: string;
}

export function FinanceTabWrapper({ defaultTab }: FinanceTabWrapperProps) {
  return <Finance defaultTab={defaultTab} />;
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
