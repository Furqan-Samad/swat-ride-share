import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  bookingId: string;
  driverId: string;
  onSuccess?: () => void;
}

const ReviewForm = ({ bookingId, driverId, onSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) return;

    await createReview.mutateAsync({
      bookingId,
      driverId,
      rating,
      comment: comment || undefined,
    });

    onSuccess?.();
  };

  const displayRating = hoveredRating || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Rate your experience</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  star <= displayRating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {rating === 5 && "Excellent!"}
            {rating === 4 && "Great!"}
            {rating === 3 && "Good"}
            {rating === 2 && "Fair"}
            {rating === 1 && "Poor"}
          </p>
        )}
      </div>

      <div>
        <Textarea
          placeholder="Share your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {comment.length}/500
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={rating === 0 || createReview.isPending}
      >
        {createReview.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;
