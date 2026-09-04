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
    <p class="eyebrow">{status} / not here</p>
    <h1>{title}</h1>
    <p>{description}</p>
    {#if retry}
      <button class="error-page__retry" type="button" onclick={retry}>Try again</button>
    {/if}
    <a class="back-link" href="/">← Back to the front page</a>
  </div>
</div>
