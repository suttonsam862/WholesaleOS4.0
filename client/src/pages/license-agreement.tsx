import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function LicenseAgreement() {
  const [accepted, setAccepted] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/license/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "1.0" })
      });
      if (!response.ok) throw new Error("Failed to accept license");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "License accepted", description: "Thank you for accepting our terms." });
      setLocation("/leads");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to accept license agreement.", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg border border-border p-8">
        <h1 className="text-3xl font-bold mb-6">User License Agreement</h1>
        
        <div className="prose prose-sm dark:prose-invert max-w-none mb-8 bg-muted/50 rounded p-6 max-h-[500px] overflow-y-auto">
          <h2>Terms and Conditions</h2>
          
          <p>This User License Agreement ("Agreement") is entered into between you and Rich Habits OS ("Company"). By accessing and using our application, you agree to be bound by the terms and conditions set forth in this Agreement.</p>

          <h3>1. Grant of License</h3>
          <p>The Company grants you a limited, non-exclusive, non-transferable license to use this application for your business purposes, subject to the terms and conditions of this Agreement.</p>

          <h3>2. Restrictions</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Reverse engineer, decompile, or attempt to discover the source code</li>
            <li>Use the application for illegal activities or to violate any laws</li>
            <li>Share your account credentials with unauthorized third parties</li>
            <li>Attempt to gain unauthorized access to the system</li>
            <li>Remove or alter any proprietary notices or labels</li>
          </ul>

          <h3>3. Intellectual Property</h3>
          <p>The application and all related content, features, and functionality are owned by the Company, its licensors, or other providers of such material and are protected by copyright, trademark, and other intellectual property laws.</p>

          <h3>4. User Data</h3>
          <p>You retain ownership of all data you input into the application. The Company will use this data solely for the purpose of providing and improving the service.</p>

          <h3>5. Limitation of Liability</h3>
          <p>To the fullest extent permitted by law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the application.</p>

          <h3>6. Termination</h3>
          <p>The Company reserves the right to terminate or suspend your access to the application at any time, for any reason, without prior notice.</p>

          <h3>7. Changes to Terms</h3>
          <p>The Company reserves the right to modify this Agreement at any time. Continued use of the application constitutes acceptance of any changes.</p>

          <h3>8. Governing Law</h3>
          <p>This Agreement is governed by and construed in accordance with the laws of the jurisdiction in which the Company is located, without regard to its conflicts of law principles.</p>
        </div>

        <div className="flex items-center space-x-3 mb-6">
          <Checkbox 
            id="accept" 
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            data-testid="checkbox-accept-license"
          />
          <label htmlFor="accept" className="text-sm font-medium cursor-pointer">
            I have read and agree to the User License Agreement
          </label>
        </div>

        <Button 
          onClick={() => acceptMutation.mutate()}
          disabled={!accepted || acceptMutation.isPending}
          className="w-full"
          data-testid="button-accept-license"
        >
          {acceptMutation.isPending ? "Accepting..." : "Accept and Continue"}
        </Button>
      </div>
    </div>
  );
}
