'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FeedsClient } from '@stream-io/feeds-client';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const baseUrl = process.env.NEXT_PUBLIC_FEEDS_BASE_URL!;

export interface User {
  id: string;
  name: string;
}

interface StreamContextType {
  user: User | null;
  client: FeedsClient | null;
  loading: boolean;
  error: string | null;
  showUserModal: boolean;
  updateUser: (userData: User) => void;
  clearUser: () => void;
  getUserInitials: (userName: string) => string;
  createUser: (name: string) => Promise<void>;
  retryConnection: () => void;
  isAuthenticated: boolean;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<FeedsClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Initialize user from localStorage only once
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData: User = JSON.parse(storedUser);
        setUser(userData);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Show modal if no user exists
  useEffect(() => {
    if (!user) {
      setShowUserModal(true);
    } else {
      setShowUserModal(false);
    }
  }, [user]);

  // Ensure modal is shown when loading is complete and no user exists
  useEffect(() => {
    if (!loading && !user) {
      setShowUserModal(true);
    }
  }, [loading, user]);

  // Connect user when user data is available
  useEffect(() => {
    if (user && !client) {
      connectUser(user);
    }
  }, [user, client]);

  const connectUser = async (userData: User) => {
    let c: FeedsClient;

    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userData.id, name: userData.name }),
      });

      if (!res.ok) {
        console.error('Failed to get authentication token');
        return;
      }

      const { token } = await res.json();
      c = new FeedsClient(apiKey, { base_url: baseUrl });
      await c.connectUser({ id: userData.id }, token);

      setClient(c);
      setShowUserModal(false);
    } catch (err) {
      console.error('Error initializing client:', err);
      setError('Failed to connect to feed service. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const clearUser = () => {
    setUser(null);
    setClient(null);
    localStorage.removeItem('user');
  };

  const createUser = async (name: string) => {
    try {
      setLoading(true);
      setError(null);

      // Generate random suffix for user ID
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const userId = `user-${randomSuffix}`;
      
      const userData: User = {
        id: userId,
        name: name
      };

      await connectUser(userData);
      updateUser(userData);
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const value: StreamContextType = {
    user,
    client,
    loading,
    error,
    showUserModal,
    updateUser,
    clearUser,
    getUserInitials,
    createUser,
    retryConnection,
    isAuthenticated: !!user,
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
}

export function useUser() {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a StreamProvider');
  }
  return context;
} 