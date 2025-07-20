"use client";

import { useState } from "react";
import { useProfileStats } from "../hooks/useProfileStats";
import { FollowUser } from "../hooks/useProfileStats";
import { User, useUser } from "../hooks/useUser";
import { X, UserPlus, UserMinus } from "lucide-react";
import Link from "next/link";

interface ProfileStatsProps {
  user: User;
  isOwnProfile?: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: FollowUser[];
  isLoading: boolean;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  isFollowing?: (userId: string) => boolean;
  isFollowLoading?: boolean;
  isUnfollowLoading?: boolean;
  isOwnProfile?: boolean;
}

function FollowersModal({
  isOpen,
  onClose,
  title,
  users,
  isLoading,
  onFollow,
  onUnfollow,
  isFollowing,
  isFollowLoading,
  isUnfollowLoading,
  isOwnProfile = false,
}: FollowersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No {title.toLowerCase()} found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                >
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center space-x-3 flex-1 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">@{user.id}</p>
                    </div>
                  </Link>
                  {/* Only show follow buttons if not own profile */}
                  {!isOwnProfile && onFollow && onUnfollow && isFollowing && (
                    <button
                      onClick={() => {
                        if (isFollowing(user.id)) {
                          onUnfollow(user.id);
                        } else {
                          onFollow(user.id);
                        }
                      }}
                      disabled={isFollowLoading || isUnfollowLoading}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isFollowing(user.id)
                          ? "bg-gray-600 text-white hover:bg-red-600"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isFollowing(user.id) ? (
                        <UserMinus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileStats({ user, isOwnProfile = false }: ProfileStatsProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const { user: currentUser } = useUser();

  const profileStats = useProfileStats(user.id);
  const {
    followers,
    following,
    isLoading,
    followUser,
    unfollowUser,
    isFollowing,
    isFollowingLoading,
    isUnfollowingLoading,
  } = profileStats;

  // Filter out current user from lists when viewing own profile
  const filteredFollowers = isOwnProfile 
    ? followers.filter(follower => follower.id !== currentUser?.id)
    : followers;
  
  const filteredFollowing = isOwnProfile 
    ? following.filter(followingUser => followingUser.id !== currentUser?.id)
    : following;

  const handleOpenModal = (tab: "followers" | "following") => {
    setActiveTab(tab);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const getCurrentUsers = () => {
    return activeTab === "followers" ? filteredFollowers : filteredFollowing;
  };

  const getCurrentTitle = () => {
    return activeTab === "followers" ? "Followers" : "Following";
  };

  return (
    <>
      <div className="flex items-center space-x-6">
        {/* Followers */}
        <button
          onClick={() => handleOpenModal("followers")}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold text-white">{filteredFollowers.length}</div>
          <div className="text-gray-400 text-sm">Followers</div>
        </button>

        {/* Following */}
        <button
          onClick={() => handleOpenModal("following")}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-2xl font-bold text-white">{filteredFollowing.length}</div>
          <div className="text-gray-400 text-sm">Following</div>
        </button>
      </div>

      {/* Combined Modal with Tabs */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab("followers")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "followers"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Followers ({filteredFollowers.length})
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "following"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Following ({filteredFollowing.length})
                </button>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-400">Loading...</p>
                </div>
              ) : getCurrentUsers().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No {getCurrentTitle().toLowerCase()} found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getCurrentUsers().map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                    >
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex items-center space-x-3 flex-1 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">@{user.id}</p>
                        </div>
                      </Link>
                      {/* Only hide follow button for current user's own profile */}
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (isFollowing(user.id)) {
                              unfollowUser(user.id);
                            } else {
                              followUser(user.id);
                            }
                          }}
                          disabled={isFollowingLoading || isUnfollowingLoading}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            isFollowing(user.id)
                              ? "bg-gray-600 text-white hover:bg-red-600"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {isFollowing(user.id) ? (
                            <UserMinus className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 