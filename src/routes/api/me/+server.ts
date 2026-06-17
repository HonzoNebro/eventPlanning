import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { updateParticipantName } from '$lib/server/repository';

export async function PATCH({ locals, platform, request }) {
  if (!locals.access?.participantId) return json({ message: 'Participant required' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { displayName?: string };
  if (!body.displayName?.trim()) return json({ message: 'Name is required' }, { status: 400 });
  return json({ participant: await updateParticipantName(db(platform), locals.access.participantId, body.displayName) });
}
