import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { createGroup, getEventBySlug } from '$lib/server/repository';

export async function POST({ params, platform, url }) {
  const database = db(platform);
  const event = await getEventBySlug(database, params.eventSlug);
  if (!event) return json({ message: 'Not found' }, { status: 404 });

  const group = await createGroup(database, event.id);
  return json({
    group,
    url: `${url.origin}/app/${event.slug}?g=${group.token}`
  });
}
