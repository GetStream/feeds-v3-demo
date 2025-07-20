"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser, User } from "./useUser";
import {
  GetOrCreateFeedResponse,
  NotificationStatusResponse,
  StreamResponse,
} from "@stream-io/feeds-client";
import { FeedsClient, Feed } from "@stream-io/feeds-client";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

// Query key for notifications data
const NOTIFICATIONS_QUERY_KEY = ["notifications"];
interface NotificationsResponse
  extends StreamResponse<GetOrCreateFeedResponse> {
  notification_status?: NotificationStatusResponse;
}
let notificationsFeed: Feed | null = null;
const fetchNotifications = async (
  client: FeedsClient,
  user: User
): Promise<NotificationsResponse | undefined> => {
  if (!client || !user) return;

  try {
    // Use a notifications feed for user notifications
    notificationsFeed = client.feed("notification", user.id);
    const notifications = await notificationsFeed.getOrCreate({ watch: true });

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    toast.error("Error fetching notifications");
    return;
  }
};

export function useNotifications() {
  const { client, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const {
    data: notifications,
    isLoading,
    isFetching,
    error,
    refetch: fetchNotificationsData,
  } = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, user?.id],
    queryFn: () => {
      if (!client) {
        throw new Error("Client is not available");
      }
      return fetchNotifications(client, user!);
    },
    enabled: !!client && !!user,
    staleTime: 0,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (notificationsFeed) {
      notificationsFeed.state.subscribe((data) => {
        console.log("subscribe", data);
      });
      const unreadCount = notifications?.notification_status?.unread || 0;
      setUnreadCount(unreadCount);
    }
  }, [notificationsFeed]);

  // Mark notifications as seen
  const markAsSeen = async () => {
    if (!client || !user) return;

    try {
      if (notificationsFeed) {
        // Mark all notifications as seen
        await client.markActivity({
          feed_group_id: notificationsFeed.group,
          feed_id: notificationsFeed.id,
          mark_all_seen: true,
          mark_all_read: true,
        });
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
    }
  };

  //this is a hack to fix the loading state, because the query is not returning the data immediately
  useEffect(() => {
    setLoading(false);
  }, []);

  const isLoadingData = loading || isLoading || isFetching;

  return {
    notifications,
    fetchNotifications: fetchNotificationsData,
    isFetching,
    isLoading: isLoadingData,
    error: error?.message || null,
    unreadCount,
    markAsSeen,
  };
}
