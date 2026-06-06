import { ReactNode } from 'react';
import MaterialIcon from '../ui/MaterialIcon';

const inputClass =
  'h-[48px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10';

export function StitchInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-stack-sm">
      <label htmlFor={id} className="font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function StitchSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  // Ensure value is valid or use first option as default
  const validValue = value || (options.length > 0 ? options[0].value : '');

  return (
    <div className="flex flex-col gap-stack-sm">
      <label htmlFor={id} className="font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={validValue}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} cursor-pointer appearance-none`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <MaterialIcon
          name="expand_more"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
    </div>
  );
}

export function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <MaterialIcon name={icon} className={`text-[24px] ${iconColor}`} />
        </div>
        <span className="text-sm font-bold text-on-surface-variant">{label}</span>
      </div>
      <div className="mb-1 text-3xl font-bold text-primary">{value}</div>
      {sub}
    </div>
  );
}

export function ProgressLine({ pct, color = 'bg-secondary' }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-container">
      <div className={`h-1.5 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function SectionLink({ children, onClick }: { children: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-bold text-secondary hover:underline">
      {children}
    </button>
  );
}

export function EmptyAwaiting({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant py-12 text-center">
      <p className="text-sm font-semibold text-on-surface-variant">Awaiting Configuration</p>
      <p className="mt-2 max-w-sm text-xs text-outline">{message}</p>
    </div>
  );
}
