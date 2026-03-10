import { useState, useEffect } from "react";
import { Car, LogOut, User, Menu, Ticket, CarFront, Settings, Users, Bell, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user's avatar from profile
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) {
        setAvatarUrl(null);
        return;
      }
      
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    
    fetchAvatar();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name;
    if (name) {
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

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

        <div className="flex items-center space-x-2">
          {user && <NotificationBell />}
          
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center font-medium">
                    <User className="mr-2 h-4 w-4" />
                    {user.user_metadata?.full_name || user.email || "My Profile"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/my-rides" className="flex items-center">
                    <CarFront className="mr-2 h-4 w-4" />
                    My Rides
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-bookings" className="flex items-center">
                    <Ticket className="mr-2 h-4 w-4" />
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/manage-bookings" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Requests
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/driver-earnings" className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Earnings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          
          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/search">Find Ride</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/post-ride">Offer Ride</Link>
              </DropdownMenuItem>
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-rides">My Rides</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings">My Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/manage-bookings">Manage Requests</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
