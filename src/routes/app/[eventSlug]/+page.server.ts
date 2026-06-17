import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getEventBySlug, getSchedule } from '$lib/server/repository';

export async function load({ params, platform }) {
  const database = db(platform);
  const event = await getEventBySlug(database, params.eventSlug);
  if (!event) throw error(404, 'Evento no encontrado');
  return { schedule: await getSchedule(database, event) };
}
