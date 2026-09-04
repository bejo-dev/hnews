import type { CommentItem, CommentNode, FeedItem, HackerNewsItem } from '$lib/types';

const API_ROOT = 'https://hacker-news.firebaseio.com/v0';
const MAX_CONCURRENT_COMMENT_REQUESTS = 12;

type HNFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

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

function createConcurrencyLimiter(limit: number) {
  let active = 0;
  const pending: Array<() => void> = [];

  const drain = () => {
    while (active < limit && pending.length > 0) {
      const task = pending.shift();

      if (!task) {
        continue;
      }

      active += 1;
      task();
    }
  };

  return <T>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      pending.push(() => {
        void task()
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            drain();
          });
      });
      drain();
    });
}

async function fetchCommentTree(fetcher: HNFetcher, ids: number[]): Promise<CommentNode[]> {
  const limit = createConcurrencyLimiter(MAX_CONCURRENT_COMMENT_REQUESTS);
  const itemCache = new Map<number, Promise<HackerNewsItem | null>>();

  const getCachedItem = (id: number) => {
    const cached = itemCache.get(id);

    if (cached) {
      return cached;
    }

    const request = limit(() => fetchItem(fetcher, id));
    itemCache.set(id, request);
    return request;
  };

  const buildNode = async (id: number): Promise<CommentNode | null> => {
    const item = await getCachedItem(id).catch(() => null);

    if (!isCommentItem(item)) {
      return null;
    }

    const replies = (
      await Promise.all((item.kids ?? []).filter(Number.isSafeInteger).map(buildNode))
    ).filter((node): node is CommentNode => node !== null);

    return {
      item,
      replies,
      totalReplyCount: replies.reduce((total, reply) => total + reply.totalReplyCount + 1, 0),
    };
  };

  return (await Promise.all(ids.filter(Number.isSafeInteger).map(buildNode))).filter(
    (node): node is CommentNode => node !== null,
  );
}

export async function getTopStories(fetcher: HNFetcher, limit = 30): Promise<FeedItem[]> {
  const ids = await fetchJson<number[]>(fetcher, '/topstories.json');
  const items = await Promise.all(ids.slice(0, limit).map((id) => fetchItem(fetcher, id)));

  return items.filter(isFeedItem);
}

export async function getStoryDetail(
  fetcher: HNFetcher,
  id: number,
): Promise<{ story: FeedItem; comments: CommentNode[] } | null> {
  const story = await fetchItem(fetcher, id);

  if (!isFeedItem(story)) {
    return null;
  }

  return {
    story,
    comments: await fetchCommentTree(fetcher, story.kids ?? []),
  };
}
