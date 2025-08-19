"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Feed, ActivityResponse } from "@stream-io/feeds-client";
import { useUser } from "./useUser";
import toast from "react-hot-toast";

// Query keys for feeds
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

export function useFeedActivities() {
  const { client, user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id || "";
  const [timelineFeed, setTimelineFeed] = useState<Feed | null>(null);
  const [userFeed, setUserFeed] = useState<Feed | null>(null);
  const [timelineActivities, setTimelineActivities] = useState<
    ActivityResponse[]
  >([]);
  const [userActivities, setUserActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"timeline" | "user">("timeline");
  const feedTypeRef = useRef(feedType);

  // Update ref when feedType changes
  useEffect(() => {
    feedTypeRef.current = feedType;
  }, [feedType]);

  // Get current activities based on feed type
  const activities =
    feedType === "timeline" ? timelineActivities : userActivities;

  // Initialize feeds
  useEffect(() => {
    if (!client || !userId) return;

    let timelineUnsubscribe: () => void = () => {};
    let userUnsubscribe: () => void = () => {};

    const initFeeds = async () => {
      try {
        setLoading(true);

        // Initialize feeds - timeline as public feed, user as personal feed
        const timeline = client.feed("timeline", userId);
        const user = client.feed("user", userId);

        // Initialize feeds sequentially to avoid concurrent getOrCreate calls
        await timeline.getOrCreate({ watch: true });
        await user.getOrCreate({ watch: true });

        // Set up timeline to follow user feed (so user posts appear in public timeline)
        try {
          const follows = await client.queryFollows({
            filter: {
              source_feed: timeline.feed,
              target_feed: { $in: [user.feed] },
            },
          });
          if (follows.follows.length === 0) {
            await client.follow({
              source: timeline.feed,
              target: user.feed,
            });
            // Small delay to ensure follow relationship is established
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (err) {
          // Ignore if already following - this is expected on refresh
          const errorMessage = (err as Error).message;
          if (errorMessage?.includes("already exists in accepted state")) {
            console.log("Timeline already follows user feed - this is normal");
          } else {
            toast.error("Follow error: " + errorMessage);
          }
        }

        // Set up subscriptions for both feeds
        timelineUnsubscribe = timeline.state.subscribe((state) => {
          setTimelineActivities(state.activities || []);
          // Update React Query cache when real-time updates come in
          queryClient.setQueryData(
            FEED_QUERY_KEYS.timeline(userId),
            state.activities || []
          );
        });

        userUnsubscribe = user.state.subscribe((state) => {
          setUserActivities(state.activities || []);
          // Update React Query cache when real-time updates come in
          queryClient.setQueryData(
            FEED_QUERY_KEYS.user(userId),
            state.activities || []
          );
        });

        // Set initial activities from current state
        const timelineState = timeline.state.getLatestValue();
        setTimelineActivities(timelineState.activities || []);

        const userState = user.state.getLatestValue();
        setUserActivities(userState.activities || []);

        setTimelineFeed(timeline);
        setUserFeed(user);
      } catch (err) {
        console.error("Error initializing feeds:", err);
        toast.error("Error initializing feeds");
      } finally {
        setLoading(false);
      }
    };

    initFeeds();

    return () => {
      // Only unsubscribe from state updates, don't close the feeds
      // This allows the feeds to continue running in the background
      timelineUnsubscribe?.();
      userUnsubscribe?.();
    };
  }, [client, userId, queryClient]);

  // Handle feed type switching
  const switchFeedType = useCallback(
    async (type: "timeline" | "user") => {
      if (!client || type === feedType) return;

      try {
        setLoading(true);
        setFeedType(type);
      } catch (err) {
        console.error("Error switching feed type:", err);
        toast.error("failed to switch feed type");
      } finally {
        setLoading(false);
      }
    },
    [client, feedType]
  );

  // Manual refetch functions that work with existing feeds
  const refetchTimeline = useCallback(async () => {
    if (!timelineFeed) return;
    try {
      await timelineFeed.getOrCreate();
      toast.success("Timeline refreshed successfully!");
    } catch (error) {
      console.error("Error refetching timeline:", error);
      toast.error("Failed to refresh timeline");
    }
  }, [timelineFeed]);

  const refetchUser = useCallback(async () => {
    if (!userFeed) return;
    try {
      await userFeed.getOrCreate();
      toast.success("User feed refreshed successfully!");
    } catch (error) {
      console.error("Error refetching user feed:", error);
      toast.error("Failed to refresh user feed");
    }
  }, [userFeed]);

  const refetchAllFeeds = useCallback(async () => {
    try {
      // Refetch feeds sequentially to avoid concurrent getOrCreate calls
      if (timelineFeed) {
        await timelineFeed.getOrCreate();
      }
      if (userFeed) {
        await userFeed.getOrCreate();
      }
      toast.success("All feeds refreshed successfully!");
    } catch (error) {
      console.error("Error refetching feeds:", error);
      toast.error("Failed to refresh feeds");
    }
  }, [timelineFeed, userFeed]);

  return {
    timelineFeed,
    userFeed,
    activities,
    feedType,
    loading,
    switchFeedType,
    // React Query refetch functions
    refetchTimeline,
    refetchUser,
    refetchAllFeeds,
  };
}
