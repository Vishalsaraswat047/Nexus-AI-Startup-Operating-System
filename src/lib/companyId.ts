/**
 * Stable company id for server-side operations store.
 * Per-user (keyed by user id) so the saved business profile is always
 * associated with the correct account, even if multiple users share
 * the same browser.
 */
export function getCompanyId(twinName: string, founderEmail?: string, userId?: string): string {
  if (userId) {
    return `co-user-${userId}`;
  }
  const stored = localStorage.getItem('nexus_company_id');
  if (stored) return stored;

  const base = `${twinName}-${founderEmail || 'founder'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 64);
  const id = `co-${base}`;
  localStorage.setItem('nexus_company_id', id);
  return id;
}

export function resetCompanyId(): void {
  localStorage.removeItem('nexus_company_id');
}
