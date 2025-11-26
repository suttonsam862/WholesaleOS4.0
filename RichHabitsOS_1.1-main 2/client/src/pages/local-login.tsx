
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, User, Lock, ArrowRight, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  hasPassword: boolean;
}

export default function LocalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTestUser, setSelectedTestUser] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch available test users
  const { data: testUsers = [] } = useQuery<TestUser[]>({
    queryKey: ["/api/auth/local/test-users"],
    retry: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/local/login", {
        email,
        password
      });

      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.name}!`,
      });

      // Force a full page reload to ensure session cookies are properly set
      // Use setTimeout to ensure toast is shown before redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestUserSelect = (userId: string) => {
    const user = testUsers.find(u => u.id === userId);
    if (user) {
      setEmail(user.email);
      setSelectedTestUser(userId);
      // Note: Password needs to be entered manually for security
      setPassword("");
    }
  };

  const handleReplitAuth = () => {
    // Redirect to Replit Auth
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 relative z-10 p-4"
      >
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-secondary"
          >
            Rich Habits
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground"
          >
            Sign in to your account
          </motion.p>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl shadow-black/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-primary" />
              Local Authentication
            </CardTitle>
            <CardDescription className="text-gray-400">
              Use email and password for testing different user accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Users Selector */}
            {testUsers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="test-user-select" className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-secondary" />
                  Quick Select Test User
                </Label>
                <Select value={selectedTestUser} onValueChange={handleTestUserSelect}>
                  <SelectTrigger className="bg-black/20 border-white/10 focus:ring-primary/50 text-white">
                    <SelectValue placeholder="Select a test user..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {testUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="focus:bg-primary/20 focus:text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-gray-400">
                            {user.email} • {user.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Selecting a user will fill the email field. You still need to enter the password.
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-gray-600 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-black font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/10">
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-gray-400">Alternative Login Options</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <Button
              variant="outline"
              className="w-full border-white/10 bg-transparent hover:bg-white/5 text-gray-300 hover:text-white"
              onClick={handleReplitAuth}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue with Replit Auth
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>
            For testing: Use any user created in User Management with a password set.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
