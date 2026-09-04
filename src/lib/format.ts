export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatRelativeTime(timestamp: number, now: number): string {
  const elapsed = Math.max(0, Math.floor(now / 1000) - timestamp);

  if (elapsed < 60) {
    return 'just now';
  }

  if (elapsed < 60 * 60) {
    return `${Math.floor(elapsed / 60)}m ago`;
  }

  if (elapsed < 60 * 60 * 24) {
    return `${Math.floor(elapsed / (60 * 60))}h ago`;
  }

  if (elapsed < 60 * 60 * 24 * 7) {
    return `${Math.floor(elapsed / (60 * 60 * 24))}d ago`;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(timestamp * 1000);
}

export function formatLoadedAt(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(timestamp);
}

export function getDomain(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(url: string | undefined): url is string {
  if (!url) {
    return false;
  }

  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
