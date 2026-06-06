import MaterialIcon from './ui/MaterialIcon';
import { PageHeader, StitchCard } from './layout/AppShell';

interface StitchPlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: string;
  description: string;
}

export default function StitchPlaceholderPage({
  title,
  subtitle,
  icon,
  description,
}: StitchPlaceholderPageProps) {
  return (
    <div className="space-y-stack-lg">
      <PageHeader title={title} subtitle={subtitle} />
      <StitchCard className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low">
          <MaterialIcon name={icon} className="text-[32px] text-outline" />
        </div>
        <h3 className="text-lg font-semibold text-primary">Awaiting Configuration</h3>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">{description}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-outline">
          Data Stream Not Active
        </p>
      </StitchCard>
    </div>
  );
}
