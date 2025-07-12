"use client";

import { Avatar } from "@/components";
import { useUser } from "@/hooks";

export default function ProfilePage() {
  const { user } = useUser();
  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5">
        <h1 className="text-xl text-white mb-4">Your profile</h1>
      </div>
      <div className="flex items-center gap-4">
        <Avatar size="lg" userId={user?.id} userName={user?.name} />
        <div>
          <div>{user?.name}</div>
          <div className="text-sm text-gray-400">@{user?.id}</div>
        </div>
      </div>
    </div>
  );
}
