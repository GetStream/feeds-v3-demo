"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";

// Query key for followers
const FOLLOWERS_QUERY_KEY = ["followers"];

// Fetch followers from Stream API
const fetchFollowers = async (
  client: any,
  userId: string
): Promise<string[]> => {
  const response = await client.queryFollows({
    filter: {
      source_feed: `timeline:${userId}`,
    },
  });

  return response.follows.map((follow: any) => follow.target_feed.id);
};

export function useFollowers() {
  const { user, client } = useUser();
  const queryClient = useQueryClient();

  // Query for followers data
  const {
    data: followers = [],
    isLoading: loading,
    error,
    refetch: refreshFollowers,
  } = useQuery({
    queryKey: [...FOLLOWERS_QUERY_KEY, user?.id],
    queryFn: () => fetchFollowers(client, user!.id),
    enabled: !!client && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for adding follower
  const addFollowerMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        [...FOLLOWERS_QUERY_KEY, user?.id],
        (old: string[] = []) => [...old, userId]
      );
      return userId;
    },
    onError: () => {
      // Revert on error
      refreshFollowers();
    },
  });

  // Mutation for removing follower
  const removeFollowerMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        [...FOLLOWERS_QUERY_KEY, user?.id],
        (old: string[] = []) => old.filter((id) => id !== userId)
      );
      return userId;
    },
    onError: () => {
      // Revert on error
      refreshFollowers();
    },
  });

  const addFollower = (userId: string) => {
    addFollowerMutation.mutate(userId);
  };

  const removeFollower = (userId: string) => {
    removeFollowerMutation.mutate(userId);
  };

  return {
    followers,
    loading,
    error: error?.message || null,
    refreshFollowers,
    addFollower,
    removeFollower,
  };
}
