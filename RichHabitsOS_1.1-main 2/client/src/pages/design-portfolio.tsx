import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Image, Star, MessageSquare, Calendar, Download, Eye } from "lucide-react";

const helpItems = [
  {
    question: "How do I add a design to my portfolio?",
    answer: "Completed designs are automatically added to your portfolio when a design job is marked as 'completed'. You can also manually add designs from the Design Jobs page.",
  },
  {
    question: "Can clients see my portfolio?",
    answer: "Your portfolio is visible to team members and can be shared with clients via a public link. Go to Settings to manage portfolio visibility and generate shareable links.",
  },
  {
    question: "How are designs rated?",
    answer: "Client feedback and internal reviews contribute to design ratings. Ratings are on a 5-star scale and help track your most successful designs.",
    example: "5 stars = Exceptional, 4 stars = Great, 3 stars = Good, 2 stars = Needs improvement, 1 star = Revision required"
  },
  {
    question: "What's the difference between 'Featured' and 'All Designs'?",
    answer: "Featured designs are your best work that you've manually selected to showcase. All Designs shows every completed project in chronological order.",
  }
];

interface Design {
  id: number;
  title: string;
  client: string;
  category: string;
  completedDate: string;
  imageUrl?: string;
  rating: number;
  feedbackCount: number;
  revisions: number;
  isFeatured: boolean;
}

interface PortfolioDesign {
  id: number;
  designJobId: number;
  designerId: string;
  title: string;
  client: string | null;
  category: string | null;
  completedDate: string | null;
  imageUrls: string[] | null;
  rating: number | null;
  feedbackCount: number | null;
  revisions: number | null;
  isFeatured: boolean | null;
  archived: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function DesignPortfolio() {
  const { data: portfolioDesigns = [], isLoading } = useQuery<PortfolioDesign[]>({
    queryKey: ["/api/design-portfolios"],
  });

  // Map backend data to frontend format
  const designs: Design[] = portfolioDesigns.map(p => ({
    id: p.id,
    title: p.title,
    client: p.client || 'Unknown Client',
    category: p.category || 'General',
    completedDate: p.completedDate || new Date().toISOString().split('T')[0],
    imageUrl: p.imageUrls?.[0],
    rating: p.rating || 0,
    feedbackCount: p.feedbackCount || 0,
    revisions: p.revisions || 0,
    isFeatured: p.isFeatured || false,
  }));

  const featuredDesigns = designs.filter(d => d.isFeatured);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-design-portfolio">Design Portfolio</h1>
          <p className="text-muted-foreground">Showcase your completed designs and client feedback</p>
        </div>
        <HelpButton pageTitle="Design Portfolio" helpItems={helpItems} />
      </div>

      {/* Portfolio Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-designs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Designs</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designs.length}</div>
            <p className="text-xs text-muted-foreground">Completed projects</p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-rating">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designs.length > 0 ? (designs.reduce((acc, d) => acc + d.rating, 0) / designs.length).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-feedback">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {designs.reduce((acc, d) => acc + d.feedbackCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total comments</p>
          </CardContent>
        </Card>

        <Card data-testid="card-featured">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredDesigns.length}</div>
            <p className="text-xs text-muted-foreground">Showcase pieces</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Tabs */}
      <Tabs defaultValue="featured" className="w-full">
        <TabsList>
          <TabsTrigger value="featured" data-testid="tab-featured">Featured</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-designs">All Designs</TabsTrigger>
          <TabsTrigger value="by-category" data-testid="tab-by-category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredDesigns.map((design) => (
              <Card key={design.id} className="overflow-hidden" data-testid={`design-card-${design.id}`}>
                <div className="aspect-video bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                  {design.imageUrl ? (
                    <ImageWithFallback src={design.imageUrl} alt={design.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="h-16 w-16 text-white opacity-50" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{design.title}</CardTitle>
                      <CardDescription>{design.client}</CardDescription>
                    </div>
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{design.category}</Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>{design.rating}.0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {design.feedbackCount} feedback
                    </span>
                    <span>{design.revisions} revisions</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-${design.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-download-${design.id}`}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {designs.map((design) => (
              <Card key={design.id} data-testid={`design-row-${design.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-white opacity-50" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{design.title}</div>
                      <div className="text-sm text-muted-foreground">{design.client}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline" className="text-xs">{design.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(design.completedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{design.rating}.0</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{design.feedbackCount} reviews</div>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-category" className="mt-6">
          <div className="space-y-6">
            {['Logo Design', 'Packaging', 'Apparel', 'Marketing'].map((category) => {
              const categoryDesigns = designs.filter(d => d.category === category);
              if (categoryDesigns.length === 0) return null;
              
              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3">{category} ({categoryDesigns.length})</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {categoryDesigns.map((design) => (
                      <Card key={design.id} className="overflow-hidden" data-testid={`category-design-${design.id}`}>
                        <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                          <Image className="h-12 w-12 text-white opacity-50" />
                        </div>
                        <CardContent className="p-3">
                          <div className="font-medium text-sm truncate">{design.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{design.client}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {design.rating}.0
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 text-xs">View</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
