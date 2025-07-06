'use client';

import { useFollowers } from '../contexts/followers';

interface FollowStatusProps {
  userId: string;
}

export function FollowStatus({ userId }: FollowStatusProps) {
  const { followers } = useFollowers();
  
  const isFollowing = followers.includes(userId);
  
  return (
    <div className="text-sm text-gray-400">
      {isFollowing ? 'Following' : 'Not following'}
    </div>
  );
} 