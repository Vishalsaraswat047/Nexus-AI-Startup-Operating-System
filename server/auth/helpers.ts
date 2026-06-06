export function founderNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'founder';
  return local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
