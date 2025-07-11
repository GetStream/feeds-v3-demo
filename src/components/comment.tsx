// CommentsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { ActivityResponse, CommentResponse } from "@stream-io/feeds-client";
import { Heart, MessageCircleReply, Trash2 } from "lucide-react";
import { Avatar } from "./avatar";
import { useUser } from "../hooks/useUser";
import { useComments } from "../hooks/useComments";
import toast from "react-hot-toast";

interface CommentsPanelProps {
  activity: ActivityResponse;
}

export default function CommentsPanel({ activity }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const { user } = useUser();
  const { addComment, deleteComment, toggleCommentReaction } = useComments();

  // Update showCommentInput when showInput prop changes
  useEffect(() => {
    setShowCommentInput(false);
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim() || newComment.length > 280) return;
    try {
      setLoading(true);
      const res = await addComment(activity.id, newComment, "activity");
      if (res) {
        setNewComment("");
        setShowCommentInput(false);
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactToComment = async (
    comment: CommentResponse,
    type: string
  ) => {
    try {
      const hasReaction = !!getUserReactionForComment(comment, type);
      await toggleCommentReaction(comment.id, type, hasReaction, user?.id);
    } catch (err) {
      toast.error("Failed to handle comment reaction");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  const getUserReactionForComment = (
    comment: CommentResponse,
    type: string
  ) => {
    //this is a right way to check if the user has reacted to the comment
    //return comment.own_reactions.length > 0;

    return comment.latest_reactions?.find(
      (reaction) => reaction.type === type && reaction.user.id === user?.id
    );
  };

  const getReactionStyles = (comment: CommentResponse, type: string) => {
    const hasReaction = getUserReactionForComment(comment, type);
    const baseStyles = "hover:scale-110 transition-all cursor-pointer";

    switch (type) {
      case "like":
        return `${baseStyles} ${
          hasReaction ? "text-red-400" : "text-gray-400 hover:text-red-400"
        }`;
      default:
        return `${baseStyles} text-gray-400`;
    }
  };

  return (
    <div
      className="mt-4 border-t border-gray-800 pt-4"
      data-activity-id={activity.id}
    >
      {/* Comment Input Section */}
      {showCommentInput ? (
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <Avatar userName={user?.name} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full rounded-lg bg-zinc-900 text-white p-3 text-sm border border-gray-600 !outline-none resize-none"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (
                      !loading &&
                      newComment.trim() &&
                      newComment.length <= 280
                    ) {
                      handleAddComment();
                    }
                  } else if (e.key === "Escape") {
                    setShowCommentInput(false);
                    setNewComment("");
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
                    {loading ? "Posting..." : "Post"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentInput(false);
                      setNewComment("");
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
            className="w-full text-left p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors text-gray-300 cursor-pointer"
          >
            Write a comment...
          </button>
        </div>
      )}

      {/* Comments List */}
      {activity.comments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Comments ({activity.comments.length})
          </h3>
          {activity.comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg transition-colors"
            >
              <Avatar userName={comment.user.name} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-100 text-sm">
                    {comment.user?.name || "unknown"}
                  </span>
                  <span className="text-gray-400 text-xs">•</span>
                  <span className="text-gray-400 text-xs">
                    {comment.created_at &&
                      new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-200 text-sm mb-2">{comment.text}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button
                      title="Like"
                      data-cid={comment.id}
                      className={getReactionStyles(comment, "like")}
                      onClick={() => handleReactToComment(comment, "like")}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          getUserReactionForComment(comment, "like")
                            ? "fill-current"
                            : ""
                        }`}
                      />
                    </button>
                    {comment.latest_reactions &&
                      comment.latest_reactions.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {comment.latest_reactions.length} like
                          {comment.latest_reactions.length > 1 ? "s" : ""}
                        </span>
                      )}
                  </div>
                  <button className="cursor-pointer transition-colors text-sm hover:bg-gray-500 px-2 py-1 rounded-md flex items-center gap-1">
                    <MessageCircleReply className="w-4 h-4" /> Reply
                  </button>
                  {comment.user?.id === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-400 hover:text-white transition-colors text-sm cursor-pointer hover:bg-red-500 px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activity.comments.length === 0 && !showCommentInput && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}
