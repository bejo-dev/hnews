import { error } from '@sveltejs/kit';
import { getStoryDetail } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
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
    loadedAt: Date.now(),
  };
};
