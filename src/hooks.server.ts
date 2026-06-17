import type { Handle } from '@sveltejs/kit';
import { accessCookieName, adminCookieName, defaultSecret, readSession } from '$lib/session';

export const handle: Handle = async ({ event, resolve }) => {
  const secret = defaultSecret(event.platform);
  const access = await readSession(secret, event.cookies.get(accessCookieName()));
  const admin = await readSession(secret, event.cookies.get(adminCookieName()));

  if (access?.groupId) {
    event.locals.access = {
      groupId: access.groupId,
      participantId: access.participantId
    };
  }
  event.locals.admin = admin?.groupId === 'admin';

  return resolve(event);
};
