import { useAuth } from "@/hooks/useAuth";
import { useBookingNotifications } from "@/hooks/useBookingNotifications";

export const BookingNotificationListener = () => {
  const { user } = useAuth();
  useBookingNotifications(user?.id);
  return null;
};
