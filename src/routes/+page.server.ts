import { db } from '$lib/server/db';
import { listPublicEvents } from '$lib/server/repository';

export async function load({ platform }) {
  return {
    events: await listPublicEvents(db(platform))
  };
}
