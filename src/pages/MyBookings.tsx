import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Calendar, MapPin, Loader2, Star, XCircle, Copy, Check, Navigation } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useMyBookings, Booking } from "@/hooks/useRides";
import { useBookingReview } from "@/hooks/useReviews";
import { useCancelBooking } from "@/hooks/usePassengerCancellation";
import ReviewForm from "@/components/ReviewForm";
import { CancelBookingDialog } from "@/components/CancelBookingDialog";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import { EmergencyContactButton } from "@/components/EmergencyContactButton";
import { WhatsAppContactButton } from "@/components/WhatsAppContactButton";
import { LiveLocationMap } from "@/components/LiveLocationMap";
import { format } from "date-fns";
import { generateBookingReference } from "@/lib/idGenerator";
import { useRealtimeRides } from "@/hooks/useRealtimeRides";

const BookingCard = ({ booking }: { booking: Booking }) => {
  const navigate = useNavigate();
  const { data: existingReview } = useBookingReview(booking.id);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLiveLocation, setShowLiveLocation] = useState(false);
  const cancelBooking = useCancelBooking();
  const bookingRef = generateBookingReference(booking.id);

  const copyBookingRef = async () => {
    await navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const driverPhone = booking.rides?.profiles?.phone_number;

  const handleCancelBooking = async (reason: string) => {
    if (!booking.rides) return;
    
    await cancelBooking.mutateAsync({
      bookingId: booking.id,
      rideId: booking.ride_id,
      seatsBooked: booking.seats_booked,
      seatType: booking.seat_type as 'front' | 'back',
      reason,
    });
  };

  const canReview = booking.status === "confirmed" && !existingReview;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const seatTypeLabel = booking.seat_type === 'front' ? 'Front' : 'Back';
  const isToday = booking.rides && new Date(booking.rides.departure_date).toDateString() === new Date().toDateString();
  const canShowLiveLocation = booking.status === "confirmed" && isToday;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
              <PaymentStatusBadge bookingId={booking.id} />
              <span className="text-sm text-muted-foreground">
                {booking.seats_booked} {seatTypeLabel} seat(s)
              </span>
            </div>
            <button 
              onClick={copyBookingRef}
              className="flex items-center gap-1 text-xs font-mono bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
              title="Click to copy"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {bookingRef}
            </button>
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
                
                <div className="flex gap-2 flex-wrap justify-end">
                  {canShowLiveLocation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLiveLocation(!showLiveLocation)}
                      className={showLiveLocation ? "bg-primary/10" : ""}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      {showLiveLocation ? "Hide Map" : "Live Track"}
                    </Button>
                  )}

                  {booking.status === "confirmed" && driverPhone && (
                    <WhatsAppContactButton
                      phoneNumber={driverPhone}
                      message={`Hi! About my booking from ${booking.rides?.origin} to ${booking.rides?.destination}`}
                      size="sm"
                      showLabel={false}
                      showFallbackCall={true}
                    />
                  )}
                  
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  
                  {canReview && (
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm">
                          <Star className="h-4 w-4 mr-1" />
                          Rate
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rate Your Ride</DialogTitle>
                        </DialogHeader>
                        <ReviewForm
                          bookingId={booking.id}
                          driverId={booking.rides.driver_id}
                          onSuccess={() => setReviewDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {existingReview && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {existingReview.rating}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Live Location Map */}
              {showLiveLocation && canShowLiveLocation && booking.rides && (
                <div className="pt-4 border-t">
                  <LiveLocationMap
                    bookingId={booking.id}
                    isDriver={false}
                    pickupLocation={booking.rides.origin}
                    dropLocation={booking.rides.destination}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      <CancelBookingDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelBooking}
        bookingDetails={{
          origin: booking.rides?.origin,
          destination: booking.rides?.destination,
          seats: booking.seats_booked,
        }}
      />
    </Card>
  );
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useMyBookings();

  // Enable real-time updates for booking changes
  useRealtimeRides();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      <EmergencyContactButton />
    </div>
  );
};

export default MyBookings;
