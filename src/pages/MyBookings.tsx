import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Calendar, MapPin, Loader2, Phone, Star, XCircle } from "lucide-react";
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
import { EmergencyContactButton } from "@/components/EmergencyContactButton";
import { format } from "date-fns";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const BookingCard = ({ booking }: { booking: Booking }) => {
  const navigate = useNavigate();
  const { data: existingReview } = useBookingReview(booking.id);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelBooking = useCancelBooking();

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
  const formattedPhone = driverPhone?.replace(/\D/g, '');

  const handleWhatsApp = () => {
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}`, '_blank');
    }
  };

  const handleCall = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    }
  };

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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Badge variant={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {booking.seats_booked} {seatTypeLabel} seat(s)
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
                
                <div className="flex gap-2 flex-wrap justify-end">
                  {booking.status === "confirmed" && driverPhone && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white hover:text-white border-0"
                        onClick={handleWhatsApp}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCall}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </>
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
