import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Star, Phone, MessageCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRide, useCreateBooking } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: ride, isLoading, error } = useRide(id || "");
  const createBooking = useCreateBooking();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const handleBookRide = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book a ride",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!id) return;

    await createBooking.mutateAsync({ rideId: id, seats: 1 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Ride not found</h1>
          <p className="text-muted-foreground mb-6">This ride may have been cancelled or doesn't exist.</p>
          <Link to="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const driverName = "Driver";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-4xl">
        <Link to="/search" className="inline-block mb-6 text-primary hover:underline">
          ← Back to Search
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-lg mb-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{ride.origin}</span>
                    </div>
                    <div className="flex items-center space-x-3 my-4 ml-2">
                      <div className="h-12 w-1 bg-primary rounded-full" />
                      <span className="text-3xl text-muted-foreground">→</span>
                      <div className="h-12 w-1 bg-accent rounded-full" />
                    </div>
                    <div className="flex items-center space-x-2 text-lg">
                      <MapPin className="h-5 w-5 text-accent" />
                      <span className="font-semibold">{ride.destination}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">₨{ride.price_per_seat}</div>
                    <div className="text-sm text-muted-foreground">per seat</div>
                  </div>
                </div>

                <div className="space-y-3 py-4 border-y border-border">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>{formatDate(ride.departure_date)} at {formatTime(ride.departure_time)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>{ride.available_seats} seats available</span>
                  </div>
                </div>

                {ride.description && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Trip Description</h3>
                    <p className="text-muted-foreground">{ride.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Driver Info & Actions */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Avatar className="h-24 w-24 mx-auto mb-3">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      DR
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{driverName}</h3>
                  <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                </div>

                <div className="flex items-center justify-center space-x-6 py-4 border-y border-border">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-lg font-semibold">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span>4.8</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-lg font-semibold">New</div>
                    <div className="text-xs text-muted-foreground">Driver</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
                    onClick={handleBookRide}
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Book Ride
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Phone className="mr-2 h-4 w-4" />
                    Contact After Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetails;
