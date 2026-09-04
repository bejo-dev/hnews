# hnews

A focused, read-only Hacker News reader built with Svelte and Vite. It is a client-only single-page app: data is loaded directly in the browser from the official Hacker News API.

## Scope

- The home view shows the current Hacker News top stories.
- The home feed polls for changes every minute and animates stories as they enter, leave, or change position.
- Each story has a dedicated detail view with its full discussion.
- Top-level comments load in small batches, and nested replies load on demand per thread.
- The top-story feed is cached in local storage so returning to the front page does not fetch it again.
- Comments are newest-first by default, including nested replies.
- The "Most replies" option sorts only top-level threads by reply count. Replies inside each thread remain newest-first.
- Story content from the Hacker News API is sanitized before rendering.

There are no profile views, alternate feeds, voting, hiding, flagging, or writing actions.

## Development

```sh
pnpm install
pnpm dev
```

Before opening a pull request, run:

```sh
pnpm check
pnpm lint
pnpm build
```

Data comes from the [official Hacker News API](https://github.com/HackerNews/API).

When deploying to a static host, configure it to serve `index.html` for unknown application routes so that direct links to story pages work.
