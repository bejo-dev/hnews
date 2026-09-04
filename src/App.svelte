<script lang="ts">
  import { onMount, tick } from 'svelte';
  import ErrorPage from './lib/pages/ErrorPage.svelte';
  import HomePage from './lib/pages/HomePage.svelte';
  import StoryPage from './lib/pages/StoryPage.svelte';
  import { resolveRoute, type Route } from './lib/router';

  let route: Route = resolveRoute(window.location.pathname);
  let routeKey = getRouteKey(window.location);

  function getRouteKey(location: Pick<Location, 'pathname' | 'search'>): string {
    return `${location.pathname}${location.search}`;
  }

  function getHistoryUrl(url: URL): string {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  async function scrollToHash(hash: string): Promise<void> {
    if (!hash) {
      return;
    }

    let id = hash.slice(1);

    try {
      id = decodeURIComponent(id);
    } catch {
      return;
    }

    await tick();
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }

  function syncRoute(): void {
    const nextUrl = new URL(window.location.href);
    const nextRouteKey = getRouteKey(nextUrl);
    const routeChanged = nextRouteKey !== routeKey;

    route = resolveRoute(nextUrl.pathname);
    routeKey = nextRouteKey;

    if (routeChanged) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    void scrollToHash(nextUrl.hash);
  }

  function navigate(href: string): void {
    const nextUrl = new URL(href, window.location.href);

    if (nextUrl.origin !== window.location.origin) {
      return;
    }

    const nextRouteKey = getRouteKey(nextUrl);
    const sameLocation =
      nextRouteKey === routeKey && nextUrl.hash === window.location.hash;

    if (sameLocation) {
      return;
    }

    const routeChanged = nextRouteKey !== routeKey;

    window.history.pushState({}, '', getHistoryUrl(nextUrl));
    route = resolveRoute(nextUrl.pathname);
    routeKey = nextRouteKey;

    if (routeChanged) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    void scrollToHash(nextUrl.hash);
  }

  function handleDocumentClick(event: MouseEvent): void {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest('a');

    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return;
    }

    const href = anchor.getAttribute('href');

    if (!href || href.startsWith('#')) {
      return;
    }

    const url = new URL(anchor.href, window.location.href);

    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    navigate(url.href);
  }

  onMount(() => {
    window.addEventListener('popstate', syncRoute);
    document.addEventListener('click', handleDocumentClick);
    void scrollToHash(window.location.hash);

    return () => {
      window.removeEventListener('popstate', syncRoute);
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#f4f5f1" />
</svelte:head>

{#key routeKey}
  {#if route.kind === 'home'}
    <HomePage />
  {:else if route.kind === 'story'}
    <StoryPage storyId={route.id} />
  {:else}
    <ErrorPage
      title="Page not found"
      description="That page does not exist. The Hacker News story may have moved, or the link may be incomplete."
    />
  {/if}
{/key}
