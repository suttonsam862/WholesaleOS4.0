import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { Grid, CheckCircle, Layers, Archive, AlertTriangle } from "lucide-react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";

interface Category {
  id: number;
  name: string;
  archived?: boolean;
}

interface Product {
  id: number;
  categoryId: number;
  active: boolean;
  archived?: boolean;
}

interface Variant {
  id: number;
  productId: number;
  inventoryCount?: number;
  lowStockThreshold?: number;
  archived?: boolean;
}

export default function CatalogHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/catalog"],
    retry: false,
  });

  const { data: variants = [], isLoading: variantsLoading } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
    retry: false,
  });

  const isDataLoading = categoriesLoading || productsLoading || variantsLoading;

  const counts = useMemo(() => {
    const allCategories = categories.length;
    const activeProducts = products.filter((p) => p.active && !p.archived).length;
    const productsWithVariants = new Set(variants.filter((v) => !v.archived).map((v) => v.productId)).size;
    const archivedItems = categories.filter((c) => c.archived).length + 
                          products.filter((p) => p.archived).length;
    const lowStockVariants = variants.filter((v) => {
      if (v.archived) return false;
      const threshold = v.lowStockThreshold ?? 10;
      return (v.inventoryCount ?? 0) < threshold;
    }).length;

    return {
      allCategories,
      activeProducts,
      productsWithVariants,
      archivedItems,
      lowStockVariants,
    };
  }, [categories, products, variants]);

  const cards: HubCardConfig[] = [
    {
      id: "all-categories",
      label: "All Categories",
      description: "Browse all product categories",
      icon: Grid,
      ...hubColors.blue,
      count: counts.allCategories,
      href: "/catalog/list",
    },
    {
      id: "active-products",
      label: "Active Products",
      description: "Products currently available",
      icon: CheckCircle,
      ...hubColors.green,
      count: counts.activeProducts,
      href: "/catalog/list?status=active",
    },
    {
      id: "with-variants",
      label: "With Variants",
      description: "Products that have variants",
      icon: Layers,
      ...hubColors.purple,
      count: counts.productsWithVariants,
      href: "/catalog/list?filter=has-variants",
    },
    {
      id: "archived",
      label: "Archived",
      description: "Archived categories and products",
      icon: Archive,
      ...hubColors.amber,
      count: counts.archivedItems,
      href: "/catalog/archived/categories",
    },
    {
      id: "low-stock",
      label: "Low Stock Variants",
      description: "Variants with low inventory",
      icon: AlertTriangle,
      ...hubColors.red,
      count: counts.lowStockVariants,
      href: "/catalog/list?filter=low-stock",
    },
  ];

  return (
    <LandingHub
      title="Catalog"
      subtitle="Manage your product catalog and inventory"
      cards={cards}
      viewAllHref="/catalog/list"
      viewAllLabel="View All Catalog"
      isLoading={isDataLoading}
      tip="Click on any card above to filter the catalog by that criteria. Use 'View All Catalog' for a complete list with advanced filters."
      testIdPrefix="catalog"
      hubId="catalog"
    />
  );
}
