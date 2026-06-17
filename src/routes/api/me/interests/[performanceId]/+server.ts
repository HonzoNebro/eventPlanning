import { json } from '@sveltejs/kit';
import { isInterestStatus } from '$lib/schedule';
import { db } from '$lib/server/db';
import { deleteInterest, upsertInterest } from '$lib/server/repository';

export async function PUT({ locals, params, platform, request }) {
  if (!locals.access?.participantId) return json({ message: 'Participant required' }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !isInterestStatus(body.status)) return json({ message: 'Invalid status' }, { status: 400 });
  await upsertInterest(db(platform), locals.access.participantId, params.performanceId, body.status);
  return json({ ok: true });
}

export async function DELETE({ locals, params, platform }) {
  if (!locals.access?.participantId) return json({ message: 'Participant required' }, { status: 401 });
  await deleteInterest(db(platform), locals.access.participantId, params.performanceId);
  return json({ ok: true });
}
