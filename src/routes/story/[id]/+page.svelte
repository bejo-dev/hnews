<script lang="ts">
  import { onMount } from 'svelte';
  import { COMMENT_BATCH_SIZE } from '$lib/api';
  import CommentThread from '$lib/components/CommentThread.svelte';
  import { formatLoadedAt, formatNumber, formatRelativeTime, getDomain, isSafeExternalUrl } from '$lib/format';
  import { sortCommentTree } from '$lib/sort-comments';
  import type { CommentNode, CommentSort } from '$lib/types';
  import type { PageData } from './$types';

  export let data: PageData;

  let sortOrder: CommentSort = 'newest';
  let comments: CommentNode[] = [];
  let commentCursor = 0;
  let loadingComments = false;
  let commentsError: string | null = null;

  $: sortedComments = sortCommentTree(comments, sortOrder);
  $: domain = getDomain(data.story.url);
  $: commentCount = data.story.descendants ?? data.commentIds.length;

  onMount(() => {
    void loadMoreComments();
  });

  async function loadCommentBatch(ids: readonly number[]) {
    const response = await window.fetch(`/api/comments?ids=${ids.join(',')}`);

    if (!response.ok) {
      throw new Error('Could not load comments.');
    }

    const payload = (await response.json()) as { comments: CommentNode[] };
    return payload.comments;
  }

  async function loadMoreComments() {
    if (loadingComments || commentCursor >= data.commentIds.length) {
      return;
    }

    loadingComments = true;
    commentsError = null;

    const nextIds = data.commentIds.slice(commentCursor, commentCursor + COMMENT_BATCH_SIZE);

    try {
      const nextComments = await loadCommentBatch(nextIds);
      comments = [...comments, ...nextComments];
      commentCursor += nextIds.length;
    } catch {
      commentsError = 'Could not load this batch of comments.';
    } finally {
      loadingComments = false;
    }
  }
</script>

<svelte:head>
  <title>{data.story.title} - hnews</title>
  <meta name="description" content={`Read the discussion on ${data.story.title}`} />
</svelte:head>

