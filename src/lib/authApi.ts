export type BusinessType = 'new_brand' | 'existing_business';

export interface AuthUser {
  id: string;
  email: string;
  founderName: string;
  authProvider: 'email' | 'google' | 'microsoft';
  businessType: BusinessType | null;
  needsEntrance: boolean;
  onboardingCompleted?: boolean;
  businessProfile?: Record<string, unknown> | null;
  businessProfileCompanyId?: string | null;
}

export interface AuthResponse {
  token: string;
  isNewUser: boolean;
  user: AuthUser;
}

const base = '/api/auth';

export async function signupApi(
  email: string,
  password: string,
  founderName?: string,
): Promise<AuthResponse> {
  const res = await fetch(`${base}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, founderName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  return data as AuthResponse;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data as AuthResponse;
}

export async function googleLoginApi(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${base}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
  return data as AuthResponse;
}

export async function saveEntranceApi(
  token: string,
  businessType: BusinessType,
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${base}/entrance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ businessType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save choice');
  return data as { user: AuthUser };
}

export async function logoutApi(token: string): Promise<void> {
  await fetch(`${base}/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchMeApi(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${base}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session expired');
  return data as { user: AuthUser };
}
