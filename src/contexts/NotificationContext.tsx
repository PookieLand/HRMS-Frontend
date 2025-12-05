import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "leave" | "attendance" | "system";
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    actionUrl?: string;
    employeeName?: string;
    leaveType?: string;
    department?: string;
    [key: string]: unknown;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "isRead">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sample notifications for demo purposes
const sampleNotifications: Notification[] = [
  {
    id: generateId(),
    title: "Leave Request Approved",
    message: "Your annual leave request for Dec 25-27 has been approved by your manager.",
    type: "leave",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    isRead: false,
    metadata: {
      leaveType: "Annual",
      employeeName: "John Doe",
    },
  },
  {
    id: generateId(),
    title: "New Leave Request",
    message: "Sarah Johnson has submitted a sick leave request for review.",
    type: "leave",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    isRead: false,
    metadata: {
      leaveType: "Sick",
      employeeName: "Sarah Johnson",
      actionUrl: "/leave/pending",
    },
  },
  {
    id: generateId(),
    title: "Attendance Alert",
    message: "You haven't checked in today. Please remember to mark your attendance.",
    type: "attendance",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: false,
  },
  {
    id: generateId(),
    title: "System Maintenance",
    message: "Scheduled maintenance on Sunday, Dec 22 from 2:00 AM - 4:00 AM. The system may be unavailable during this time.",
    type: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
  },
  {
    id: generateId(),
    title: "Welcome to HRMS",
    message: "Your account has been set up successfully. Explore the dashboard to get started with managing your HR tasks.",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    isRead: true,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("hrms-notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const restored = parsed.map((n: Notification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(restored);
      } catch {
        // If parsing fails, use sample notifications
        setNotifications(sampleNotifications);
      }
    } else {
      // First time, use sample notifications
      setNotifications(sampleNotifications);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("hrms-notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "isRead">) => {
      const newNotification: Notification = {
        ...notification,
        id: generateId(),
        timestamp: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem("hrms-notifications");
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
