import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <i className="fas fa-tshirt text-primary-foreground text-2xl"></i>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">Rich Habits OS</h1>
              <p className="text-muted-foreground">
                Complete wholesale management system for custom clothing companies
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => window.location.href = '/api/login'} className="min-w-[200px]">
                  Sign In with Replit
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.location.href = '/local-login'} className="min-w-[200px]">
                  Email Login
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Manage leads, orders, manufacturing, and design workflows
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}