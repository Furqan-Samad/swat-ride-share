import { MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "react-router-dom";

interface RideCardProps {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  driver: {
    name: string;
    avatar?: string;
    rating: number;
  };
}

const RideCard = ({ id, from, to, date, time, price, seats, driver }: RideCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              <span>{from}</span>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <span className="text-2xl">→</span>
              <div className="h-8 w-1 bg-accent rounded-full" />
            </div>
            <div className="flex items-center space-x-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{to}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-primary">₨{price}</div>
            <div className="text-xs text-muted-foreground">per seat</div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{seats} seats</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={driver.avatar} />
              <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <div className="font-medium">{driver.name}</div>
              <div className="text-muted-foreground">★ {driver.rating}</div>
            </div>
          </div>
        </div>

        <Link to={`/ride/${id}`} className="block mt-4">
          <Button className="w-full bg-gradient-hero hover:opacity-90 transition-opacity">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default RideCard;
