import { type ReactNode } from "react";
interface Notification {
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
    type: "info" | "warning" | "success" | "error";
}
interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void;
    removeNotification: (id: string) => void;
}
export declare function NotificationProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useNotifications(): NotificationContextType;
export {};
//# sourceMappingURL=notification-provider.d.ts.map