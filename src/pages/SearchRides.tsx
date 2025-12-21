import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import RideCard from "@/components/RideCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRides } from "@/hooks/useRides";
import { format } from "date-fns";

const SearchRides = () => {
  const [from, setFrom] = useState("Swat");
  const [to, setTo] = useState("");
  const [searchFrom, setSearchFrom] = useState("Swat");
  const [searchTo, setSearchTo] = useState("");

  const { data: rides, isLoading, error } = useRides(searchFrom, searchTo);

  const handleSearch = () => {
    setSearchFrom(from);
    setSearchTo(to);
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

        {/* Search Filters */}
        <div className="mb-8 rounded-2xl bg-card p-6 shadow-card">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="From"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-gradient-hero hover:opacity-90 transition-opacity"
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
                    driver={{
                      name: "Driver",
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
