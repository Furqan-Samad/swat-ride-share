import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Calendar, MapPin, Loader2, Phone } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyBookings } from "@/hooks/useRides";
import { format } from "date-fns";

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useMyBookings();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "EEE, MMM d, yyyy");
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
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
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {!bookings || bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Bookings Yet</h2>
              <p className="text-muted-foreground mb-6">
                Find a ride and book your first trip
              </p>
              <Button 
                className="bg-gradient-hero hover:opacity-90"
                onClick={() => navigate("/search")}
              >
                Search Rides
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {booking.seats_booked} seat(s) booked
                      </span>
                    </div>
                    
                    {booking.rides && (
                      <>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">{booking.rides.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <MapPin className="h-4 w-4 text-accent" />
                          <span className="font-medium">{booking.rides.destination}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(booking.rides.departure_date)} at {formatTime(booking.rides.departure_time)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Price</p>
                            <p className="text-xl font-bold text-primary">
                              ₨{booking.rides.price_per_seat * booking.seats_booked}
                            </p>
                          </div>
                          
                          {booking.status === "confirmed" && booking.rides.profiles?.phone_number && (
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Driver
                            </Button>
                          )}
                        </div>
                      </>
                    )}
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

export default MyBookings;
