// CommentsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { ActivityResponse, CommentResponse } from "@stream-io/feeds-client";
import { Heart, TextQuote, Trash2 } from "lucide-react";
import { Avatar } from "./avatar";
import { useUser } from "../hooks/useUser";
import { useComments } from "../hooks/useComments";
import toast from "react-hot-toast";

interface CommentsPanelProps {
  activity: ActivityResponse;
}

interface CommentWithReplies extends CommentResponse {
  replies: CommentWithReplies[];
}

// Separate ReplyForm component with its own state
const ReplyForm = ({
  comment,
  onReply,
  onCancel,
  isLoading,
}: {
  comment: CommentResponse;
  onReply: (text: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [replyText, setReplyText] = useState("");
  const { user } = useUser();

  const handleSubmit = () => {
    if (replyText.trim() && replyText.length <= 280) {
      onReply(replyText);
      setReplyText("");
    }
  };

  const handleCancel = () => {
    setReplyText("");
    onCancel();
  };

  return (
    <div className="mt-3 ml-8">
      <div className="flex items-start gap-3">
        <Avatar userName={user?.name} size="sm" />
        <div className="flex-1">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.user?.name || "unknown"}...`}
            className="w-full rounded-lg bg-zinc-900 text-white p-3 text-sm border border-gray-600 !outline-none resize-none"
            style={{ direction: "ltr", textAlign: "left" }}
            rows={2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading && replyText.trim() && replyText.length <= 280) {
                  handleSubmit();
                }
              } else if (e.key === "Escape") {
                handleCancel();
              }
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !replyText.trim()}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Posting..." : "Reply"}
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
            <span className="text-xs text-gray-400">
              {replyText.length}/280
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CommentsPanel({ activity }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const { user } = useUser();
  const { addComment, addReply, deleteComment, toggleCommentReaction } =
    useComments();

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
    } catch {
      console.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentCommentId: string, replyText: string) => {
    if (!replyText.trim() || replyText.length > 280) return;
    try {
      setReplyLoading(true);
      const res = await addReply(
        activity.id,
        replyText,
        parentCommentId,
        "activity"
      );
      if (res) {
        setReplyingTo(null);
      }
    } catch {
      toast.error("Failed to add reply");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleReactToComment = async (
    comment: CommentResponse,
    type: string
  ) => {
    try {
      const hasReaction = !!getUserReactionForComment(comment, type);
      await toggleCommentReaction(comment.id, type, hasReaction, user?.id);
    } catch {
      toast.error("Failed to handle comment reaction");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const getUserReactionForComment = (
    comment: CommentResponse,
    type: string
  ) => {
    // Check own_reactions first for better accuracy
    if (comment.own_reactions && comment.own_reactions.length > 0) {
      return comment.own_reactions.find(
        (reaction) => reaction.type === type
      );
    }
    
    // Fallback to latest_reactions if own_reactions is not available
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

  // Organize comments into hierarchical structure
  const organizeComments = (
    comments: CommentResponse[]
  ): CommentWithReplies[] => {
    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    // First pass: create map of all comments with empty replies array
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into hierarchy
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!;

      if (comment.parent_id) {
        // This is a reply
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(commentWithReplies);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  // Recursive component to render comment and its replies
  const CommentItem = ({
    comment,
    level = 0,
  }: {
    comment: CommentWithReplies;
    level?: number;
  }) => {
    const indentClass =
      level > 0 ? `ml-${Math.min(level * 8, 32)} reply` : "overflow-hidden";

    return (
      <div className={`${indentClass}`}>
        <div className="flex gap-3 p-3 pt-0 transition-colors relative z-30">
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
              {level === 0 ? (
                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="cursor-pointer transition-colors text-sm hover:bg-gray-500 px-2 py-1 rounded-md flex items-center gap-1"
                >
                  <TextQuote className="w-4 h-4" /> Reply
                </button>
              ) : null}
              {comment.user?.id === user?.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-400 hover:text-white transition-colors text-sm cursor-pointer hover:bg-red-500 px-2 py-1 rounded-md flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <ReplyForm
                comment={comment}
                onReply={(text) => handleReply(comment.id, text)}
                onCancel={() => setReplyingTo(null)}
                isLoading={replyLoading}
              />
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="relative">
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="relative z-10">
                  <CommentItem comment={reply} level={level + 1} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                style={{ direction: "ltr", textAlign: "left" }}
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
            Comments ({activity.comment_count})
          </h3>
          {organizeComments(activity.comments).map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
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
