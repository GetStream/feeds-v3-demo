"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CommentResponse,
  AddCommentReactionResponse,
} from "@stream-io/feeds-client";
import { useUser } from "./useUser";
import toast from "react-hot-toast";
// Add comment to Stream API
const addCommentToAPI = async (
  client: any,
  objectId: string,
  comment: string,
  objectType: string = "activity"
): Promise<CommentResponse> => {
  const res = await client.addComment({
    object_id: objectId,
    object_type: objectType,
    comment: comment.trim(),
  });
  return res.comment;
};

// Delete comment from Stream API
const deleteCommentFromAPI = async (
  client: any,
  commentId: string
): Promise<void> => {
  await client.deleteComment({
    comment_id: commentId,
  });
};

// Add comment reaction to Stream API
const addCommentReactionToAPI = async (
  client: any,
  commentId: string,
  type: string
): Promise<AddCommentReactionResponse> => {
  return await client.addCommentReaction({
    comment_id: commentId,
    type,
  });
};

// Delete comment reaction from Stream API
const deleteCommentReactionFromAPI = async (
  client: any,
  commentId: string,
  type: string
): Promise<void> => {
  await client.deleteCommentReaction({
    comment_id: commentId,
    type,
  });
};

export function useComments() {
  const { client } = useUser();
  const queryClient = useQueryClient();

  // Mutation for adding comment
  const addCommentMutation = useMutation({
    mutationFn: async ({
      objectId,
      comment,
      objectType,
    }: {
      objectId: string;
      comment: string;
      objectType?: string;
    }) => {
      if (!comment.trim() || comment.length > 280) {
        throw new Error("Comment must be between 1 and 280 characters");
      }
      return await addCommentToAPI(client, objectId, comment, objectType);
    },
  });

  // Mutation for deleting comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await deleteCommentFromAPI(client, commentId);
      return commentId;
    },
  });

  // Mutation for adding comment reaction
  const addCommentReactionMutation = useMutation({
    mutationFn: async ({
      commentId,
      type,
    }: {
      commentId: string;
      type: string;
    }) => {
      return await addCommentReactionToAPI(client, commentId, type);
    },
  });

  // Mutation for deleting comment reaction
  const deleteCommentReactionMutation = useMutation({
    mutationFn: async ({
      commentId,
      type,
      userId,
    }: {
      commentId: string;
      type: string;
      userId: string;
    }) => {
      await deleteCommentReactionFromAPI(client, commentId, type);
      return { commentId, type, userId };
    },
  });

  const addComment = async (
    objectId: string,
    comment: string,
    objectType?: string
  ): Promise<CommentResponse | null> => {
    try {
      const result = await addCommentMutation.mutateAsync({
        objectId,
        comment,
        objectType,
      });
      return result;
    } catch (err) {
      toast.error("Failed to add comment");
      return null;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      return true;
    } catch (err) {
      toast.error("Failed to delete comment");
      return false;
    }
  };

  const addCommentReaction = async (
    commentId: string,
    type: string
  ): Promise<boolean> => {
    try {
      await addCommentReactionMutation.mutateAsync({ commentId, type });
      return true;
    } catch (err) {
      toast.error("Failed to add comment reaction");
      return false;
    }
  };

  const deleteCommentReaction = async (
    commentId: string,
    type: string,
    userId: string
  ): Promise<boolean> => {
    try {
      await deleteCommentReactionMutation.mutateAsync({
        commentId,
        type,
        userId,
      });
      return true;
    } catch (err) {
      toast.error("Failed to delete comment reaction");
      return false;
    }
  };

  const toggleCommentReaction = async (
    commentId: string,
    type: string,
    hasReaction: boolean,
    userId?: string
  ): Promise<boolean> => {
    if (!userId) return false;

    if (hasReaction) {
      return await deleteCommentReaction(commentId, type, userId);
    } else {
      return await addCommentReaction(commentId, type);
    }
  };

  const getUserReactionForComment = (
    comment: CommentResponse,
    type: string,
    userId: string
  ) => {
    return comment.latest_reactions?.find(
      (reaction) => reaction.user.id === userId && reaction.type === type
    );
  };

  return {
    addComment,
    deleteComment,
    addCommentReaction,
    deleteCommentReaction,
    toggleCommentReaction,
    getUserReactionForComment,
  };
}
