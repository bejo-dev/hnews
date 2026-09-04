<script lang="ts">
  import { onMount } from 'svelte';
  import StoryCard from '../components/StoryCard.svelte';
  import { getTopStories } from '../api';
  import { formatLoadedAt } from '../format';
  import { readCachedStories, writeCachedStories } from '../story-cache';
  import type { FeedItem } from '../types';

  let stories: FeedItem[] = [];
  let loadedAt = Date.now();
  let loading = true;
  let errorMessage: string | null = null;
  let usingCachedStories = false;
  let disposed = false;

  async function loadStories(): Promise<void> {
    loading = true;
    errorMessage = null;

    try {
      const nextStories = await getTopStories(window.fetch);

      if (disposed) {
        return;
      }

      stories = nextStories;
      loadedAt = Date.now();
      usingCachedStories = false;

      if (nextStories.length > 0) {
        writeCachedStories(nextStories, loadedAt);
      }
    } catch {
      if (!disposed) {
        errorMessage = 'Could not load the Hacker News front page.';
      }
    } finally {
      if (!disposed) {
        loading = false;
      }
    }
  }

  onMount(() => {
    const cachedStories = readCachedStories();

    if (cachedStories) {
      stories = cachedStories.stories;
      loadedAt = cachedStories.loadedAt;
      usingCachedStories = true;
      loading = false;
    } else {
      void loadStories();
    }

    return () => {
      disposed = true;
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
    <section aria-labelledby="feed-title" aria-busy={loading}>
      <div class="feed-header">
        <h1 id="feed-title" class="feed-header__title">Top stories</h1>
        {#if stories.length > 0}
          <time class="feed-header__updated" datetime={new Date(loadedAt).toISOString()}>
            Updated {formatLoadedAt(loadedAt)} UTC
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
            <li><StoryCard story={story} rank={index + 1} referenceTime={loadedAt} /></li>
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
