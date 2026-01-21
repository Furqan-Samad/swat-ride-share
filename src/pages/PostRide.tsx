import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, DollarSign, Loader2, Armchair } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreateRide } from "@/hooks/useRides";

const PostRide = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const createRide = useCreateRide();

  const [from, setFrom] = useState("Swat");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [frontSeats, setFrontSeats] = useState("1");
  const [backSeats, setBackSeats] = useState("3");
  const [frontPrice, setFrontPrice] = useState("");
  const [backPrice, setBackPrice] = useState("");
  const [description, setDescription] = useState("");

  // Auto-calculate front price when back price changes (50% more)
  useEffect(() => {
    if (backPrice && !frontPrice) {
      setFrontPrice(String(Math.round(parseInt(backPrice) * 1.5)));
    }
  }, [backPrice]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post a ride",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!to || !date || !time || !backPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const totalSeats = parseInt(frontSeats || "0") + parseInt(backSeats || "0");
    if (totalSeats < 1) {
      toast({
        title: "Invalid Seats",
        description: "Please provide at least 1 seat",
        variant: "destructive",
      });
      return;
    }

    await createRide.mutateAsync({
      origin: from,
      destination: to,
      departure_date: date,
      departure_time: time,
      available_seats: totalSeats,
      price_per_seat: parseInt(backPrice),
      front_seat_price: parseInt(frontPrice) || Math.round(parseInt(backPrice) * 1.5),
      back_seat_price: parseInt(backPrice),
      front_seats_available: parseInt(frontSeats) || 0,
      back_seats_available: parseInt(backSeats) || 0,
      description: description || undefined,
    });

    navigate("/search");
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
      
      <div className="container py-8 px-4 max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Offer a Ride</h1>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route */}
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="From"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-accent" />
                  <Input
                    placeholder="To (e.g., Islamabad, Peshawar, Lahore)"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              {/* Seat Availability Section */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Armchair className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Seat Availability & Pricing</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Front Seats */}
                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <Label className="text-sm font-medium">Front Seats</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Count"
                        value={frontSeats}
                        onChange={(e) => setFrontSeats(e.target.value)}
                        className="pl-10"
                        min="0"
                        max="2"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Price (₨)"
                        value={frontPrice}
                        onChange={(e) => setFrontPrice(e.target.value)}
                        className="pl-10"
                        min="0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Premium seat with more space</p>
                  </div>

                  {/* Back Seats */}
                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <Label className="text-sm font-medium">Back Seats</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Count"
                        value={backSeats}
                        onChange={(e) => setBackSeats(e.target.value)}
                        className="pl-10"
                        min="0"
                        max="4"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Price (₨)"
                        value={backPrice}
                        onChange={(e) => setBackPrice(e.target.value)}
                        className="pl-10"
                        min="0"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Standard seat pricing</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Total seats: <span className="font-semibold">{(parseInt(frontSeats) || 0) + (parseInt(backSeats) || 0)}</span>
                </p>
              </div>

              {/* Description */}
              <div>
                <Textarea
                  placeholder="Add trip details (e.g., pickup points, stops, vehicle type...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
                disabled={createRide.isPending}
              >
                {createRide.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Publish Ride"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-8 rounded-xl bg-muted p-6">
          <h3 className="font-semibold mb-3">Tips for a successful trip</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Set a fair price that covers your fuel costs</li>
            <li>• Front seats typically cost 50% more than back seats</li>
            <li>• Be clear about pickup points and any stops</li>
            <li>• Respond quickly to booking requests</li>
            <li>• Keep your phone accessible on the day of travel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PostRide;