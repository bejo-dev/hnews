import type { CommentItem, CommentNode, FeedItem, HackerNewsItem } from '$lib/types';

const API_ROOT = 'https://hacker-news.firebaseio.com/v0';
export const COMMENT_BATCH_SIZE = 24;

export type HNFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

async function fetchJson<T>(fetcher: HNFetcher, path: string): Promise<T> {
  const response = await fetcher(`${API_ROOT}${path}`);

  if (!response.ok) {
    throw new Error(`Hacker News API returned ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

async function fetchItem(fetcher: HNFetcher, id: number): Promise<HackerNewsItem | null> {
  return fetchJson<HackerNewsItem | null>(fetcher, `/item/${id}.json`);
}

function isFeedItem(item: HackerNewsItem | null): item is FeedItem {
  return Boolean(
    item &&
      (item.type === 'story' || item.type === 'job') &&
      !item.deleted &&
      !item.dead &&
      item.title &&
      typeof item.time === 'number',
  );
}

function isCommentItem(item: HackerNewsItem | null): item is CommentItem {
  return Boolean(item && item.type === 'comment' && typeof item.time === 'number');
}

function getReplyIds(item: CommentItem): number[] {
  return (item.kids ?? []).filter(Number.isSafeInteger);
}

function toCommentNode(item: CommentItem): CommentNode {
  const replyIds = getReplyIds(item);

  return {
    item,
    replies: [],
    replyIds,
    replyCount: replyIds.length,
  };
}

export async function getTopStories(fetcher: HNFetcher, limit = 30): Promise<FeedItem[]> {
  const ids = await fetchJson<number[]>(fetcher, '/topstories.json');
  const items = await Promise.all(ids.slice(0, limit).map((id) => fetchItem(fetcher, id)));

  return items.filter(isFeedItem);
}

export async function getCommentBatch(
  fetcher: HNFetcher,
  ids: readonly number[],
): Promise<CommentNode[]> {
  const items = await Promise.all(ids.map((id) => fetchItem(fetcher, id)));

  return items.filter(isCommentItem).map(toCommentNode);
}

export async function getStoryDetail(
  fetcher: HNFetcher,
  id: number,
): Promise<{ story: FeedItem; commentIds: number[] } | null> {
  const story = await fetchItem(fetcher, id);

  if (!isFeedItem(story)) {
    return null;
  }

  return {
    story,
    commentIds: (story.kids ?? []).filter(Number.isSafeInteger),
  };
}
