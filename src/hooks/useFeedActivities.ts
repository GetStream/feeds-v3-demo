"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Feed, ActivityResponse } from "@stream-io/feeds-client";
import { useUser } from "./useUser";
import toast from "react-hot-toast";

export function useFeedActivities() {
  const { client, user } = useUser();
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

        await Promise.all([
          timeline.getOrCreate({ watch: true }),
          user.getOrCreate({ watch: true }),
        ]);

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
        } catch (err: any) {
          // Ignore if already following - this is expected on refresh
          if (err.message?.includes("already exists in accepted state")) {
            console.log("Timeline already follows user feed - this is normal");
          } else {
            toast.error("Follow error:");
          }
        }

        // Set up subscriptions for both feeds
        timelineUnsubscribe = timeline.state.subscribe((state) => {
          setTimelineActivities(state.activities || []);
        });

        userUnsubscribe = user.state.subscribe((state) => {
          setUserActivities(state.activities || []);
        });

        // Set initial activities
        const timelineState = timeline.state.getLatestValue();
        setTimelineActivities(timelineState.activities || []);

        const userState = user.state.getLatestValue();
        setUserActivities(userState.activities || []);

        setTimelineFeed(timeline);
        setUserFeed(user);
      } catch (err) {
        toast.error("Error initializing feeds");
      } finally {
        setLoading(false);
      }
    };

    initFeeds();

    return () => {
      timelineUnsubscribe?.();
      userUnsubscribe?.();
    };
  }, [client, userId]);

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

  return {
    timelineFeed,
    userFeed,
    activities,
    feedType,
    loading,
    switchFeedType,
  };
}
