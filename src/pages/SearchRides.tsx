import { useState } from "react";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import RideCard from "@/components/RideCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock data - will be replaced with real data later
const mockRides = [
  {
    id: "1",
    from: "Swat",
    to: "Islamabad",
    date: "Dec 2, 2025",
    time: "08:00 AM",
    price: 1500,
    seats: 3,
    driver: {
      name: "Ahmed Khan",
      rating: 4.8,
    },
  },
  {
    id: "2",
    from: "Swat",
    to: "Peshawar",
    date: "Dec 2, 2025",
    time: "10:30 AM",
    price: 800,
    seats: 2,
    driver: {
      name: "Bilal Shah",
      rating: 4.9,
    },
  },
  {
    id: "3",
    from: "Swat",
    to: "Lahore",
    date: "Dec 3, 2025",
    time: "06:00 AM",
    price: 2500,
    seats: 4,
    driver: {
      name: "Usman Ali",
      rating: 4.7,
    },
  },
  {
    id: "4",
    from: "Swat",
    to: "Islamabad",
    date: "Dec 3, 2025",
    time: "02:00 PM",
    price: 1600,
    seats: 2,
    driver: {
      name: "Zain Malik",
      rating: 4.9,
    },
  },
];

const SearchRides = () => {
  const [from, setFrom] = useState("Swat");
  const [to, setTo] = useState("");

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
            <Button className="bg-gradient-hero hover:opacity-90 transition-opacity">
              Search
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            {mockRides.length} rides available
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {mockRides.map((ride) => (
            <RideCard key={ride.id} {...ride} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchRides;
