import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sparkles,
  Layers,
  Type,
  ImageIcon,
  History,
  ArrowLeft,
  Wand2,
  PenTool,
} from "lucide-react";

export function DesignLab() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();

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

  const features = [
    {
      id: "ai-generation",
      icon: Wand2,
      title: "AI Generation",
      description: "Generate base front and back designs using AI",
    },
    {
      id: "typography-iteration",
      icon: Type,
      title: "Typography Iteration",
      description: "Customize text styles and placements",
    },
    {
      id: "logo-placement",
      icon: ImageIcon,
      title: "Logo Placement",
      description: "Add and position logos with locked overlays",
    },
    {
      id: "version-history",
      icon: History,
      title: "Version History",
      description: "Track changes and restore previous versions",
    },
    {
      id: "layer-management",
      icon: Layers,
      title: "Layer Management",
      description: "Organize design elements with layers",
    },
    {
      id: "finalize-export",
      icon: PenTool,
      title: "Finalize & Export",
      description: "Finalize designs and attach to jobs",
    },
  ];

  return (
    <div className={cn("p-6 max-w-6xl mx-auto", isMobile && "p-4")}>
      <div className="mb-6">
        <Link href="/design-jobs" data-testid="link-back-to-design-jobs">
          <Button variant="ghost" className="mb-4 -ml-2" data-testid="button-back-to-design-jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Design Jobs
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
            <Sparkles className="h-6 w-6 text-violet-500" />
          </div>
          <h1 className={cn("text-2xl font-bold", isMobile && "text-xl")} data-testid="text-design-lab-title">
            AI Design Lab
          </h1>
        </div>
        <p className="text-muted-foreground">
          Create stunning designs with AI-powered generation and iteration tools
        </p>
      </div>

      <Card className="mb-6 border-2 border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5" data-testid="card-coming-soon">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-violet-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2" data-testid="text-coming-soon">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            The AI Design Lab is currently under development. Soon you'll be able to create 
            AI-powered designs with typography iteration, logo placement, and version control.
          </p>
          <Button disabled className="gap-2" data-testid="button-start-design-project">
            <Sparkles className="h-4 w-4" />
            Start Design Project
          </Button>
        </CardContent>
      </Card>

      <h3 className="text-lg font-semibold mb-4">Planned Features</h3>
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
      )}>
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.id} className="border border-border/50" data-testid={`card-feature-${feature.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base" data-testid={`text-feature-title-${feature.id}`}>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription data-testid={`text-feature-desc-${feature.id}`}>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
