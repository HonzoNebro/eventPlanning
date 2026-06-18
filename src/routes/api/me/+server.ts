import { json } from '@sveltejs/kit';
import { normalizeDisplayName } from '$lib/participants';
import { db } from '$lib/server/db';
import { participantNameExists, updateParticipantNameInGroup } from '$lib/server/repository';

const DUPLICATE_NAME_MESSAGE = 'Ese nombre ya está en uso en este grupo.';

export async function PATCH({ locals, platform, request }) {
  if (!locals.access?.groupId || !locals.access?.participantId) {
    return json({ message: 'Participant required' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { displayName?: string };
  const displayName = normalizeDisplayName(body.displayName ?? '');
  if (!displayName) return json({ message: 'Name is required' }, { status: 400 });

  const database = db(platform);
  if (await participantNameExists(database, locals.access.groupId, displayName, locals.access.participantId)) {
    return json({ message: DUPLICATE_NAME_MESSAGE }, { status: 409 });
  }

  const participant = await updateParticipantNameInGroup(
    database,
    locals.access.groupId,
    locals.access.participantId,
    displayName
  );
  if (!participant) return json({ message: 'Participant required' }, { status: 401 });

  return json({ participant });
}
