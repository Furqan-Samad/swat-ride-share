import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

interface LiveLocationOptions {
  bookingId: string;
  isDriver: boolean;
  enabled?: boolean;
}

// Store live locations in-memory with realtime channel broadcasts
const locationChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export const useLiveLocation = ({ bookingId, isDriver, enabled = true }: LiveLocationOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [otherLocation, setOtherLocation] = useState<Location | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Broadcast location to channel
  const broadcastLocation = useCallback((location: Location) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: isDriver ? 'driver-location' : 'passenger-location',
      payload: {
        userId: user?.id,
        location,
      },
    });
  }, [isDriver, user?.id]);

  // Start watching position
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
        };
        setMyLocation(newLocation);
        broadcastLocation(newLocation);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message);
        setIsSharing(false);
        toast({
          title: "Location Error",
          description: "Could not access your location. Please check permissions.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [broadcastLocation, toast]);

  // Stop watching position
  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  }, []);

  // Set up realtime channel
  useEffect(() => {
    if (!enabled || !bookingId || !user) return;

    const channelName = `live-location-${bookingId}`;
    
    // Check if channel already exists
    let channel = locationChannels.get(channelName);
    if (!channel) {
      channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      });
      locationChannels.set(channelName, channel);
    }

    // Listen for location updates from the other party
    const eventToListen = isDriver ? 'passenger-location' : 'driver-location';
    channel.on('broadcast', { event: eventToListen }, (payload) => {
      if (payload.payload?.location) {
        setOtherLocation(payload.payload.location);
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel ?? null;
      }
    });

    return () => {
      stopSharing();
      if (channel) {
        supabase.removeChannel(channel);
        locationChannels.delete(channelName);
      }
      channelRef.current = null;
    };
  }, [bookingId, isDriver, user, enabled, stopSharing]);

  return {
    myLocation,
    otherLocation,
    isSharing,
    error,
    startSharing,
    stopSharing,
  };
};

// Hook to get one-time current location
export const useCurrentLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  return { location, loading, error, getCurrentLocation };
};