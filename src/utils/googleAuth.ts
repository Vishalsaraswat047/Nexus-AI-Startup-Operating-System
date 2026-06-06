export interface GoogleProfile {
  email: string;
  name: string;
}

export function parseGoogleCredential(credential: string): GoogleProfile {
  const part = credential.split('.')[1];
  if (!part) throw new Error('Invalid Google credential');
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(json) as {
    email?: string;
    name?: string;
    given_name?: string;
  };
  if (!payload.email) throw new Error('Google account has no email');
  return {
    email: payload.email,
    name: payload.name || payload.given_name || 'Founder',
  };
}

export function founderNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'founder';
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
