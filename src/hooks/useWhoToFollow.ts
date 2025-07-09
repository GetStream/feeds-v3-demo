import { useEffect, useState } from "react";
import { useUser } from "../contexts/stream";
import { FullUserResponse } from "@stream-io/feeds-client";

export function useWhoToFollow() {
  const { client, user } = useUser();
  const [whoToFollow, setWhoToFollow] = useState<FullUserResponse[]>([]);

  const fetchWhoToFollow = async () => {
    if (!client || !user) return;

    try {
      // First, get the feed IDs for user feeds
      const response = await client.getFollowSuggestions({
        feed_group_id: "user",
        limit: 10,
      });

      if (response.suggestions.length === 0) {
        setWhoToFollow([]);
        return;
      }

      // this is a hack to get the user details, because in the response field 'name' is not populated
      // so we need to get the user details from the queryUsers endpoint ;)
      const suggestions = await client.queryUsers({
        payload: {
          filter_conditions: {
            id: {
              $in: response.suggestions.map((suggestion) => suggestion.id),
            },
          },
        },
      });

      setWhoToFollow(suggestions.users || []);
    } catch (error) {
      console.error("Error fetching who to follow:", error);
      setWhoToFollow([]);
    }
  };

  useEffect(() => {
    fetchWhoToFollow();
  }, [client, user]);

  return { whoToFollow, fetchWhoToFollow };
}
