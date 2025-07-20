"use client";

import { useSearch } from "../../hooks/useSearch";
import { useUser } from "../../hooks/useUser";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import { SearchInput } from "../../components/searchInput";
import { SearchResults } from "../../components/searchResults";
import Activity from "../../components/activity";

export default function ExplorePage() {
  const {
    error: userError,
    loading: clientLoading,
    retryConnection,
  } = useUser();

  const {
    activities,
    searchQuery,
    searchMode,
    isLoading: contentLoading,
    error: contentError,
    searchActivities,
    clearSearch,
  } = useSearch();

  const loading = clientLoading || contentLoading;
  const error = userError || (contentError ? "Error loading activities" : null);

  // Show search results if there's a search query, otherwise show all activities
  const isSearching = !!searchQuery.trim();

  if (loading) {
    return <Loading message="Loading activities..." />;
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
        <h1 className="text-xl text-white mb-4">Explore</h1>
        <p className="text-gray-400 text-sm font-light mb-4">
          Discover and search for activities across the platform.
        </p>
        
        {/* Search Input */}
        <div className="mb-4">
          <SearchInput 
            placeholder="Search activities..."
            value={searchQuery}
            searchMode={searchMode}
            isLoading={contentLoading}
            onSearch={searchActivities}
            onClear={clearSearch}
            onSearchModeChange={(mode) => searchActivities(searchQuery, mode)}
          />
        </div>
      </div>

      {/* Content */}
      {isSearching ? (
        // Show search results when searching
        <div className="px-4">
          <SearchResults
            activities={activities}
            searchQuery={searchQuery}
            isLoading={contentLoading}
            error={contentError ? "Error loading activities" : null}
          />
        </div>
      ) : (
        // Show all activities when not searching
        <div className="space-y-6">
          <div className="px-4">
            <h2 className="text-lg font-semibold text-white mb-4">All Activities</h2>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  No activities found
                </div>
                <p className="text-gray-500 text-sm">
                  Check back later for new posts!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <Activity key={`explore-${activity.id}`} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
