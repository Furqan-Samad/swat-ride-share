import { useState } from "react";
import { Users, X, Phone, Loader2, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useRideBookings, useDeleteBookingFromRide, RideBooking } from "@/hooks/useRideManagement";

interface RideBookingsSheetProps {
  rideId: string | null;
  rideName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RideBookingsSheet = ({ rideId, rideName, open, onOpenChange }: RideBookingsSheetProps) => {
  const { data: bookings, isLoading } = useRideBookings(rideId || "");
  const deleteBooking = useDeleteBookingFromRide();
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<{ id: string; name: string } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const activeBookings = bookings?.filter(b => b.status === "confirmed" || b.status === "pending") || [];
  const cancelledBookings = bookings?.filter(b => b.status === "cancelled") || [];

  const handleDeleteBooking = async () => {
    if (!deleteConfirmBooking || !rideId) return;
    
    await deleteBooking.mutateAsync({ bookingId: deleteConfirmBooking.id, rideId });
    setDeleteConfirmBooking(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seat Bookings
            </SheetTitle>
            <SheetDescription>
              {rideName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Active Bookings */}
                {activeBookings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Active Bookings ({activeBookings.length})
                    </h3>
                    <div className="space-y-3">
                      {activeBookings.map((booking) => (
                        <Card key={booking.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={booking.passenger?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {booking.passenger?.full_name?.charAt(0) || "P"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {booking.passenger?.full_name || "Unknown Passenger"}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{booking.seats_booked} {booking.seat_type || "back"} seat(s)</span>
                                    <Badge variant={getStatusColor(booking.status)} className="text-xs">
                                      {booking.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {booking.passenger?.phone_number && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={`tel:${booking.passenger.phone_number}`}>
                                      <Phone className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteConfirmBooking({
                                    id: booking.id,
                                    name: booking.passenger?.full_name || "this passenger"
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancelled Bookings */}
                {cancelledBookings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Cancelled Bookings ({cancelledBookings.length})
                    </h3>
                    <div className="space-y-2">
                      {cancelledBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {booking.passenger?.full_name?.charAt(0) || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <p>{booking.passenger?.full_name || "Unknown"}</p>
                              <p className="text-muted-foreground">
                                {booking.seats_booked} seat(s)
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Cancelled
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!bookings || bookings.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No bookings yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Booking Confirmation */}
      <AlertDialog open={!!deleteConfirmBooking} onOpenChange={(open) => !open && setDeleteConfirmBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the booking for {deleteConfirmBooking?.name}? 
              The seat(s) will be restored and made available for other passengers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmBooking(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBooking}
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Booking"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RideBookingsSheet;
