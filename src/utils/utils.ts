import { CommentResponse } from '@stream-io/feeds-client';

/**
 * Filter comments for a specific activity
 */
export function filterCommentsForActivity(
  comments: CommentResponse[], 
  activityId: string, 
  objectType: string = 'activity'
): CommentResponse[] {
  return comments.filter(comment => 
    comment.object_id === activityId && 
    comment.object_type === objectType
  );
}

/**
 * Get comments count for a specific activity
 */
export function getCommentsCountForActivity(
  comments: CommentResponse[], 
  activityId: string, 
  objectType: string = 'activity'
): number {
  return filterCommentsForActivity(comments, activityId, objectType).length;
}

/**
 * Check if an activity has any comments
 */
export function hasCommentsForActivity(
  comments: CommentResponse[], 
  activityId: string, 
  objectType: string = 'activity'
): boolean {
  return getCommentsCountForActivity(comments, activityId, objectType) > 0;
} 