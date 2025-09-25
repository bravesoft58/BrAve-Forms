"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProvider = NotificationProvider;
exports.useNotifications = useNotifications;
const react_1 = require("react");
const use_toast_1 = require("@/components/ui/use-toast");
const NotificationContext = (0, react_1.createContext)(undefined);
function NotificationProvider({ children }) {
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const { toast } = (0, use_toast_1.useToast)();
    // Load notifications from localStorage on mount
    (0, react_1.useEffect)(() => {
        const storedNotifications = localStorage.getItem("notifications");
        if (storedNotifications) {
            try {
                setNotifications(JSON.parse(storedNotifications));
            }
            catch (error) {
                console.error("Error parsing notifications:", error);
            }
        }
        else {
            // Set some demo notifications
            const demoNotifications = [
                {
                    id: "1",
                    title: "New Form Submitted",
                    message: "A new Dust Control Log has been submitted for Downtown High-Rise",
                    date: new Date().toISOString(),
                    read: false,
                    type: "info",
                },
                {
                    id: "2",
                    title: "Inspection Required",
                    message: "SWPPP inspection is due for Riverside Apartments",
                    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    read: false,
                    type: "warning",
                },
                {
                    id: "3",
                    title: "Project Updated",
                    message: "Central Park Renovation project details have been updated",
                    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    read: true,
                    type: "success",
                },
            ];
            setNotifications(demoNotifications);
            localStorage.setItem("notifications", JSON.stringify(demoNotifications));
        }
    }, []);
    // Save notifications to localStorage whenever they change
    (0, react_1.useEffect)(() => {
        localStorage.setItem("notifications", JSON.stringify(notifications));
    }, [notifications]);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const markAsRead = (id) => {
        setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    };
    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    };
    const addNotification = (notification) => {
        const newNotification = {
            ...notification,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            read: false,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        // Also show a toast notification
        toast({
            title: notification.title,
            description: notification.message,
        });
    };
    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };
    return (<NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            addNotification,
            removeNotification,
        }}>
      {children}
    </NotificationContext.Provider>);
}
function useNotifications() {
    const context = (0, react_1.useContext)(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
//# sourceMappingURL=notification-provider.js.map