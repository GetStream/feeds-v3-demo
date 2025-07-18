"use client";

import { useNotifications } from "../../hooks";
import { useUser } from "../../hooks/useUser";
import { Loading } from "../../components/loading";
import { Error } from "../../components/error";
import Activity from "../../components/activity";
import { useEffect } from "react";

export default function NotificationsPage() {
  const { error, loading: clientLoading, retryConnection } = useUser();
  const {
    notifications,
    isLoading: notificationsLoading,
    error: notificationsError,
    fetchNotifications,
    markAsSeen,
  } = useNotifications();

  const loading = clientLoading || notificationsLoading;

  // Mark notifications as seen when the page is opened
  useEffect(() => {
    if (notifications?.activities && notifications.activities.length > 0) {
      markAsSeen();
    }
  }, [notifications, markAsSeen]);

  if (loading) {
    return <Loading message="Loading notifications..." />;
  }

  if (error || notificationsError) {
    return (
      <Error
        title="Connection Error"
        message={error || notificationsError || "Failed to load notifications"}
        onRetry={retryConnection || fetchNotifications}
      />
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 font-bold px-4 pt-4 mb-5">
        <h1 className="text-xl text-white">Notifications</h1>
        <p className="text-gray-400 text-sm font-light mb-4">
          Get notified when someone follows you, comments on your posts, or
          likes your content.
        </p>
      </div>

      {!notifications?.activities || notifications.activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No notifications yet</div>
          <p className="text-gray-500 text-sm">
            When you get notifications, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.activities.map((notification) => (
            <Activity
              key={`notification-${notification.id}`}
              activity={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
