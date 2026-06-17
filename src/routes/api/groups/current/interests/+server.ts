import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getSocialData } from '$lib/server/repository';

export async function GET({ locals, platform }) {
  if (!locals.access?.groupId) return json({ message: 'Not found' }, { status: 404 });
  return json(await getSocialData(db(platform), locals.access.groupId));
}
