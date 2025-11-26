import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArchiveRestore, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  basePrice: string;
  primaryImageUrl?: string;
  archived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
}

export default function ArchivedProducts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/archived"],
    retry: false,
  });

  const unarchiveMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest("PUT", `/api/products/${productId}/unarchive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Product restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore product",
        variant: "destructive",
      });
    },
  });

  if (isLoading || productsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-archived-products">
            Archived Products
          </h1>
          <p className="text-muted-foreground">
            View and restore previously archived products
          </p>
        </div>
        <Link href="/catalog">
          <Button variant="outline" data-testid="button-back-to-catalog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-archive text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No archived products</h3>
              <p className="text-muted-foreground">
                Products you archive will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <Card key={product.id} data-testid={`card-archived-product-${product.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {product.primaryImageUrl ? (
                    <img
                      src={product.primaryImageUrl}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                      data-testid={`img-archived-product-${product.id}`}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-box text-3xl text-blue-400/40"></i>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg" data-testid={`text-archived-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <Badge variant="outline">{product.sku}</Badge>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2" data-testid={`text-archived-product-description-${product.id}`}>
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Archived</Badge>
                      {product.archivedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(product.archivedAt), "MMM d, yyyy")}
                        </span>
                      )}
                      <span className="text-sm font-medium ml-2">${product.basePrice}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Restore "${product.name}" from archive?`)) {
                        unarchiveMutation.mutate(product.id);
                      }
                    }}
                    data-testid={`button-restore-product-${product.id}`}
                  >
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
