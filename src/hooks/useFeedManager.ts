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

// Global feed instances to prevent multiple initializations
let globalTimelineFeed: Feed | null = null;
let globalUserFeed: Feed | null = null;
let globalTimelineActivities: ActivityResponse[] = [];
let globalUserActivities: ActivityResponse[] = [];
const globalSubscribers = new Set<() => void>();
let globalInitializationPromise: Promise<void> | null = null;

export function useFeedManager() {
  const { client, user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id || "";
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

  // Initialize feeds globally
  useEffect(() => {
    if (!client || !userId) return;

    const initFeeds = async () => {
      // If already initializing, wait for that to complete
      if (globalInitializationPromise) {
        await globalInitializationPromise;
        return;
      }

      // If already initialized, just set up subscriptions
      if (globalTimelineFeed && globalUserFeed) {
        setTimelineActivities(globalTimelineActivities);
        setUserActivities(globalUserActivities);
        setLoading(false);
        return;
      }

      // Start initialization
      globalInitializationPromise = (async () => {
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
                source_feed: timeline.fid,
                target_feed: { $in: [user.fid] },
              },
            });
            if (follows.follows.length === 0) {
              await client.follow({
                source: timeline.fid,
                target: user.fid,
              });
              // Small delay to ensure follow relationship is established
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          } catch (err) {
            // Ignore if already following - this is expected on refresh
            const errorMessage = (err as Error).message;
            if (errorMessage?.includes("already exists in accepted state")) {
              console.log(
                "Timeline already follows user feed - this is normal"
              );
            } else {
              toast.error("Follow error: " + errorMessage);
            }
          }

          // Set up subscriptions for both feeds
          timeline.state.subscribe((state) => {
            globalTimelineActivities = state.activities || [];
            setTimelineActivities(globalTimelineActivities);
            // Update React Query cache when real-time updates come in
            queryClient.setQueryData(
              FEED_QUERY_KEYS.timeline(userId),
              globalTimelineActivities
            );
            // Notify all subscribers
            globalSubscribers.forEach((callback) => callback());
          });

          user.state.subscribe((state) => {
            globalUserActivities = state.activities || [];
            setUserActivities(globalUserActivities);
            // Update React Query cache when real-time updates come in
            queryClient.setQueryData(
              FEED_QUERY_KEYS.user(userId),
              globalUserActivities
            );
            // Notify all subscribers
            globalSubscribers.forEach((callback) => callback());
          });

          // Set initial activities
          const timelineState = timeline.state.getLatestValue();
          globalTimelineActivities = timelineState.activities || [];
          setTimelineActivities(globalTimelineActivities);

          const userState = user.state.getLatestValue();
          globalUserActivities = userState.activities || [];
          setUserActivities(globalUserActivities);

          // Store global references
          globalTimelineFeed = timeline;
          globalUserFeed = user;
        } catch (err) {
          console.error("Error initializing feeds:", err);
          toast.error("Error initializing feeds");
        } finally {
          setLoading(false);
          globalInitializationPromise = null;
        }
      })();

      await globalInitializationPromise;
    };

    initFeeds();

    // Cleanup function
    return () => {
      // Note: We don't unsubscribe here as other components might be using the feeds
      // The feeds will be cleaned up when the component unmounts and no other components are using them
    };
  }, [client, userId, queryClient]);

  // Handle feed type switching
  const switchFeedType = useCallback(
    async (type: "timeline" | "user") => {
      if (type === feedType) return;
      setFeedType(type);
    },
    [feedType]
  );

  // Manual refetch functions that work with existing feeds
  const refetchTimeline = useCallback(async () => {
    if (!globalTimelineFeed) return;
    try {
      await globalTimelineFeed.getOrCreate();
      toast.success("Timeline refreshed successfully!");
    } catch (error) {
      console.error("Error refetching timeline:", error);
      toast.error("Failed to refresh timeline");
    }
  }, []);

  const refetchUser = useCallback(async () => {
    if (!globalUserFeed) return;
    try {
      await globalUserFeed.getOrCreate();
      toast.success("User feed refreshed successfully!");
    } catch (error) {
      console.error("Error refetching user feed:", error);
      toast.error("Failed to refresh user feed");
    }
  }, []);

  const refetchAllFeeds = useCallback(async () => {
    try {
      // Refetch feeds sequentially to avoid concurrent getOrCreate calls
      if (globalTimelineFeed) {
        await globalTimelineFeed.getOrCreate();
      }
      if (globalUserFeed) {
        await globalUserFeed.getOrCreate();
      }
      toast.success("All feeds refreshed successfully!");
    } catch (error) {
      console.error("Error refetching feeds:", error);
      toast.error("Failed to refresh feeds");
    }
  }, []);

  return {
    timelineFeed: globalTimelineFeed,
    userFeed: globalUserFeed,
    activities,
    feedType,
    loading,
    switchFeedType,
    refetchTimeline,
    refetchUser,
    refetchAllFeeds,
  };
}
