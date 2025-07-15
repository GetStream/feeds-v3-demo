"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";

// Default values from environment variables
const defaultApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const defaultBaseUrl = process.env.NEXT_PUBLIC_FEEDS_BASE_URL!;

export interface User {
  id: string;
  name: string;
}

interface CustomSettings {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

interface AuthTokenResponse {
  token: string;
}

// Query key for user data
const USER_QUERY_KEY = ["user"];

// Get user from localStorage
const getUserFromStorage = (): User | null => {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      localStorage.removeItem("user");
    }
  }
  return null;
};

// Get custom settings from localStorage
const getCustomSettingsFromStorage = (): CustomSettings | null => {
  if (typeof window === "undefined") return null;

  const storedSettings = localStorage.getItem("customSettings");
  if (storedSettings) {
    try {
      return JSON.parse(storedSettings);
    } catch (err) {
      console.error("Failed to parse stored custom settings:", err);
      localStorage.removeItem("customSettings");
    }
  }
  return null;
};

// Save user to localStorage
const saveUserToStorage = (user: User | null) => {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
};

// Connect user to Stream API
const connectUser = async (
  user: User,
  customSettings?: CustomSettings
): Promise<FeedsClient> => {
  const settings = customSettings || getCustomSettingsFromStorage();

  // Use custom settings if available, otherwise use default environment variables
  const apiKey = settings?.apiKey || defaultApiKey;
  const baseUrl = settings?.baseUrl || defaultBaseUrl;

  const res = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      name: user.name,
      customSettings: settings,
    }),
  });

  if (!res.ok) {
    toast.error("Failed to get authentication token");
    throw new Error("Failed to get authentication token");
  }

  const { token }: AuthTokenResponse = await res.json();
  const client = new FeedsClient(apiKey, { base_url: baseUrl });
  await client.connectUser({ id: user.id }, token);

  return client;
};

export function useUser() {
  const queryClient = useQueryClient();
  const [showUserModal, setShowUserModal] = useState(false);

  // Query for user data
  const {
    data: user,
    isLoading: loading,
    error: userError,
  } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getUserFromStorage,
    staleTime: Infinity, // User data doesn't change often
    gcTime: Infinity, // Keep in cache indefinitely
  });

  // Query for client connection
  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["client", user?.id],
    queryFn: () => connectUser(user!),
    enabled: !!user,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Mutation for creating user
  const createUserMutation = useMutation({
    mutationFn: async ({
      name,
      customSettings,
    }: {
      name: string;
      customSettings?: CustomSettings;
    }) => {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const userId = `user-${randomSuffix}`;
      const userData: User = { id: userId, name };

      const client = await connectUser(userData, customSettings);
      saveUserToStorage(userData);

      return { user: userData, client };
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(USER_QUERY_KEY, user);
      setShowUserModal(false);
    },
  });

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async (userData: User) => {
      saveUserToStorage(userData);
      return userData;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(USER_QUERY_KEY, userData);
    },
  });

  // Mutation for clearing user
  const clearUserMutation = useMutation({
    mutationFn: async () => {
      saveUserToStorage(null);
      // Also clear custom settings when user logs out
      if (typeof window !== "undefined") {
        localStorage.removeItem("customSettings");
      }
      return null;
    },
    onSuccess: () => {
      queryClient.setQueryData(USER_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ["client"] });
    },
  });

  // Show modal if no user exists
  useEffect(() => {
    if (!loading && !user) {
      setShowUserModal(true);
    } else {
      setShowUserModal(false);
    }
  }, [loading, user]);

  const updateUser = (userData: User) => {
    updateUserMutation.mutate(userData);
  };

  const clearUser = () => {
    clearUserMutation.mutate();
  };

  const createUser = async (name: string, customSettings?: CustomSettings) => {
    createUserMutation.mutate({ name, customSettings });
  };

  const retryConnection = () => {
    window.location.reload();
  };

  const getUserInitials = (userName: string) => {
    return userName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const error = userError || clientError;
  const isAuthenticated = !!user;

  return {
    user,
    client,
    loading: loading || clientLoading,
    error: error?.message || null,
    showUserModal,
    updateUser,
    clearUser,
    getUserInitials,
    createUser,
    retryConnection,
    isAuthenticated,
  };
}
