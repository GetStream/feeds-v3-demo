"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser, User } from "./useUser";
import { ActivityResponse } from "@stream-io/feeds-client";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";
import { useState } from "react";

// Define a unique query key factory
export const activitiesQueryKey = (
  query: string,
  mode: "$q" | "$autocomplete"
) => ["activities", query, mode];

const fetchActivities = async (
  client: FeedsClient,
  user: User,
  searchQuery: string = "",
  searchMode: "$q" | "$autocomplete" = "$q"
): Promise<ActivityResponse[]> => {
  if (!client || !user) return [];

  try {
    const params = {
      limit: 50,
      sort: [{ field: "created_at", direction: -1 }],
      ...(searchQuery.trim()
        ? {
            filter: {
              text: { [searchMode]: searchQuery.trim() },
            },
          }
        : {}),
    };

    const response = await client.queryActivities(params);
    return (
      response.activities?.filter((activity) => activity.type === "post") || []
    );
  } catch (error) {
    console.error("Error fetching activities:", error);
    toast.error("Error fetching activities");
    throw error;
  }
};

export function useSearch() {
  const { client, user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"$q" | "$autocomplete">("$q");

  const {
    data: activities = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: activitiesQueryKey(searchQuery, searchMode),
    queryFn: () =>
      fetchActivities(
        client as FeedsClient,
        user as User,
        searchQuery,
        searchMode
      ),
    enabled: !!client && !!user,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch when query changes
    gcTime: 0, // Don't cache
  });

  const searchActivities = (
    query: string,
    mode: "$q" | "$autocomplete" = "$q"
  ) => {
    setSearchQuery(query);
    setSearchMode(mode);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return {
    activities,
    searchQuery,
    searchMode,
    isLoading,
    error: isError,
    searchActivities,
    clearSearch,
    refetch,
  };
}
