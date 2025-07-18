"use client";

import { useForyouActivities } from "../../hooks";
import { useUser } from "../../hooks/useUser";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import Activity from "../../components/activity";

export default function ExplorePage() {
  const {
    error: userError,
    loading: clientLoading,
    retryConnection,
  } = useUser();

  const {
    foryouActivities,
    isLoading: foryouLoading,
    error: foryouError,
  } = useForyouActivities();

  const loading = (clientLoading || foryouLoading) && !foryouActivities.length;
  const error = userError || foryouError;

  if (loading) {
    return <Loading message="Loading for you activities..." />;
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
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5">
        <h1 className="text-xl text-white">For You</h1>
        <p className="text-gray-400 text-sm font-light mb-4">
          Personalized content curated just for you.
        </p>
      </div>

      {foryouActivities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            No ForYou activities found
          </div>
          <p className="text-gray-500 text-sm">
            Check back later for personalized posts!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {foryouActivities.map((activity) => (
            <Activity key={`foryou-${activity.id}`} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
