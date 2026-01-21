import { Star } from "lucide-react";
import { useDriverAverageRating } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";

interface DriverRatingProps {
  driverId: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

const DriverRating = ({ driverId, showCount = true, size = "md" }: DriverRatingProps) => {
  const { data: ratingData, isLoading } = useDriverAverageRating(driverId);

  const sizeClasses = {
    sm: { star: "h-3 w-3", text: "text-xs", container: "space-x-0.5" },
    md: { star: "h-4 w-4", text: "text-sm", container: "space-x-1" },
    lg: { star: "h-5 w-5", text: "text-base", container: "space-x-1" },
  };

  const classes = sizeClasses[size];

  if (isLoading) {
    return <Skeleton className="h-4 w-16" />;
  }

  if (!ratingData || ratingData.count === 0) {
    return (
      <div className={`flex items-center ${classes.container}`}>
        <Star className={`${classes.star} text-muted-foreground`} />
        <span className={`${classes.text} text-muted-foreground`}>New</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${classes.container}`}>
      <Star className={`${classes.star} text-yellow-500 fill-yellow-500`} />
      <span className={`${classes.text} font-medium`}>{ratingData.average}</span>
      {showCount && (
        <span className={`${classes.text} text-muted-foreground`}>
          ({ratingData.count})
        </span>
      )}
    </div>
  );
};

export default DriverRating;
