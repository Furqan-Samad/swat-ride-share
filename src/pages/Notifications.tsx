import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Loader2, Calendar, Car, XCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from "@/hooks/useNotifications";

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'booking_confirmed':
      return <Check className="h-5 w-5 text-primary" />;
    case 'booking_cancelled':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'new_booking':
      return <Car className="h-5 w-5 text-primary" />;
    case 'ride_update':
      return <Calendar className="h-5 w-5 text-accent" />;
    case 'emergency':
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) => {
  return (
    <div
      className={`p-4 border-b last:border-b-0 transition-colors ${
        notification.is_read ? "bg-background" : "bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`font-medium ${notification.is_read ? "" : "font-semibold"}`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <Badge variant="secondary" className="shrink-0">New</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onMarkRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {!notifications || notifications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Notifications</h2>
              <p className="text-muted-foreground">
                You'll see booking updates and alerts here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markRead.mutate(id)}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Notifications;
