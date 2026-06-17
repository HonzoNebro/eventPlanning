import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { createNote, deleteOwnNote } from '$lib/server/repository';

export async function POST({ locals, params, platform, request }) {
  if (!locals.access?.participantId) return json({ message: 'Participant required' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { body?: string };
  if (!body.body?.trim()) return json({ message: 'Note body is required' }, { status: 400 });
  return json({ note: await createNote(db(platform), locals.access.participantId, params.id, body.body) });
}

export async function DELETE({ locals, params, platform }) {
  if (!locals.access?.participantId) return json({ message: 'Participant required' }, { status: 401 });
  const deleted = await deleteOwnNote(db(platform), locals.access.participantId, params.id);
  return json({ ok: deleted }, { status: deleted ? 200 : 404 });
}
