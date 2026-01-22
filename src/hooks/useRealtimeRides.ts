import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeRides = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("rides-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          // Invalidate and refetch rides queries when seat availability changes
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
          
          // Also update the specific ride if it's being viewed
          if (payload.new?.id) {
            queryClient.invalidateQueries({ queryKey: ["ride", payload.new.id] });
            queryClient.invalidateQueries({ queryKey: ["rideWithDriver", payload.new.id] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
        },
        () => {
          // Refetch when new rides are added
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rides",
        },
        () => {
          // Refetch when rides are deleted
          queryClient.invalidateQueries({ queryKey: ["rides"] });
          queryClient.invalidateQueries({ queryKey: ["ridesWithDriver"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
