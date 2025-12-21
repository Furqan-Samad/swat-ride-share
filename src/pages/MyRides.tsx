import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car, Calendar, MapPin, Users, Loader2, Plus } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyRides } from "@/hooks/useRides";
import { format } from "date-fns";

const MyRides = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: rides, isLoading } = useMyRides();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "EEE, MMM d");
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Rides</h1>
          <Link to="/post-ride">
            <Button className="bg-gradient-hero hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Post New Ride
            </Button>
          </Link>
        </div>

        {!rides || rides.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Rides Posted Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start offering rides and earn money while traveling
              </p>
              <Link to="/post-ride">
                <Button className="bg-gradient-hero hover:opacity-90">
                  Post Your First Ride
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <Card key={ride.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{ride.origin}</span>
                        <span className="text-muted-foreground">→</span>
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="font-medium">{ride.destination}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(ride.departure_date)} at {formatTime(ride.departure_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {ride.available_seats} seats
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={ride.status === "active" ? "default" : "secondary"}>
                        {ride.status}
                      </Badge>
                      <span className="text-xl font-bold text-primary">
                        ₨{ride.price_per_seat}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRides;
