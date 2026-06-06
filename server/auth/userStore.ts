import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type BusinessType = 'new_brand' | 'existing_business';
export type AuthProvider = 'email' | 'google' | 'microsoft';

export interface StoredUser {
  id: string;
  email: string;
  founderName: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  businessType?: BusinessType;
  createdAt: number;
  lastLoginAt: number;
  onboardingCompleted?: boolean;
  businessProfile?: Record<string, unknown> | null;
  businessProfileCompanyId?: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

interface AuthDb {
  users: StoredUser[];
  sessions: SessionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'users.json');

function ensureDb(): AuthDb {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const empty: AuthDb = { users: [], sessions: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as AuthDb;
  } catch {
    return { users: [], sessions: [] };
  }
}

function saveDb(db: AuthDb) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}

function newToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const db = ensureDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  const db = ensureDb();
  return db.users.find((u) => u.id === id);
}

export function createEmailUser(params: {
  email: string;
  password: string;
  founderName: string;
}): { user: StoredUser; token: string } {
  const db = ensureDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === params.email.toLowerCase());
  if (existing) throw new Error('An account with this email already exists');

  const user: StoredUser = {
    id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    email: params.email.toLowerCase().trim(),
    founderName: params.founderName.trim(),
    passwordHash: hashPassword(params.password),
    authProvider: 'email',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };
  db.users.push(user);
  const token = createSession(db, user);
  saveDb(db);
  return { user, token };
}

export function loginEmailUser(email: string, password: string): { user: StoredUser; token: string } {
  const db = ensureDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.passwordHash) throw new Error('Invalid email or password');
  if (!verifyPassword(password, user.passwordHash)) throw new Error('Invalid email or password');
  user.lastLoginAt = Date.now();
  const token = createSession(db, user);
  saveDb(db);
  return { user, token };
}

export function upsertGoogleUser(params: {
  email: string;
  founderName: string;
}): { user: StoredUser; token: string; isNewUser: boolean } {
  const db = ensureDb();
  let user = db.users.find((u) => u.email.toLowerCase() === params.email.toLowerCase());
  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = {
      id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      email: params.email.toLowerCase().trim(),
      founderName: params.founderName.trim(),
      authProvider: 'google',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    db.users.push(user);
  } else {
    user.lastLoginAt = Date.now();
    user.founderName = params.founderName.trim() || user.founderName;
    if (user.authProvider !== 'google') user.authProvider = 'google';
  }
  const token = createSession(db, user);
  saveDb(db);
  return { user, token, isNewUser };
}

function createSession(db: AuthDb, user: StoredUser): string {
  const token = newToken();
  const session: SessionRecord = {
    token,
    userId: user.id,
    email: user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  db.sessions = db.sessions.filter((s) => s.userId !== user.id || s.expiresAt > Date.now());
  db.sessions.push(session);
  return token;
}

export function resolveSession(token: string): StoredUser | null {
  const db = ensureDb();
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export function revokeSession(token: string) {
  const db = ensureDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDb(db);
}

export function setUserBusinessType(userId: string, businessType: BusinessType): StoredUser | null {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  user.businessType = businessType;
  saveDb(db);
  return user;
}

export function setUserOnboardingComplete(
  userId: string,
  payload: { businessProfile: Record<string, unknown>; companyId: string },
): StoredUser | null {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  user.onboardingCompleted = true;
  user.businessProfile = payload.businessProfile;
  user.businessProfileCompanyId = payload.companyId;
  saveDb(db);
  return user;
}
