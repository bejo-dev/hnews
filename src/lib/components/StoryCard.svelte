<script lang="ts">
  import { fade } from 'svelte/transition';
  import { formatNumber, formatRelativeTime, getDomain, isSafeExternalUrl } from '../format';
  import type { FeedItem, StoryMovement } from '../types';

  export let story: FeedItem;
  export let rank: number;
  export let referenceTime: number;
  export let movement: StoryMovement | null = null;
  export let movementFadeDuration = 500;
  export let reduceMotion = false;

  $: domain = getDomain(story.url);
</script>

<article class="story-card">
  <div class="story-card__rank" aria-hidden="true">{String(rank).padStart(2, '0')}</div>

  <div>
    <div class="story-card__heading">
      {#if movement}
        <span
          class={`story-card__movement story-card__movement--${movement}`}
          aria-hidden="true"
          in:fade={{ duration: reduceMotion ? 0 : 120 }}
          out:fade={{ duration: reduceMotion ? 0 : movementFadeDuration }}
        >{movement === 'up' ? '↑' : '↓'}</span>
      {/if}
      {#if isSafeExternalUrl(story.url)}
        <a class="story-card__title" href={story.url}>{story.title}</a>
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
</article>

<style>
  .story-card__heading {
    position: relative;
  }

  .story-card__movement {
    position: absolute;
    top: 0.75rem;
    left: -1rem;
    display: inline-flex;
    width: 0.65rem;
    height: 0.65rem;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    font-size: 0.8rem;
    font-weight: 850;
    line-height: 1;
    transform: translateY(-50%);
  }

  .story-card__movement--up {
    color: #2f8f5b;
  }

  .story-card__movement--down {
    color: #c4473d;
  }

  .story-card__title:focus-visible {
    border-radius: 0.2rem;
  }

  @media (max-width: 42rem) {
    .story-card__movement {
      left: -0.7rem;
      font-size: 0.75rem;
    }
  }
</style>
