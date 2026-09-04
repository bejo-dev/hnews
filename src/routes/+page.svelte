<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import StoryCard from '$lib/components/StoryCard.svelte';
  import { formatLoadedAt } from '$lib/format';
  import type { PageData } from './$types';

  export let data: PageData;

  let refreshing = false;

  async function refreshStories() {
    if (refreshing) {
      return;
    }

    refreshing = true;

    try {
      await invalidateAll();
    } finally {
      refreshing = false;
    }
  }
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
    <div class="topbar__status"><span class="status-dot" aria-hidden="true"></span>live from HN</div>
  </header>

  <main class="main-content">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero__copy">
        <p class="eyebrow">Hacker News / home</p>
        <h1 id="page-title">Signal over noise.</h1>
        <p class="hero__lede">
          The front page, distilled to the stories people are talking about right now. Open a story
          to read the conversation in the order that makes sense to you.
        </p>
      </div>

      <div class="hero__actions">
        <span class="story-count">{data.stories.length} top stories</span>
        <button
          class="refresh-button"
          type="button"
          aria-busy={refreshing}
          disabled={refreshing}
          onclick={() => void refreshStories()}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13 5.5A5 5 0 1 0 13.2 10M13 2.5v3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {refreshing ? 'Refreshing' : 'Refresh feed'}
        </button>
      </div>
    </section>

    <section aria-labelledby="feed-title">
      <div class="feed-header">
        <span id="feed-title" class="feed-header__title">Top stories</span>
        <time class="feed-header__updated" datetime={new Date(data.loadedAt).toISOString()}>
          Updated {formatLoadedAt(data.loadedAt)} UTC
        </time>
      </div>

      {#if data.stories.length === 0}
        <div class="empty-state">
          <p>No stories are available right now. Try refreshing in a moment.</p>
        </div>
      {:else}
        <ol class="story-list">
          {#each data.stories as story, index (story.id)}
            <li><StoryCard story={story} rank={index + 1} referenceTime={data.loadedAt} /></li>
          {/each}
        </ol>
      {/if}
    </section>
  </main>

  <footer class="site-footer">
    <span>Read-only by design.</span>
    <a href="https://github.com/HackerNews/API" target="_blank" rel="noreferrer">Hacker News API</a>
  </footer>
</div>
