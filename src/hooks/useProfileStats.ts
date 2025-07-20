"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";

export interface FollowUser {
  id: string;
  name: string;
  image?: string;
}

// Query keys
const FOLLOWERS_QUERY_KEY = ["profile-followers"];
const FOLLOWING_QUERY_KEY = ["profile-following"];

// Get user name from activities
const getUserNameFromActivities = async (
  client: FeedsClient,
  userId: string
): Promise<string> => {
  try {
    const response = await client.queryActivities({
      filter: {
        user_id: userId,
      },
      limit: 1,
    });

    if (response.activities && response.activities.length > 0) {
      return response.activities[0].user?.name || `User ${userId.replace("user-", "")}`;
    }
    return `User ${userId.replace("user-", "")}`;
  } catch (error) {
    console.error("Error fetching user name:", error);
    return `User ${userId.replace("user-", "")}`;
  }
};

// Fetch followers for a user
const fetchFollowers = async (
  client: FeedsClient,
  userId: string
): Promise<FollowUser[]> => {
  if (!client || !userId) return [];

  try {
    console.log("Fetching followers for user:", userId);
    const response = await client.queryFollows({
      filter: {
        target_feed: `user:${userId}`,
      },
      limit: 50,
    });

    console.log("Followers response:", response.follows.length, "follows");

    const followers = await Promise.all(
      response.follows.map(async (follow) => {
        const sourceFeedId = follow.source_feed.id;
        const followerUserId = sourceFeedId.replace("user:", "");
        const userName = await getUserNameFromActivities(client, followerUserId);
        
        console.log("Follower:", followerUserId, "->", userName);
        
        return {
          id: followerUserId,
          name: userName,
          image: undefined,
        };
      })
    );

    // Filter out duplicates and current user
    const uniqueFollowers = followers
      .filter((follower, index, self) => 
        index === self.findIndex(f => f.id === follower.id) && 
        follower.id !== userId
      );

    console.log("Final followers:", uniqueFollowers.length);
    return uniqueFollowers;
  } catch (error) {
    console.error("Error fetching followers:", error);
    return [];
  }
};

// Fetch following for a user
const fetchFollowing = async (
  client: FeedsClient,
  userId: string
): Promise<FollowUser[]> => {
  if (!client || !userId) return [];

  try {
    const response = await client.queryFollows({
      filter: {
        source_feed: `timeline:${userId}`,
      },
      limit: 50,
    });

    const following = await Promise.all(
      response.follows.map(async (follow) => {
        const targetFeedId = follow.target_feed.id;
        const followedUserId = targetFeedId.replace("user:", "");
        const userName = await getUserNameFromActivities(client, followedUserId);
        
        return {
          id: followedUserId,
          name: userName,
          image: undefined,
        };
      })
    );

    return following.filter((user) => user.id !== userId); // Filter out the current user
  } catch (error) {
    console.error("Error fetching following:", error);
    return [];
  }
};

// Follow a user
const followUser = async (
  client: FeedsClient,
  sourceUserId: string,
  targetUserId: string
): Promise<void> => {
  if (!client || !sourceUserId || !targetUserId) return;

  try {
    await client.follow({
      source: `timeline:${sourceUserId}`,
      target: `user:${targetUserId}`,
      create_notification_activity: true,
    });
    toast.success("Successfully followed user");
  } catch (error) {
    console.error("Error following user:", error);
    toast.error("Error following user");
    throw error;
  }
};

// Unfollow a user
const unfollowUser = async (
  client: FeedsClient,
  sourceUserId: string,
  targetUserId: string
): Promise<void> => {
  if (!client || !sourceUserId || !targetUserId) return;

  try {
    await client.unfollow({
      source: `timeline:${sourceUserId}`,
      target: `user:${targetUserId}`,
    });
    toast.success("Successfully unfollowed user");
  } catch (error) {
    console.error("Error unfollowing user:", error);
    toast.error("Error unfollowing user");
    throw error;
  }
};

export function useProfileStats(userId?: string) {
  const { client, user } = useUser();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  // Query for followers
  const {
    data: followers = [],
    isLoading: followersLoading,
    error: followersError,
    refetch: refetchFollowers,
  } = useQuery({
    queryKey: [...FOLLOWERS_QUERY_KEY, targetUserId],
    queryFn: () => fetchFollowers(client!, targetUserId!),
    enabled: !!client && !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for following
  const {
    data: following = [],
    isLoading: followingLoading,
    error: followingError,
    refetch: refetchFollowing,
  } = useQuery({
    queryKey: [...FOLLOWING_QUERY_KEY, targetUserId],
    queryFn: () => fetchFollowing(client!, targetUserId!),
    enabled: !!client && !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for current user's following (to check if current user is following target user)
  const {
    data: currentUserFollowing = [],
    isLoading: currentUserFollowingLoading,
  } = useQuery({
    queryKey: [...FOLLOWING_QUERY_KEY, user?.id],
    queryFn: () => fetchFollowing(client!, user!.id),
    enabled: !!client && !!user?.id && !!targetUserId && user.id !== targetUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return followUser(client!, user.id, targetUserId);
    },
    onSuccess: () => {
      // Invalidate and refetch followers/following data
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWERS_QUERY_KEY, targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWING_QUERY_KEY, targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWERS_QUERY_KEY, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWING_QUERY_KEY, user?.id],
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return unfollowUser(client!, user.id, targetUserId);
    },
    onSuccess: () => {
      // Invalidate and refetch followers/following data
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWERS_QUERY_KEY, targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWING_QUERY_KEY, targetUserId],
      });
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWERS_QUERY_KEY, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [...FOLLOWING_QUERY_KEY, user?.id],
      });
    },
  });

  // Check if current user is following target user
  const isFollowing = (targetUserId: string): boolean => {
    if (!user?.id) return false;
    // Check if the current user is following the target user
    return currentUserFollowing.some((followedUser) => followedUser.id === targetUserId);
  };

  // Check if target user is following current user
  const isFollowedBy = (targetUserId: string): boolean => {
    if (!user?.id) return false;
    // Check if the target user is following the current user
    return followers.some((follower) => follower.id === targetUserId);
  };

  return {
    followers,
    following,
    isLoading: followersLoading || followingLoading || currentUserFollowingLoading,
    error: followersError || followingError,
    followUser: followMutation.mutate,
    unfollowUser: unfollowMutation.mutate,
    isFollowing,
    isFollowedBy,
    refetchFollowers,
    refetchFollowing,
    isFollowingLoading: followMutation.isPending,
    isUnfollowingLoading: unfollowMutation.isPending,
  };
} 