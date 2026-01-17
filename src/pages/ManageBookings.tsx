import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, MapPin, Loader2, Check, X, Phone } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useDriverBookingRequests, useUpdateBookingStatus } from "@/hooks/useBookingManagement";
import { format } from "date-fns";

const ManageBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useDriverBookingRequests();
  const updateStatus = useUpdateBookingStatus();

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

  const pendingBookings = bookings?.filter(b => b.status === "pending") || [];
  const otherBookings = bookings?.filter(b => b.status !== "pending") || [];

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
        <h1 className="text-3xl font-bold mb-8">Manage Booking Requests</h1>

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">{pendingBookings.length}</Badge>
              Pending Requests
            </h2>
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={booking.passenger?.avatar_url || undefined} />
                          <AvatarFallback>
                            {booking.passenger?.full_name?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {booking.passenger?.full_name || "Passenger"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.seats_booked} seat(s) requested
                          </p>
                        </div>
                      </div>

                      {booking.ride && (
                        <div className="flex-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.ride.origin} → {booking.ride.destination}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(booking.ride.departure_date)} at {formatTime(booking.ride.departure_time)}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "confirmed" })}
                          disabled={updateStatus.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus.mutate({ bookingId: booking.id, status: "cancelled" })}
                          disabled={updateStatus.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Bookings */}
        {otherBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Requests</h2>
            <div className="space-y-4">
              {otherBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.passenger?.avatar_url || undefined} />
                          <AvatarFallback>
                            {booking.passenger?.full_name?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {booking.passenger?.full_name || "Passenger"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.seats_booked} seat(s)
                          </p>
                        </div>
                      </div>

                      {booking.ride && (
                        <div className="flex-1 text-sm text-muted-foreground">
                          <span>{booking.ride.origin} → {booking.ride.destination}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        {booking.status === "confirmed" && booking.passenger?.phone_number && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${booking.passenger.phone_number}`}>
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(!bookings || bookings.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Booking Requests</h2>
              <p className="text-muted-foreground">
                When passengers book your rides, their requests will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
