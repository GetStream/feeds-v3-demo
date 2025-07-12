"use client";

import { useBookmarks } from "../../hooks/useBookmarks";
import { useUser } from "../../hooks/useUser";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import UserModal from "../../components/userModal";
import Activity from "../../components/activity";

export default function BookmarksPage() {
  const {
    user,
    error: userError,
    loading: clientLoading,
    retryConnection,
    showUserModal,
    createUser,
  } = useUser();

  const {
    bookmarkedActivities,
    isLoading,
    error: bookmarksError,
  } = useBookmarks();

  const loading = clientLoading || isLoading;
  const error = userError || bookmarksError;

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
    return <Loading message="Loading bookmarks..." />;
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
      <UserModal
        isOpen={showUserModal}
        onSubmit={createUser}
        loading={clientLoading}
      />

      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5">
        <h1 className="text-xl text-white mb-4">Bookmarks</h1>
      </div>

      {bookmarkedActivities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No bookmarks yet</div>
          <p className="text-gray-500 text-sm">
            Start bookmarking posts to see them here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedActivities.map((activity) => (
            <Activity key={`bookmark-${activity.id}`} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
