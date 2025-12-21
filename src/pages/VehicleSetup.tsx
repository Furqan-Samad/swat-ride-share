import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Palette, Hash, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

const VehicleSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  // Vehicle fields
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [seatsAvailable, setSeatsAvailable] = useState("4");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleType || !vehicleMake || !vehicleModel || !vehicleColor || !licensePlate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("vehicles")
      .upsert({
        driver_id: user!.id,
        vehicle_type: vehicleType,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : null,
        vehicle_color: vehicleColor,
        license_plate: licensePlate.toUpperCase(),
        seats_available: parseInt(seatsAvailable),
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
      title: "Vehicle Registered!",
      description: "You can now start offering rides",
    });
    
    navigate("/post-ride");
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
      
      <div className="container py-12 px-4 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-hero">
              <Car className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Register Your Vehicle</CardTitle>
            <CardDescription>
              Add your vehicle details to start offering rides
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Vehicle Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="pickup">Pickup Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Make (e.g., Toyota)"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="h-12"
                    disabled={loading}
                  />
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Model (e.g., Corolla)"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="h-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Year (e.g., 2020)"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    className="h-12"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    disabled={loading}
                  />
                </div>
                <div className="relative">
                  <Palette className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Color"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="pl-10 h-12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="relative">
                <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="License Plate (e.g., ABC-1234)"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="pl-10 h-12 uppercase"
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Select value={seatsAvailable} onValueChange={setSeatsAvailable}>
                  <SelectTrigger className="h-12 pl-10">
                    <SelectValue placeholder="Available Seats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Seat</SelectItem>
                    <SelectItem value="2">2 Seats</SelectItem>
                    <SelectItem value="3">3 Seats</SelectItem>
                    <SelectItem value="4">4 Seats</SelectItem>
                    <SelectItem value="5">5 Seats</SelectItem>
                    <SelectItem value="6">6 Seats</SelectItem>
                    <SelectItem value="7">7+ Seats</SelectItem>
                  </SelectContent>
                </Select>
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
                  "Register Vehicle"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleSetup;
