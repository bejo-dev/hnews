<script lang="ts">
  import { formatNumber, formatRelativeTime, getDomain, isSafeExternalUrl } from '$lib/format';
  import type { FeedItem } from '$lib/types';

  export let story: FeedItem;
  export let rank: number;
  export let referenceTime: number;

  $: domain = getDomain(story.url);
</script>

<article class="story-card">
  <div class="story-card__rank" aria-hidden="true">{String(rank).padStart(2, '0')}</div>

  <div>
    <div class="story-card__heading">
      {#if isSafeExternalUrl(story.url)}
        <a class="story-card__title" href={story.url} target="_blank" rel="noreferrer">{story.title}</a>
      {:else}
        <a class="story-card__title" href={`/story/${story.id}`}>{story.title}</a>
      {/if}
      {#if story.type === 'job'}
        <span class="story-card__kind">job</span>
      {:else if domain}
        <span class="story-card__domain">{domain}</span>
      {/if}
    </div>

    <div class="story-card__meta">
      <span><strong>{formatNumber(story.score ?? 0)}</strong> points</span>
      <span class="story-card__meta-dot" aria-hidden="true">·</span>
      <span>by {story.by ?? 'unknown'}</span>
      <span class="story-card__meta-dot" aria-hidden="true">·</span>
      <span>{formatRelativeTime(story.time, referenceTime)}</span>
      <span class="story-card__meta-dot" aria-hidden="true">·</span>
      <a class="story-card__comments" href={`/story/${story.id}#comments`}>
        {formatNumber(story.descendants ?? 0)} comments
      </a>
    </div>
  </div>

  {#if isSafeExternalUrl(story.url)}
    <a
      class="story-card__open"
      href={story.url}
      target="_blank"
      rel="noreferrer"
      aria-label={'Open original link for ' + story.title}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M5 3h8v8M13 3 7 9M11 13H3V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
  {/if}
</article>

<style>
  .story-card__title:focus-visible {
    border-radius: 0.2rem;
  }
</style>
