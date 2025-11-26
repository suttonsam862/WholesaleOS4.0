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
  archived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
}

export default function ArchivedVariants() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: variants = [], isLoading: variantsLoading } = useQuery<Variant[]>({
    queryKey: ["/api/variants/archived"],
    retry: false,
  });

  const unarchiveMutation = useMutation({
    mutationFn: (variantId: number) =>
      apiRequest("PUT", `/api/variants/${variantId}/unarchive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      toast({
        title: "Success",
        description: "Variant restored successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restore variant",
        variant: "destructive",
      });
    },
  });

  if (isLoading || variantsLoading) {
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
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-archived-variants">
            Archived Product Variants
          </h1>
          <p className="text-muted-foreground">
            View and restore previously archived product variants
          </p>
        </div>
        <Link href="/catalog">
          <Button variant="outline" data-testid="button-back-to-catalog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </Link>
      </div>

      {variants.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-archive text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No archived variants</h3>
              <p className="text-muted-foreground">
                Product variants you archive will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {variants.map((variant) => (
            <Card key={variant.id} data-testid={`card-archived-variant-${variant.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {variant.imageUrl ? (
                    <img
                      src={`/public-objects/${variant.imageUrl}`}
                      alt={variant.variantCode}
                      className="w-24 h-24 object-cover rounded-lg"
                      data-testid={`img-archived-variant-${variant.id}`}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-palette text-3xl text-orange-400/40"></i>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg" data-testid={`text-archived-variant-code-${variant.id}`}>
                        {variant.variantCode}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {variant.color && <Badge variant="outline">Color: {variant.color}</Badge>}
                      {variant.size && <Badge variant="outline">Size: {variant.size}</Badge>}
                      {variant.material && <Badge variant="outline">{variant.material}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Archived</Badge>
                      {variant.archivedAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(variant.archivedAt), "MMM d, yyyy")}
                        </span>
                      )}
                      {variant.msrp && (
                        <span className="text-sm font-medium ml-2">MSRP: ${variant.msrp}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Restore variant "${variant.variantCode}" from archive?`)) {
                        unarchiveMutation.mutate(variant.id);
                      }
                    }}
                    data-testid={`button-restore-variant-${variant.id}`}
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
