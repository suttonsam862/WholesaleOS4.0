import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, Clock, AlertCircle, XCircle, Plus, Search, Filter, Edit2, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Task, InsertTask } from "@shared/schema";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
}

interface TaskWithUsers extends Task {
  assignedTo?: User;
  createdBy?: User;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "in_progress", label: "In Progress", icon: AlertCircle, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  { value: "medium", label: "Medium", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

export default function Tasks() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithUsers | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  // Form states
  const [formData, setFormData] = useState<Partial<InsertTask>>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assignedToUserId: "",
    dueDate: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithUsers[]>({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users/for-assignment"],
    retry: false,
  });

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assignedTo?.name?.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && task.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter && task.priority !== priorityFilter) return false;

      // Assignee filter
      if (assigneeFilter && task.assignedToUserId !== assigneeFilter) return false;

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      acc[status.value] = filteredTasks.filter(task => task.status === status.value);
      return acc;
    }, {} as Record<string, TaskWithUsers[]>);
  }, [filteredTasks]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: Partial<InsertTask>) => {
      // Clean up empty strings for optional fields
      const cleanData: any = {
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        pageKey: data.pageKey || undefined,
      };
      
      // Only include dueDate if it has a value
      if (data.dueDate && data.dueDate !== "") {
        cleanData.dueDate = data.dueDate;
      }
      
      // Only include assignedToUserId if it has a value and is not the placeholder
      if (data.assignedToUserId && data.assignedToUserId !== "" && data.assignedToUserId !== " ") {
        cleanData.assignedToUserId = data.assignedToUserId;
      }
      
      return apiRequest("/api/tasks", {
        method: "POST",
        body: cleanData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      setIsCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        assignedToUserId: "",
        dueDate: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertTask> }) => {
      // Clean up empty strings for optional fields
      const cleanData: any = {
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        pageKey: data.pageKey || undefined,
      };
      
      // Only include dueDate if it has a value
      if (data.dueDate && data.dueDate !== "") {
        cleanData.dueDate = data.dueDate;
      }
      
      // Only include assignedToUserId if it has a value and is not the placeholder
      if (data.assignedToUserId && data.assignedToUserId !== "" && data.assignedToUserId !== " ") {
        cleanData.assignedToUserId = data.assignedToUserId;
      }
      
      return apiRequest(`/api/tasks/${id}`, {
        method: "PUT",
        body: cleanData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      setIsEditModalOpen(false);
      setEditingTask(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      setDeleteTaskId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    createTaskMutation.mutate(formData);
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    updateTaskMutation.mutate({
      id: editingTask.id,
      data: formData,
    });
  };

  const openEditModal = (task: TaskWithUsers) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignedToUserId: task.assignedToUserId || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    });
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusOption) return null;
    const Icon = statusOption.icon;
    return (
      <Badge className={cn("border", statusOption.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);
    if (!priorityOption) return null;
    return (
      <Badge variant="outline" className={cn("border", priorityOption.color)}>
        {priorityOption.label}
      </Badge>
    );
  };

  if (isLoading || tasksLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and to-dos</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          data-testid="button-create-task"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card border-white/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 text-white"
                data-testid="input-search-tasks"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-priority-filter">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Priorities</SelectItem>
                {PRIORITY_OPTIONS.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SearchableSelect
              options={[
                { value: "", label: "All Assignees" },
                ...users.map(u => ({ value: u.id, label: u.name }))
              ]}
              value={assigneeFilter}
              onValueChange={setAssigneeFilter}
              placeholder="Filter by assignee"
              searchPlaceholder="Search users..."
              testId="select-assignee-filter"
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_OPTIONS.map(status => {
          const Icon = status.icon;
          const statusTasks = groupedTasks[status.value] || [];
          
          return (
            <Card key={status.value} className="glass-card border-white/10 bg-black/20" data-testid={`card-status-${status.value}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <div className={cn("w-3 h-3 rounded-full", status.color.split(' ')[0].replace('/20', ''))} />
                    {status.label}
                  </span>
                  <Badge variant="secondary" className="bg-white/10 text-white">{statusTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="p-3 glass-card border-white/5 hover:bg-white/5 transition-all cursor-pointer" 
                    data-testid={`card-task-${task.id}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-white/10"
                            onClick={() => openEditModal(task)}
                            data-testid={`button-edit-task-${task.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTaskId(task.id)}
                            data-testid={`button-delete-task-${task.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(task.priority)}
                        {task.assignedTo && (
                          <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                            {task.assignedTo.firstName} {task.assignedTo.lastName}
                          </Badge>
                        )}
                        {task.dueDate && (
                          <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(task.dueDate), "MMM d")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {statusTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass-panel border-white/10" data-testid="dialog-create-task">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add a new task to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-foreground">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-foreground">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="assignee" className="text-foreground">Assign To</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Unassigned" },
                  ...users.map(u => ({ value: u.id, label: u.name }))
                ]}
                value={formData.assignedToUserId}
                onValueChange={(value) => setFormData({ ...formData, assignedToUserId: value })}
                placeholder="Select user"
                searchPlaceholder="Search users..."
                testId="select-task-assignee"
              />
            </div>
            <div>
              <Label htmlFor="dueDate" className="text-foreground">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-task-due-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              data-testid="button-cancel-create"
              className="border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!formData.title || createTaskMutation.isPending}
              data-testid="button-submit-create"
              className="bg-primary hover:bg-primary/90"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-panel border-white/10" data-testid="dialog-edit-task">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-foreground">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-edit-task-title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-foreground">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-edit-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status" className="text-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-edit-task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority" className="text-foreground">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-edit-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-assignee" className="text-foreground">Assign To</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Unassigned" },
                  ...users.map(u => ({ value: u.id, label: u.name }))
                ]}
                value={formData.assignedToUserId}
                onValueChange={(value) => setFormData({ ...formData, assignedToUserId: value })}
                placeholder="Select user"
                searchPlaceholder="Search users..."
                testId="select-edit-task-assignee"
              />
            </div>
            <div>
              <Label htmlFor="edit-dueDate" className="text-foreground">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-edit-task-due-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              data-testid="button-cancel-edit"
              className="border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              disabled={!formData.title || updateTaskMutation.isPending}
              data-testid="button-submit-edit"
              className="bg-primary hover:bg-primary/90"
            >
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent data-testid="dialog-delete-task" className="glass-panel border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete" className="border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskId && deleteTaskMutation.mutate(deleteTaskId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}