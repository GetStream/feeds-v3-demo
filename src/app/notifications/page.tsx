"use client";

import { useUser } from "@/hooks/useUser";

export default function NotificationsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5">
        <h1 className="text-xl text-white">Notifications</h1>
        <p className="text-gray-400 text-sm font-light mb-4">
          Get notified when someone follows you, comments on your posts, or
          likes your content.
        </p>
      </div>
    </div>
  );
}
