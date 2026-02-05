import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Share2, Loader2, User, Car } from "lucide-react";
import { useLiveLocation, Location } from "@/hooks/useLiveLocation";
import { useToast } from "@/hooks/use-toast";

interface LiveLocationMapProps {
  bookingId: string;
  isDriver: boolean;
  pickupLocation: string;
  dropLocation: string;
  className?: string;
}

const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
    typeof window.google !== 'undefined' && 
    window.google?.maps !== undefined;
};

export const LiveLocationMap = ({
  bookingId,
  isDriver,
  pickupLocation,
  dropLocation,
  className = "",
}: LiveLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [myMarker, setMyMarker] = useState<google.maps.Marker | null>(null);
  const [otherMarker, setOtherMarker] = useState<google.maps.Marker | null>(null);
  const { toast } = useToast();

  const {
    myLocation,
    otherLocation,
    isSharing,
    error,
    startSharing,
    stopSharing,
  } = useLiveLocation({ bookingId, isDriver, enabled: true });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !isGoogleMapsLoaded()) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 35.2227, lng: 72.4258 }, // Swat coordinates
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(mapInstance);
  }, []);

  // Update my location marker
  useEffect(() => {
    if (!map || !myLocation) return;

    if (myMarker) {
      myMarker.setPosition({ lat: myLocation.lat, lng: myLocation.lng });
    } else {
      const marker = new google.maps.Marker({
        position: { lat: myLocation.lat, lng: myLocation.lng },
        map,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isDriver ? "#2563eb" : "#16a34a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      setMyMarker(marker);
    }

    // Center map on first location
    if (!otherLocation) {
      map.setCenter({ lat: myLocation.lat, lng: myLocation.lng });
    }
  }, [map, myLocation, isDriver]);

  // Update other party's location marker
  useEffect(() => {
    if (!map || !otherLocation) return;

    if (otherMarker) {
      otherMarker.setPosition({ lat: otherLocation.lat, lng: otherLocation.lng });
    } else {
      const marker = new google.maps.Marker({
        position: { lat: otherLocation.lat, lng: otherLocation.lng },
        map,
        title: isDriver ? "Passenger Location" : "Driver Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isDriver ? "#16a34a" : "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      setOtherMarker(marker);
    }

    // Fit bounds to show both markers
    if (myLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: myLocation.lat, lng: myLocation.lng });
      bounds.extend({ lat: otherLocation.lat, lng: otherLocation.lng });
      map.fitBounds(bounds);
      // Slight zoom out for better visibility
      const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
      });
    }
  }, [map, otherLocation, myLocation, isDriver]);

  // Cleanup markers
  useEffect(() => {
    return () => {
      myMarker?.setMap(null);
      otherMarker?.setMap(null);
    };
  }, []);

  const handleToggleSharing = () => {
    if (isSharing) {
      stopSharing();
      toast({
        title: "Location Sharing Stopped",
        description: "You are no longer sharing your location",
      });
    } else {
      startSharing();
      toast({
        title: "Location Sharing Started",
        description: `Your location is now visible to the ${isDriver ? 'passenger' : 'driver'}`,
      });
    }
  };

  if (!isGoogleMapsLoaded()) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <MapPin className="h-6 w-6 mr-2" />
          <span>Map not available</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-3 bg-muted/50 flex items-center justify-between border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Navigation className="h-4 w-4 text-primary" />
          Live Location
        </div>
        <Button
          size="sm"
          variant={isSharing ? "destructive" : "default"}
          onClick={handleToggleSharing}
          disabled={!!error}
        >
          {isSharing ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Stop Sharing
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 mr-1" />
              Share Location
            </>
          )}
        </Button>
      </div>

      <div ref={mapRef} className="h-64 w-full" />

      <div className="p-3 bg-muted/30 flex items-center justify-around text-xs">
        <div className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-full ${isDriver ? "bg-blue-600" : "bg-green-600"}`} />
          <span>You ({isDriver ? "Driver" : "Passenger"})</span>
        </div>
        {otherLocation && (
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${isDriver ? "bg-green-600" : "bg-blue-600"}`} />
            <span>{isDriver ? "Passenger" : "Driver"} (Live)</span>
          </div>
        )}
        {!otherLocation && (
          <span className="text-muted-foreground">
            Waiting for {isDriver ? "passenger" : "driver"} location...
          </span>
        )}
      </div>
    </Card>
  );
};