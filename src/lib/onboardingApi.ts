import type { NexusBusinessProfile } from '../types/businessProfile';
import { getApiHeaders } from '../utils/apiKeys';

const base = '/api/onboarding';

export async function saveDiscoveryProfileApi(
  companyId: string,
  profile: NexusBusinessProfile,
  authToken?: string,
): Promise<NexusBusinessProfile> {
  const res = await fetch(`${base}/discovery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ companyId, profile }),
  });
  if (!res.ok) throw new Error('Failed to save business profile');
  const data = await res.json();
  return data.profile;
}

export async function fetchBusinessProfileApi(
  companyId: string,
): Promise<NexusBusinessProfile | null> {
  const res = await fetch(`${base}/business/${encodeURIComponent(companyId)}/profile`, {
    headers: getApiHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load business profile');
  const data = await res.json();
  return data.profile;
}
