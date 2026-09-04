<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} - hnews</title>
</svelte:head>

<div class="error-page">
  <div class="error-page__inner">
    <a class="brand" href="/" aria-label="hnews home">
      <span class="brand-mark" aria-hidden="true">y</span>
      <span>hnews</span>
    </a>
    <p class="eyebrow">{$page.status} / not here</p>
    <h1>{$page.error?.message ?? 'Something went wrong.'}</h1>
    <p>The story may have disappeared, or Hacker News may be taking a short breather.</p>
    <a class="back-link" href="/">← Back to the front page</a>
  </div>
</div>
