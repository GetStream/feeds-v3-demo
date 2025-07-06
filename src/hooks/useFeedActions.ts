"use client";

import { useState } from 'react';
import { FeedsClient } from '@stream-io/feeds-client';
import { useUser } from '../contexts/stream';

export function useFeedActions(
  showToast: (message: string, type: 'success' | 'error') => void
) {
  const { client, user } = useUser();
  const userId = user?.id || '';
  const [posting, setPosting] = useState(false);

  const handlePost = async (text: string) => {
    if (!client || !userId) return;
    
    try {
      setPosting(true);
      
      // Add to user feed - timeline will automatically get it via follow relationship
      const userFeed = client.feed('user', userId);
      await userFeed.addActivity({
        type: 'post',
        text,
      });
      
      // Force refresh of both feeds to ensure state updates
      const timelineFeed = client.feed('timeline', userId);
      await Promise.all([
        timelineFeed.getOrCreate(),
        userFeed.getOrCreate()
      ]);
      
      showToast('Activity created successfully!', 'success');
    } catch (err) {
      console.error('Error posting:', err);
      showToast('Failed to create activity', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!client || !userId) return;
    
    try {
      await client.deleteActivity({
        activity_id: activityId,
      });
      
      showToast('Post deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting activity:', err);
      showToast('Failed to delete post', 'error');
    }
  };

  return {
    posting,
    handlePost,
    handleDeleteActivity,
  };
} 