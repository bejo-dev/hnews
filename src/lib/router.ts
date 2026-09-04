export type Route = { kind: 'home' } | { kind: 'story'; id: number } | { kind: 'not-found' };

export function resolveRoute(pathname: string): Route {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (normalizedPath === '/') {
    return { kind: 'home' };
  }

  const storyMatch = /^\/story\/([1-9]\d*)$/.exec(normalizedPath);

  if (!storyMatch) {
    return { kind: 'not-found' };
  }

  const id = Number(storyMatch[1]);

  if (!Number.isSafeInteger(id)) {
    return { kind: 'not-found' };
  }

  return { kind: 'story', id };
}
