import { useState } from 'react';
import MaterialIcon from './ui/MaterialIcon';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { StitchPageHeader } from './stitch/StitchPageHeader';
import type { BusinessTwin } from '../types';
import type { NexusSession } from './LoginPage';

interface ProfilePageProps {
  session: NexusSession;
  twin: BusinessTwin;
  founderName: string;
  onUpdateFounderName: (name: string) => void;
  onLogout: () => void;
  onAddLog: (msg: string) => void;
  onNavigateSettings: () => void;
}

function providerLabel(provider?: NexusSession['authProvider']) {
  if (provider === 'google') return 'Google';
  if (provider === 'microsoft') return 'Microsoft';
  return 'Email';
}

export default function ProfilePage({
  session,
  twin,
  founderName,
  onUpdateFounderName,
  onLogout,
  onAddLog,
  onNavigateSettings,
}: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(founderName);

  const initials =
    founderName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'AF';

  const handleSaveName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onUpdateFounderName(trimmed);
    onAddLog(`Profile: Updated operator identity to ${trimmed}.`);
    setEditing(false);
  };

  const handleLogout = () => {
    if (!window.confirm('Sign out of Nexus AI?')) return;
    onLogout();
    onAddLog('Security: Signed out of Nexus workspace.');
  };

  return (
    <div className="space-y-stack-lg">
      <StitchPageHeader
        title="Profile"
        subtitle="Your operator identity and workspace access"
        breadcrumb={{ parent: 'Account', current: 'Profile' }}
        action={
          <button
            type="button"
            onClick={onNavigateSettings}
            className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface-container-low"
          >
            <MaterialIcon name="settings" className="text-[18px]" />
            Workspace Settings
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-primary">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">{founderName}</h3>
              <p className="text-sm text-on-surface-variant">{session.email}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <MaterialIcon name="verified" className="text-[12px]" />
                Active session
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-sm font-semibold text-on-surface">Display name</Label>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftName(founderName);
                      setEditing(true);
                    }}
                    className="text-xs font-semibold text-secondary hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="flex-1"
                    placeholder="Your name"
                  />
                  <Button onClick={handleSaveName} className="shrink-0">
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="shrink-0">
                    Cancel
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-primary">{founderName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase text-outline">Email</p>
                <p className="mt-1 text-sm font-medium text-primary">{session.email}</p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase text-outline">Sign-in method</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {providerLabel(session.authProvider)}
                </p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase text-outline">Company</p>
                <p className="mt-1 text-sm font-medium text-primary">{twin.name}</p>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[10px] font-bold uppercase text-outline">Stage</p>
                <p className="mt-1 text-sm font-medium text-primary">{twin.stage}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-outline-variant bg-primary-container p-6 text-on-primary-container">
            <MaterialIcon name="shield_person" className="mb-2 text-[28px]" />
            <h3 className="font-bold">Founder & CEO</h3>
            <p className="mt-1 text-sm opacity-80">Full access to all Nexus AI modules and agents.</p>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-primary">
              <MaterialIcon name="logout" />
              Session
            </h3>
            <p className="mb-4 text-sm text-on-surface-variant">
              End your session and return to the login screen. Your company data stays saved locally.
            </p>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full rounded-lg border-error/40 font-semibold text-error hover:bg-error/5"
            >
              <MaterialIcon name="logout" className="mr-2 text-[18px]" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
