"use client";

import { usePopularActivities } from "../../hooks";
import { useUser } from "../../hooks/useUser";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import UserModal from "../../components/userModal";
import Activity from "../../components/activity";

export default function ExplorePage() {
  const {
    user,
    error: userError,
    loading: clientLoading,
    retryConnection,
    showUserModal,
    createUser,
  } = useUser();

  const {
    popularActivities,
    isLoading: popularLoading,
    error: popularError,
  } = usePopularActivities();

  const loading =
    (clientLoading || popularLoading) && !popularActivities.length;
  const error = userError || popularError;

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
    return <Loading message="Loading popular activities..." />;
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

      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5">
        <h1 className="text-xl text-white">Explore</h1>
        <p className="text-gray-400 text-sm font-light mb-4">
          Discover popular posts from the community
        </p>
      </div>

      {popularActivities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            No popular activities found
          </div>
          <p className="text-gray-500 text-sm">
            Check back later for trending posts!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {popularActivities.map((activity) => (
            <Activity key={`popular-${activity.id}`} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
