import { json } from '@sveltejs/kit';
import { avatarColor } from '$lib/id';
import { normalizeDisplayName } from '$lib/participants';
import { accessCookieName, defaultSecret, signSession } from '$lib/session';
import { db } from '$lib/server/db';
import { createParticipant, listParticipants, participantNameExists } from '$lib/server/repository';

const DUPLICATE_NAME_MESSAGE = 'Ese nombre ya está en uso en este grupo.';

export async function GET({ locals, platform }) {
  if (!locals.access?.groupId) return json({ message: 'Not found' }, { status: 404 });
  return json({ participants: await listParticipants(db(platform), locals.access.groupId) });
}

export async function POST({ cookies, locals, platform, request }) {
  if (!locals.access?.groupId) return json({ message: 'Not found' }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { displayName?: string };
  const displayName = normalizeDisplayName(body.displayName ?? '');
  if (!displayName) return json({ message: 'Name is required' }, { status: 400 });

  const database = db(platform);
  if (await participantNameExists(database, locals.access.groupId, displayName)) {
    return json({ message: DUPLICATE_NAME_MESSAGE }, { status: 409 });
  }

  const participant = await createParticipant(database, locals.access.groupId, displayName, avatarColor(displayName));
  cookies.set(
    accessCookieName(),
    await signSession(defaultSecret(platform), {
      groupId: locals.access.groupId,
      participantId: participant.id,
      issuedAt: Date.now()
    }),
    {
      path: '/',
      httpOnly: true,
      secure: Boolean(platform),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 120
    }
  );
  return json({ participant });
}
