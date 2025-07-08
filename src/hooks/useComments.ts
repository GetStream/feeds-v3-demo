"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FeedsClient,
  CommentResponse,
  AddCommentReactionResponse,
} from "@stream-io/feeds-client";
import { useUser } from "../contexts/stream";

export function useComments() {
  const { client } = useUser();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load comments automatically when client is available
  useEffect(() => {
    const loadComments = async () => {
      if (!client) return;

      try {
        setLoading(true);
        setError(null);

        const res = await client.queryComments({
          filter: {},
        });

        setComments(res.comments);
      } catch (err) {
        console.error("Failed to fetch comments", err);
        setError("Failed to fetch comments");
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [client]);

  const fetchComments = useCallback(async () => {
    if (!client) return;

    try {
      setLoading(true);
      setError(null);

      const res = await client.queryComments({
        filter: {},
      });

      setComments(res.comments);
    } catch (err) {
      console.error("Failed to fetch comments", err);
      setError("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [client]);

  const addComment = useCallback(
    async (
      objectId: string,
      comment: string,
      objectType: string = "activity"
    ) => {
      if (!client || !comment.trim() || comment.length > 280) return null;

      try {
        setLoading(true);
        setError(null);

        const res = await client.addComment({
          object_id: objectId,
          object_type: objectType,
          comment: comment.trim(),
        });

        setComments((prev) => [...prev, res.comment]);
        return res.comment;
      } catch (err) {
        console.error("Failed to add comment", err);
        setError("Failed to add comment");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!client) return false;

      try {
        setLoading(true);
        setError(null);

        await client.deleteComment({
          comment_id: commentId,
        });

        setComments((prev) => prev.filter((c) => c.id !== commentId));
        return true;
      } catch (err) {
        console.error("Failed to delete comment", err);
        setError("Failed to delete comment");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const addCommentReaction = useCallback(
    async (commentId: string, type: string) => {
      if (!client) return false;

      try {
        setError(null);

        const res: AddCommentReactionResponse = await client.addCommentReaction(
          {
            comment_id: commentId,
            type,
          }
        );

        // Refresh comments to get updated reaction state
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          const updatedComments = comments.map((c) =>
            c.id === commentId
              ? { ...c, latest_reactions: res.comment.latest_reactions }
              : c
          );
          setComments(updatedComments);
        }

        return true;
      } catch (err) {
        console.error("Failed to add comment reaction", err);
        setError("Failed to add reaction");
        return false;
      }
    },
    [client, comments]
  );

  const deleteCommentReaction = useCallback(
    async (commentId: string, type: string, userId: string) => {
      if (!client) return false;

      try {
        setError(null);

        await client.deleteCommentReaction({
          comment_id: commentId,
          type,
        });

        // Refresh comments to get updated reaction state
        const comment = comments.find((c) => c.id === commentId);
        if (comment) {
          const updatedComments = comments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  latest_reactions: c.latest_reactions?.filter(
                    (r) => !(r.type === type && r.user.id === userId)
                  ),
                }
              : c
          );
          setComments(updatedComments);
        }

        return true;
      } catch (err) {
        console.error("Failed to delete comment reaction", err);
        setError("Failed to remove reaction");
        return false;
      }
    },
    [client, comments]
  );

  const toggleCommentReaction = useCallback(
    async (commentId: string, type: string, userId?: string) => {
      if (!client || !userId) return false;

      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return false;

      const hasReaction = comment.latest_reactions?.find(
        (reaction) => reaction.user.id === userId && reaction.type === type
      );

      if (hasReaction) {
        return await deleteCommentReaction(commentId, type, userId);
      } else {
        return await addCommentReaction(commentId, type);
      }
    },
    [client, comments, addCommentReaction, deleteCommentReaction]
  );

  const clearComments = useCallback(() => {
    setComments([]);
    setError(null);
  }, []);

  const getUserReactionForComment = useCallback(
    (comment: CommentResponse, type: string, userId: string) => {
      return comment.latest_reactions?.find(
        (reaction) => reaction.user.id === userId && reaction.type === type
      );
    },
    []
  );

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
    addCommentReaction,
    deleteCommentReaction,
    toggleCommentReaction,
    clearComments,
    getUserReactionForComment,
  };
}
