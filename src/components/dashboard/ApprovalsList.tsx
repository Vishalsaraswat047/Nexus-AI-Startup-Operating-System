import MaterialIcon from '../ui/MaterialIcon';

export interface PendingApproval {
  id: string;
  title: string;
  description: string;
  tier: string;
  actionType?: string;
}

interface ApprovalsListProps {
  approvals: PendingApproval[];
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  busyId?: string | null;
}

function tierTone(tier: string) {
  const t = tier.toLowerCase();
  if (t.includes('red') || t.includes('critical')) return 'border-rose-500/40 bg-rose-500/10 text-rose-700';
  if (t.includes('yellow') || t.includes('medium')) return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
  return 'border-secondary/30 bg-secondary/5 text-secondary';
}

export default function ApprovalsList({ approvals, onApprove, onDecline, busyId }: ApprovalsListProps) {
  if (approvals.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 p-4 text-sm text-on-surface-variant">
        <MaterialIcon name="verified" className="text-emerald-500" />
        <p className="flex-1">No pending approvals. CEO is operating autonomously.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {approvals.slice(0, 5).map((a) => {
        const busy = busyId === a.id;
        return (
          <li
            key={a.id}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
          >
            <div className="flex flex-wrap items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700">
                <MaterialIcon name="gavel" className="text-[16px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-on-surface">{a.title}</p>
                {a.description && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-on-surface-variant">
                    {a.description}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${tierTone(a.tier)}`}
                  >
                    {a.tier}
                  </span>
                  {a.actionType && (
                    <span className="rounded-full border border-outline-variant bg-surface-container-low px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                      {a.actionType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => onApprove(a.id)}
                    disabled={busy}
                    className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-on-primary disabled:opacity-50"
                  >
                    {busy ? '…' : 'Approve'}
                  </button>
                )}
                {onDecline && (
                  <button
                    type="button"
                    onClick={() => onDecline(a.id)}
                    disabled={busy}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-[11px] font-bold text-on-surface-variant disabled:opacity-50"
                  >
                    Decline
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
