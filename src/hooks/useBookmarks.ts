"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "./useUser";
import { ActivityResponse } from "@stream-io/feeds-client";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

// Query key for bookmarks data
const BOOKMARKS_QUERY_KEY = ["bookmarks"];

const fetchBookmarkedActivities = async (
  client: FeedsClient,
  user: any
): Promise<ActivityResponse[]> => {
  if (!client || !user) return [];

  try {
    const bookmarks = await client.queryBookmarks();

    return bookmarks.bookmarks.map((bookmark) => bookmark.activity) || [];
  } catch (error) {
    console.error("Error fetching bookmarked activities:", error);
    toast.error("Error fetching bookmarks");
    return [];
  }
};

export function useBookmarks() {
  const { client, user } = useUser();
  const [loading, setLoading] = useState(true);

  const {
    data: bookmarkedActivities = [],
    isLoading,
    isFetching,
    error,
    refetch: fetchBookmarks,
  } = useQuery({
    queryKey: [...BOOKMARKS_QUERY_KEY, user?.id],
    queryFn: () => fetchBookmarkedActivities(client!, user!),
    enabled: !!client && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  //this is a hack to fix the loading state, because the query is not returning the data immediately
  useEffect(() => {
    setLoading(false);
  }, []);

  const isLoadingData = loading || isLoading || isFetching;

  return {
    bookmarkedActivities,
    fetchBookmarks,
    isFetching,
    isLoading: isLoadingData,
    error: error?.message || null,
  };
}
