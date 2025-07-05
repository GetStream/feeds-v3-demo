// CommentsPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  FeedsClient,
  ActivityResponse,
  CommentResponse,
  AddCommentReactionResponse,
} from '@stream-io/feeds-client';
import { ThumbsUp, Heart, Laugh } from 'lucide-react';

interface CommentsPanelProps {
  activity: ActivityResponse;
  client: FeedsClient;
}

export default function CommentsPanel({ activity, client }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');

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
    if (!newComment.trim()) return;
    try {
      const res = await client.addComment({
        object_id: activity.id,
        object_type: 'activity',
        comment: newComment,
      });
      setComments((prev) => [...prev, res.comment]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleReactToComment = async (commentId: string, type: string) => {
    try {
      const res: AddCommentReactionResponse = await client.addCommentReaction({
        comment_id: commentId,
        type,
      });

      // Replace previous reaction of the same type from the same user if it exists
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const otherReactions = (c.latest_reactions || []).filter(
            (r) => !(r.user.id === res.reaction.user.id && r.type === type)
          );
          return {
            ...c,
            latest_reactions: [...otherReactions, res.reaction],
          };
        })
      );
    } catch (err) {
      console.error('Failed to add reaction to comment', err);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-600 pt-2">
      <h3 className="text-sm text-gray-300 mb-1">Comments</h3>
      <ul className="space-y-2 text-sm">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="text-gray-200 border border-gray-700 p-3 rounded bg-zinc-900"
          >
            <div className="text-sm">
              <span className="font-semibold text-gray-100">{comment.user?.id || 'unknown'}</span>: {comment.text}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex gap-3 text-gray-400">
                <button
                  title="Like"
                  className="hover:text-blue-400 hover:scale-110 transition-all cursor-pointer"
                  onClick={() => handleReactToComment(comment.id, 'like')}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  title="Haha"
                  className="hover:text-yellow-400 hover:scale-110 transition-all cursor-pointer"
                  onClick={() => handleReactToComment(comment.id, 'haha')}
                >
                  <Laugh className="w-4 h-4" />
                </button>
                <button
                  title="Love"
                  className="hover:text-pink-400 hover:scale-110 transition-all cursor-pointer"
                  onClick={() => handleReactToComment(comment.id, 'love')}
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              {comment.latest_reactions && comment.latest_reactions.length > 0 && (
                <span className="text-xs text-gray-400">
                  {comment.latest_reactions.length} reaction{comment.latest_reactions.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded bg-gray-800 text-white p-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddComment}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Post
        </button>
      </div>
    </div>
  );
}