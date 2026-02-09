import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import RideCard from "@/components/RideCard";
import { Button } from "@/components/ui/button";
import { useRides } from "@/hooks/useRides";
import { useRealtimeRides } from "@/hooks/useRealtimeRides";
import { format } from "date-fns";
import { LocationPicker } from "@/components/LocationPicker";
import { useQueryClient } from "@tanstack/react-query";

const SearchRides = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const queryClient = useQueryClient();

  const { data: rides, isLoading, error, refetch, isFetching } = useRides(searchFrom, searchTo);
  
  // Enable real-time updates for seat availability
  useRealtimeRides();

  const handleSearch = () => {
    setSearchFrom(from);
    setSearchTo(to);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["rides"] });
    refetch();
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4">
        <h1 className="mb-8 text-3xl font-bold">Find Your Ride</h1>

        {/* Search Filters with Location Picker */}
        <div className="mb-8 rounded-2xl bg-card p-6 shadow-card">
          <div className="grid gap-4 md:grid-cols-3">
            <LocationPicker
              value={from}
              onChange={(value) => setFrom(value)}
              placeholder="From (e.g., Swat)"
            />
            <LocationPicker
              value={to}
              onChange={(value) => setTo(value)}
              placeholder="To (e.g., Islamabad)"
            />
            <Button 
              onClick={handleSearch}
              className="bg-gradient-hero hover:opacity-90 transition-opacity h-10 self-end"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load rides. Please try again.</p>
          </div>
        ) : (
        <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">
                {rides?.length || 0} rides available
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {rides && rides.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {rides.map((ride) => (
                  <RideCard 
                    key={ride.id}
                    id={ride.id}
                    from={ride.origin}
                    to={ride.destination}
                    date={formatDate(ride.departure_date)}
                    time={formatTime(ride.departure_time)}
                    price={ride.price_per_seat}
                    seats={ride.available_seats}
                    frontSeatsAvailable={(ride as any).front_seats_available}
                    backSeatsAvailable={(ride as any).back_seats_available}
                    frontPrice={(ride as any).front_seat_price}
                    backPrice={(ride as any).back_seat_price}
                    driver={{
                      name: ride.driver?.full_name || "Driver",
                      avatar: ride.driver?.avatar_url || undefined,
                      rating: 4.8,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-2xl">
                <p className="text-muted-foreground mb-4">No rides found for this route.</p>
                <p className="text-sm text-muted-foreground">Try different locations or check back later.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchRides;
