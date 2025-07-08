import { useEffect, useState } from "react";
import { useUser } from "../contexts/stream";
import { Feed, RequestMetadata, UserResponse } from "@stream-io/feeds-client";

type WhoToFollowType = {
  feeds: Feed[];
  next: string | undefined;
  prev: string | undefined;
  metadata: RequestMetadata;
  duration: string;
};

export function useWhoToFollow() {
  const { client, user } = useUser();
  const [whoToFollow, setWhoToFollow] = useState<UserResponse[]>([]);

  useEffect(() => {
    const fetchWhoToFollow = async () => {
      if (!client || !user) return;

      try {
        // First, get the feed IDs for user feeds
        const response = (await client.queryFeeds({
          filter: {},
          limit: 10,
        })) as WhoToFollowType;

        // Extract user IDs from user feeds, excluding current user
        const userIds =
          response?.feeds
            .filter((feed) => feed.group === "user" && feed.id !== user.id)
            .map((feed) => feed.id) || [];

        if (userIds.length === 0) {
          setWhoToFollow([]);
          return;
        }

        // Fetch user objects using queryUsers with correct payload
        const usersResponse = await client.queryUsers({
          payload: {
            filter_conditions: {
              id: { $in: userIds },
            },
          },
        });

        // Query follows to check which users the current user is following
        const followsResponse = await client.queryFollows({
          filter: {
            source_feed: `user:${user.id}`,
            target_feed: { $in: userIds.map((id) => `user:${id}`) },
          },
        });

        setWhoToFollow(usersResponse.users || []);
      } catch (error) {
        console.error("Error fetching who to follow:", error);
        setWhoToFollow([]);
      }
    };

    fetchWhoToFollow();
  }, [client, user]);

  return { whoToFollow };
}
