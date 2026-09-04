<script lang="ts">
  import { formatRelativeTime } from '$lib/format';
  import { sanitizeHtmlFragment } from '$lib/sanitize';
  import { sortCommentTree } from '$lib/sort-comments';
  import type { CommentNode, CommentSort } from '$lib/types';

  export let node: CommentNode;
  export let depth = 0;
  export let referenceTime: number;
  export let sortOrder: CommentSort = 'newest';

  let collapsed = false;

  $: sortedReplies = sortCommentTree(node.replies, sortOrder, depth + 1);
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
    {#if node.totalReplyCount > 0}
      <span class="comment__replies-count">
        {node.totalReplyCount} {node.totalReplyCount === 1 ? 'reply' : 'replies'}
      </span>
    {/if}
  </div>

  {#if !collapsed}
    <div class="comment__body">
      {#if node.item.deleted}
        <p class="comment__deleted">Comment deleted.</p>
      {:else if node.item.text}
        <div class="comment__copy">{@html sanitizeHtmlFragment(node.item.text)}</div>
      {:else}
        <p class="comment__deleted">Comment unavailable.</p>
      {/if}
    </div>

    {#if sortedReplies.length > 0}
      <div class="comment__replies">
        {#each sortedReplies as reply (reply.item.id)}
          <svelte:self
            node={reply}
            depth={depth + 1}
            referenceTime={referenceTime}
            sortOrder={sortOrder}
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
