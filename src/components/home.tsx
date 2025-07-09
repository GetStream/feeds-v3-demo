"use client";

import { useFeedActivities, useFeedActions, useComments } from "../hooks";
import { useUser } from "../contexts/stream";
import { Composer } from "./composer";
import ReactionsPanel from "./reaction";
import CommentsPanel from "./comment";
import { Loading } from "./loading";
import { Error } from "./error";
import { UserActions, UserAvatar } from "./userActions";
import { useToast } from "./toast";
import UserModal from "./userModal";
import { Trash2 } from "lucide-react";

export default function FeedView() {
  const { showToast, ToastContainer } = useToast();
  const {
    user,
    client,
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
  } = useFeedActivities();
  const { posting, handlePost, handleDeleteActivity } =
    useFeedActions(showToast);
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    fetchComments,
    addComment,
    deleteComment,
    toggleCommentReaction,
  } = useComments();

  const loading =
    (clientLoading || activitiesLoading || commentsLoading) &&
    !activities.length;

  // Show user modal if no user is authenticated
  if (!user) {
    return (
      <div>
        <ToastContainer />
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
      <ToastContainer />

      {/* User Registration Modal */}
      <UserModal
        isOpen={showUserModal}
        onSubmit={createUser}
        loading={clientLoading}
      />

      {/* Feed Type Selector */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5 flex gap-5">
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

      <Composer onPost={handlePost} />

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
            <article
              key={activity.id}
              className="border-b border-gray-800 shadow-sm my-15 transition-colors"
            >
              <div className="flex items-start space-x-3 mb-4">
                <UserAvatar userId={activity.user?.name || "unknown"} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white truncate overflow-hidden whitespace-nowrap max-w-[50%]">
                        {activity.user?.name || activity.user?.id || "..."}
                      </span>
                      {activity.created_at && (
                        <span className="text-sm text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {activity.user?.id && activity.user.id !== user?.id && (
                        <UserActions targetUserId={activity.user.id} />
                      )}
                      {client && activity.user?.id === user?.id && (
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-red-400 hover:bg-gray-700 rounded-full cursor-pointer transition-colors p-2"
                          title="Delete activity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    {activity.text || activity.type}
                  </p>
                </div>
              </div>

              <ReactionsPanel activity={activity} />
              <CommentsPanel
                activity={activity}
                allComments={comments}
                currentUserId={user?.id || ""}
                addComment={addComment}
                deleteComment={deleteComment}
                toggleCommentReaction={toggleCommentReaction}
                onCommentReactionUpdated={() => {
                  // Refresh comments to get updated reaction state
                  fetchComments();
                }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
