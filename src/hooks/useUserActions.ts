import { useState } from "react";
import { useUser } from "./useUser";
import { useFollowers } from "./useFollowers";
import toast from "react-hot-toast";
import { refetchTimelineGlobal } from "./useFeedManager";

export function useUserActions(targetUserId: string) {
  const { user, client } = useUser();
  const {
    followers,
    loading: followersLoading,
    addFollower,
    removeFollower,
  } = useFollowers();
  const currentUserId = user?.id || "";
  const [loading, setLoading] = useState(false);
  const isFollowing = followers.includes(targetUserId);

  const handleFollow = async () => {
    if (targetUserId === currentUserId || !client) return;

    try {
      setLoading(true);

      if (isFollowing) {
        // Unfollow
        await client.unfollow({
          source: `timeline:${currentUserId}`,
          target: `user:${targetUserId}`,
        });
        removeFollower(targetUserId);
      } else {
        // Follow
        await client.follow({
          source: `timeline:${currentUserId}`,
          target: `user:${targetUserId}`,
        });
        addFollower(targetUserId);
      }
      refetchTimelineGlobal();
    } catch {
      toast.error("failed to perform this action");
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || followersLoading;
  const isOwnUser = targetUserId === currentUserId;

  return {
    isFollowing,
    isLoading,
    isOwnUser,
    handleFollow,
  };
}
