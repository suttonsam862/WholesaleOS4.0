import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Edit, Archive, Plus } from "lucide-react";
import { useState } from "react";
import { EditVariantModal } from "@/components/modals/edit-variant-modal";
import { CreateVariantModal } from "@/components/modals/create-variant-modal";
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
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductVariants() {
  const [, params] = useRoute("/catalog/product/:productId");
  const productId = params?.productId ? parseInt(params.productId) : null;
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] = useState(false);

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
    retry: false,
  });

  const { data: allVariants, isLoading: variantsLoading } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
    retry: false,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const variants = allVariants?.filter(v => v.productId === productId) || [];
  const category = categories?.find(c => c.id === product?.categoryId);

  const archiveVariantMutation = useMutation({
    mutationFn: (variantId: number) =>
      apiRequest("PUT", `/api/variants/${variantId}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      toast({
        title: "Success",
        description: "Variant archived successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive variant",
        variant: "destructive",
      });
    },
  });

  const handleArchiveVariant = (e: React.MouseEvent, variantId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to archive this variant?")) {
      archiveVariantMutation.mutate(variantId);
    }
  };

  const handleEditVariant = (e: React.MouseEvent, variant: Variant) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingVariant(variant);
  };

  if (isLoading || productLoading || variantsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product && !productLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Product Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The product you're looking for doesn't exist.
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
        <div className="flex items-center justify-between mb-3">
          <Link href={`/catalog/category/${product?.categoryId}`}>
            <Button variant="ghost" size="sm" data-testid="button-back-to-category">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {category?.name || 'Category'}
            </Button>
          </Link>
          {canModify(user, 'catalog') && (
            <Button 
              onClick={() => setIsCreateVariantModalOpen(true)}
              data-testid="button-create-variant"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Variant
            </Button>
          )}
        </div>
        
        <div className="flex items-start gap-6">
          {product?.primaryImageUrl ? (
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 border border-border">
              <ImageWithFallback 
                src={`/public-objects/${product.primaryImageUrl}`}
                alt={product.name || 'Product'}
                className="w-full h-full"
                fallbackIcon={<i className="fas fa-box text-5xl text-orange-400/40"></i>}
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-border">
              <i className="fas fa-box text-5xl text-orange-400/40"></i>
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold" data-testid="heading-product-name">
                {product?.name}
              </h1>
              <Badge variant={product?.active ? "default" : "secondary"}>
                {product?.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono mb-2" data-testid="text-product-sku">
              {product?.sku}
            </p>
            {product?.description && (
              <p className="text-muted-foreground mb-3" data-testid="text-product-description">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Base Price: </span>
                <span className="font-semibold text-lg" data-testid="text-product-price">
                  ${parseFloat(product?.basePrice || '0').toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  <i className="fas fa-palette mr-2"></i>
                  {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Grid */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-palette text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Variants Yet</h3>
              <p className="text-muted-foreground mb-6">
                This product doesn't have any variants yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {variants.map((variant) => {
            return (
              <Link key={variant.id} href={`/catalog/variant/${variant.id}/designs`}>
                <Card 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden h-full"
                  data-testid={`card-variant-${variant.id}`}
                >
                  {/* Variant Image */}
                  <div className="relative h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 overflow-hidden">
                    {variant.imageUrl ? (
                      <ImageWithFallback 
                        src={`/public-objects/${variant.imageUrl}`}
                        alt={variant.variantCode}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        fallbackIcon={<i className="fas fa-palette text-7xl text-purple-400/40"></i>}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-palette text-7xl text-purple-400/40"></i>
                      </div>
                    )}
                    
                    {/* Edit and Archive buttons */}
                    {canModify(user, 'catalog') && (
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleEditVariant(e, variant)}
                          data-testid={`button-edit-variant-${variant.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleArchiveVariant(e, variant.id)}
                          data-testid={`button-archive-variant-${variant.id}`}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Design archive link badge */}
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-background/90 backdrop-blur-sm">
                        <i className="fas fa-images mr-1"></i>
                        View Designs
                      </Badge>
                    </div>
                  </div>

                  {/* Variant Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 font-mono group-hover:text-primary transition-colors" data-testid={`text-variant-code-${variant.id}`}>
                      {variant.variantCode}
                    </h3>
                    
                    <div className="space-y-2 mt-3">
                      {variant.color && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Color</span>
                          <span className="font-medium" data-testid={`text-variant-color-${variant.id}`}>
                            {variant.color}
                          </span>
                        </div>
                      )}
                      
                      {variant.size && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Size</span>
                          <span className="font-medium" data-testid={`text-variant-size-${variant.id}`}>
                            {variant.size}
                          </span>
                        </div>
                      )}
                      
                      {variant.material && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Material</span>
                          <span className="font-medium" data-testid={`text-variant-material-${variant.id}`}>
                            {variant.material}
                          </span>
                        </div>
                      )}
                    </div>

                    {(variant.msrp || variant.cost) && (
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        {variant.msrp && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">MSRP</span>
                            <span className="font-bold" data-testid={`text-variant-msrp-${variant.id}`}>
                              ${parseFloat(variant.msrp).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {variant.cost && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cost</span>
                            <span className="text-sm font-medium" data-testid={`text-variant-cost-${variant.id}`}>
                              ${parseFloat(variant.cost).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-center text-sm text-primary font-medium">
                        <i className="fas fa-archive mr-2"></i>
                        View Design Archive
                        <i className="fas fa-chevron-right ml-2 text-xs group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {editingVariant && (
        <EditVariantModal
          isOpen={true}
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
        />
      )}

      <CreateVariantModal
        isOpen={isCreateVariantModalOpen}
        onClose={() => setIsCreateVariantModalOpen(false)}
        productId={productId || undefined}
      />
    </div>
  );
}
