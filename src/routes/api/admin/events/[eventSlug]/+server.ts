import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { deleteEvent, setEventPublic } from '$lib/server/repository';

export async function PATCH({ locals, params, platform, request }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  const body = (await request.json()) as { isPublic?: boolean };
  if (typeof body.isPublic !== 'boolean') return json({ message: 'isPublic must be boolean' }, { status: 400 });
  const event = await setEventPublic(db(platform), params.eventSlug, body.isPublic);
  if (!event) return json({ message: 'Event not found' }, { status: 404 });
  return json({ event });
}

export async function DELETE({ locals, params, platform }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  const deleted = await deleteEvent(db(platform), params.eventSlug);
  return json({ deleted }, { status: deleted ? 200 : 404 });
}
