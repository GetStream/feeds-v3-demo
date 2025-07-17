"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser, User } from "./useUser";
import { ActivityResponse } from "@stream-io/feeds-client";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

// Query key for popular activities data
const POPULAR_QUERY_KEY = ["popular"];

const fetchPopularActivities = async (
  client: FeedsClient,
  user: User
): Promise<ActivityResponse[]> => {
  if (!client || !user) return [];

  try {
    // Use a public feed for popular activities
    const popularFeed = client.feed("user", user.id);
    const response = await popularFeed.getOrCreate({
      view: "popular-view",
      external_ranking: {
        weight: 2.5,
        comment_weight: 20,
        base_score: 10,
      },
    });

    // Filter only activities of type "post"
    return (response.activities || []).filter(
      (activity) => activity?.type === "post"
    );
  } catch (error) {
    console.error("Error fetching popular activities:", error);
    toast.error("Error fetching popular activities");
    return [];
  }
};

export function usePopularActivities() {
  const { client, user } = useUser();
  const [loading, setLoading] = useState(true);

  const {
    data: popularActivities = [],
    isLoading,
    isFetching,
    error,
    refetch: fetchPopular,
  } = useQuery({
    queryKey: [...POPULAR_QUERY_KEY, user?.id],
    queryFn: () => {
      if (!client) {
        throw new Error("Client is not available");
      }
      return fetchPopularActivities(client, user!);
    },
    enabled: !!client && !!user,
    staleTime: 0,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  //this is a hack to fix the loading state, because the query is not returning the data immediately
  useEffect(() => {
    setLoading(false);
  }, []);

  const isLoadingData = loading || isLoading || isFetching;

  return {
    popularActivities,
    fetchPopular,
    isFetching,
    isLoading: isLoadingData,
    error: error?.message || null,
  };
}
