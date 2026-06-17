import { json } from '@sveltejs/kit';
import { accessCookieName, defaultSecret, signSession } from '$lib/session';
import { db } from '$lib/server/db';
import { findGroupByToken } from '$lib/server/repository';

export async function POST({ cookies, params, platform }) {
  const database = db(platform);
  const group = await findGroupByToken(database, params.token);
  if (!group) return json({ message: 'Not found' }, { status: 404 });

  cookies.set(
    accessCookieName(),
    await signSession(defaultSecret(platform), { groupId: group.id, issuedAt: Date.now() }),
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
