import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "");
    
    // If starts with 0, replace with +92
    if (cleaned.startsWith("0")) {
      cleaned = "92" + cleaned.slice(1);
    }
    
    // If doesn't start with country code, assume Pakistan
    if (!cleaned.startsWith("92")) {
      cleaned = "92" + cleaned;
    }
    
    return "+" + cleaned;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "OTP Sent",
      description: "Please check your phone for the verification code",
    });
    setStep("otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome to SwatPool!",
      description: "You have successfully signed in",
    });
    
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero">
              <Phone className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {step === "phone" ? "Sign in to SwatPool" : "Enter Verification Code"}
            </CardTitle>
            <CardDescription>
              {step === "phone" 
                ? "Enter your phone number to receive a verification code" 
                : `We sent a 6-digit code to ${formatPhoneNumber(phone)}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="03XX XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 bg-gradient-hero hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 text-lg text-center tracking-widest font-mono"
                  maxLength={6}
                  disabled={loading}
                />
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 bg-gradient-hero hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep("phone")}
                  disabled={loading}
                >
                  Change phone number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
