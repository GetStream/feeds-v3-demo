// components/ReactionsPanel.tsx

'use client';

import { ActivityResponse, FeedsClient } from '@stream-io/feeds-client';
import { ThumbsUp, Heart, Laugh } from 'lucide-react';
import { useState } from 'react';

type Props = {
  client: FeedsClient;
  activity: ActivityResponse;
};

export default function ReactionsPanel({ client, activity }: Props) {
  const [loading, setLoading] = useState(false);

  const handleReaction = async (type: string) => {
    if (!activity?.id || !client) return;
    try {
      setLoading(true);
      await client.addReaction({
        activity_id: activity.id,
        type,
      });
    } catch (err) {
      console.error('Reaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reactionCount = (type: string) =>
    activity.own_reactions?.map((reaction) => reaction.type).filter((t) => t === type).length || 0;

  return (
    <div className="flex space-x-4 mt-2 text-sm text-gray-400">
      <button
        disabled={loading}
        onClick={() => handleReaction('like')}
        className="hover:text-blue-400 flex items-center space-x-1"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{reactionCount('like')}</span>
      </button>
      <button
        disabled={loading}
        onClick={() => handleReaction('love')}
        className="hover:text-pink-400 flex items-center space-x-1"
      >
        <Heart className="w-4 h-4" />
        <span>{reactionCount('love')}</span>
      </button>
      <button
        disabled={loading}
        onClick={() => handleReaction('haha')}
        className="hover:text-yellow-400 flex items-center space-x-1"
      >
        <Laugh className="w-4 h-4" />
        <span>{reactionCount('haha')}</span>
      </button>
    </div>
  );
}
