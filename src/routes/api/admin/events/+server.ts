import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { deleteExpiredEvents, importEvent, listAdminEvents } from '$lib/server/repository';
import type { AdminImportPayload } from '$lib/types';

export async function GET({ locals, platform }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  return json({ events: await listAdminEvents(db(platform)) });
}

export async function POST({ locals, platform, request }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  const payload = (await request.json()) as AdminImportPayload;
  return json({ event: await importEvent(db(platform), payload) }, { status: 201 });
}

export async function DELETE({ locals, platform, url }) {
  if (!locals.admin) return json({ message: 'Unauthorized' }, { status: 401 });
  if (url.searchParams.get('expired') !== '1') return json({ message: 'Missing expired=1' }, { status: 400 });
  return json({ deleted: await deleteExpiredEvents(db(platform)) });
}
