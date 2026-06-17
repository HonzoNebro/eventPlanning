import { error } from '@sveltejs/kit';

export function db(platform: App.Platform | undefined): D1Database {
  if (!platform?.env.DB) {
    throw error(500, 'D1 binding DB is not available.');
  }
  return platform.env.DB;
}
