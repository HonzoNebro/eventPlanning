import type { ArtistSpotifyRow } from './repository';
import {
  getEventBySlug,
  listArtistsMissingSpotify,
  updateArtistSpotifyUrl
} from './repository';

export interface SpotifyEnvironment {
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
}

export interface SpotifyEnrichmentSummary {
  matched: Array<{ artistId: string; artistName: string; spotifyUrl: string; spotifyName: string }>;
  unmatched: Array<{ artistId: string; artistName: string }>;
  errors: string[];
}

interface SpotifyArtistResult {
  id: string;
  name: string;
  external_urls?: {
    spotify?: string;
  };
  popularity?: number;
}

interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: SpotifyToken | null = null;

export function normalizeArtistName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(feat|featuring|with)\b.*$/g, '')
    .replace(/["'`´.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function similarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const leftWords = new Set(left.split(' '));
  const rightWords = new Set(right.split(' '));
  const intersection = [...leftWords].filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;
  return union ? intersection / union : 0;
}

export function selectBestSpotifyArtist(
  artistName: string,
  candidates: SpotifyArtistResult[]
): SpotifyArtistResult | null {
  const normalizedName = normalizeArtistName(artistName);
  const ranked = candidates
    .filter((candidate) => candidate.external_urls?.spotify)
    .map((candidate) => {
      const candidateName = normalizeArtistName(candidate.name);
      const lengthRatio =
        normalizedName && candidateName
          ? Math.min(normalizedName.length, candidateName.length) / Math.max(normalizedName.length, candidateName.length)
          : 0;
      const closeContainment =
        lengthRatio >= 0.65 && (candidateName.includes(normalizedName) || normalizedName.includes(candidateName));
      const score =
        candidateName === normalizedName
          ? 1
          : Math.max(similarity(normalizedName, candidateName), closeContainment ? 0.9 : 0);
      return { candidate, score };
    })
    .filter(({ score }) => score >= 0.82)
    .sort((left, right) => right.score - left.score || (right.candidate.popularity ?? 0) - (left.candidate.popularity ?? 0));

  return ranked[0]?.candidate ?? null;
}

function getSpotifyConfig(env: SpotifyEnvironment | undefined): SpotifyEnvironment {
  return {
    SPOTIFY_CLIENT_ID:
      env?.SPOTIFY_CLIENT_ID ?? (typeof process !== 'undefined' ? process.env.SPOTIFY_CLIENT_ID : undefined),
    SPOTIFY_CLIENT_SECRET:
      env?.SPOTIFY_CLIENT_SECRET ?? (typeof process !== 'undefined' ? process.env.SPOTIFY_CLIENT_SECRET : undefined)
  };
}

function encodeBasicAuth(clientId: string, clientSecret: string): string {
  return btoa(`${clientId}:${clientSecret}`);
}

async function getSpotifyToken(env: SpotifyEnvironment | undefined): Promise<string | null> {
  const config = getSpotifyConfig(env);
  if (!config.SPOTIFY_CLIENT_ID || !config.SPOTIFY_CLIENT_SECRET) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) return cachedToken.accessToken;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${encodeBasicAuth(config.SPOTIFY_CLIENT_ID, config.SPOTIFY_CLIENT_SECRET)}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });
  if (!response.ok) throw new Error(`Spotify token request failed with ${response.status}`);

  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error('Spotify token response did not include access_token');
  cachedToken = {
    accessToken: body.access_token,
    expiresAt: now + (body.expires_in ?? 3600) * 1000
  };
  return cachedToken.accessToken;
}

async function searchSpotifyArtist(accessToken: string, artistName: string): Promise<SpotifyArtistResult[]> {
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', `artist:${artistName}`);
  url.searchParams.set('type', 'artist');
  url.searchParams.set('limit', '5');

  const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Spotify search failed with ${response.status}`);
  const body = (await response.json()) as { artists?: { items?: SpotifyArtistResult[] } };
  return body.artists?.items ?? [];
}

async function enrichArtist(
  database: D1Database,
  accessToken: string,
  artist: ArtistSpotifyRow,
  summary: SpotifyEnrichmentSummary
) {
  const candidates = await searchSpotifyArtist(accessToken, artist.name);
  const match = selectBestSpotifyArtist(artist.name, candidates);
  if (!match?.external_urls?.spotify) {
    summary.unmatched.push({ artistId: artist.id, artistName: artist.name });
    return;
  }

  await updateArtistSpotifyUrl(database, artist.id, match.external_urls.spotify);
  summary.matched.push({
    artistId: artist.id,
    artistName: artist.name,
    spotifyUrl: match.external_urls.spotify,
    spotifyName: match.name
  });
}

export async function enrichEventArtistsWithSpotify(
  database: D1Database,
  eventSlug: string,
  env: SpotifyEnvironment | undefined
): Promise<SpotifyEnrichmentSummary> {
  const summary: SpotifyEnrichmentSummary = { matched: [], unmatched: [], errors: [] };
  const event = await getEventBySlug(database, eventSlug, true);
  if (!event) {
    summary.errors.push('Event not found.');
    return summary;
  }

  const artists = await listArtistsMissingSpotify(database, event.id);
  if (!artists.length) return summary;

  let accessToken: string | null = null;
  try {
    accessToken = await getSpotifyToken(env);
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : 'Spotify token request failed.');
  }
  if (!accessToken) {
    summary.errors.push('Spotify credentials are not configured.');
    summary.unmatched.push(...artists.map((artist) => ({ artistId: artist.id, artistName: artist.name })));
    return summary;
  }

  for (const artist of artists) {
    try {
      await enrichArtist(database, accessToken, artist, summary);
    } catch (error) {
      summary.errors.push(`${artist.name}: ${error instanceof Error ? error.message : 'Spotify search failed.'}`);
    }
  }

  return summary;
}
