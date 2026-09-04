<script lang="ts">
  import StoryCard from '$lib/components/StoryCard.svelte';
  import { formatLoadedAt } from '$lib/format';
  import type { PageData } from './$types';

  export let data: PageData;
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
    <section aria-labelledby="feed-title">
      <div class="feed-header">
        <h1 id="feed-title" class="feed-header__title">Top stories</h1>
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
