import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { listAdminEvents } from '$lib/server/repository';

export async function load({ locals, platform }) {
  if (!locals.admin) throw redirect(303, '/admin/login');
  return { events: await listAdminEvents(db(platform)) };
}
