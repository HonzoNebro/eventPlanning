import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { listAdminEvents, listExpiredAdminEvents } from '$lib/server/repository';

export async function load({ locals, platform }) {
  if (!locals.admin) throw redirect(303, '/admin/login');
  const database = db(platform);
  return {
    events: await listAdminEvents(database),
    expiredEvents: await listExpiredAdminEvents(database)
  };
}
