import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, Loader2, Navigation, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Declare google maps types
declare global {
  interface Window {
    google?: typeof google;
  }
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  onDistanceCalculated?: (distance: { text: string; value: number } | null) => void;
  compareWithCoords?: { lat: number; lng: number };
}

interface Suggestion {
  place_id: string;
  description: string;
}

// Check if Google Maps API is loaded
const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
    typeof window.google !== 'undefined' && 
    window.google?.maps?.places !== undefined;
};

export const LocationPicker = ({
  value,
  onChange,
  placeholder = "Enter location",
  label,
  error,
  onDistanceCalculated,
  compareWithCoords,
}: LocationPickerProps) => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(isGoogleMapsLoaded());
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync inputValue with external value prop
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Initialize Google Maps services
  useEffect(() => {
    if (isGoogleMapsLoaded()) {
      setMapsLoaded(true);
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required by API)
      const div = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, []);

  // Debounced search
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'pk' }, // Restrict to Pakistan
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(
              predictions.map((p) => ({
                place_id: p.place_id,
                description: p.description,
              }))
            );
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      console.error('Place search error:', error);
    }
  }, []);

  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapsLoaded) {
        searchPlaces(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, searchPlaces, mapsLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Always update parent state immediately for manual input
    onChange(newValue);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    
    // Get coordinates for the selected place
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: suggestion.place_id, fields: ['geometry'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            onChange(suggestion.description, {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          } else {
            onChange(suggestion.description);
          }
        }
      );
    } else {
      onChange(suggestion.description);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapsLoaded) {
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsLoading(false);
              if (status === 'OK' && results?.[0]) {
                const address = results[0].formatted_address;
                setInputValue(address);
                onChange(address, { lat: latitude, lng: longitude });
              } else {
                const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setInputValue(coordsString);
                onChange(coordsString, { lat: latitude, lng: longitude });
                toast({
                  title: "Location found",
                  description: "Using coordinates as address lookup failed.",
                });
              }
            }
          );
        } else {
          setIsLoading(false);
          const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setInputValue(coordsString);
          onChange(coordsString, { lat: latitude, lng: longitude });
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      }
    );
  };

  const hasError = !!error;

  return (
    <div className="relative space-y-2">
      {label && (
        <Label className={`text-sm font-medium ${hasError ? "text-destructive" : ""}`}>
          {label}
        </Label>
      )}
      <div className="relative">
        <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${hasError ? "text-destructive" : "text-muted-foreground"}`} />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => {
            // Delay hiding to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`pl-10 pr-20 ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleGetCurrentLocation}
            title="Use current location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 py-2 max-h-60 overflow-auto shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.place_id}-${index}`}
              type="button"
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-start gap-2"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{suggestion.description}</span>
            </button>
          ))}
        </Card>
      )}

      {!mapsLoaded && (
        <p className="text-xs text-muted-foreground">
          <Search className="h-3 w-3 inline mr-1" />
          Enter location manually (Maps autocomplete unavailable)
        </p>
      )}
    </div>
  );
};