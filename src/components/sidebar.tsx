"use client";

import {
  MdHome,
  MdSearch,
  MdNotificationsNone,
  MdBookmarkBorder,
  MdPerson,
  MdTrendingUp,
} from "react-icons/md";
import { useUser } from "../contexts/stream";
import { Avatar } from "./avatar";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems = [
  { icon: MdHome, label: "Home", href: "/" },
  { icon: MdSearch, label: "Explore", href: "/explore" },
  { icon: MdNotificationsNone, label: "Notifications", href: "/notifications" },
  { icon: MdBookmarkBorder, label: "Bookmarks", href: "/bookmarks" },
  { icon: MdTrendingUp, label: "Trending", href: "/trending" },
  { icon: MdPerson, label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const { user, clearUser } = useUser();
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-start justify-between flex-[0.2] p-4 min-w-[250px] h-screen space-y-2 sticky top-0">
      <div>
        {/* Logo/Brand */}
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-bold text-blue-500">FeedsApp</h1>
        </div>

        {/* Navigation Items */}
        {sidebarItems.map(({ icon: Icon, label, href }) => (
          <Link
            href={href}
            key={label}
            className={`flex items-center space-x-2 py-3 px-4 my-3 rounded-full cursor-pointer transition-all duration-200 w-full ${
              href === pathname
                ? "bg-blue-500 text-white shadow-lg"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon className="text-2xl" />
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
