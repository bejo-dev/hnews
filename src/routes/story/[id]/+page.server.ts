import { error } from '@sveltejs/kit';
import { getStoryDetail } from '$lib/api';
import { sanitizeHtmlFragment } from '$lib/sanitize';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const id = Number(params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    error(404, 'Story not found');
  }

  const detail = await getStoryDetail(fetch, id);

  if (!detail) {
    error(404, 'Story not found');
  }

  return {
    ...detail,
    story: {
      ...detail.story,
      text: detail.story.text ? sanitizeHtmlFragment(detail.story.text) : detail.story.text,
    },
    loadedAt: Date.now(),
  };
};
