'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { UserActions, UserAvatar } from './user-actions';
import { useToast } from './toast';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const baseUrl = process.env.NEXT_PUBLIC_FEEDS_BASE_URL!;
const userId = 'demo-user-1';

export default function FeedView() {
  const [client, setClient] = useState<FeedsClient | null>(null);
  const [timelineFeed, setTimelineFeed] = useState<Feed | null>(null);
  const [userFeed, setUserFeed] = useState<Feed | null>(null);
  const [timelineActivities, setTimelineActivities] = useState<ActivityResponse[]>([]);
  const [userActivities, setUserActivities] = useState<ActivityResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [feedType, setFeedType] = useState<'timeline' | 'user'>('timeline');
  const { showToast, ToastContainer } = useToast();
  const feedTypeRef = useRef(feedType);

  // Update ref when feedType changes
  useEffect(() => {
    feedTypeRef.current = feedType;
  }, [feedType]);

  // Get current activities based on feed type
  const activities = feedType === 'timeline' ? timelineActivities : userActivities;

  // Initialize client and feeds
  useEffect(() => {
    let c: FeedsClient;
    let timelineUnsubscribe: () => void = () => {};
    let userUnsubscribe: () => void = () => {};

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

        // Initialize both feeds
        const timeline = c.feed('timeline', userId);
        const user = c.feed('user', userId);

        await Promise.all([
          timeline.getOrCreate({ watch: true }),
          user.getOrCreate({ watch: true })
        ]);

        // Set up timeline to follow user feed (this is the proper way)
        try {
          await c.follow({
            source: timeline.fid,
            target: user.fid,
          });
          // Small delay to ensure follow relationship is established
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          // Ignore if already following - this is expected on refresh
          if (err.message?.includes('already exists in accepted state')) {
            console.log('Timeline already follows user feed - this is normal');
          } else {
            console.error('Follow error:', err);
          }
        }

        // Set up subscriptions for both feeds
        timelineUnsubscribe = timeline.state.subscribeWithSelector(
          (state) => state.activities || [],
          (newActivities) => {
            setTimelineActivities(newActivities);
          }
        );

        userUnsubscribe = user.state.subscribeWithSelector(
          (state) => state.activities || [],
          (newActivities) => {
            setUserActivities(newActivities);
          }
        );

        // Set initial activities
        const timelineState = timeline.state.getLatestValue();
        setTimelineActivities(timelineState.activities || []);
        
        const userState = user.state.getLatestValue();
        setUserActivities(userState.activities || []);

        setClient(c);
        setTimelineFeed(timeline);
        setUserFeed(user);
      } catch (err) {
        console.error('Error initializing feed:', err);
        setError('Failed to load feed. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      timelineUnsubscribe?.();
      userUnsubscribe?.();
      c?.disconnectUser();
    };
  }, []);

  // Handle feed type switching
  const switchFeedType = useCallback(async (type: 'timeline' | 'user') => {
    if (!client || type === feedType) return;
    
    try {
      setLoading(true);
      setFeedType(type);
    } catch (err) {
      console.error('Error switching feed type:', err);
      showToast('Failed to switch feed', 'error');
    } finally {
      setLoading(false);
    }
  }, [client, feedType, showToast]);

  const handlePost = async (text: string) => {
    if (!client) return;
    
    try {
      setPosting(true);
      
      // Only add to user feed - timeline will automatically get it via follow relationship
      const userFeed = client.feed('user', userId);
      const result = await userFeed.addActivity({
        type: 'post',
        text,
      });

      console.log('Post created:', result);
      
      // Force refresh of both feeds to ensure state updates
      if (timelineFeed) {
        await timelineFeed.getOrCreate();
      }
      if (userFeed) {
        await userFeed.getOrCreate();
      }
      
      showToast('Post created successfully!', 'success');
    } catch (err) {
      console.error('Error posting:', err);
      setError('Failed to post. Please try again.');
      showToast('Failed to create post', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!client) return;
    
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
      <ToastContainer />
      
      {/* Feed Type Selector */}
      <div className="flex space-x-2 mb-4 p-2 bg-zinc-900 rounded-lg">
        <button
          onClick={() => switchFeedType('timeline')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            feedType === 'timeline' 
              ? 'bg-blue-600 text-white' 
              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => switchFeedType('user')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            feedType === 'user' 
              ? 'bg-blue-600 text-white' 
              : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
          }`}
        >
          My Posts
        </button>
      </div>

      <Composer onPost={handlePost} />

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {feedType === 'timeline' && 'No posts in your timeline'}
            {feedType === 'user' && 'No posts yet'}
          </div>
          <p className="text-gray-500 text-sm">
            {feedType === 'timeline' && 'Follow some users to see their posts here! Your own posts will also appear in your timeline.'}
            {feedType === 'user' && 'Be the first to share something!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="border border-gray-700 rounded-xl p-6 shadow-sm bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start space-x-3 mb-4">
                <UserAvatar userId={activity.user?.id || 'unknown'} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
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
                    <div className="flex items-center space-x-2">
                      {client && activity.user?.id && activity.user.id !== userId && (
                        <UserActions 
                          client={client}
                          targetUserId={activity.user.id}
                          currentUserId={userId}
                        />
                      )}
                      {client && activity.user?.id === userId && (
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Delete post"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-200 text-lg leading-relaxed">
                    {activity.text || activity.type}
                  </p>
                </div>
              </div>
              
              {client && <ReactionsPanel 
                activity={activity} 
                client={client} 
              />}
              {client && <CommentsPanel 
                activity={activity} 
                client={client} 
              />}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}