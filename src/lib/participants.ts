export function normalizeDisplayName(displayName: string): string {
  return displayName.trim().replace(/\s+/g, ' ').slice(0, 40);
}

export function displayNameKey(displayName: string): string {
  return normalizeDisplayName(displayName).toLocaleLowerCase('es-ES');
}
