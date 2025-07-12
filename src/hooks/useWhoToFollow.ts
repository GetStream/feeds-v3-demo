"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser, User } from "./useUser";
import { FullUserResponse } from "@stream-io/feeds-client";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

// Query key for who to follow data
const WHO_TO_FOLLOW_QUERY_KEY = ["whoToFollow"];

const fetchWhoToFollowData = async (
  client: FeedsClient,
  user: User
): Promise<FullUserResponse[]> => {
  if (!client || !user) return [];

  try {
    // First, get the feed IDs for user feeds
    const response = await client.getFollowSuggestions({
      feed_group_id: "user",
      limit: 10,
    });

    if (response.suggestions.length === 0) {
      return [];
    }

    // this is a hack to get the user details, because in the response field 'name' is not populated
    // so we need to get the user details from the queryUsers endpoint ;)
    const suggestions = await client.queryUsers({
      payload: {
        filter_conditions: {
          id: {
            $in: response.suggestions.map(
              (suggestion: { id: string }) => suggestion.id
            ),
          },
        },
      },
    });

    return suggestions.users || [];
  } catch (error) {
    toast.error("Error fetching who to follow");
    return [];
  }
};

export function useWhoToFollow() {
  const { client, user } = useUser();
  const [loading, setLoading] = useState(true);

  const {
    data: whoToFollow = [],
    isLoading,
    isFetching,
    error,
    refetch: fetchWhoToFollow,
  } = useQuery({
    queryKey: [...WHO_TO_FOLLOW_QUERY_KEY, user?.id],
    queryFn: () => fetchWhoToFollowData(client!, user!),
    enabled: !!client && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  //this is a hack to fix the loading state, because the query is not returning the data immediately
  useEffect(() => {
    setLoading(false);
  }, []);

  const isLoadingData = loading || isLoading || isFetching;

  return {
    whoToFollow,
    fetchWhoToFollow,
    isFetching,
    isLoading: isLoadingData,
    error: error?.message || null,
  };
}
