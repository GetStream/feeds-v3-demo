'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from './stream';

interface FollowersContextType {
  followers: string[];
  loading: boolean;
  error: string | null;
  refreshFollowers: () => Promise<void>;
  addFollower: (userId: string) => void;
  removeFollower: (userId: string) => void;
}

const FollowersContext = createContext<FollowersContextType | undefined>(undefined);

export function FollowersProvider({ children }: { children: ReactNode }) {
  const { user, client } = useUser();
  const [followers, setFollowers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = async () => {
    if (!client || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await client.queryFollows({
        filter: {
          source_feed: `timeline:${user.id}`,
        }
      });

      const followerIds = response.follows.map(follow => 
        follow.target_feed.id
      );
      
      setFollowers(followerIds);
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client && user?.id) {
      fetchFollowers();
    }
  }, [client, user?.id]);

  const refreshFollowers = async () => {
    await fetchFollowers();
  };

  const addFollower = (userId: string) => {
    setFollowers(prev => [...prev, userId]);
  };

  const removeFollower = (userId: string) => {
    setFollowers(prev => prev.filter(id => id !== userId));
  };

  const value: FollowersContextType = {
    followers,
    loading,
    error,
    refreshFollowers,
    addFollower,
    removeFollower,
  };

  return (
    <FollowersContext.Provider value={value}>
      {children}
    </FollowersContext.Provider>
  );
}

export function useFollowers() {
  const context = useContext(FollowersContext);
  if (context === undefined) {
    throw new Error('useFollowers must be used within a FollowersProvider');
  }
  return context;
} 