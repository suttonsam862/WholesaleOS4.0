import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "action";
  isRead: boolean;
  link?: string | null;
  metadata?: any;
  createdAt: string;
  readAt?: string | null;
}

export default function Notifications() {
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("PUT", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300";
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
      case "error":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300";
      case "action":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" data-testid="skeleton-title" />
          <Skeleton className="h-4 w-64" data-testid="skeleton-description" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" data-testid={`skeleton-card-title-${i}`} />
              <Skeleton className="h-4 w-1/2" data-testid={`skeleton-card-description-${i}`} />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" data-testid={`skeleton-card-content-${i}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="heading-notifications">
            Notifications
          </h1>
          <p className="text-muted-foreground" data-testid="text-notification-count">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            variant="outline"
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="heading-empty-state">
              No notifications yet
            </h3>
            <p className="text-muted-foreground text-center" data-testid="text-empty-state-description">
              When you receive notifications, they will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${
                !notification.isRead
                  ? "border-l-4 border-l-primary bg-muted/30 dark:bg-muted/10"
                  : "border-l-4 border-l-transparent"
              }`}
              data-testid={`card-notification-${notification.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle
                        className={`text-base sm:text-lg ${
                          !notification.isRead ? "font-bold" : "font-semibold"
                        }`}
                        data-testid={`text-notification-title-${notification.id}`}
                      >
                        {notification.title}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={getTypeColor(notification.type)}
                        data-testid={`badge-notification-type-${notification.id}`}
                      >
                        {notification.type}
                      </Badge>
                    </div>
                    <CardDescription
                      className="text-xs sm:text-sm"
                      data-testid={`text-notification-date-${notification.id}`}
                    >
                      {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </CardDescription>
                  </div>
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      data-testid={`button-mark-read-${notification.id}`}
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Mark Read</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-sm mb-3 ${
                    !notification.isRead ? "font-medium" : "text-muted-foreground"
                  }`}
                  data-testid={`text-notification-message-${notification.id}`}
                >
                  {notification.message}
                </p>
                {notification.link && (
                  <Link href={notification.link}>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      data-testid={`link-notification-action-${notification.id}`}
                    >
                      View Details
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
