import { describe, expect, it } from 'vitest';
import { displayNameKey, normalizeDisplayName } from '../src/lib/participants';

describe('participant display names', () => {
  it('normalizes surrounding and repeated whitespace', () => {
    expect(normalizeDisplayName('  Roberto   Alvarez  ')).toBe('Roberto Alvarez');
  });

  it('compares names case-insensitively after normalization', () => {
    expect(displayNameKey(' Roberto ')).toBe(displayNameKey('roberto'));
  });

  it('keeps persisted display names within the database limit', () => {
    expect(normalizeDisplayName('a'.repeat(50))).toHaveLength(40);
  });
});
