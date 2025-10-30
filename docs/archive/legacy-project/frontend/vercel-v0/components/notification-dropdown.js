"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDropdown = NotificationDropdown;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const notification_provider_1 = require("@/components/notification-provider");
const date_fns_1 = require("date-fns");
function NotificationDropdown() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = (0, notification_provider_1.useNotifications)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const handleNotificationClick = (id) => {
        markAsRead(id);
        setOpen(false);
    };
    return (<dropdown_menu_1.DropdownMenu open={open} onOpenChange={setOpen}>
      <dropdown_menu_1.DropdownMenuTrigger asChild>
        <button_1.Button variant="ghost" size="icon" className="relative">
          <lucide_react_1.Bell className="h-5 w-5"/>
          {unreadCount > 0 && (<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {unreadCount}
            </span>)}
          <span className="sr-only">Notifications</span>
        </button_1.Button>
      </dropdown_menu_1.DropdownMenuTrigger>
      <dropdown_menu_1.DropdownMenuContent align="end" className="w-80">
        <dropdown_menu_1.DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (<button_1.Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto py-1 px-2 text-xs">
              Mark all as read
            </button_1.Button>)}
        </dropdown_menu_1.DropdownMenuLabel>
        <dropdown_menu_1.DropdownMenuSeparator />
        <dropdown_menu_1.DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (notifications.map((notification) => (<dropdown_menu_1.DropdownMenuItem key={notification.id} className={`flex flex-col items-start p-3 ${!notification.read ? "bg-muted/50" : ""}`} onClick={() => handleNotificationClick(notification.id)}>
                <div className="flex w-full justify-between">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {(0, date_fns_1.formatDistanceToNow)(new Date(notification.date), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
              </dropdown_menu_1.DropdownMenuItem>))) : (<div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>)}
        </dropdown_menu_1.DropdownMenuGroup>
      </dropdown_menu_1.DropdownMenuContent>
    </dropdown_menu_1.DropdownMenu>);
}
//# sourceMappingURL=notification-dropdown.js.map