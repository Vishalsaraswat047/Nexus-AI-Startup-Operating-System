import { Router } from 'express';
import {
  createEmailUser,
  loginEmailUser,
  upsertGoogleUser,
  resolveSession,
  revokeSession,
  setUserBusinessType,
  setUserOnboardingComplete,
  type BusinessType,
  type StoredUser,
} from './userStore';
import { founderNameFromEmail } from './helpers';

const router = Router();

async function verifyGoogleToken(credential: string): Promise<{ email: string; name: string }> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
  );
  if (!res.ok) throw new Error('Invalid Google token');
  const data = (await res.json()) as {
    email?: string;
    name?: string;
    given_name?: string;
    email_verified?: string;
    aud?: string;
  };
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (clientId && data.aud && data.aud !== clientId) {
    throw new Error('Google token audience mismatch');
  }
  if (data.email_verified === 'false') throw new Error('Google email not verified');
  if (!data.email) throw new Error('Google account has no email');
  return {
    email: data.email,
    name: data.name || data.given_name || founderNameFromEmail(data.email),
  };
}

function toSessionPayload(user: StoredUser, token: string, isNewUser = false) {
  return {
    token,
    isNewUser,
    user: {
      id: user.id,
      email: user.email,
      founderName: user.founderName,
      authProvider: user.authProvider,
      businessType: user.businessType ?? null,
      needsEntrance: !user.businessType,
      needsOnboarding: !user.businessType,
      onboardingCompleted: !!user.onboardingCompleted,
      businessProfile: user.businessProfile ?? null,
      businessProfileCompanyId: user.businessProfileCompanyId ?? null,
    },
  };
}

router.post('/signup', (req, res) => {
  try {
    const { email, password, founderName } = req.body as {
      email?: string;
      password?: string;
      founderName?: string;
    };
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const name = founderName?.trim() || founderNameFromEmail(email);
    const { user, token } = createEmailUser({ email, password, founderName: name });
    res.json(toSessionPayload(user, token, true));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Signup failed';
    res.status(400).json({ error: msg });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const { user, token } = loginEmailUser(email, password);
    res.json(toSessionPayload(user, token, false));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login failed';
    res.status(401).json({ error: msg });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) return res.status(400).json({ error: 'Google credential required' });
    const profile = await verifyGoogleToken(credential);
    const { user, token, isNewUser } = upsertGoogleUser({
      email: profile.email,
      founderName: profile.name,
    });
    res.json(toSessionPayload(user, token, isNewUser));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Google sign-in failed';
    res.status(401).json({ error: msg });
  }
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  const user = resolveSession(auth);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  res.json({
    user: {
      id: user.id,
      email: user.email,
      founderName: user.founderName,
      authProvider: user.authProvider,
      businessType: user.businessType ?? null,
      needsEntrance: !user.businessType,
      onboardingCompleted: !!user.onboardingCompleted,
      businessProfile: user.businessProfile ?? null,
      businessProfileCompanyId: user.businessProfileCompanyId ?? null,
    },
  });
});

router.post('/entrance', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (!auth) return res.status(401).json({ error: 'Not authenticated' });
  const user = resolveSession(auth);
  if (!user) return res.status(401).json({ error: 'Session expired' });
  const { businessType } = req.body as { businessType?: BusinessType };
  if (businessType !== 'new_brand' && businessType !== 'existing_business') {
    return res.status(400).json({ error: 'Invalid business type' });
  }
  const updated = setUserBusinessType(user.id, businessType);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      founderName: updated.founderName,
      authProvider: updated.authProvider,
      businessType: updated.businessType,
      needsEntrance: false,
    },
  });
});

router.post('/logout', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  if (auth) revokeSession(auth);
  res.json({ ok: true });
});

export default router;
