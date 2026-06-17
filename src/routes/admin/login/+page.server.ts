import { fail, redirect } from '@sveltejs/kit';
import { adminCookieName, defaultSecret, signSession } from '$lib/session';

export const actions = {
  default: async ({ cookies, platform, request }) => {
    const form = await request.formData();
    const password = String(form.get('password') ?? '');
    const expected = platform?.env.ADMIN_PASSWORD ?? (platform ? '' : 'admin');
    if (!expected) {
      return fail(500, { message: 'ADMIN_PASSWORD no está configurado en el Worker' });
    }

    if (password !== expected) {
      return fail(401, { message: 'Contraseña incorrecta' });
    }

    cookies.set(adminCookieName(), await signSession(defaultSecret(platform), { groupId: 'admin', issuedAt: Date.now() }), {
      path: '/',
      httpOnly: true,
      secure: Boolean(platform),
      sameSite: 'lax',
      maxAge: 60 * 60 * 8
    });
    throw redirect(303, '/admin/events');
  }
};
