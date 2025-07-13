// components/ReactionsPanel.tsx

"use client";

import { useUser } from "@/hooks/useUser";
import { ActivityResponse } from "@stream-io/feeds-client";
import { Heart, Bookmark, Pin, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

type Props = {
  activity: ActivityResponse;
};

export default function ReactionsPanel({ activity }: Props) {
  const [loading, setLoading] = useState(false);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(
    {}
  );
  const [isPinned, setIsPinned] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user, client } = useUser();
  useEffect(() => {
    if (!user) return;

    // Update reaction counts from activity
    const counts: Record<string, number> = {};
    const userReacts = new Set<string>();

    if (activity.reaction_groups) {
      Object.entries(activity.reaction_groups).forEach(([type, group]) => {
        counts[type] = group.count || 0;
      });
    }

    if (activity.latest_reactions) {
      activity.latest_reactions.forEach((reaction) => {
        if (reaction.user.id === user.id) {
          userReacts.add(reaction.type);
        }
      });
    }

    // Check if activity is pinned by current user
    // Look for pinned activities in the activity data
    const pinnedActivities = (activity as unknown as Record<string, unknown>)
      .pinned_activities;
    const isPinnedByUser = Array.isArray(pinnedActivities)
      ? pinnedActivities.some(
          (pinned: Record<string, unknown>) =>
            (pinned.user as Record<string, unknown>)?.id === user.id
        )
      : false;

    // Check if activity is bookmarked by current user
    const ownBookmarks = (activity as unknown as Record<string, unknown>)
      .own_bookmarks;
    const isBookmarkedByUser =
      Array.isArray(ownBookmarks) && ownBookmarks.length > 0;

    setReactionCounts(counts);
    setUserReactions(userReacts);
    setIsPinned(isPinnedByUser);
    setIsBookmarked(isBookmarkedByUser);
  }, [activity, user]);

  const handleReaction = async (type: string) => {
    if (loading || !client) return;

    try {
      setLoading(true);

      if (userReactions.has(type)) {
        // Delete existing reaction
        await client.deleteActivityReaction({
          activity_id: activity.id,
          type,
        });
        setUserReactions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });
        setReactionCounts((prev) => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) - 1),
        }));
      } else {
        // Add new reaction
        await client.addReaction({
          activity_id: activity.id,
          type,
        });
        setUserReactions((prev) => new Set([...prev, type]));
        setReactionCounts((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Failed to handle reaction", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async () => {
    if (loading || !client || !user) return;

    try {
      setLoading(true);

      if (isPinned) {
        await client.unpinActivity({
          feed_group_id: "user",
          feed_id: user.id,
          activity_id: activity.id,
        });
        setIsPinned(false);
      } else {
        await client.pinActivity({
          feed_group_id: "user",
          feed_id: user.id,
          activity_id: activity.id,
        });
        setIsPinned(true);
      }
    } catch (err) {
      console.error("Failed to handle pin", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (loading || !client) return;

    try {
      setLoading(true);

      if (isBookmarked) {
        // Delete bookmark - we need to delete the specific bookmark
        const bookmarks =
          (activity as unknown as Record<string, unknown>).own_bookmarks || [];
        if (Array.isArray(bookmarks) && bookmarks.length > 0) {
          const firstBookmark = bookmarks[0] as Record<string, unknown>;
          await client.deleteBookmark({
            activity_id: activity.id,
            folder_id: (firstBookmark.folder as Record<string, unknown>)
              ?.id as string, // Delete from the first folder
          });
        }
        setIsBookmarked(false);
      } else {
        await client.addBookmark({
          activity_id: activity.id,
        });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Failed to handle bookmark", err);
    } finally {
      setLoading(false);
    }
  };

  const getReactionStyles = (type: string) => {
    const hasReaction = userReactions.has(type);
    const baseStyles =
      "flex items-center space-x-2 text-gray-400 hover:text-red-400 cursor-pointer transition-colors";

    switch (type) {
      case "like":
        return `${baseStyles} ${hasReaction ? "text-red-400" : ""}`;
      default:
        return baseStyles;
    }
  };

  const reactionCount = (type: string) => {
    return reactionCounts[type] || 0;
  };

  return (
    <div className="flex items-center justify-between mt-4 pt-4">
      <div className="flex items-center space-x-6">
        <button title="Comments" className={getReactionStyles("messages")}>
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{activity.comments.length}</span>
        </button>
        {/* Like/Heart */}
        <button
          disabled={loading}
          onClick={() => handleReaction("like")}
          className={getReactionStyles("like")}
          title={userReactions.has("like") ? "Unlike" : "Like"}
        >
          <Heart
            className={`w-5 h-5 ${
              userReactions.has("like") ? "fill-current" : ""
            }`}
          />
          <span className="text-sm">{reactionCount("like")}</span>
        </button>

        {/* Pin */}
        <button
          disabled={loading}
          onClick={handlePin}
          className={`flex items-center space-x-2 transition-colors cursor-pointer ${
            isPinned ? "text-blue-400" : "text-gray-400 hover:text-blue-400"
          }`}
          title={isPinned ? "Unpin" : "Pin"}
        >
          <Pin className={`w-5 h-5 ${isPinned ? "fill-current" : ""}`} />
        </button>

        {/* Bookmark */}
        <button
          disabled={loading}
          onClick={handleBookmark}
          className={`flex items-center space-x-2 transition-colors cursor-pointer ${
            isBookmarked ? "text-blue-400" : "text-gray-400 hover:text-blue-400"
          }`}
          title={isBookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
