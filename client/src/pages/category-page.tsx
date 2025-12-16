import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, DollarSign, Edit, Trash2, Plus } from "lucide-react";
import { EditVariantModal } from "@/components/modals/edit-variant-modal";
import { CreateVariantModal } from "@/components/modals/create-variant-modal";
import { EditProductModal } from "@/components/modals/edit-product-modal";
import { CreateProductModal } from "@/components/modals/create-product-modal";
import { apiRequest } from "@/lib/queryClient";

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
  description: string;
  createdAt: string;
}

interface Variant {
  id: number;
  productId: number;
  variantCode: string;
  color?: string;
  size?: string;
  material?: string;
  msrp?: string;
  cost?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoryPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [match, params] = useRoute("/catalog/category/:categoryId");
  const categoryId = params?.categoryId ? parseInt(params.categoryId) : null;
  const queryClient = useQueryClient();
  const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/catalog"],
    retry: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: variants = [] } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
    retry: false,
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: number) => 
      apiRequest(`/api/variants/${variantId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Variant deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete variant",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest(`/api/catalog/${productId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditProductModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  // Placeholder functions for variant edit/delete - these would need to be implemented
  const handleEditVariant = (variant: Variant) => {
    setSelectedVariant(variant);
    setIsEditVariantModalOpen(true);
  };

  const handleDeleteVariant = (variant: Variant) => {
    if (confirm(`Are you sure you want to delete variant "${variant.variantCode}"?`)) {
      deleteVariantMutation.mutate(variant.id);
    }
  };


  if (isLoading || productsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!categoryId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Category</h1>
          <p className="text-muted-foreground mb-4">No category ID provided.</p>
          <Link href="/catalog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = categories.find(c => c.id === categoryId);
  const categoryProducts = products.filter(p => p.categoryId === categoryId);

  if (!category) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested category does not exist.</p>
          <Link href="/catalog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/catalog">
            <Button variant="ghost" size="sm" data-testid="button-back-to-catalog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground">
              Catalog
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{category.name}</span>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateProductModalOpen(true)}
          data-testid="button-create-product"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Button>
      </div>

      {/* Category Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="heading-category-name">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-muted-foreground" data-testid="text-category-description">
            {category.description}
          </p>
        )}
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card data-testid="card-category-products">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-category-product-count">
                  {categoryProducts.length}
                </p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-category-active-products">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-green-400"></i>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-category-active-products">
                  {categoryProducts.filter(p => p.active).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-category-variants" className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-palette text-purple-400"></i>
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-category-variant-count">
                  {variants.filter(v => categoryProducts.some(p => p.id === v.productId)).length}
                </p>
                <p className="text-sm text-muted-foreground">Variants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      {categoryProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoryProducts.map((product) => {
            const productVariants = variants.filter(v => v.productId === product.id);

            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
                <div className="aspect-square relative">
                  {product.primaryImageUrl ? (
                    <img
                      src={product.primaryImageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) {
                          (fallback as HTMLElement).style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center ${product.primaryImageUrl ? 'hidden' : ''}`}
                    style={product.primaryImageUrl ? { display: 'none' } : {}}
                  >
                    <Package className="w-12 h-12 text-white" />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={product.active ? "default" : "secondary"}
                      data-testid={`badge-product-status-${product.id}`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg mb-1" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground" data-testid={`text-product-sku-${product.id}`}>
                      {product.sku}
                    </p>
                  </div>

                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-lg" data-testid={`text-product-price-${product.id}`}>
                        ${(() => {
                          // Show the first variant's price if available, otherwise show base price
                          if (productVariants.length > 0) {
                            const firstVariant = productVariants[0];
                            const price = firstVariant.msrp || firstVariant.cost || product.basePrice;
                            return parseFloat(price).toFixed(2);
                          }
                          return parseFloat(product.basePrice).toFixed(2);
                        })()}
                      </span>
                    </div>
                    {productVariants.length > 0 && (
                      <div className="text-sm text-muted-foreground" data-testid={`text-product-variant-count-${product.id}`}>
                        {productVariants.length} variant{productVariants.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Product Actions */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground font-medium">Product Actions:</p>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          className="h-7 px-2"
                          title="Edit Product"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductId(product.id);
                            setIsCreateVariantModalOpen(true);
                          }}
                          className="h-7 px-2"
                          title="Add Variant"
                        >
                          <i className="fas fa-palette h-3 w-3"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Product"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Variants Preview with Edit/Delete */}
                  {productVariants.length > 0 && (
                    <div className="border-t pt-3 mt-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-medium">Available Variants:</p>
                        <span className="text-xs text-muted-foreground">
                          {productVariants.length} variant{productVariants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {productVariants.map((variant) => (
                          <div key={variant.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium truncate" data-testid={`text-variant-name-${variant.id}`}>
                                  {variant.color && variant.size ? `${variant.color} - ${variant.size}` : 
                                   variant.color || variant.size || variant.variantCode}
                                </span>
                                {variant.material && (
                                  <span className="text-xs text-muted-foreground">
                                    ({variant.material})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-green-600" data-testid={`text-variant-price-${variant.id}`}>
                                  ${variant.msrp ? parseFloat(variant.msrp).toFixed(2) : variant.cost ? parseFloat(variant.cost).toFixed(2) : "0.00"}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {variant.variantCode}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditVariant(variant);
                                }}
                                data-testid={`button-edit-variant-${variant.id}`}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3 text-blue-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVariant(variant);
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-variant-${variant.id}`}
                              >
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12" data-testid="card-no-products">
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                This category doesn't have any products yet.
              </p>
              <Link href="/catalog">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Catalog
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Variant Modal */}
      <EditVariantModal
        isOpen={isEditVariantModalOpen}
        onClose={() => {
          setIsEditVariantModalOpen(false);
          setSelectedVariant(null);
        }}
        variant={selectedVariant}
      />

      {/* Create Variant Modal */}
      <CreateVariantModal
        isOpen={isCreateVariantModalOpen}
        onClose={() => {
          setIsCreateVariantModalOpen(false);
          setSelectedProductId(undefined);
        }}
        productId={selectedProductId}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        categoryId={categoryId || undefined}
      />
    </div>
  );
}