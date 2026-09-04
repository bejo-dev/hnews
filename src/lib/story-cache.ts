import type { FeedItem } from './types';

const TOP_STORIES_CACHE_KEY = 'hnews:top-stories';

export interface StoriesCache {
  stories: FeedItem[];
  loadedAt: number;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isCachedFeedItem(value: unknown): value is FeedItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    Number.isSafeInteger(item.id) &&
    (item.type === 'story' || item.type === 'job') &&
    typeof item.title === 'string' &&
    typeof item.time === 'number' &&
    Number.isFinite(item.time) &&
    isOptionalString(item.by) &&
    isOptionalString(item.text) &&
    isOptionalString(item.url) &&
    isOptionalFiniteNumber(item.score) &&
    isOptionalFiniteNumber(item.descendants)
  );
}

export function readCachedStories(): StoriesCache | null {
  try {
    const rawValue = window.localStorage.getItem(TOP_STORIES_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const value: unknown = JSON.parse(rawValue);

    if (typeof value !== 'object' || value === null) {
      return null;
    }

    const cache = value as Record<string, unknown>;

    if (
      !Array.isArray(cache.stories) ||
      cache.stories.length === 0 ||
      !cache.stories.every(isCachedFeedItem) ||
      typeof cache.loadedAt !== 'number' ||
      !Number.isFinite(cache.loadedAt)
    ) {
      return null;
    }

    return {
      stories: cache.stories,
      loadedAt: cache.loadedAt,
    };
  } catch {
    return null;
  }
}

export function writeCachedStories(stories: FeedItem[], loadedAt: number): void {
  try {
    window.localStorage.setItem(TOP_STORIES_CACHE_KEY, JSON.stringify({ stories, loadedAt }));
  } catch {
    // Storage can be unavailable or full. The feed still works without the cache.
  }
}
