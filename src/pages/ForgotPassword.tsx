import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: "Invalid email", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    // Do not reveal whether the email exists. Supabase handles this safely.
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
    toast({
      title: "Check your inbox",
      description: "If an account exists for that email, we've sent reset instructions.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-12 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero">
              {sent ? <CheckCircle2 className="h-8 w-8 text-primary-foreground" /> : <Mail className="h-8 w-8 text-primary-foreground" />}
            </div>
            <CardTitle className="text-2xl">{sent ? "Check Your Email" : "Forgot Password"}</CardTitle>
            <CardDescription>
              {sent
                ? "If an account exists for that email, you'll receive a reset link shortly. The link expires in 30 minutes."
                : "Enter your email and we'll send you a secure link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full h-12 bg-gradient-hero hover:opacity-90" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center">
              <Link to="/auth" className="inline-flex items-center text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
