"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNav = UserNav;
const avatar_1 = require("@/components/ui/avatar");
const button_1 = require("@/components/ui/button");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
function UserNav() {
    return (<dropdown_menu_1.DropdownMenu>
      <dropdown_menu_1.DropdownMenuTrigger asChild>
        <button_1.Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <avatar_1.Avatar className="h-8 w-8">
            <avatar_1.AvatarImage src="/placeholder.svg" alt="John Doe"/>
            <avatar_1.AvatarFallback>JD</avatar_1.AvatarFallback>
          </avatar_1.Avatar>
        </button_1.Button>
      </dropdown_menu_1.DropdownMenuTrigger>
      <dropdown_menu_1.DropdownMenuContent className="w-56" align="end" forceMount>
        <dropdown_menu_1.DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">john.doe@example.com</p>
          </div>
        </dropdown_menu_1.DropdownMenuLabel>
        <dropdown_menu_1.DropdownMenuSeparator />
        <dropdown_menu_1.DropdownMenuGroup>
          <dropdown_menu_1.DropdownMenuItem>
            <lucide_react_1.User className="mr-2 h-4 w-4"/>
            <span>Profile</span>
          </dropdown_menu_1.DropdownMenuItem>
          <dropdown_menu_1.DropdownMenuItem>
            <lucide_react_1.HardHat className="mr-2 h-4 w-4"/>
            <span>Role: Foreman</span>
          </dropdown_menu_1.DropdownMenuItem>
          <dropdown_menu_1.DropdownMenuItem>
            <lucide_react_1.Settings className="mr-2 h-4 w-4"/>
            <span>Settings</span>
          </dropdown_menu_1.DropdownMenuItem>
        </dropdown_menu_1.DropdownMenuGroup>
        <dropdown_menu_1.DropdownMenuSeparator />
        <dropdown_menu_1.DropdownMenuItem asChild>
          <link_1.default href="/login">
            <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
            <span>Log out</span>
          </link_1.default>
        </dropdown_menu_1.DropdownMenuItem>
      </dropdown_menu_1.DropdownMenuContent>
    </dropdown_menu_1.DropdownMenu>);
}
//# sourceMappingURL=user-nav.js.map