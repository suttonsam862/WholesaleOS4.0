import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { canModify } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { EditCategoryModal } from "@/components/modals/edit-category-modal";
import { CreateCategoryModal } from "@/components/modals/create-category-modal";
import { Edit, Archive, Plus, Folder, Box, Palette, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

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

export default function Catalog() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);

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

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/catalog"],
    retry: false,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: variants = [] } = useQuery<any[]>({
    queryKey: ["/api/variants"],
    retry: false,
  });

  const archiveCategoryMutation = useMutation({
    mutationFn: (categoryId: number) =>
      apiRequest("PUT", `/api/categories/${categoryId}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category archived successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive category",
        variant: "destructive",
      });
    },
  });

  if (isLoading || productsLoading || categoriesLoading) {
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

  return (
    <div className="p-3 sm:p-6 min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight gradient-text" data-testid="heading-catalog">
              Catalog
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Explore our curated collection of premium products and categories.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canModify(user, 'catalog') && (
              <Button 
                onClick={() => setIsCreateCategoryModalOpen(true)} 
                data-testid="button-create-category"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            )}
            <div className="flex gap-2">
              <Link href="/catalog/archived/categories">
                <Button variant="outline" size="sm" className="glass-panel hover:bg-white/5 border-white/10">
                  <Archive className="h-4 w-4 mr-2" />
                  Categories
                </Button>
              </Link>
              <Link href="/catalog/archived/products">
                <Button variant="outline" size="sm" className="glass-panel hover:bg-white/5 border-white/10">
                  <Archive className="h-4 w-4 mr-2" />
                  Products
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Categories", value: categories.length, icon: Folder, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Products", value: products?.length || 0, icon: Box, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Variants", value: variants.length, icon: Palette, color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: "Active", value: products?.filter(p => p.active).length || 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" }
          ].map((stat, i) => (
            <Card key={i} className="glass-card border-white/10 hover:bg-white/5 transition-colors">
              <CardContent className="p-4 flex items-center space-x-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center backdrop-blur-sm`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-white/10 bg-transparent">
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Folder className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No categories found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Get started by creating your first category to organize your products.
              </p>
              {canModify(user, 'catalog') && (
                <Button onClick={() => setIsCreateCategoryModalOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories.map((category) => {
            const categoryProducts = products?.filter(p => p.categoryId === category.id) || [];
            
            return (
              <div 
                key={category.id}
                className="group relative"
                data-testid={`card-category-${category.id}`}
              >
                <Link href={`/catalog/category/${category.id}`}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted glass-card border-white/10 card-hover-effect">
                    {/* Background Image / Gradient */}
                    {category.imageUrl ? (
                      <ImageWithFallback 
                        src={`/public-objects/${category.imageUrl}`}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                        <Folder className="h-16 w-16 text-white/5 group-hover:text-white/10 transition-colors" />
                      </div>
                    )}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-300 line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            {category.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                            {categoryProducts.length} Products
                          </Badge>
                          
                          {/* Product Previews */}
                          {categoryProducts.length > 0 && (
                            <div className="flex -space-x-2">
                              {categoryProducts.slice(0, 3).map((product) => (
                                <div 
                                  key={product.id} 
                                  className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 overflow-hidden"
                                >
                                  {product.primaryImageUrl ? (
                                    <ImageWithFallback 
                                      src={`/public-objects/${product.primaryImageUrl}`}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                      <Box className="h-3 w-3 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Admin Actions */}
                {canModify(user, 'catalog') && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(category);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full bg-black/50 hover:bg-red-500/80 text-white border-none backdrop-blur-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to archive "${category.name}"?`)) {
                          archiveCategoryMutation.mutate(category.id);
                        }
                      }}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <EditCategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
        />
      )}

      {/* Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
      />
    </div>
  );
}