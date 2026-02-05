import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Loader2, Save, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import AvatarUpload from "@/components/AvatarUpload";
import { profileFormSchema } from "@/lib/validation";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone_number, avatar_url, emergency_contact, emergency_contact_name, is_driver")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data) {
        setFullName(data.full_name || "");
        setPhoneNumber(data.phone_number || "");
        setAvatarUrl(data.avatar_url);
        setEmergencyContactName(data.emergency_contact_name || "");
        setEmergencyContact(data.emergency_contact || "");
        setIsDriver(data.is_driver || false);
      }
      
      setFetching(false);
    };
    
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate using schema
    const validation = profileFormSchema.safeParse({
      full_name: fullName,
      phone_number: phoneNumber,
      emergency_contact: emergencyContact || undefined,
      emergency_contact_name: emergencyContactName || undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError?.message || "Please check your inputs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        emergency_contact: emergencyContact || null,
        emergency_contact_name: emergencyContactName || null,
      })
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

    toast({
      title: "Profile Updated!",
      description: "Your changes have been saved",
    });
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12 px-4 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4">
              <AvatarUpload
                userId={user?.id || ""}
                currentAvatarUrl={avatarUrl}
                onUploadComplete={setAvatarUrl}
                size="lg"
              />
            </div>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <p>Email: {user?.email}</p>
                {isDriver && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Shield className="h-3 w-3" />
                    Driver
                  </span>
                )}
              </div>

              <Separator className="my-6" />

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <Label className="text-base font-semibold">Emergency Contact</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  This contact will be available for one-tap calling during emergencies.
                </p>
                
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Contact Name (e.g., Mom, Dad)"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="pl-10 h-12"
                    disabled={loading}
                  />
                </div>
                
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Emergency Phone (03XX XXXXXXX)"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="pl-10 h-12"
                    disabled={loading}
                  />
                </div>
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
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;