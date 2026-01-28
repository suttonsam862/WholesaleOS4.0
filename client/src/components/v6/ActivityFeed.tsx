/**
 * V6 Activity Feed Component
 * Chronological display of entity events with commenting support
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  RefreshCw,
  Upload,
  DollarSign,
  UserCheck,
  Mail,
  Factory,
  FileText,
  Bell,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Lock,
  type LucideIcon,
} from "lucide-react";

export type ActivityType =
  | "comment"
  | "status_change"
  | "note"
  | "file_upload"
  | "file_remove"
  | "assignment"
  | "payment"
  | "email_sent"
  | "manufacturing_update"
  | "design_update"
  | "validation"
  | "system";

interface ActivityUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Activity {
  id: string;
  entityType: string;
  entityId: string;
  activityType: ActivityType;
  userId: string;
  user?: ActivityUser;
  content?: string;
  contentHtml?: string;
  metadata?: Record<string, any>;
  isInternal: boolean;
  isSystem: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  comment: MessageSquare,
  status_change: RefreshCw,
  note: FileText,
  file_upload: Upload,
  file_remove: Upload,
  assignment: UserCheck,
  payment: DollarSign,
  email_sent: Mail,
  manufacturing_update: Factory,
  design_update: Factory,
  validation: FileText,
  system: Bell,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  comment: "bg-blue-400/20 text-blue-400",
  status_change: "bg-green-400/20 text-green-400",
  note: "bg-yellow-400/20 text-yellow-400",
  file_upload: "bg-purple-400/20 text-purple-400",
  file_remove: "bg-red-400/20 text-red-400",
  assignment: "bg-teal-400/20 text-teal-400",
  payment: "bg-emerald-400/20 text-emerald-400",
  email_sent: "bg-indigo-400/20 text-indigo-400",
  manufacturing_update: "bg-orange-400/20 text-orange-400",
  design_update: "bg-pink-400/20 text-pink-400",
  validation: "bg-cyan-400/20 text-cyan-400",
  system: "bg-slate-400/20 text-slate-400",
};

interface ActivityFeedProps {
  entityType: string;
  entityId: string;
  limit?: number;
  showCommentInput?: boolean;
  showInternalToggle?: boolean;
  compact?: boolean;
  className?: string;
}

export function ActivityFeed({
  entityType,
  entityId,
  limit = 20,
  showCommentInput = true,
  showInternalToggle = true,
  compact = false,
  className,
}: ActivityFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [includeInternal, setIncludeInternal] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/v6/activity/${entityType}/${entityId}`, { includeInternal, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        includeInternal: includeInternal.toString(),
      });
      const res = await fetch(`/api/v6/activity/${entityType}/${entityId}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();
      return data.activities || [];
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; isInternal: boolean }) => {
      const res = await apiRequest("POST", `/api/v6/activity/${entityType}/${entityId}/comment`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/activity/${entityType}/${entityId}`] });
      setNewComment("");
      toast({ title: "Comment added" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async (data: { activityId: string; content: string }) => {
      const res = await apiRequest("PUT", `/api/v6/activity/comment/${data.activityId}`, {
        content: data.content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/activity/${entityType}/${entityId}`] });
      setEditingId(null);
      setEditContent("");
      toast({ title: "Comment updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await apiRequest("DELETE", `/api/v6/activity/comment/${activityId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/activity/${entityType}/${entityId}`] });
      toast({ title: "Comment deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment.trim(), isInternal });
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditContent(activity.content || "");
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    editCommentMutation.mutate({ activityId: editingId, content: editContent.trim() });
  };

  const handleDelete = (activityId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(activityId);
    }
  };

  const displayedActivities = expanded ? activities : activities.slice(0, 5);
  const hasMore = activities.length > 5;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Comment Input */}
      {showCommentInput && user && (
        <div className="space-y-2">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {user.name?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] resize-none bg-background/50"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showInternalToggle && (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-muted-foreground/30"
                      />
                      <Lock className="w-3 h-3" />
                      Internal only
                    </label>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="w-3 h-3 mr-1" />
                  {addCommentMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet
          </p>
        ) : (
          displayedActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              compact={compact}
              isEditing={editingId === activity.id}
              editContent={editContent}
              onEditContentChange={setEditContent}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => {
                setEditingId(null);
                setEditContent("");
              }}
              onDelete={handleDelete}
              currentUserId={user?.id}
              isAdmin={user?.role === "admin"}
            />
          ))
        )}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show More ({activities.length - 5} more)
            </>
          )}
        </Button>
      )}
    </div>
  );
}

