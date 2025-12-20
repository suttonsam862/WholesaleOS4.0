import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle 
} from "@/components/ui/responsive-dialog";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Quote, QuoteLineItem, Organization } from "@shared/schema";
import { generateQuotePDF } from "@/utils/generateQuotePDF";
import { useState } from "react";

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
}

interface QuoteWithLineItems extends Quote {
  lineItems?: QuoteLineItem[];
  organization?: Organization;
}

export function QuoteDetailModal({ isOpen, onClose, quote }: QuoteDetailModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch quote with line items
  const { data: quoteWithLineItems, isLoading } = useQuery<QuoteWithLineItems>({
    queryKey: ['/api/quotes', quote?.id],
    enabled: !!quote?.id && isOpen
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPDF = async () => {
    if (!quoteWithLineItems) return;

    setIsGeneratingPDF(true);
    try {
      await generateQuotePDF({
        quote: quoteWithLineItems,
        lineItems: quoteWithLineItems.lineItems || [],
        organization: quoteWithLineItems.organization,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isMobile = useIsMobile();

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onClose}>
      <ResponsiveDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <ResponsiveDialogTitle className="text-lg sm:text-xl">Quote Details: {quote?.quoteName}</ResponsiveDialogTitle>
            <Button
              onClick={handleDownloadPDF}
              disabled={isLoading || isGeneratingPDF || !quoteWithLineItems}
              variant="outline"
              size="sm"
              data-testid="button-download-quote-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </ResponsiveDialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">Loading quote details...</div>
        ) : (
          <div className="space-y-6">
            {/* Quote Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{quote.quoteName}</CardTitle>
                    <p className="text-muted-foreground">Code: {quote.quoteCode}</p>
                  </div>
                  <Badge className={getStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p>{quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  {quote.validUntil && (
                    <div>
                      <p className="text-sm font-medium">Valid Until</p>
                      <p>{new Date(quote.validUntil).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
                    <p className="text-xl font-bold" data-testid={`detail-subtotal-${quote.id}`}>
                      ${parseFloat(quote.subtotal || '0').toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Discount</p>
                    <p className="text-xl font-bold text-red-600" data-testid={`detail-discount-${quote.id}`}>
                      -${parseFloat(quote.discount || '0').toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tax ({(parseFloat(quote.taxRate || '0') * 100).toFixed(2)}%)
                    </p>
                    <p className="text-xl font-bold" data-testid={`detail-tax-${quote.id}`}>
                      ${parseFloat(quote.taxAmount || '0').toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied to ${(parseFloat(quote.subtotal || '0') - parseFloat(quote.discount || '0')).toFixed(2)} (after discount)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-green-600" data-testid={`detail-total-${quote.id}`}>
                      ${parseFloat(quote.total || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            {quoteWithLineItems?.lineItems && quoteWithLineItems.lineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Line Items ({quoteWithLineItems.lineItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quoteWithLineItems.lineItems.map((item: QuoteLineItem, index: number) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity} × ${parseFloat(item.unitPrice || '0').toFixed(2)} = 
                            <span className="text-green-600 ml-1">
                              ${parseFloat(item.lineTotal || '0').toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}