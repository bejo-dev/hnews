# hnews

A focused, read-only Hacker News reader built with SvelteKit.

## Scope

- The home view shows the current Hacker News top stories.
- Each story has a dedicated detail view with its full discussion.
- Comments are newest-first by default, including nested replies.
- The "Most replies" option sorts only top-level threads by total descendants. Replies inside each thread remain newest-first.
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
