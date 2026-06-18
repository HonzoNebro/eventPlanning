import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { deleteEvent, setEventPublic } from '$lib/server/repository';
import { enrichEventArtistsWithSpotify } from '$lib/server/spotify';

export async function PATCH({ locals, params, platform, request }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  const body = (await request.json()) as { isPublic?: boolean };
  if (typeof body.isPublic !== 'boolean') return json({ message: 'isPublic must be boolean' }, { status: 400 });
  const database = db(platform);
  const event = await setEventPublic(database, params.eventSlug, body.isPublic);
  if (!event) return json({ message: 'Event not found' }, { status: 404 });
  const spotify = body.isPublic
    ? await enrichEventArtistsWithSpotify(database, params.eventSlug, platform?.env)
    : undefined;
  return json({ event, spotify });
}

export async function DELETE({ locals, params, platform }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  const deleted = await deleteEvent(db(platform), params.eventSlug);
  return json({ deleted }, { status: deleted ? 200 : 404 });
}
