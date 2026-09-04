import { json } from '@sveltejs/kit';
import { COMMENT_BATCH_SIZE, getCommentBatch } from '$lib/api';
import { sanitizeHtmlFragment } from '$lib/sanitize';
import type { RequestHandler } from './$types';

function parseCommentIds(value: string | null): number[] {
  if (!value) {
    return [];
  }

  return [...new Set(value.split(',').map(Number).filter(Number.isSafeInteger))];
}

export const GET: RequestHandler = async ({ fetch, url }) => {
  const ids = parseCommentIds(url.searchParams.get('ids'));

  if (ids.length > COMMENT_BATCH_SIZE) {
    return json(
      { error: `A maximum of ${COMMENT_BATCH_SIZE} comments can be loaded at once.` },
      { status: 400 },
    );
  }

  if (ids.length === 0) {
    return json({ comments: [] });
  }

  try {
    const comments = await getCommentBatch(fetch, ids);
    const sanitizedComments = comments.map((comment) => ({
      ...comment,
      item: {
        ...comment.item,
        text: comment.item.text ? sanitizeHtmlFragment(comment.item.text) : comment.item.text,
      },
    }));

    return json({ comments: sanitizedComments });
  } catch {
    return json(
      { error: 'The Hacker News API could not load this comment batch.' },
      { status: 502 },
    );
  }
};
