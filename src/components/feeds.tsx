"use client";

import { useFeedManager } from "../hooks";
import { useUser } from "../hooks/useUser";
import { Composer } from "./composer";
import { RefreshCw } from "lucide-react";

import { Loading } from "./loading";
import { Error } from "./error";
import UserModal from "./userModal";
import Activity from "./activity";

export default function FeedView() {
  const {
    user,
    error,
    loading: clientLoading,
    retryConnection,
    showUserModal,
    createUser,
  } = useUser();
  const {
    activities,
    feedType,
    loading: activitiesLoading,
    switchFeedType,
    refetchAllFeeds,
    refetchTimeline,
    refetchUser,
  } = useFeedManager();

  const loading = (clientLoading || activitiesLoading) && !activities.length;

  // Show user modal if no user is authenticated
  if (!user) {
    return (
      <div>
        <UserModal
          isOpen={showUserModal}
          onSubmit={createUser}
          loading={clientLoading}
        />
      </div>
    );
  }

  if (loading) {
    return <Loading message="Loading feed..." />;
  }

  if (error) {
    return (
      <Error
        title="Connection Error"
        message={error}
        onRetry={retryConnection}
      />
    );
  }

  return (
    <div>
      {/* User Registration Modal */}
      <UserModal
        isOpen={showUserModal}
        onSubmit={createUser}
        loading={clientLoading}
      />

      {/* Feed Type Selector */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5 flex gap-5 items-center justify-between">
        <div className="flex gap-5">
          <button
            onClick={() => switchFeedType("timeline")}
            className={`px-4 py-4 cursor-pointer text-xs uppercase border-b border-b-3 border-transparent transition-colors ${
              feedType === "timeline" ? "border-b-blue-600" : ""
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => switchFeedType("user")}
            className={`px-4 py-4 cursor-pointer uppercase text-xs border-b border-b-3 border-transparent transition-colors ${
              feedType === "user" ? "border-b-blue-600" : ""
            }`}
          >
            My posts
          </button>
        </div>
      </div>

      <Composer />

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {feedType === "timeline" && "No posts in your timeline"}
            {feedType === "user" && "No posts yet"}
          </div>
          <p className="text-gray-500 text-sm">
            {feedType === "timeline" &&
              "Follow some users to see their posts here! Your own posts will also appear in your timeline."}
            {feedType === "user" && "Be the first to share something!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Activity key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
