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

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const baseUrl = process.env.NEXT_PUBLIC_FEEDS_BASE_URL!;
const userId = 'demo-user-1';

export default function FeedView() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [client, setClient] = useState<FeedsClient | null>(null);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let f: Feed;
    let c: FeedsClient;
    let unsubscribe: () => void = () => {};

    const init = async () => {
      try {
        const res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });

        const { token } = await res.json();
        c = new FeedsClient(apiKey, { base_url: baseUrl });
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
        setError('Failed to load feed.');
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
    await feed.addActivity({
      type: 'post',
      text,
    });

    const response = await feed.getOrCreate();
    setActivities(response.activities);
  };

  return (
    <div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <Composer onPost={handlePost} />

      {activities.length === 0 ? (
        <p className="text-gray-500 mt-4">No activities yet.</p>
      ) : (
        <ul className="space-y-4 mt-4">
          {activities.map((a) => (
            <li
              key={a.id}
              className="border border-gray-700 p-4 rounded-lg shadow-sm bg-black text-white"
            >
              <p className="font-semibold">
                {a.user?.name || a.user?.id || 'unknown'} — {a.text ?? a.type}
              </p>
              {a.created_at && (
                <p className="text-xs text-gray-400">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              )}
              {client && <ReactionsPanel activity={a} client={client} />}
              {client && <CommentsPanel activity={a} client={client} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}