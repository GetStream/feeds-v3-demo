"use client";

import { ActivityResponse } from "@stream-io/feeds-client";
import Activity from "./activity";
import { Search } from "lucide-react";

interface SearchResultsProps {
  activities?: ActivityResponse[];
  searchQuery: string;
  isLoading: boolean;
  error?: string | null;
}

export function SearchResults({ 
  activities = [], 
  searchQuery, 
  isLoading, 
  error 
}: SearchResultsProps) {
  const hasResults = activities.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Searching for "{searchQuery}"...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-2">
          <Search className="w-8 h-8 mx-auto mb-2" />
        </div>
        <p className="text-gray-400">Error searching: {error}</p>
      </div>
    );
  }

  if (!searchQuery.trim()) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Search for activities</h3>
        <p className="text-gray-500 text-sm">
          Enter a search term to find activities
        </p>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No results found</h3>
        <p className="text-gray-500 text-sm">
          No activities found for "{searchQuery}"
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Try different keywords or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-gray-300">
            {activities.length} result{activities.length !== 1 ? "s" : ""} for "{searchQuery}"
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
            {activities.length} activities
          </span>
        </div>
      </div>

      {/* Activities Results */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <Activity key={`search-activity-${activity.id}`} activity={activity} />
        ))}
      </div>
    </div>
  );
} 