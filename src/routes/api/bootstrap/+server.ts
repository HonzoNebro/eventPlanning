import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getEventForGroup, getParticipant } from '$lib/server/repository';

export async function GET({ locals, platform }) {
  if (!locals.access?.groupId) {
    return json({ hasAccess: false, participant: null, event: null });
  }

  const database = db(platform);
  return json({
    hasAccess: true,
    participant: await getParticipant(database, locals.access.participantId),
    event: await getEventForGroup(database, locals.access.groupId)
  });
}