interface ActivityItemProps {
  activity: Activity;
  compact?: boolean;
  isEditing?: boolean;
  editContent?: string;
  onEditContentChange?: (content: string) => void;
  onStartEdit?: (activity: Activity) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onDelete?: (activityId: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

function ActivityItem({
  activity,
  compact = false,
  isEditing = false,
  editContent = "",
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  currentUserId,
  isAdmin = false,
}: ActivityItemProps) {
  const Icon = ACTIVITY_ICONS[activity.activityType] || Bell;
  const iconColor = ACTIVITY_COLORS[activity.activityType] || "bg-slate-400/20 text-slate-400";

  const canEdit = activity.activityType === "comment" && activity.userId === currentUserId;
  const canDelete = activity.activityType === "comment" && (activity.userId === currentUserId || isAdmin);

  const getActivityText = () => {
    switch (activity.activityType) {
      case "status_change":
        return `changed status from "${activity.metadata?.previousStatus}" to "${activity.metadata?.newStatus}"`;
      case "assignment":
        return `assigned to ${activity.metadata?.assigneeName}`;
      case "file_upload":
        return `uploaded ${activity.metadata?.filename || "a file"}`;
      case "file_remove":
        return `removed ${activity.metadata?.filename || "a file"}`;
      case "payment":
        return `recorded payment of ${activity.metadata?.amount}`;
      case "email_sent":
        return `sent email to ${activity.metadata?.recipient}`;
      default:
        return activity.content;
    }
  };

  return (
    <div className={cn("flex gap-3 group", compact && "py-1")}>
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 rounded-full p-1.5 mt-0.5",
          iconColor
        )}
      >
        <Icon className="w-3 h-3" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {activity.user?.name || "System"}
              </span>
              {activity.isInternal && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  <Lock className="w-2 h-2 mr-0.5" />
                  Internal
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                {activity.isEdited && " (edited)"}
              </span>
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange?.(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className={cn("text-sm mt-0.5", compact ? "line-clamp-2" : "")}>
                {getActivityText()}
              </p>
            )}
          </div>

          {/* Actions */}
          {(canEdit || canDelete) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onStartEdit?.(activity)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(activity.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact timeline version for sidebar
interface ActivityTimelineProps {
  entityType: string;
  entityId: string;
  limit?: number;
  className?: string;
}

export function ActivityTimeline({
  entityType,
  entityId,
  limit = 10,
  className,
}: ActivityTimelineProps) {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: [`/api/v6/activity/${entityType}/${entityId}`, { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/v6/activity/${entityType}/${entityId}?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();
      return data.activities || [];
    },
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Skeleton className="w-2 h-2 rounded-full mt-1.5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {activities.length === 0 ? (
        <p className="text-xs text-muted-foreground">No activity</p>
      ) : (
        activities.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.activityType] || Bell;
          const isLast = index === activities.length - 1;

          return (
            <div key={activity.id} className="flex gap-2 items-start relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-1 top-4 bottom-0 w-px bg-border" />
              )}

              {/* Dot */}
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mt-1.5 relative z-10" />

              {/* Content */}
              <div className="flex-1 pb-3">
                <p className="text-xs text-foreground line-clamp-2">
                  {activity.user?.name || "System"}{" "}
                  <span className="text-muted-foreground">
                    {getActivityVerb(activity.activityType)}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function getActivityVerb(type: ActivityType): string {
  switch (type) {
    case "comment":
      return "commented";
    case "status_change":
      return "changed status";
    case "note":
      return "added a note";
    case "file_upload":
      return "uploaded a file";
    case "file_remove":
      return "removed a file";
    case "assignment":
      return "assigned";
    case "payment":
      return "recorded payment";
    case "email_sent":
      return "sent email";
    case "manufacturing_update":
      return "updated manufacturing";
    case "design_update":
      return "updated design";
    case "validation":
      return "ran validation";
    case "system":
      return "system update";
    default:
      return "performed action";
  }
}
