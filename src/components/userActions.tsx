'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useUser } from '../contexts/stream';
import { useFollowers } from '../contexts/followers';
import { Avatar } from './avatar';

interface UserActionsProps {
  targetUserId: string;
  
}

export function UserActions({ targetUserId }: UserActionsProps) {
  const { user, client } = useUser();
  const { followers, loading: followersLoading, addFollower, removeFollower } = useFollowers();
  const currentUserId = user?.id || '';
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
          target: `user:${targetUserId}` 
        });
        removeFollower(targetUserId);
      } else {
        // Follow
        await client.follow({ 
          source: `timeline:${currentUserId}`, 
          target: `user:${targetUserId}` 
        });
        addFollower(targetUserId);
      }
    } catch (err) {
      console.error('Follow/Unfollow error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (targetUserId === currentUserId) {
    return null; // Don't show follow button for own posts
  }

  const isLoading = loading || followersLoading;

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`cursor-pointer flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-600 text-white hover:bg-gray-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
    </button>
  );
}

export function UserAvatar({ userId, size = 'md' }: { userId: string; size?: 'sm' | 'md' | 'lg' }) {
  // Try to find user by ID to get their name for initials
  const storedUser = localStorage.getItem('user');
  let userName = '';
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.id === userId) {
        userName = userData.name;
      }
    } catch (err) {
      // Ignore parsing errors
    }
  }

  return (
    <Avatar 
      userId={userId}
      userName={userName}
      size={size}
    />
  );
} 