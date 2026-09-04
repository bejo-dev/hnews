<script lang="ts">
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { onMount, tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import StoryCard from '../components/StoryCard.svelte';
  import { getTopStories } from '../api';
  import { formatLoadedAt } from '../format';
  import { readCachedStories, writeCachedStories } from '../story-cache';
  import type { FeedItem, StoryMovement } from '../types';

  const STORIES_REFRESH_INTERVAL = 60_000;
  const STORY_MOVE_DURATION = 560;
  const STORY_ENTRY_DURATION = 360;
  const STORY_EXIT_DURATION = 360;
  const MOVEMENT_INDICATOR_DELAY = 2_000;
  const MOVEMENT_INDICATOR_FADE_DURATION = 500;

  let stories: FeedItem[] = [];
  let loadedAt = Date.now();
  let loading = true;
  let refreshing = false;
  let errorMessage: string | null = null;
  let usingCachedStories = false;
  let requestInFlight = false;
  let prefersReducedMotion = false;
  let storyMovements: Record<number, StoryMovement> = {};
  const movementTimers = new Map<number, number>();
  let disposed = false;

  function getStoryMovements(
    previousStories: readonly FeedItem[],
    nextStories: readonly FeedItem[],
  ): Record<number, StoryMovement> {
    const previousIndexes = new Map(
      previousStories.map((story, index) => [story.id, index]),
    );

    return nextStories.reduce<Record<number, StoryMovement>>((movements, story, index) => {
      const previousIndex = previousIndexes.get(story.id);

      if (previousIndex !== undefined && previousIndex !== index) {
        movements[story.id] = index < previousIndex ? 'up' : 'down';
      }

      return movements;
    }, {});
  }

  function clearMovementTimers(): void {
    for (const timerId of movementTimers.values()) {
      window.clearTimeout(timerId);
    }

    movementTimers.clear();
  }

  function updateMovementIndicators(nextMovements: Record<number, StoryMovement>): void {
    clearMovementTimers();
    storyMovements = nextMovements;

    const movementDuration = prefersReducedMotion ? 0 : STORY_MOVE_DURATION;
    const expiryDelay = movementDuration + MOVEMENT_INDICATOR_DELAY;

    for (const storyIdValue of Object.keys(nextMovements)) {
      const storyId = Number(storyIdValue);
      const timerId = window.setTimeout(() => {
        const remainingMovements = { ...storyMovements };

        delete remainingMovements[storyId];
        storyMovements = remainingMovements;
        movementTimers.delete(storyId);
      }, expiryDelay);

      movementTimers.set(storyId, timerId);
    }
  }

  async function loadStories(): Promise<void> {
    if (requestInFlight) {
      return;
    }

    requestInFlight = true;

    if (stories.length > 0) {
      refreshing = true;
    } else {
      loading = true;
    }

    errorMessage = null;

    try {
      const nextStories = await getTopStories(window.fetch);

      if (disposed) {
        return;
      }

      const nextMovements = getStoryMovements(stories, nextStories);

      stories = nextStories;
      const nextLoadedAt = Date.now();

      loadedAt = nextLoadedAt;
      usingCachedStories = false;

      if (nextStories.length > 0) {
        writeCachedStories(nextStories, nextLoadedAt);
      }

      await tick();

      if (!disposed) {
        updateMovementIndicators(nextMovements);
      }
    } catch {
      if (!disposed) {
        errorMessage = 'Could not load the Hacker News front page.';
      }
    } finally {
      requestInFlight = false;

      if (!disposed) {
        loading = false;
        refreshing = false;
      }
    }
  }

  onMount(() => {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cachedStories = readCachedStories();

    if (cachedStories) {
      stories = cachedStories.stories;
      loadedAt = cachedStories.loadedAt;
      usingCachedStories = true;
      loading = false;
    } else {
      void loadStories();
    }

    const pollId = window.setInterval(() => {
      void loadStories();
    }, STORIES_REFRESH_INTERVAL);

    return () => {
      disposed = true;
      window.clearInterval(pollId);
      clearMovementTimers();
    };
  });
</script>

<svelte:head>
  <title>hnews - the front page</title>
  <meta name="description" content="The Hacker News front page, with a better way to read discussion." />
</svelte:head>

<div class="page">
  <header class="topbar">
    <a class="brand" href="/" aria-label="hnews home">
      <span class="brand-mark" aria-hidden="true">y</span>
      <span>hnews</span>
    </a>
    <div class="topbar__status">
      <span class="status-dot" aria-hidden="true"></span>{usingCachedStories ? 'cached from HN' : 'live from HN'}
    </div>
  </header>

  <main class="main-content">
    <section aria-labelledby="feed-title" aria-busy={loading || refreshing}>
      <div class="feed-header">
        <h1 id="feed-title" class="feed-header__title">Top stories</h1>
        {#if stories.length > 0}
          <time class="feed-header__updated" datetime={new Date(loadedAt).toISOString()}>
            {refreshing ? 'Updating...' : `Updated ${formatLoadedAt(loadedAt)} UTC`}
          </time>
        {/if}
      </div>

      {#if loading && stories.length === 0}
        <div class="loading-state" role="status">
          <p>Loading the latest stories...</p>
        </div>
      {:else if stories.length === 0 && errorMessage}
        <div class="request-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onclick={() => void loadStories()}>Try again</button>
        </div>
      {:else if stories.length === 0}
        <div class="empty-state">
          <p>No stories are available right now. Try refreshing in a moment.</p>
        </div>
      {:else}
        <ol class="story-list">
          {#each stories as story, index (story.id)}
            <li
              animate:flip={{ duration: prefersReducedMotion ? 0 : STORY_MOVE_DURATION, easing: cubicOut }}
              in:fly={{ x: prefersReducedMotion ? 0 : -28, y: 0, duration: prefersReducedMotion ? 0 : STORY_ENTRY_DURATION, easing: cubicOut }}
              out:fly={{ x: prefersReducedMotion ? 0 : 28, y: 0, duration: prefersReducedMotion ? 0 : STORY_EXIT_DURATION, easing: cubicOut }}
            >
              <StoryCard
                story={story}
                rank={index + 1}
                referenceTime={loadedAt}
                movement={storyMovements[story.id] ?? null}
                movementFadeDuration={MOVEMENT_INDICATOR_FADE_DURATION}
                reduceMotion={prefersReducedMotion}
              />
            </li>
          {/each}
        </ol>

        {#if errorMessage}
          <div class="request-error request-error--inline" role="alert">
            <span>{errorMessage}</span>
            <button type="button" onclick={() => void loadStories()}>Try again</button>
          </div>
        {/if}
      {/if}
    </section>
  </main>

  <footer class="site-footer">
    <span>Read-only by design.</span>
    <a href="https://github.com/HackerNews/API" target="_blank" rel="noreferrer">Hacker News API</a>
  </footer>
</div>
