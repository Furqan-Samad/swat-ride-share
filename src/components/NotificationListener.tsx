import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useNotifications";

export const NotificationListener = () => {
  const { user } = useAuth();
  useRealtimeNotifications(user?.id);
  return null;
};
