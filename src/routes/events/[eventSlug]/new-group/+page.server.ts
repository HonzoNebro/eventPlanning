import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { createGroup, getEventBySlug } from '$lib/server/repository';

export async function load({ params, platform }) {
  const event = await getEventBySlug(db(platform), params.eventSlug);
  if (!event) throw redirect(303, '/');
  return { event };
}

export const actions = {
  default: async ({ params, platform, request, url }) => {
    const form = await request.formData();
    if (String(form.get('website') ?? '')) return fail(400, { message: 'No se pudo crear el grupo.' });
    const database = db(platform);
    const event = await getEventBySlug(database, params.eventSlug);
    if (!event) return fail(404, { message: 'Evento no encontrado.' });
    const group = await createGroup(database, event.id);
    throw redirect(303, `${url.origin}/app/${event.slug}?g=${group.token}`);
  }
};
