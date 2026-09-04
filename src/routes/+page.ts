import { getTopStories } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => ({
  stories: await getTopStories(fetch),
  loadedAt: Date.now(),
});
