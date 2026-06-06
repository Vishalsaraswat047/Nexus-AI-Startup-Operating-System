import { Router } from 'express';
import { saveBusinessProfile, getBusinessProfile } from '../operations/businessProfile';
import { resolveSession, setUserOnboardingComplete } from '../auth/userStore';

const router = Router();

router.post('/discovery', (req, res) => {
  const auth = req.headers.authorization?.replace('Bearer ', '');
  const user = auth ? resolveSession(auth) : null;

  const { companyId, profile } = req.body as {
    companyId?: string;
    profile?: Record<string, unknown>;
  };

  if (!companyId?.trim() || !profile) {
    return res.status(400).json({ error: 'companyId and profile required' });
  }

  const stored = saveBusinessProfile(
    companyId.trim(),
    profile as Parameters<typeof saveBusinessProfile>[1],
  );

  if (user) {
    setUserOnboardingComplete(user.id, {
      businessProfile: profile,
      companyId: companyId.trim(),
    });
  }

  res.json({ profile: stored });
});

router.get('/business/:companyId/profile', (req, res) => {
  const profile = getBusinessProfile(String(req.params.companyId));
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

export default router;
