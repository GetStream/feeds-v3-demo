'use client';

import { useFeedActivities, useFeedActions, useComments } from '../hooks';
import { useUser } from '../contexts/stream';
import { Composer } from './composer';
import ReactionsPanel from './reaction';
import CommentsPanel from './comment';
import { Loading } from './loading';
import { Error } from './error';
import { UserActions, UserAvatar } from './userActions';
import { useToast } from './toast';
import  UserModal  from './userModal';

export default function FeedView() {
  const { showToast, ToastContainer } = useToast();
  const { 
    user,
    client, 
    error, 
    loading: clientLoading, 
    retryConnection, 
    showUserModal, 
    createUser 
  } = useUser();
  const { 
    activities, 
    feedType, 
    loading: activitiesLoading, 
    switchFeedType 
  } = useFeedActivities();
  const { posting, handlePost, handleDeleteActivity } = useFeedActions(showToast);
  const {
    comments, 
    loading: commentsLoading, 
    error: commentsError,
    fetchComments,
    addComment,
    deleteComment,
    toggleCommentReaction
  } = useComments();
  
  const loading = (clientLoading || activitiesLoading || commentsLoading) && !activities.length;
  
  // Show user modal if no user is authenticated
  if (!user) {
    return (
      <div>
        <ToastContainer />
        <UserModal 
          isOpen={showUserModal}
          onSubmit={createUser}
          loading={clientLoading}
        />
      </div>
    );
  }
  
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
      
      {/* User Registration Modal */}
      <UserModal 
        isOpen={showUserModal}
        onSubmit={createUser}
        loading={clientLoading}
      />
      
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
              className="border-b border-gray-800 shadow-sm mb-15 transition-colors"
            >
              <div className="flex items-start space-x-3 mb-4">
                <UserAvatar userId={activity.user?.name || 'unknown'} />
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
                      {activity.user?.id && activity.user.id !== user?.id && (
                        <UserActions 
                          targetUserId={activity.user.id}
                        />
                      )}
                      {client && activity.user?.id === user?.id && (
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
              
              <ReactionsPanel 
                activity={activity} 
              />
              <CommentsPanel 
                activity={activity} 
                allComments={comments}
                currentUserId={user?.id || ''}
                addComment={addComment}
                deleteComment={deleteComment}
                toggleCommentReaction={toggleCommentReaction}
                onCommentReactionUpdated={() => {
                  // Refresh comments to get updated reaction state
                  fetchComments();
                }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}