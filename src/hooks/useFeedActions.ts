"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";
import toast from "react-hot-toast";

// Query keys for feeds - these can be used for manual refetching
const FEED_QUERY_KEYS = {
  timeline: (userId: string) => ["feed", "timeline", userId],
  user: (userId: string) => ["feed", "user", userId],
  activities: (userId: string, feedType: string) => [
    "feed",
    "activities",
    userId,
    feedType,
  ],
} as const;

// Add activity to user feed
const addActivityToFeed = async (
  client: any,
  userId: string,
  text: string
): Promise<void> => {
  const userFeed = client.feed("user", userId);
  await userFeed.addActivity({
    type: "post",
    text,
  });

  // Note: We don't need to call getOrCreate here anymore since the global feed manager
  // will handle the real-time updates through subscriptions
};

// Delete activity
const deleteActivityFromFeed = async (
  client: any,
  activityId: string
): Promise<void> => {
  await client.deleteActivity({
    activity_id: activityId,
  });
};

export function useFeedActions() {
  const { client, user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id || "";

  // Mutation for creating a post
  const createPostMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!client || !userId) {
        throw new Error("Client or user not available");
      }
      return await addActivityToFeed(client, userId, text);
    },
    onSuccess: () => {
      // Invalidate all feed-related queries to trigger refetches
      queryClient.invalidateQueries({
        queryKey: ["feed"],
      });
      toast.success("Activity created successfully!");
    },
    onError: (error) => {
      console.error("Error posting:", error);
      toast.error("Failed to create activity");
    },
  });

  // Mutation for deleting a post
  const deletePostMutation = useMutation({
    mutationFn: async (activityId: string) => {
      if (!client) {
        throw new Error("Client not available");
      }
      return await deleteActivityFromFeed(client, activityId);
    },
    onSuccess: () => {
      // Invalidate all feed-related queries to trigger refetches
      queryClient.invalidateQueries({
        queryKey: ["feed"],
      });
      toast.success("Activity deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    },
  });

  // Manual refetch mutation - just invalidate cache instead of calling getOrCreate
  const refetchFeedsMutation = useMutation({
    mutationFn: async () => {
      if (!client || !userId) {
        throw new Error("Client or user not available");
      }
      // Don't call getOrCreate here to avoid conflicts
      // Just return success to trigger cache invalidation
      return true;
    },
    onSuccess: () => {
      // Invalidate all feed-related queries
      queryClient.invalidateQueries({
        queryKey: ["feed"],
      });
      toast.success("Feeds refreshed successfully!");
    },
    onError: (error) => {
      console.error("Error refetching feeds:", error);
      toast.error("Failed to refresh feeds");
    },
  });

  const handlePost = async (text: string) => {
    createPostMutation.mutate(text);
  };

  const handleDeleteActivity = async (activityId: string) => {
    deletePostMutation.mutate(activityId);
  };

  const handleRefetchFeeds = async () => {
    refetchFeedsMutation.mutate();
  };

  return {
    posting: createPostMutation.isPending,
    deleting: deletePostMutation.isPending,
    refetching: refetchFeedsMutation.isPending,
    handlePost,
    handleDeleteActivity,
    handleRefetchFeeds,
    // Expose mutation states for more granular control
    createPostMutation,
    deletePostMutation,
    refetchFeedsMutation,
  };
}
