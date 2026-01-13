import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArchiveRestore, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  archived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
}

export default function ArchivedCategories() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories/archived"],
    retry: false,
  });

  const unarchiveMutation = useMutation({
    mutationFn: (categoryId: number) =>
      apiRequest("PUT", `/api/categories/${categoryId}/unarchive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) =>
      apiRequest(`/api/categories/${categoryId}?force=true`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category permanently deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  if (isLoading || categoriesLoading) {
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
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-archived-categories">
            Archived Categories
          </h1>
          <p className="text-muted-foreground">
            View and restore previously archived categories
          </p>
        </div>
        <Link href="/catalog">
          <Button variant="outline" data-testid="button-back-to-catalog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-archive text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No archived categories</h3>
              <p className="text-muted-foreground">
                Categories you archive will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {categories.map((category) => (
            <Card key={category.id} data-testid={`card-archived-category-${category.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {category.imageUrl ? (
                    <ImageWithFallback
                      src={`/public-objects/${category.imageUrl}`}
                      alt={category.name}
                      className="w-24 h-24 rounded-lg"
                      fallbackIcon={<i className="fas fa-folder text-3xl text-purple-400/40"></i>}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-folder text-3xl text-purple-400/40"></i>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" data-testid={`text-archived-category-name-${category.id}`}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-archived-category-description-${category.id}`}>
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Archived</Badge>
                      {category.archivedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(category.archivedAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Restore "${category.name}" from archive?`)) {
                          unarchiveMutation.mutate(category.id);
                        }
                      }}
                      data-testid={`button-restore-category-${category.id}`}
                    >
                      <ArchiveRestore className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    {user?.role === 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`PERMANENTLY DELETE "${category.name}"? This will archive all products in this category. This action cannot be undone.`)) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                        disabled={deleteCategoryMutation.isPending}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
