<script lang="ts">
  import { COMMENT_BATCH_SIZE } from '$lib/api';
  import { formatRelativeTime } from '$lib/format';
  import { sortCommentTree } from '$lib/sort-comments';
  import type { CommentNode, CommentSort } from '$lib/types';

  export let node: CommentNode;
  export let depth = 0;
  export let referenceTime: number;
  export let sortOrder: CommentSort = 'newest';
  export let loadReplies: (ids: readonly number[]) => Promise<CommentNode[]>;

  let collapsed = false;
  let loadedReplies: CommentNode[] = [];
  let loadingReplies = false;
  let replyCursor = 0;
  let replyError: string | null = null;

  $: sortedReplies = sortCommentTree(loadedReplies, sortOrder, depth + 1);
  $: nextReplyCount = Math.min(COMMENT_BATCH_SIZE, node.replyIds.length - replyCursor);

  async function loadMoreReplies() {
    if (loadingReplies || replyCursor >= node.replyIds.length) {
      return;
    }

    loadingReplies = true;
    replyError = null;

    const nextIds = node.replyIds.slice(replyCursor, replyCursor + COMMENT_BATCH_SIZE);

    try {
      const nextReplies = await loadReplies(nextIds);
      loadedReplies = [...loadedReplies, ...nextReplies];
      replyCursor += nextIds.length;
    } catch {
      replyError = 'Could not load replies.';
    } finally {
      loadingReplies = false;
    }
  }
</script>

<article class="comment" style={`--depth: ${Math.min(depth, 5)};`}>
  <div class="comment__header">
    <button
      class="comment__toggle"
      type="button"
      aria-label={collapsed ? 'Expand comment' : 'Collapse comment'}
      aria-expanded={!collapsed}
      onclick={() => (collapsed = !collapsed)}
    >
      <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
    </button>
    <span class="comment__author">{node.item.by ?? 'deleted user'}</span>
    <span class="comment__separator" aria-hidden="true">·</span>
    <time datetime={new Date(node.item.time * 1000).toISOString()}>{formatRelativeTime(node.item.time, referenceTime)}</time>
    {#if node.replyCount > 0}
      <span class="comment__replies-count">
        {node.replyCount} {node.replyCount === 1 ? 'reply' : 'replies'}
      </span>
    {/if}
  </div>

  {#if !collapsed}
    <div class="comment__body">
      {#if node.item.deleted}
        <p class="comment__deleted">Comment deleted.</p>
      {:else if node.item.text}
        <div class="comment__copy">{@html node.item.text}</div>
      {:else}
        <p class="comment__deleted">Comment unavailable.</p>
      {/if}
    </div>

    {#if node.replyIds.length > 0}
      <div class="comment__reply-actions">
        {#if replyError}
          <span class="comment__load-error" aria-live="polite">{replyError}</span>
        {/if}

        {#if replyCursor < node.replyIds.length}
          <button
            class="comment__load-button"
            type="button"
            disabled={loadingReplies}
            onclick={() => void loadMoreReplies()}
          >
            {#if loadingReplies}
              Loading replies...
            {:else if replyError}
              Try again
            {:else if replyCursor === 0}
              Load {nextReplyCount} {nextReplyCount === 1 ? 'reply' : 'replies'}
            {:else}
              Load more replies
            {/if}
          </button>
        {:else}
          <span class="comment__loaded-replies">All {node.replyCount} replies loaded</span>
        {/if}
      </div>
    {/if}

    {#if sortedReplies.length > 0}
      <div class="comment__replies">
        {#each sortedReplies as reply (reply.item.id)}
          <svelte:self
            node={reply}
            depth={depth + 1}
            referenceTime={referenceTime}
            sortOrder={sortOrder}
            loadReplies={loadReplies}
          />
        {/each}
      </div>
    {/if}
  {/if}
</article>

<style>
  .comment {
    min-width: 0;
  }

  .comment__header {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 2rem;
    padding-left: calc(var(--depth) * 1.05rem);
    color: var(--muted);
    font-size: 0.72rem;
  }

  .comment__toggle {
    display: grid;
    width: 1.2rem;
    height: 1.2rem;
    flex: 0 0 auto;
    place-items: center;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: 0.35rem;
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
  }

  .comment__toggle:hover {
    border-color: var(--accent);
    color: var(--accent-dark);
  }

  .comment__author {
    color: var(--ink-soft);
    font-weight: 760;
  }

  .comment__separator {
    color: var(--line-strong);
  }

  .comment__replies-count {
    margin-left: 0.2rem;
    color: var(--accent-dark);
    font-size: 0.67rem;
    font-weight: 720;
  }

  .comment__reply-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-left: calc((var(--depth) * 1.05rem) + 1.75rem);
    padding: 0 0 1rem 1rem;
    border-left: 1px solid var(--line);
  }

  .comment__load-button {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--accent-dark);
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 760;
  }

  .comment__load-button:hover:not(:disabled) {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .comment__load-button:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  .comment__load-error,
  .comment__loaded-replies {
    color: var(--muted);
    font-size: 0.7rem;
  }

  .comment__load-error {
    color: var(--accent-dark);
  }

  .comment__body {
    margin: 0.25rem 0 0;
    margin-left: calc((var(--depth) * 1.05rem) + 1.75rem);
    padding: 0 0 1rem 1rem;
    border-left: 1px solid var(--line);
  }

  .comment__copy {
    max-width: 50rem;
    color: var(--ink-soft);
    font-size: 0.88rem;
    line-height: 1.65;
    overflow-wrap: anywhere;
  }

  .comment__copy :global(p) {
    margin: 0 0 0.8rem;
  }

  .comment__copy :global(p:last-child) {
    margin-bottom: 0;
  }

  .comment__copy :global(a) {
    color: var(--accent-dark);
    text-decoration: underline;
    text-decoration-color: rgba(189, 76, 26, 0.35);
    text-underline-offset: 0.18em;
  }

  .comment__copy :global(a:hover) {
    text-decoration-color: currentColor;
  }

  .comment__copy :global(pre) {
    max-width: 100%;
    padding: 0.8rem;
    overflow-x: auto;
    border-radius: 0.45rem;
    background: var(--surface-soft);
    font-size: 0.8rem;
    white-space: pre-wrap;
  }

  .comment__copy :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.88em;
  }

  .comment__deleted {
    margin: 0;
    color: var(--muted);
    font-style: italic;
  }

  .comment__replies {
    padding-bottom: 0.3rem;
  }
</style>
