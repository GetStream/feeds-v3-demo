"use client";

import { useUser } from "../../hooks/useUser";
import { ProfileStats } from "../../components/profileStats";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import { Settings, LogOut } from "lucide-react";

export default function ProfilePage() {
  const {
    user,
    loading,
    error,
    clearUser,
    updateUser,
    getUserInitials,
  } = useUser();

  if (loading) {
    return <Loading message="Loading profile..." />;
  }

  if (error) {
    return (
      <Error
        title="Connection Error"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!user) {
    return (
      <Error
        title="No User Found"
        message="Please create a user to view your profile"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <div className="flex items-center space-x-2">
              <button className="text-gray-400 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={clearUser}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {getUserInitials(user.name)}
              </span>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">{user.name}</h2>
              <p className="text-gray-400">@{user.id}</p>
            </div>
          </div>

          {/* Stats */}
          <ProfileStats user={user} isOwnProfile={true} />
        </div>

        {/* Profile Actions */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
          
          <div className="space-y-4">
            <button className="w-full text-left p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
              <div className="text-white font-medium">Edit Profile</div>
              <div className="text-gray-400 text-sm">Update your name and information</div>
            </button>
            
            <button className="w-full text-left p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
              <div className="text-white font-medium">Privacy Settings</div>
              <div className="text-gray-400 text-sm">Manage your privacy preferences</div>
            </button>
            
            <button className="w-full text-left p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
              <div className="text-white font-medium">Notifications</div>
              <div className="text-gray-400 text-sm">Configure notification preferences</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
