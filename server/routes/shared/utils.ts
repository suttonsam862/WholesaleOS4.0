// Utility function to strip financial data for manufacturer role
export function stripFinancialData(data: any, userRole: string): any {
  if (userRole !== 'manufacturer') {
    return data; // Only filter for manufacturer role
  }

  if (Array.isArray(data)) {
    return data.map(item => stripFinancialData(item, userRole));
  }

  if (data && typeof data === 'object') {
    const filtered = { ...data };
    
    // Remove financial fields
    delete filtered.unitPrice;
    delete filtered.lineTotal;
    delete filtered.subtotal;
    delete filtered.total;
    delete filtered.taxAmount;
    delete filtered.discount;
    delete filtered.msrp;
    delete filtered.cost;
    delete filtered.basePrice;
    delete filtered.commission;
    delete filtered.revenue;
    delete filtered.amountPaid;
    delete filtered.invoiceUrl;
    delete filtered.actualCost;
    
    // Recursively filter nested objects and arrays
    if (filtered.lineItems && Array.isArray(filtered.lineItems)) {
      filtered.lineItems = filtered.lineItems.map((item: any) => stripFinancialData(item, userRole));
    }
    
    if (filtered.variant && typeof filtered.variant === 'object') {
      filtered.variant = stripFinancialData(filtered.variant, userRole);
    }
    
    return filtered;
  }

  return data;
}
