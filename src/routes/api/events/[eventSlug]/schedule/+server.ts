import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getEventBySlug, getSchedule } from '$lib/server/repository';

export async function GET({ params, platform }) {
  const database = db(platform);
  const event = await getEventBySlug(database, params.eventSlug);
  if (!event) return json({ message: 'Not found' }, { status: 404 });
  return json(await getSchedule(database, event), {
    headers: {
      'cache-control': 'public, max-age=60'
    }
  });
}
