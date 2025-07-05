'use client';

import { useState } from 'react';
import { FeedsClient } from '@stream-io/feeds-client';
import { UserPlus, UserMinus, User } from 'lucide-react';

interface UserActionsProps {
  client: FeedsClient;
  targetUserId: string;
  currentUserId: string;
}

export function UserActions({ client, targetUserId, currentUserId }: UserActionsProps) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (targetUserId === currentUserId) return;
    
    try {
      setLoading(true);
      
      if (isFollowing) {
        // Unfollow
        await client.unfollow({ source: currentUserId, target: targetUserId });
        setIsFollowing(false);
      } else {
        // Follow
        await client.follow({ source: currentUserId, target: targetUserId });
        setIsFollowing(true);
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

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-600 text-white hover:bg-gray-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? (
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
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold`}>
      {userId.charAt(0).toUpperCase()}
    </div>
  );
} 