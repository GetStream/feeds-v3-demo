// components/ReactionsPanel.tsx

'use client';

import { ActivityResponse, FeedsClient } from '@stream-io/feeds-client';
import { ThumbsUp, Heart, Laugh } from 'lucide-react';
import { useState, useEffect } from 'react';

type Props = {
  client: FeedsClient;
  activity: ActivityResponse;
};

export default function ReactionsPanel({ client, activity }: Props) {
  const [loading, setLoading] = useState(false);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  // Track user's reactions for this activity
  useEffect(() => {
    if (activity.own_reactions) {
      const userReactionTypes = new Set(
        activity.own_reactions.map(reaction => reaction.type)
      );
      setUserReactions(userReactionTypes);
    }
  }, [activity.own_reactions]);

  const handleReaction = async (type: string) => {
    if (!activity?.id || !client) return;
    
    try {
      setLoading(true);
      // Check if user already has this reaction
      const hasReaction = userReactions.has(type);
      if (hasReaction) {
        await client.deleteActivityReaction({
            activity_id: activity.id,
            type,
        });
      } else {
        await client.addReaction({
          activity_id: activity.id,
          type,
        });
      }
      setUserReactions(prev => new Set([...prev, type]));
    } catch (err) {
      console.error('Reaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reactionCount = (type: string) =>
    activity.own_reactions?.filter((reaction) => reaction.type === type).length || 0;

  const getReactionStyles = (type: string) => {
    const isActive = userReactions.has(type);
    const baseStyles = "flex items-center space-x-1 transition-all duration-200 hover:scale-105";
    
    switch (type) {
      case 'like':
        return `${baseStyles} ${isActive ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'}`;
      case 'love':
        return `${baseStyles} ${isActive ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`;
      case 'haha':
        return `${baseStyles} ${isActive ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`;
      default:
        return `${baseStyles} text-gray-400`;
    }
  };

  return (
    <div className="flex space-x-4 mt-2 text-sm">
      <button
        disabled={loading}
        onClick={() => handleReaction('like')}
        className={getReactionStyles('like')}
        title={userReactions.has('like') ? 'Already liked' : 'Like'}
      >
        <ThumbsUp className={`w-4 h-4 ${userReactions.has('like') ? 'fill-current' : ''}`} />
        <span>{reactionCount('like')}</span>
      </button>
      <button
        disabled={loading}
        onClick={() => handleReaction('love')}
        className={getReactionStyles('love')}
        title={userReactions.has('love') ? 'Already loved' : 'Love'}
      >
        <Heart className={`w-4 h-4 ${userReactions.has('love') ? 'fill-current' : ''}`} />
        <span>{reactionCount('love')}</span>
      </button>
      <button
        disabled={loading}
        onClick={() => handleReaction('haha')}
        className={getReactionStyles('haha')}
        title={userReactions.has('haha') ? 'Already reacted' : 'Haha'}
      >
        <Laugh className={`w-4 h-4 ${userReactions.has('haha') ? 'fill-current' : ''}`} />
        <span>{reactionCount('haha')}</span>
      </button>
    </div>
  );
}
