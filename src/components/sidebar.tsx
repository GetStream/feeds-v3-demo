"use client";

import { useUser } from "../hooks/useUser";
import { useNotifications } from "../hooks/useNotifications";
import { Avatar } from "./avatar";
import {
  Bell,
  Bookmark,
  Home,
  LogOut,
  Search,
  TrendingUp,
  User2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/assets/img/logo.png";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
  { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
  { icon: TrendingUp, label: "Trending", href: "/trending" },
  { icon: User2, label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const { user, clearUser } = useUser();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-start justify-between flex-[0.2] p-4 h-screen space-y-2 sticky top-0">
      <div>
        <div className="mb-8 px-4">
          <img src={Logo.src} className="h-8" alt="Logo" />
        </div>

        {/* Navigation Items */}
        {sidebarItems.map(({ icon: Icon, label, href }) => (
          <Link
            href={href}
            key={label}
            className={`flex items-center space-x-2 py-3 px-4 my-3 rounded-full cursor-pointer transition-all duration-200 w-full relative ${
              href === pathname
                ? "bg-blue-500 text-white shadow-lg"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <div className="relative">
              <Icon className="text-2xl" />
              {/* Notification Badge */}
              {label === "Notifications" && unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>
            <span className="text-xl font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* User Profile Section */}
      <div className="mt-auto pt-8 w-full">
        <div className="flex items-center space-x-3 px-4 py-3 cursor-pointer">
          <Avatar userName={user?.name} userId={user?.id} size="md" />
          <div className="flex-1">
            <div className="text-white font-medium">
              {user ? user.name : "..."}
            </div>
            <div className="text-gray-400 text-xs">
              {user ? `@${user.id}` : "@..."}
            </div>
          </div>
          <div
            onClick={clearUser}
            className="p-1 hover:bg-gray-700 rounded-full p-2 transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={15} />
          </div>
        </div>
      </div>
    </div>
  );
}
