import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, Users, Star, Phone, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const RideDetails = () => {
  const { id } = useParams();

  // Mock data - will be replaced with real data
  const ride = {
    id: id,
    from: "Swat",
    to: "Islamabad",
    date: "Dec 2, 2025",
    time: "08:00 AM",
    price: 1500,
    seats: 3,
    description: "Comfortable ride in Toyota Corolla. Leaving early morning to avoid traffic. Will make one stop for breakfast.",
    driver: {
      name: "Ahmed Khan",
      rating: 4.8,
      trips: 45,
      avatar: "",
      phone: "+92 300 1234567",
      verified: true,
    },
    pickupPoints: [
      "Mingora Main Chowk",
      "Saidu Sharif Hospital",
      "Motorway Entrance",
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-4xl">
        <Link to="/search" className="inline-block mb-6 text-primary hover:underline">
          ← Back to Search
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-lg mb-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{ride.from}</span>
                    </div>
                    <div className="flex items-center space-x-3 my-4 ml-2">
                      <div className="h-12 w-1 bg-primary rounded-full" />
                      <span className="text-3xl text-muted-foreground">→</span>
                      <div className="h-12 w-1 bg-accent rounded-full" />
                    </div>
                    <div className="flex items-center space-x-2 text-lg">
                      <MapPin className="h-5 w-5 text-accent" />
                      <span className="font-semibold">{ride.to}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">₨{ride.price}</div>
                    <div className="text-sm text-muted-foreground">per seat</div>
                  </div>
                </div>

                <div className="space-y-3 py-4 border-y border-border">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>{ride.date} at {ride.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>{ride.seats} seats available</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Trip Description</h3>
                  <p className="text-muted-foreground">{ride.description}</p>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Pickup Points</h3>
                  <ul className="space-y-2">
                    {ride.pickupPoints.map((point, index) => (
                      <li key={index} className="flex items-center space-x-2 text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Info & Actions */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Avatar className="h-24 w-24 mx-auto mb-3">
                    <AvatarImage src={ride.driver.avatar} />
                    <AvatarFallback className="text-2xl">{ride.driver.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{ride.driver.name}</h3>
                  {ride.driver.verified && (
                    <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center space-x-6 py-4 border-y border-border">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-lg font-semibold">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span>{ride.driver.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-lg font-semibold">{ride.driver.trips}</div>
                    <div className="text-xs text-muted-foreground">Trips</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button className="w-full bg-gradient-hero hover:opacity-90 transition-opacity">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Book Ride
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetails;
