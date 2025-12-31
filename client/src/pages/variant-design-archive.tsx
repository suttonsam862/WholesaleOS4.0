import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

interface DesignArchiveItem {
  id: number;
  orderId: number;
  imageUrl: string;
  itemName?: string;
  colorNotes?: string;
  createdAt: string;
}

interface DesignArchiveResponse {
  variantId: number;
  variant: {
    id: number;
    variantCode: string;
    color?: string;
    size?: string;
    material?: string;
    imageUrl?: string;
    productId: number;
  };
  designs: DesignArchiveItem[];
  totalDesigns: number;
}

interface Product {
  id: number;
  name: string;
  categoryId: number;
}

export default function VariantDesignArchive() {
  const [, params] = useRoute("/catalog/variant/:variantId/designs");
  const variantId = params?.variantId ? parseInt(params.variantId) : null;
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: archiveData, isLoading: archiveLoading } = useQuery<DesignArchiveResponse>({
    queryKey: ['/api/variants', variantId, 'design-archive'],
    enabled: !!variantId,
    retry: false,
  });

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/catalog"],
    retry: false,
  });

  const product = allProducts?.find(p => p.id === archiveData?.variant?.productId);

  if (isLoading || archiveLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!archiveData && !archiveLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Variant Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The variant you're looking for doesn't exist.
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

  const variant = archiveData?.variant;
  const designs = archiveData?.designs || [];

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/catalog/product/${variant?.productId}`}>
          <Button variant="ghost" size="sm" className="mb-3" data-testid="button-back-to-product">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {product?.name || 'Product'}
          </Button>
        </Link>
        
        <div className="flex items-start gap-6">
          {variant?.imageUrl ? (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-border">
              <img 
                src={variant.imageUrl} 
                alt={variant.variantCode || 'Variant'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-border">
              <i className="fas fa-palette text-4xl text-purple-400/40"></i>
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-mono" data-testid="heading-variant-code">
                {variant?.variantCode}
              </h1>
            </div>
            {product && (
              <p className="text-muted-foreground mb-2" data-testid="text-product-name">
                {product.name}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {variant?.color && (
                <div>
                  <span className="text-muted-foreground">Color: </span>
                  <span className="font-medium" data-testid="text-variant-color">{variant.color}</span>
                </div>
              )}
              {variant?.size && (
                <div>
                  <span className="text-muted-foreground">Size: </span>
                  <span className="font-medium" data-testid="text-variant-size">{variant.size}</span>
                </div>
              )}
              {variant?.material && (
                <div>
                  <span className="text-muted-foreground">Material: </span>
                  <span className="font-medium" data-testid="text-variant-material">{variant.material}</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <Badge className="text-base" data-testid="badge-design-count">
                <i className="fas fa-images mr-2"></i>
                {designs.length} {designs.length === 1 ? 'Design' : 'Designs'} Archived
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Design Archive Grid */}
      {designs.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-images text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Designs Archived</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                This variant doesn't have any saved designs yet. Designs are automatically archived when they're added to order line items.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Design Archive</h2>
            <p className="text-sm text-muted-foreground">
              Showing all designs from orders
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => {
              return (
                <Card 
                  key={design.id} 
                  className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                  data-testid={`card-design-${design.id}`}
                >
                  {/* Design Image */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-500/10 to-gray-700/10 overflow-hidden">
                    <img 
                      src={design.imageUrl} 
                      alt={design.itemName || `Design ${design.id}`}
                      className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-full h-full flex items-center justify-center';
                          placeholder.innerHTML = '<i class="fas fa-image text-6xl text-muted-foreground/40"></i>';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                    
                    {/* Order badge */}
                    <div className="absolute top-3 right-3">
                      <Link href={`/orders`}>
                        <Badge className="bg-background/90 backdrop-blur-sm cursor-pointer hover:bg-background" data-testid={`badge-order-${design.id}`}>
                          Order #{design.orderId}
                        </Badge>
                      </Link>
                    </div>
                  </div>

                  {/* Design Info */}
                  <CardContent className="p-4">
                    {design.itemName && (
                      <h3 className="font-semibold text-base mb-2" data-testid={`text-design-name-${design.id}`}>
                        {design.itemName}
                      </h3>
                    )}
                    
                    {design.colorNotes && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-design-notes-${design.id}`}>
                        {design.colorNotes}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span>Added {new Date(design.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={design.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          data-testid={`button-view-design-${design.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </a>
                      <a 
                        href={design.imageUrl} 
                        download
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-download-design-${design.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
