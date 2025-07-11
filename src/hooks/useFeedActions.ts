"use client";

import { useState } from "react";
import { useUser } from "./useUser";
import toast from "react-hot-toast";

export function useFeedActions() {
  const { client, user } = useUser();
  const userId = user?.id || "";
  const [posting, setPosting] = useState(false);

  const handlePost = async (text: string) => {
    if (!client || !userId) return;

    try {
      setPosting(true);

      // Add to user feed - timeline will automatically get it via follow relationship
      const userFeed = client.feed("user", userId);
      await userFeed.addActivity({
        type: "post",
        text,
      });

      // Force refresh of both feeds to ensure state updates
      const timelineFeed = client.feed("timeline", userId);
      await Promise.all([timelineFeed.getOrCreate(), userFeed.getOrCreate()]);

      toast.success("Activity created successfully!");
    } catch (err) {
      console.error("Error posting:", err);
      toast.error("Failed to create activity");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!client || !userId) return;

    try {
      await client.deleteActivity({
        activity_id: activityId,
      });

      toast.success("Post deleted successfully");
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error("Failed to delete post");
    }
  };

  return {
    posting,
    handlePost,
    handleDeleteActivity,
  };
}
