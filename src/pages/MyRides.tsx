import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car, Calendar, MapPin, Users, Loader2, Plus, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useMyRides, Ride } from "@/hooks/useRides";
import { useRealtimeRides } from "@/hooks/useRealtimeRides";
import { format } from "date-fns";
import EditRideDialog from "@/components/EditRideDialog";
import DeleteRideDialog from "@/components/DeleteRideDialog";
import RideBookingsSheet from "@/components/RideBookingsSheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MyRides = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: rides, isLoading } = useMyRides();
  
  // Enable real-time updates
  useRealtimeRides();

  // State for dialogs
  const [editRide, setEditRide] = useState<Ride | null>(null);
  const [deleteRideId, setDeleteRideId] = useState<string | null>(null);
  const [viewBookingsRide, setViewBookingsRide] = useState<{ id: string; name: string } | null>(null);

  // Fetch active bookings count for each ride
  const { data: bookingsCounts } = useQuery({
    queryKey: ["rideBookingsCounts", rides?.map(r => r.id)],
    queryFn: async () => {
      if (!rides || rides.length === 0) return {};
      
      const { data } = await supabase
        .from("bookings")
        .select("ride_id, status")
        .in("ride_id", rides.map(r => r.id))
        .in("status", ["pending", "confirmed"]);

      const counts: Record<string, number> = {};
      data?.forEach(b => {
        counts[b.ride_id] = (counts[b.ride_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!rides && rides.length > 0,
  });

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "secondary";
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Rides</h1>
            <p className="text-muted-foreground mt-1">
              Manage your posted rides and view bookings
            </p>
          </div>
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
            {rides.map((ride) => {
              const activeBookings = bookingsCounts?.[ride.id] || 0;
              const frontSeats = ride.front_seats_available ?? 1;
              const backSeats = ride.back_seats_available ?? 3;
              const totalSeats = frontSeats + backSeats;
              
              return (
                <Card key={ride.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Ride Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getStatusVariant(ride.status)}>
                            {ride.status}
                          </Badge>
                          {activeBookings > 0 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <Users className="h-3 w-3 mr-1" />
                              {activeBookings} booking{activeBookings > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium">{ride.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <MapPin className="h-4 w-4 text-accent shrink-0" />
                          <span className="font-medium">{ride.destination}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(ride.departure_date)} at {formatTime(ride.departure_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {totalSeats} seats ({frontSeats} front, {backSeats} back)
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Front: <span className="font-semibold text-primary">₨{ride.front_seat_price ?? Math.round(ride.price_per_seat * 1.5)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Back: <span className="font-semibold text-primary">₨{ride.back_seat_price ?? ride.price_per_seat}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 self-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewBookingsRide({ 
                            id: ride.id, 
                            name: `${ride.origin} → ${ride.destination}` 
                          })}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Bookings
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/ride/${ride.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditRide(ride)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Ride
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteRideId(ride.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Ride
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Ride Dialog */}
      <EditRideDialog
        ride={editRide}
        open={!!editRide}
        onOpenChange={(open) => !open && setEditRide(null)}
      />

      {/* Delete Ride Dialog */}
      <DeleteRideDialog
        rideId={deleteRideId}
        hasActiveBookings={(bookingsCounts?.[deleteRideId || ""] || 0) > 0}
        activeBookingsCount={bookingsCounts?.[deleteRideId || ""] || 0}
        open={!!deleteRideId}
        onOpenChange={(open) => !open && setDeleteRideId(null)}
      />

      {/* View Bookings Sheet */}
      <RideBookingsSheet
        rideId={viewBookingsRide?.id || null}
        rideName={viewBookingsRide?.name || ""}
        open={!!viewBookingsRide}
        onOpenChange={(open) => !open && setViewBookingsRide(null)}
      />
    </div>
  );
};

export default MyRides;
