import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Clock, Loader2 } from "lucide-react";

interface MapPreviewProps {
  origin: string;
  destination: string;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  showRoute?: boolean;
  className?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
    typeof window.google !== 'undefined' && 
    window.google?.maps !== undefined;
};

export const MapPreview = ({
  origin,
  destination,
  originCoords,
  destinationCoords,
  showRoute = true,
  className = "",
}: MapPreviewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !isGoogleMapsLoaded()) {
      setIsLoading(false);
      setError("Maps not available");
      return;
    }

    // Initialize map centered on Pakistan
    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: 33.6844, lng: 73.0479 }, // Islamabad
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(mapInstance);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!map || !isGoogleMapsLoaded()) return;

    const geocoder = new google.maps.Geocoder();
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 4,
      },
    });

    const geocodeAddress = (address: string): Promise<google.maps.LatLng> => {
      return new Promise((resolve, reject) => {
        geocoder.geocode(
          { address: address + ", Pakistan" },
          (results, status) => {
            if (status === "OK" && results?.[0]) {
              resolve(results[0].geometry.location);
            } else {
              reject(new Error(`Geocode failed for ${address}`));
            }
          }
        );
      });
    };

    const displayRoute = async () => {
      try {
        let originLatLng: google.maps.LatLng | google.maps.LatLngLiteral;
        let destLatLng: google.maps.LatLng | google.maps.LatLngLiteral;

        if (originCoords) {
          originLatLng = originCoords;
        } else if (origin) {
          originLatLng = await geocodeAddress(origin);
        } else {
          return;
        }

        if (destinationCoords) {
          destLatLng = destinationCoords;
        } else if (destination) {
          destLatLng = await geocodeAddress(destination);
        } else {
          // Just show origin marker
          new google.maps.Marker({
            position: originLatLng,
            map,
            title: origin,
          });
          map.setCenter(originLatLng);
          map.setZoom(12);
          return;
        }

        if (showRoute) {
          directionsService.route(
            {
              origin: originLatLng,
              destination: destLatLng,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                
                const leg = result.routes[0]?.legs[0];
                if (leg) {
                  setRouteInfo({
                    distance: leg.distance?.text || "N/A",
                    duration: leg.duration?.text || "N/A",
                  });
                }
              }
            }
          );
        } else {
          // Just show markers without route
          new google.maps.Marker({
            position: originLatLng,
            map,
            title: origin,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            },
          });
          new google.maps.Marker({
            position: destLatLng,
            map,
            title: destination,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            },
          });

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(originLatLng);
          bounds.extend(destLatLng);
          map.fitBounds(bounds);
        }
      } catch (err) {
        console.error("Error displaying route:", err);
      }
    };

    if (origin || destination) {
      displayRoute();
    }

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, origin, destination, originCoords, destinationCoords, showRoute]);

  if (error) {
    return (
      <Card className={`p-4 bg-muted/50 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Map preview unavailable</span>
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">{origin}</p>
          {destination && (
            <>
              <span className="text-muted-foreground">→</span>
              <p className="text-sm font-medium">{destination}</p>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="h-48 w-full" />
      {routeInfo && (
        <div className="p-3 bg-muted/50 flex items-center justify-around text-sm">
          <div className="flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-primary" />
            <span className="font-medium">{routeInfo.distance}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{routeInfo.duration}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
