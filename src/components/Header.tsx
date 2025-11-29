import { Car } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SwatPool</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Find Ride
          </Link>
          <Link to="/post-ride" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Offer Ride
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Sign In
          </Button>
          <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
