"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";
import {
  useNotifications,
  type Notification,
} from "@/contexts/NotificationContext";

// Get icon for notification type
function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "success":
      return (
        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
      );
    case "warning":
      return (
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
      );
    case "error":
      return <AlertCircle className="size-4 text-red-600 dark:text-red-400" />;
    case "leave":
      return <Calendar className="size-4 text-blue-600 dark:text-blue-400" />;
    case "attendance":
      return <Clock className="size-4 text-violet-600 dark:text-violet-400" />;
    case "system":
      return <Users className="size-4 text-orange-600 dark:text-orange-400" />;
    case "info":
    default:
      return <Info className="size-4 text-slate-600 dark:text-slate-400" />;
  }
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Single notification item component
function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          "group relative rounded-lg border p-3 transition-all duration-200",
          notification.isRead
            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
        )}
      >
        {/* Unread indicator dot */}
        {!notification.isRead && (
          <span className="absolute top-3 right-3 size-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
        )}

        <CollapsibleTrigger asChild>
          <button className="w-full text-left cursor-pointer">
            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className={cn(
                      "text-sm truncate text-zinc-900 dark:text-zinc-100",
                      notification.isRead ? "font-medium" : "font-semibold",
                    )}
                  >
                    {notification.title}
                  </h4>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {formatRelativeTime(notification.timestamp)}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  >
                    {notification.type}
                  </Badge>
                </div>
              </div>

              {/* Expand indicator */}
              <div className="shrink-0 text-zinc-400 dark:text-zinc-500">
                {isExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {notification.message}
            </p>

            {/* Metadata */}
            {notification.metadata && (
              <div className="mt-2 flex flex-wrap gap-2">
                {notification.metadata.employeeName && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {notification.metadata.employeeName}
                  </Badge>
                )}
                {notification.metadata.leaveType && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {notification.metadata.leaveType} Leave
                  </Badge>
                )}
                {notification.metadata.department && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {notification.metadata.department}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              {!notification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <Check className="size-3" />
                  Mark as read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
              >
                <Trash2 className="size-3" />
                Remove
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Notification list component
function NotificationList({
  notifications,
  emptyMessage,
  onMarkAsRead,
  onRemove,
}: {
  notifications: Notification[];
  emptyMessage: string;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <Bell className="size-6 text-zinc-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

// Main notification panel component
export function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
  } = useNotifications();

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-5 text-zinc-700 dark:text-zinc-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 min-w-5 px-1.5 text-[11px] font-bold text-white bg-red-500 dark:bg-red-600 rounded-full shadow-sm border-2 border-white dark:border-zinc-900">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800"
      >
        {/* Custom close button positioned better */}
        <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary z-10">
          <X className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span className="sr-only">Close</span>
        </SheetClose>

        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={markAllAsRead}
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="unread" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 bg-white dark:bg-zinc-900">
            <TabsList className="w-full grid grid-cols-2 bg-zinc-100 dark:bg-zinc-800 p-1 h-10">
              <TabsTrigger
                value="unread"
                className="gap-1.5 h-8 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
              >
                Unread
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full bg-red-500 text-white">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="read"
                className="h-8 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
              >
                Read
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Unread tab */}
          <TabsContent
            value="unread"
            className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full">
              <div className="px-4 py-3">
                <NotificationList
                  notifications={unreadNotifications}
                  emptyMessage="No unread notifications"
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Read tab */}
          <TabsContent
            value="read"
            className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full">
              <div className="px-4 py-3">
                <NotificationList
                  notifications={readNotifications}
                  emptyMessage="No read notifications"
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {notifications.length > 0 && (
          <SheetFooter className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-zinc-900">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-red-600 dark:text-red-400 border-zinc-300 dark:border-zinc-700 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800"
              onClick={clearAll}
            >
              <Trash2 className="size-4" />
              Clear all notifications
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
