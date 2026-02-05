import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Clock, Loader2, AlertCircle } from "lucide-react";

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

// Check if billing is enabled (Google Maps API)
const checkBillingEnabled = (): boolean => {
  // We can't directly check billing, but we can handle the error gracefully
  return true;
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
  const [billingError, setBillingError] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !isGoogleMapsLoaded()) {
      setIsLoading(false);
      setError("Maps not available");
      return;
    }

    try {
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
    } catch (err: any) {
      console.error("Map initialization error:", err);
      if (err.message?.includes("BillingNotEnabled")) {
        setBillingError(true);
      }
      setError("Could not load map");
      setIsLoading(false);
    }
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
            if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0].geometry.location);
            } else if (status === google.maps.GeocoderStatus.REQUEST_DENIED) {
              setBillingError(true);
              reject(new Error("Maps API billing not enabled"));
            } else {
              // Fallback: try to use known city coordinates
              const knownLocations: Record<string, { lat: number; lng: number }> = {
                "swat": { lat: 35.2227, lng: 72.4258 },
                "islamabad": { lat: 33.6844, lng: 73.0479 },
                "peshawar": { lat: 34.0151, lng: 71.5249 },
                "lahore": { lat: 31.5204, lng: 74.3587 },
                "karachi": { lat: 24.8607, lng: 67.0011 },
                "rawalpindi": { lat: 33.5651, lng: 73.0169 },
                "mingora": { lat: 34.7717, lng: 72.3600 },
              };
              
              const normalizedAddress = address.toLowerCase().trim();
              for (const [city, coords] of Object.entries(knownLocations)) {
                if (normalizedAddress.includes(city)) {
                  resolve(new google.maps.LatLng(coords.lat, coords.lng));
                  return;
                }
              }
              reject(new Error(`Could not locate ${address}`));
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
        console.warn("Error displaying route:", err);
        // Don't show error to user for geocoding failures
      }
    };

    if (origin || destination) {
      displayRoute();
    }

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, origin, destination, originCoords, destinationCoords, showRoute]);

  if (error || billingError) {
    return (
      <Card className={`p-4 bg-muted/30 ${className}`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Route Information</span>
          </div>
        </div>
        <div className="mt-3 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm font-medium">{origin}</p>
          </div>
          {destination && (
            <>
              <div className="text-muted-foreground">↓</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <p className="text-sm font-medium">{destination}</p>
              </div>
            </>
          )}
        </div>
        {billingError && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Interactive map requires Google Maps billing
          </p>
        )}
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
