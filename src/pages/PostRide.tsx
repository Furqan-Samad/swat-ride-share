import { useState } from "react";
import { MapPin, Calendar, Users, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PostRide = () => {
  const { toast } = useToast();
  const [from, setFrom] = useState("Swat");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!to || !date || !time || !seats || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Would send to backend here
    toast({
      title: "Ride Posted!",
      description: "Your ride has been published successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Offer a Ride</h1>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route */}
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="From"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-accent" />
                  <Input
                    placeholder="To (e.g., Islamabad, Peshawar, Lahore)"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              {/* Seats & Price */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Available seats"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="pl-10"
                    min="1"
                    max="6"
                    required
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Price per seat (₨)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-10"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Textarea
                  placeholder="Add trip details (e.g., pickup points, stops, vehicle type...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
              >
                Publish Ride
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-8 rounded-xl bg-muted p-6">
          <h3 className="font-semibold mb-3">Tips for a successful trip</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Set a fair price that covers your fuel costs</li>
            <li>• Be clear about pickup points and any stops</li>
            <li>• Respond quickly to booking requests</li>
            <li>• Keep your phone accessible on the day of travel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PostRide;
