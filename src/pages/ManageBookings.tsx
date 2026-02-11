import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, MapPin, Loader2, Check, X, Phone, MessageCircle, Navigation, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useDriverBookingRequests, useUpdateBookingStatus } from "@/hooks/useBookingManagement";
import { WhatsAppContactButton } from "@/components/WhatsAppContactButton";
import { LiveLocationMap } from "@/components/LiveLocationMap";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import PaymentVerificationCard from "@/components/PaymentVerificationCard";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import { useDriverPayments } from "@/hooks/usePayments";
import { format } from "date-fns";

// Individual booking card component with live location toggle
const BookingCard = ({ booking, formatDate, formatTime, getStatusColor, updateStatus }: any) => {
  const [showLiveLocation, setShowLiveLocation] = useState(false);
  const isToday = booking.ride && new Date(booking.ride.departure_date).toDateString() === new Date().toDateString();
  const canShowLiveLocation = booking.status === "confirmed" && isToday;

  return (
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

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
            <PaymentStatusBadge bookingId={booking.id} />
            
            {canShowLiveLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLiveLocation(!showLiveLocation)}
                className={showLiveLocation ? "bg-primary/10" : ""}
              >
                <Navigation className="h-4 w-4 mr-1" />
                {showLiveLocation ? "Hide" : "Track"}
              </Button>
            )}
            
            {booking.status === "confirmed" && booking.passenger?.phone_number && (
              <>
                <WhatsAppContactButton
                  phoneNumber={booking.passenger.phone_number}
                  message={`Hi! About your booking on my ride from ${booking.ride?.origin} to ${booking.ride?.destination}`}
                  size="sm"
                  showLabel={false}
                  showFallbackCall={false}
                />
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${booking.passenger.phone_number}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Live Location Map for Driver */}
        {showLiveLocation && canShowLiveLocation && booking.ride && (
          <div className="mt-4 pt-4 border-t">
            <LiveLocationMap
              bookingId={booking.id}
              isDriver={true}
              pickupLocation={booking.ride.origin}
              dropLocation={booking.ride.destination}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ManageBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useDriverBookingRequests();
  const { data: payments } = useDriverPayments();
  const updateStatus = useUpdateBookingStatus();

  // Enable real-time updates for booking changes
  useRealtimeBookings();

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
                <BookingCard 
                  key={booking.id}
                  booking={booking}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  updateStatus={updateStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment Verification Section */}
        {payments && payments.filter(p => p.payment_status === 'pending_verification' || p.payment_status === 'cash_pending').length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Pending Payments
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {payments
                .filter(p => p.payment_status === 'pending_verification' || p.payment_status === 'cash_pending')
                .map((payment) => (
                  <PaymentVerificationCard key={payment.id} payment={payment} />
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
