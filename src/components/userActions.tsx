"use client";

import { UserPlus, UserMinus } from "lucide-react";
import { useUserActions } from "../hooks/useUserActions";
import { Avatar } from "./avatar";

interface UserActionsProps {
  targetUserId: string;
}

export function UserActions({ targetUserId }: UserActionsProps) {
  const { isFollowing, isLoading, isOwnUser, handleFollow } =
    useUserActions(targetUserId);

  if (isOwnUser) {
    return null; // Don't show follow button for own posts
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`cursor-pointer flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? "bg-gray-600 text-white hover:bg-gray-700"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>{isFollowing ? "Unfollow" : "Follow"}</span>
    </button>
  );
}

export function UserAvatar({
  userId,
  size = "md",
}: {
  userId: string;
  size?: "sm" | "md" | "lg";
}) {
  // Try to find user by ID to get their name for initials
  const storedUser = localStorage.getItem("user");
  let userName = "";
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.id === userId) {
        userName = userData.name;
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return <Avatar userId={userId} userName={userName} size={size} />;
}
