import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getEventBySlug, getSchedule } from '$lib/server/repository';

export async function load({ locals, params, platform }) {
  if (!locals.admin) throw redirect(303, '/admin/login');
  const database = db(platform);
  const event = await getEventBySlug(database, params.eventSlug, true);
  if (!event) throw redirect(303, '/admin/events');
  return { event, schedule: await getSchedule(database, event) };
}
