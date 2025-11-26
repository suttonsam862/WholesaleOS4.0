import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateQuoteModal } from "@/components/modals/create-quote-modal";
import { EditQuoteModal } from "@/components/modals/edit-quote-modal";
import { QuoteDetailModal } from "@/components/modals/quote-detail-modal";
import type { Quote } from "@shared/schema";

export default function Quotes() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quotes
  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['/api/quotes']
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: (quoteId: number) => apiRequest('DELETE', `/api/quotes/${quoteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete quote",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsEditModalOpen(true);
  };

  const handleView = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (quote: Quote) => {
    if (quote.status !== 'draft') {
      toast({
        title: "Error",
        description: "Only draft quotes can be deleted",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete quote ${quote.quoteCode}?`)) {
      deleteQuoteMutation.mutate(quote.id);
    }
  };

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="quotes-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Quotes
          </h1>
          <p className="text-muted-foreground">
            Manage customer quotes with real-time financial calculations
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="button-create-quote"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first quote to get started
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" data-testid="quotes-list">
          {quotes.map((quote: Quote) => (
            <Card key={quote.id} data-testid={`quote-card-${quote.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{quote.quoteName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Code: {quote.quoteCode}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Subtotal</p>
                    <p className="text-lg font-bold" data-testid={`subtotal-${quote.id}`}>
                      ${parseFloat(quote.subtotal || "0").toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Discount</p>
                    <p className="text-lg font-bold text-red-600" data-testid={`discount-${quote.id}`}>
                      -${parseFloat(quote.discount || "0").toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tax ({(parseFloat(quote.taxRate || "0") * 100).toFixed(2)}%)</p>
                    <p className="text-lg font-bold" data-testid={`tax-${quote.id}`}>
                      ${parseFloat(quote.taxAmount || "0").toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold text-green-600" data-testid={`total-${quote.id}`}>
                      ${parseFloat(quote.total || "0").toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Created: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(quote)}
                      data-testid={`button-view-${quote.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(quote)}
                      data-testid={`button-edit-${quote.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {quote.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(quote)}
                        data-testid={`button-delete-${quote.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateQuoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      {selectedQuote && (
        <>
          <EditQuoteModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
          />
          
          <QuoteDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
          />
        </>
      )}
    </div>
  );
}