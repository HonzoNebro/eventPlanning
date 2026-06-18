import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { enrichEventArtistsWithSpotify } from '$lib/server/spotify';

export async function POST({ locals, params, platform }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  const result = await enrichEventArtistsWithSpotify(db(platform), params.eventSlug, platform?.env);
  if (result.errors.includes('Event not found.')) return json(result, { status: 404 });
  return json(result);
}