<div class="page story-page">
  <header class="topbar">
    <a class="brand" href="/" aria-label="hnews home">
      <span class="brand-mark" aria-hidden="true">y</span>
      <span>hnews</span>
    </a>
    <div class="topbar__status"><span class="status-dot" aria-hidden="true"></span>story view</div>
  </header>

  <main class="story-main">
    <nav class="story-nav" aria-label="Story navigation">
      <a class="back-link" href="/">
        <span aria-hidden="true">←</span>
        Back to stories
      </a>
      <span class="story-nav__divider" aria-hidden="true">·</span>
      <h1 class="story-nav__title">{data.story.title}</h1>
    </nav>

    <article class="story-detail">
      <p class="eyebrow">{data.story.type === 'job' ? 'Hacker News / job' : 'Hacker News / story'}</p>

      {#if data.story.text}
        <div class="story-detail__text">{@html data.story.text}</div>
      {/if}

      <div class="story-detail__meta">
        <span><strong>{formatNumber(data.story.score ?? 0)}</strong> points</span>
        <span class="story-detail__dot" aria-hidden="true">·</span>
        <span>by {data.story.by ?? 'unknown'}</span>
        <span class="story-detail__dot" aria-hidden="true">·</span>
        <time datetime={new Date(data.story.time * 1000).toISOString()}>
          {formatRelativeTime(data.story.time, data.loadedAt)}
        </time>
        {#if domain}
          <span class="story-detail__dot" aria-hidden="true">·</span>
          <span>{domain}</span>
        {/if}
      </div>

      {#if isSafeExternalUrl(data.story.url)}
        <a class="story-detail__source" href={data.story.url} target="_blank" rel="noreferrer">
          Read original
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 3h8v8M13 3 7 9M11 13H3V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      {/if}
    </article>

    <section id="comments" class="comments" aria-labelledby="comments-title">
      <div class="comments__header">
        <div>
          <p class="section-label">Discussion</p>
          <h2 id="comments-title">{formatNumber(commentCount)} comments</h2>
          <p class="comments__updated">Fetched {formatLoadedAt(data.loadedAt)} UTC</p>
        </div>

        <div class="sort-control" role="group" aria-label="Sort top-level comments">
          <span class="sort-control__label">Sort by</span>
          <div class="sort-control__buttons">
            <button
              class:sort-button--active={sortOrder === 'newest'}
              class="sort-button"
              type="button"
              aria-pressed={sortOrder === 'newest'}
              onclick={() => (sortOrder = 'newest')}
            >Newest</button>
            <button
              class:sort-button--active={sortOrder === 'replies'}
              class="sort-button"
              type="button"
              aria-pressed={sortOrder === 'replies'}
              onclick={() => (sortOrder = 'replies')}
            >Most replies</button>
          </div>
          {#if sortOrder === 'replies'}
            <span class="sort-control__hint">Replies stay newest-first inside each thread.</span>
          {/if}
        </div>
      </div>

      {#if data.commentIds.length === 0}
        <div class="comments__empty">
          <p>No comments yet.</p>
          <span>Be the first reader to open the discussion on Hacker News.</span>
        </div>
      {:else}
        <div class="comments__status" aria-live="polite">
          <span>{comments.length} of {data.commentIds.length} top-level threads loaded</span>
          {#if loadingComments}
            <span>Loading a batch...</span>
          {/if}
        </div>

        <div class="comment-list">
          {#each sortedComments as comment (comment.item.id)}
            <CommentThread
              node={comment}
              referenceTime={data.loadedAt}
              sortOrder={sortOrder}
              loadReplies={loadCommentBatch}
            />
          {/each}
        </div>

        {#if commentsError}
          <div class="comments__error" role="alert">
            <span>{commentsError}</span>
            <button class="comments__retry" type="button" onclick={() => void loadMoreComments()}>Try again</button>
          </div>
        {/if}

        {#if commentCursor < data.commentIds.length}
          <button
            class="comments__load-more"
            type="button"
            disabled={loadingComments}
            onclick={() => void loadMoreComments()}
          >
            {loadingComments ? 'Loading comments...' : 'Load more top-level comments'}
          </button>
        {:else if !loadingComments}
          <p class="comments__complete">All top-level threads are loaded. Open a thread to load its replies.</p>
        {/if}
      {/if}
    </section>
  </main>

  <footer class="site-footer">
    <span>Read-only by design.</span>
    <a href="https://news.ycombinator.com" target="_blank" rel="noreferrer">View on Hacker News</a>
  </footer>
</div>

<style>
  .story-main {
    padding: 2.4rem 0 6rem;
  }

  .story-nav {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
  }

  .story-nav__divider {
    flex: 0 0 auto;
    color: var(--line-strong);
  }

  .story-nav__title {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: var(--ink);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .story-detail {
    max-width: 55rem;
    padding: 4rem 0 4.5rem;
  }

  .story-detail__text {
    max-width: 45rem;
    margin-top: 2rem;
    color: var(--ink-soft);
    font-size: 1rem;
    line-height: 1.7;
  }

  .story-detail__text :global(p) {
    margin: 0 0 1rem;
  }

  .story-detail__text :global(a) {
    color: var(--accent-dark);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .story-detail__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin-top: 2rem;
    color: var(--muted);
    font-size: 0.76rem;
  }

  .story-detail__meta strong {
    color: var(--ink-soft);
    font-weight: 760;
  }

  .story-detail__dot {
    color: var(--line-strong);
  }

  .story-detail__source {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 1.4rem;
    color: var(--accent-dark);
    font-size: 0.78rem;
    font-weight: 760;
    text-decoration: none;
  }

  .story-detail__source:hover {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .story-detail__source svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .comments {
    padding-top: 2.3rem;
    border-top: 1px solid var(--line-strong);
  }

  .comments__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2rem;
    padding-bottom: 2rem;
  }

  .comments__header h2 {
    margin: 0.35rem 0 0;
    color: var(--ink);
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 720;
    letter-spacing: -0.055em;
  }

  .comments__updated {
    margin: 0.55rem 0 0;
    color: var(--muted);
    font-size: 0.72rem;
  }

  .sort-control {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .sort-control__label,
  .sort-control__hint {
    color: var(--muted);
    font-size: 0.68rem;
  }

  .sort-control__hint {
    max-width: 16rem;
    text-align: right;
  }

  .sort-control__buttons {
    display: flex;
    gap: 0.35rem;
    padding: 0.25rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface-soft);
  }

  .sort-button {
    min-height: 2.05rem;
    padding: 0 0.75rem;
    border-color: transparent;
    background: transparent;
    font-size: 0.71rem;
  }

  .sort-button--active {
    border-color: var(--surface);
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 0.15rem 0.45rem rgba(23, 32, 29, 0.07);
  }

  .comment-list {
    padding: 0.75rem 0 0;
  }

  .comments__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 0.7rem;
  }

  .comments__load-more,
  .comments__retry {
    border: 0;
    background: transparent;
    color: var(--accent-dark);
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 760;
  }

  .comments__load-more {
    display: block;
    width: 100%;
    margin-top: 1rem;
    padding: 0.9rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.5rem;
  }

  .comments__load-more:hover:not(:disabled),
  .comments__retry:hover {
    border-color: var(--accent);
    background: var(--accent-pale);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .comments__load-more:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  .comments__error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
    padding: 0.8rem 0;
    color: var(--accent-dark);
    font-size: 0.72rem;
  }

  .comments__complete {
    margin: 1.5rem 0 0;
    color: var(--muted);
    font-size: 0.7rem;
    text-align: center;
  }

  .comments__empty {
    padding: 3rem 0;
    border-top: 1px solid var(--line);
    color: var(--muted);
  }

  .comments__empty p {
    margin: 0 0 0.35rem;
    color: var(--ink-soft);
    font-size: 1rem;
    font-weight: 700;
  }

  .comments__empty span {
    font-size: 0.8rem;
  }

  @media (max-width: 42rem) {
    .story-main {
      padding-top: 1.8rem;
    }

    .story-nav {
      align-items: flex-start;
    }

    .story-nav__title {
      overflow: visible;
      font-size: 0.9rem;
      white-space: normal;
    }

    .story-detail {
      padding: 3rem 0 3.5rem;
    }

    .comments__header {
      align-items: flex-start;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sort-control {
      align-items: flex-start;
    }

    .sort-control__hint {
      max-width: none;
      text-align: left;
    }
  }
</style>
