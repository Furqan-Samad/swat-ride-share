import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Car, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import AvatarUpload from "@/components/AvatarUpload";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<"profile" | "role">("profile");
  const [loading, setLoading] = useState(false);
  
  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      // Pre-fill from user metadata
      setFullName(user.user_metadata?.full_name || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user!.id,
        full_name: fullName,
        phone_number: phoneNumber,
        profile_completed: true,
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

    setStep("role");
  };

  const handleRoleSelect = async (isDriver: boolean) => {
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ is_driver: isDriver })
      .eq("id", user!.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (isDriver) {
      navigate("/vehicle-setup");
    } else {
      toast({
        title: "Profile Complete!",
        description: "You can now search and book rides",
      });
      navigate("/search");
    }
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
            {step === "profile" ? (
              <div className="mb-4">
                <AvatarUpload
                  userId={user?.id || ""}
                  currentAvatarUrl={avatarUrl}
                  onUploadComplete={setAvatarUrl}
                  size="lg"
                />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero">
                <CheckCircle className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
            <CardTitle className="text-2xl">
              {step === "profile" ? "Complete Your Profile" : "How will you use SwatPool?"}
            </CardTitle>
            <CardDescription>
              {step === "profile" 
                ? "Add your details to get started" 
                : "Choose your primary role"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === "profile" ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Phone Number (03XX XXXXXXX)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-12"
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
                    "Continue"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5"
                  onClick={() => handleRoleSelect(false)}
                  disabled={loading}
                >
                  <User className="h-6 w-6" />
                  <span>I'm a Passenger</span>
                  <span className="text-xs text-muted-foreground">Find and book rides</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5"
                  onClick={() => handleRoleSelect(true)}
                  disabled={loading}
                >
                  <Car className="h-6 w-6" />
                  <span>I'm a Driver</span>
                  <span className="text-xs text-muted-foreground">Offer rides and earn</span>
                </Button>

                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
