import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDriverReviews, Review } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ReviewListProps {
  driverId: string;
  limit?: number;
}

const ReviewItem = ({ review }: { review: Review }) => {
  const passengerName = review.passenger?.full_name || "Passenger";
  
  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={review.passenger?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {passengerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{passengerName}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {format(new Date(review.created_at), "MMM d, yyyy")}
            </span>
          </div>
          
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= review.rating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          
          {review.comment && (
            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewList = ({ driverId, limit }: ReviewListProps) => {
  const { data: reviews, isLoading } = useDriverReviews(driverId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No reviews yet</p>
      </div>
    );
  }

  const displayReviews = limit ? reviews.slice(0, limit) : reviews;

  return (
    <div>
      {displayReviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
      {limit && reviews.length > limit && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          +{reviews.length - limit} more reviews
        </p>
      )}
    </div>
  );
};

export default ReviewList;
