import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Edit, Archive } from "lucide-react";
import { useState } from "react";
import { EditProductModal } from "@/components/modals/edit-product-modal";
import { apiRequest } from "@/lib/queryClient";
import { canModify } from "@/lib/permissions";

interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  description: string;
  basePrice: string;
  primaryImageUrl?: string;
  additionalImages?: string[];
  active: boolean;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

interface Variant {
  id: number;
  productId: number;
  variantCode: string;
  color?: string;
  size?: string;
  material?: string;
  imageUrl?: string;
}

export default function CategoryProducts() {
  const [, params] = useRoute("/catalog/category/:categoryId");
  const categoryId = params?.categoryId ? parseInt(params.categoryId) : null;
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${categoryId}`],
    enabled: !!categoryId,
    retry: false,
  });

  const { data: allProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/catalog"],
    retry: false,
  });

  const { data: allVariants } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
    retry: false,
  });

  const products = allProducts?.filter(p => p.categoryId === categoryId) || [];

  const archiveProductMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest("PUT", `/api/products/${productId}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Product archived successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive product",
        variant: "destructive",
      });
    },
  });

  const handleArchiveProduct = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to archive this product?")) {
      archiveProductMutation.mutate(productId);
    }
  };

  const handleEditProduct = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProduct(product);
  };

  if (isLoading || categoryLoading || productsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category && !categoryLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Category Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The category you're looking for doesn't exist.
              </p>
              <Link href="/catalog">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Catalog
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/catalog">
          <Button variant="ghost" size="sm" className="mb-3" data-testid="button-back-to-catalog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
        
        <div className="flex items-start gap-6">
          {category?.imageUrl ? (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-border">
              <img 
                src={category.imageUrl} 
                alt={category.name || 'Category'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-border">
              <i className="fas fa-folder text-4xl text-purple-400/40"></i>
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-category-name">
              {category?.name}
            </h1>
            {category?.description && (
              <p className="text-muted-foreground mb-3" data-testid="text-category-description">
                {category.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span data-testid="text-product-count">
                <i className="fas fa-box mr-2"></i>
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-box text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-6">
                This category doesn't have any products yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const productVariants = allVariants?.filter(v => v.productId === product.id) || [];
            
            return (
              <Link key={product.id} href={`/catalog/product/${product.id}`}>
                <Card 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden h-full"
                  data-testid={`card-product-${product.id}`}
                >
                  {/* Product Image */}
                  <div className="relative h-56 bg-gradient-to-br from-orange-500/10 to-red-500/10 overflow-hidden">
                    {product.primaryImageUrl ? (
                      <img 
                        src={`/public-objects/${product.primaryImageUrl}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-box text-6xl text-orange-400/40"></i>
                      </div>
                    )}
                    
                    {/* Edit and Archive buttons */}
                    {canModify(user, 'catalog') && (
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleEditProduct(e, product)}
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleArchiveProduct(e, product.id)}
                          data-testid={`button-archive-product-${product.id}`}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute bottom-3 right-3">
                      <Badge 
                        variant={product.active ? "default" : "secondary"}
                        className="bg-background/90 backdrop-blur-sm"
                        data-testid={`badge-product-status-${product.id}`}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Variant count badge */}
                    {productVariants.length > 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-background/90 backdrop-blur-sm" data-testid={`badge-variant-count-${product.id}`}>
                          {productVariants.length} {productVariants.length === 1 ? 'variant' : 'variants'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 font-mono" data-testid={`text-product-sku-${product.id}`}>
                      {product.sku}
                    </p>
                    
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Base Price</span>
                      <span className="text-lg font-bold" data-testid={`text-product-price-${product.id}`}>
                        ${parseFloat(product.basePrice).toFixed(2)}
                      </span>
                    </div>

                    {/* Variant preview thumbnails */}
                    {productVariants.length > 0 && (
                      <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                        {productVariants.slice(0, 5).map((variant) => (
                          <div 
                            key={variant.id} 
                            className="w-8 h-8 rounded border border-border overflow-hidden bg-muted"
                            title={variant.color || variant.variantCode}
                          >
                            {variant.imageUrl ? (
                              <img 
                                src={variant.imageUrl} 
                                alt={variant.variantCode}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                <i className="fas fa-palette text-xs text-muted-foreground"></i>
                              </div>
                            )}
                          </div>
                        ))}
                        {productVariants.length > 5 && (
                          <div className="w-8 h-8 rounded border border-border flex items-center justify-center bg-muted">
                            <span className="text-xs font-medium text-muted-foreground">
                              +{productVariants.length - 5}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {editingProduct && (
        <EditProductModal
          isOpen={true}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
