import type { CommentNode, CommentSort } from '$lib/types';

function compareNewest(left: CommentNode, right: CommentNode): number {
  return right.item.time - left.item.time || right.totalReplyCount - left.totalReplyCount;
}

function compareReplies(left: CommentNode, right: CommentNode): number {
  return right.totalReplyCount - left.totalReplyCount || right.item.time - left.item.time;
}

export function sortCommentTree(
  nodes: readonly CommentNode[],
  sort: CommentSort,
  depth = 0,
): CommentNode[] {
  const sorted = [...nodes].sort((left, right) => {
    if (sort === 'replies' && depth === 0) {
      return compareReplies(left, right);
    }

    return compareNewest(left, right);
  });

  return sorted.map((node) => ({
    ...node,
    replies: sortCommentTree(node.replies, sort, depth + 1),
  }));
}
