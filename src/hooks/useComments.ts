"use client";

import { useMutation } from "@tanstack/react-query";
import {
  CommentResponse,
  AddCommentReactionResponse,
} from "@stream-io/feeds-client";
import { useUser } from "./useUser";
import { FeedsClient } from "@stream-io/feeds-client";
import toast from "react-hot-toast";
// Add comment to Stream API
const addCommentToAPI = async (
  client: FeedsClient,
  objectId: string,
  comment: string,
  objectType: string = "activity"
): Promise<CommentResponse> => {
  const res = await client.addComment({
    object_id: objectId,
    object_type: objectType,
    comment: comment.trim(),
    create_notification_activity: true,
  });
  return res.comment;
};

// Add reply to comment
const addReplyToAPI = async (
  client: FeedsClient,
  objectId: string,
  comment: string,
  parentId: string,
  objectType: string = "activity"
): Promise<CommentResponse> => {
  const res = await client.addComment({
    object_id: objectId,
    object_type: objectType,
    parent_id: parentId,
    comment: comment.trim(),
    create_notification_activity: true,
  });
  return res.comment;
};

// Delete comment from Stream API
const deleteCommentFromAPI = async (
  client: FeedsClient,
  commentId: string
): Promise<void> => {
  await client.deleteComment({
    id: commentId,
  });
};

// Add comment reaction to Stream API
const addCommentReactionToAPI = async (
  client: FeedsClient,
  commentId: string,
  type: string
): Promise<AddCommentReactionResponse> => {
  return await client.addCommentReaction({
    id: commentId,
    type,
    create_notification_activity: true,
  });
};

// Delete comment reaction from Stream API
const deleteCommentReactionFromAPI = async (
  client: FeedsClient,
  commentId: string,
  type: string
): Promise<void> => {
  await client.deleteCommentReaction({
    id: commentId,
    type,
  });
};

export function useComments() {
  const { client } = useUser();

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
      if (!client) {
        throw new Error("Client is not available");
      }
      return await addCommentToAPI(client, objectId, comment, objectType);
    },
  });

  // Mutation for adding reply
  const addReplyMutation = useMutation({
    mutationFn: async ({
      objectId,
      comment,
      parentId,
      objectType,
    }: {
      objectId: string;
      comment: string;
      parentId: string;
      objectType?: string;
    }) => {
      if (!comment.trim() || comment.length > 280) {
        throw new Error("Reply must be between 1 and 280 characters");
      }
      if (!client) {
        throw new Error("Client is not available");
      }
      return await addReplyToAPI(
        client,
        objectId,
        comment,
        parentId,
        objectType
      );
    },
  });

  // Mutation for deleting comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!client) {
        throw new Error("Client is not available");
      }
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
      if (!client) {
        throw new Error("Client is not available");
      }
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
      if (!client) {
        throw new Error("Client is not available");
      }
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
    } catch {
      toast.error("Failed to add comment");
      return null;
    }
  };

  const addReply = async (
    objectId: string,
    comment: string,
    parentId: string,
    objectType?: string
  ): Promise<CommentResponse | null> => {
    try {
      const result = await addReplyMutation.mutateAsync({
        objectId,
        comment,
        parentId,
        objectType,
      });
      return result;
    } catch {
      toast.error("Failed to add reply");
      return null;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      return true;
    } catch {
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
    } catch {
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
    } catch {
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
    addReply,
    deleteComment,
    addCommentReaction,
    deleteCommentReaction,
    toggleCommentReaction,
    getUserReactionForComment,
  };
}
