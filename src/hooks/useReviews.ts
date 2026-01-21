import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export interface Review {
  id: string;
  booking_id: string;
  driver_id: string;
  passenger_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  passenger?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Validation schema for review input
const reviewSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  driverId: z.string().uuid("Invalid driver ID"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().max(500, "Comment must be less than 500 characters").optional(),
});

export const useDriverReviews = (driverId: string) => {
  return useQuery({
    queryKey: ["driverReviews", driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch passenger profiles
      const passengerIds = [...new Set((data || []).map(r => r.passenger_id))];
      
      if (passengerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", passengerIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return (data || []).map(review => ({
        ...review,
        passenger: profileMap.get(review.passenger_id) || null
      })) as Review[];
    },
    enabled: !!driverId,
  });
};

export const useDriverAverageRating = (driverId: string) => {
  return useQuery({
    queryKey: ["driverRating", driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("driver_id", driverId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }

      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: Math.round((sum / data.length) * 10) / 10,
        count: data.length,
      };
    },
    enabled: !!driverId,
  });
};

export const useBookingReview = (bookingId: string) => {
  return useQuery({
    queryKey: ["bookingReview", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!bookingId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      driverId, 
      rating, 
      comment 
    }: { 
      bookingId: string; 
      driverId: string; 
      rating: number; 
      comment?: string;
    }) => {
      // Validate input
      const validationResult = reviewSchema.safeParse({ bookingId, driverId, rating, comment });
      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to leave a review");

      // Sanitize comment
      const sanitizedComment = comment?.trim().slice(0, 500) || null;

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          driver_id: driverId,
          passenger_id: user.id,
          rating,
          comment: sanitizedComment,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("You have already reviewed this ride");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driverReviews", variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ["driverRating", variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ["bookingReview", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      toast({ title: "Review Submitted!", description: "Thank you for your feedback" });
    },
    onError: (error: Error) => {
      toast({ title: "Review Failed", description: error.message, variant: "destructive" });
    },
  });
};
