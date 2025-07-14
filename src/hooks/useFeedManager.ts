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

// Global feed instances and state
let globalTimelineFeed: Feed | null = null;
let globalUserFeed: Feed | null = null;
let globalTimelineActivities: ActivityResponse[] = [];
let globalUserActivities: ActivityResponse[] = [];
let globalTimelineUnsubscribe: (() => void) | null = null;
let globalUserUnsubscribe: (() => void) | null = null;
let globalInitializationPromise: Promise<void> | null = null;
let globalComponentCount = 0;

// Event emitter for state updates
const stateUpdateCallbacks = new Set<
  (type: "timeline" | "user", activities: ActivityResponse[]) => void
>();

function notifyStateUpdate(
  type: "timeline" | "user",
  activities: ActivityResponse[]
) {
  console.log(
    `[useFeedManager] Notifying ${stateUpdateCallbacks.size} callbacks about ${type} update`
  );
  stateUpdateCallbacks.forEach((callback) => callback(type, activities));
}

// Standalone refetch functions that don't require the hook
export const refetchTimelineGlobal = async () => {
  if (!globalTimelineFeed) return;
  try {
    await globalTimelineFeed.getOrCreate();
    toast.success("Timeline refreshed successfully!");
  } catch (error) {
    console.error("Error refetching timeline:", error);
    toast.error("Failed to refresh timeline");
  }
};

export const refetchUserGlobal = async () => {
  if (!globalUserFeed) return;
  try {
    await globalUserFeed.getOrCreate();
    toast.success("User feed refreshed successfully!");
  } catch (error) {
    console.error("Error refetching user feed:", error);
    toast.error("Failed to refresh user feed");
  }
};

export const refetchAllFeedsGlobal = async () => {
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
};

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

  // State update handler
  const handleStateUpdate = useCallback(
    (type: "timeline" | "user", activities: ActivityResponse[]) => {
      console.log(
        `[useFeedManager] State update received for ${type}:`,
        activities.length,
        "activities"
      );
      if (type === "timeline") {
        setTimelineActivities(activities);
      } else {
        setUserActivities(activities);
      }
    },
    []
  );

  // Subscribe to global state updates
  useEffect(() => {
    stateUpdateCallbacks.add(handleStateUpdate);

    // Set initial state from global state
    setTimelineActivities(globalTimelineActivities);
    setUserActivities(globalUserActivities);

    return () => {
      stateUpdateCallbacks.delete(handleStateUpdate);
    };
  }, [handleStateUpdate]);

  // Initialize feeds globally
  useEffect(() => {
    if (!client || !userId) return;

    // Increment component count
    globalComponentCount++;
    console.log(
      `[useFeedManager] Component mounted. Count: ${globalComponentCount}`
    );

    const initFeeds = async () => {
      // If already initializing, wait for that to complete
      if (globalInitializationPromise) {
        console.log("[useFeedManager] Waiting for existing initialization...");
        await globalInitializationPromise;
        return;
      }

      // If already initialized, just ensure we have the latest state
      if (globalTimelineFeed && globalUserFeed) {
        console.log(
          "[useFeedManager] Feeds already initialized, syncing state..."
        );
        setLoading(false);

        // Get the latest state from the feeds
        const currentTimelineState = globalTimelineFeed.state.getLatestValue();
        const currentUserState = globalUserFeed.state.getLatestValue();

        if (currentTimelineState.activities) {
          globalTimelineActivities = currentTimelineState.activities;
          notifyStateUpdate("timeline", globalTimelineActivities);
        }

        if (currentUserState.activities) {
          globalUserActivities = currentUserState.activities;
          notifyStateUpdate("user", globalUserActivities);
        }

        return;
      }

      // Start initialization
      console.log("[useFeedManager] Starting feed initialization...");
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
          console.log("[useFeedManager] Setting up feed subscriptions...");
          globalTimelineUnsubscribe = timeline.state.subscribe((state) => {
            console.log(
              "[useFeedManager] Timeline state update received:",
              state.activities?.length || 0,
              "activities"
            );
            globalTimelineActivities = state.activities || [];
            // Update React Query cache when real-time updates come in
            queryClient.setQueryData(
              FEED_QUERY_KEYS.timeline(userId),
              globalTimelineActivities
            );
            // Notify all components about the state update
            notifyStateUpdate("timeline", globalTimelineActivities);
          });

          globalUserUnsubscribe = user.state.subscribe((state) => {
            console.log(
              "[useFeedManager] User state update received:",
              state.activities?.length || 0,
              "activities"
            );
            globalUserActivities = state.activities || [];
            // Update React Query cache when real-time updates come in
            queryClient.setQueryData(
              FEED_QUERY_KEYS.user(userId),
              globalUserActivities
            );
            // Notify all components about the state update
            notifyStateUpdate("user", globalUserActivities);
          });

          // Set initial activities
          const timelineState = timeline.state.getLatestValue();
          globalTimelineActivities = timelineState.activities || [];
          notifyStateUpdate("timeline", globalTimelineActivities);

          const userState = user.state.getLatestValue();
          globalUserActivities = userState.activities || [];
          notifyStateUpdate("user", globalUserActivities);

          // Store global references
          globalTimelineFeed = timeline;
          globalUserFeed = user;
          console.log(
            "[useFeedManager] Feed initialization completed successfully"
          );
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
      // Decrement component count
      globalComponentCount--;
      console.log(
        `[useFeedManager] Component unmounted. Count: ${globalComponentCount}`
      );

      // If no components are using the feeds, clean up the global subscriptions
      if (globalComponentCount === 0) {
        console.log(
          "[useFeedManager] No components left, cleaning up global subscriptions..."
        );
        globalTimelineUnsubscribe?.();
        globalUserUnsubscribe?.();
        globalTimelineUnsubscribe = null;
        globalUserUnsubscribe = null;
        globalTimelineFeed = null;
        globalUserFeed = null;
        globalTimelineActivities = [];
        globalUserActivities = [];
        stateUpdateCallbacks.clear();
      }
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
