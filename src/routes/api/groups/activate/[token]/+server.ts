import { json } from '@sveltejs/kit';
import { accessCookieName, defaultSecret, readSession, signSession } from '$lib/session';
import { db } from '$lib/server/db';
import { findGroupByToken, getParticipantInGroup } from '$lib/server/repository';

export async function POST({ cookies, params, platform }) {
  const database = db(platform);
  const group = await findGroupByToken(database, params.token);
  if (!group) return json({ message: 'Not found' }, { status: 404 });

  const secret = defaultSecret(platform);
  const currentSession = await readSession(secret, cookies.get(accessCookieName()));
  const currentParticipant =
    currentSession?.groupId === group.id
      ? await getParticipantInGroup(database, group.id, currentSession.participantId)
      : null;

  cookies.set(
    accessCookieName(),
    await signSession(secret, { groupId: group.id, participantId: currentParticipant?.id, issuedAt: Date.now() }),
    {
      path: '/',
      httpOnly: true,
      secure: Boolean(platform),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 120
    }
  );

  return json({ ok: true, eventId: group.eventId });
}
