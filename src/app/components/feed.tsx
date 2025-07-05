'use client';

import { useEffect, useState } from 'react';
import {
  FeedsClient,
  Feed,
  ActivityResponse,
} from '@stream-io/feeds-client';
import { Composer } from './composer';
import ReactionsPanel from './reaction';
import CommentsPanel from './comment';
import { Loading } from './loading';
import { Error } from './error';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const baseUrl = process.env.NEXT_PUBLIC_FEEDS_BASE_URL!;
const userId = 'demo-user-1';

export default function FeedView() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [client, setClient] = useState<FeedsClient | null>(null);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let f: Feed;
    let c: FeedsClient;
    let unsubscribe: () => void = () => {};

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!res.ok) {
          console.error('Failed to get authentication token');
          return;
        }

        const { token } = await res.json();
        c = new (FeedsClient as any)(apiKey, { base_url: baseUrl });
        await c.connectUser({ id: userId }, token);

        f = c.feed('timeline', userId);
        await f.getOrCreate({ watch: true });

        const state = f.state.getLatestValue();
        setActivities(state.activities || []);

        unsubscribe = f.state.subscribeWithSelector(
          (state) => state.activities || [],
          (newActivities, _prevActivities) => {
            setActivities(newActivities);
          }
        );

        setFeed(f);
        setClient(c);
      } catch (err) {
        console.error('Error initializing feed:', err);
        setError('Failed to load feed. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      unsubscribe?.();
      c?.disconnectUser();
    };
  }, []);

  const handlePost = async (text: string) => {
    if (!feed) return;
    
    try {
      setPosting(true);
      await feed.addActivity({
        type: 'post',
        text,
      });

      const response = await feed.getOrCreate();
      setActivities(response.activities);
    } catch (err) {
      console.error('Error posting:', err);
      setError('Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const retryConnection = () => {
    setError(null);
    setLoading(true);
    // Re-initialize the connection
    window.location.reload();
  };

  if (loading) {
    return <Loading message="Loading feed..." />;
  }

  if (error) {
    return (
      <Error 
        title="Connection Error"
        message={error}
        onRetry={retryConnection}
      />
    );
  }

  return (
    <div>
      <Composer onPost={handlePost} />

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No posts yet</div>
          <p className="text-gray-500 text-sm">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="border border-gray-700 rounded-xl p-6 shadow-sm bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {(activity.user?.name || activity.user?.id || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-white">
                      {activity.user?.name || activity.user?.id || 'Unknown User'}
                    </span>
                    {activity.created_at && (
                      <span className="text-sm text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    {activity.text || activity.type}
                  </p>
                </div>
              </div>
              
              {client && <ReactionsPanel activity={activity} client={client} />}
              {client && <CommentsPanel activity={activity} client={client} />}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}