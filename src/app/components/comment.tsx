// CommentsPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  FeedsClient,
  ActivityResponse,
  CommentResponse,
  AddCommentReactionResponse,
} from '@stream-io/feeds-client';
import { Heart, Trash2 } from 'lucide-react';

interface CommentsPanelProps {
  activity: ActivityResponse;
  client: FeedsClient;
}

export default function CommentsPanel({ activity, client }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Update showCommentInput when showInput prop changes
  useEffect(() => {
    setShowCommentInput(false);
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await client.queryComments({
          filter: { object_id: activity.id },
        });
        setComments(res.comments);
      } catch (err) {
        console.error('Failed to fetch comments', err);
      }
    };

    fetchComments();
  }, [activity.id, client]);

  const handleAddComment = async () => {
    if (!newComment.trim() || newComment.length > 280) return;
    try {
      setLoading(true);
      const res = await client.addComment({
        object_id: activity.id,
        object_type: 'activity',
        comment: newComment,
      });
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
      setShowCommentInput(false);
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactToComment = async (commentId: string, type: string) => {
    try {
      const hasReaction = getUserReactionForComment(
        comments.find(c => c.id === commentId)!, 
        type
      );

      if (hasReaction) {
        // Delete existing reaction
        await client.deleteCommentReaction({
          comment_id: commentId,
          type,
        });
      } else {
        // Add new reaction
        const res: AddCommentReactionResponse = await client.addCommentReaction({
          comment_id: commentId,
          type,
        });
      }

      // Refresh comments to get updated reaction state
      const res = await client.queryComments({
        filter: { object_id: activity.id },
      });
      setComments(res.comments);
    } catch (err) {
      console.error('Failed to handle comment reaction', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await client.deleteComment({
        comment_id: commentId,
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const getUserReactionForComment = (comment: CommentResponse, type: string) => {
    return comment.latest_reactions?.find(
      (reaction) => reaction.user.id === 'demo-user-1' && reaction.type === type
    );
  };

  const getReactionStyles = (comment: CommentResponse, type: string) => {
    const hasReaction = getUserReactionForComment(comment, type);
    const baseStyles = "hover:scale-110 transition-all cursor-pointer";
    
    switch (type) {
      case 'like':
        return `${baseStyles} ${hasReaction ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`;
      default:
        return `${baseStyles} text-gray-400`;
    }
  };

  return (
    <div className="mt-4 border-t border-gray-600 pt-4" data-activity-id={activity.id}>
      {/* Comment Input Section */}
      {showCommentInput ? (
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
              D
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full rounded-lg bg-gray-700 text-white p-3 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && newComment.trim() && newComment.length <= 280) {
                      handleAddComment();
                    }
                  } else if (e.key === 'Escape') {
                    setShowCommentInput(false);
                    setNewComment('');
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleAddComment}
                    disabled={loading || !newComment.trim()}
                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentInput(false);
                      setNewComment('');
                    }}
                    className="bg-gray-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <span className="text-xs text-gray-400">
                  {newComment.length}/280
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <button
            onClick={() => setShowCommentInput(true)}
            className="w-full text-left p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
          >
            Write a comment...
          </button>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Comments ({comments.length})
          </h3>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
                {comment.user?.id?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-100 text-sm">
                    {comment.user?.id || 'unknown'}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">
                    {comment.created_at && new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-200 text-sm mb-2">{comment.text}</p>
                <div className="flex items-center gap-4">
                  <button
                    title="Like"
                    className={getReactionStyles(comment, 'like')}
                    onClick={() => handleReactToComment(comment.id, 'like')}
                  >
                    <Heart className={`w-4 h-4 ${getUserReactionForComment(comment, 'like') ? 'fill-current' : ''}`} />
                  </button>
                  {comment.latest_reactions && comment.latest_reactions.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {comment.latest_reactions.length} like{comment.latest_reactions.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {comment.user?.id === 'demo-user-1' && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {comments.length === 0 && !showCommentInput && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}