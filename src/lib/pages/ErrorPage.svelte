<script lang="ts">
  export let status = 404;
  export let title = 'Story not found';
  export let description = 'The story may have disappeared, or Hacker News may be taking a short breather.';
  export let retry: (() => void) | undefined = undefined;
</script>

<svelte:head>
  <title>{status} - hnews</title>
  <meta name="description" content={description} />
</svelte:head>

<div class="error-page">
  <div class="error-page__inner">
    <a class="brand" href="/" aria-label="hnews home">
      <span class="brand-mark" aria-hidden="true">y</span>
      <span>hnews</span>
    </a>
    <p class="eyebrow">{status} / not here</p>
    <h1>{title}</h1>
    <p>{description}</p>
    {#if retry}
      <button class="error-page__retry" type="button" onclick={retry}>Try again</button>
    {/if}
    <a class="back-link" href="/">← Back to the front page</a>
  </div>
</div>
