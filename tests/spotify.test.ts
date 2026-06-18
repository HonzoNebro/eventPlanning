import { describe, expect, it } from 'vitest';
import { normalizeArtistName, selectBestSpotifyArtist } from '../src/lib/server/spotify';

describe('spotify artist matching', () => {
  it('normalizes accents, punctuation and featuring suffixes', () => {
    expect(normalizeArtistName('Queensrÿche')).toBe('queensryche');
    expect(normalizeArtistName('Sex Pistols featuring Frank Carter')).toBe('sex pistols');
  });

  it('selects an exact normalized artist match', () => {
    const match = selectBestSpotifyArtist('A Day to Remember', [
      { id: 'wrong', name: 'A Day Away', external_urls: { spotify: 'https://open.spotify.com/artist/wrong' }, popularity: 80 },
      {
        id: 'right',
        name: 'A Day To Remember',
        external_urls: { spotify: 'https://open.spotify.com/artist/right' },
        popularity: 20
      }
    ]);

    expect(match?.id).toBe('right');
  });

  it('rejects weak matches', () => {
    const match = selectBestSpotifyArtist('Football', [
      { id: 'wrong', name: 'Football Songs FC', external_urls: { spotify: 'https://open.spotify.com/artist/wrong' } }
    ]);

    expect(match).toBeNull();
  });
});
