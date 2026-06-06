import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { StitchInput, StitchSelect } from './stitch/StitchPrimitives';
import { Button } from './ui/button';
import MaterialIcon from './ui/MaterialIcon';
import type { BusinessType } from '../lib/authApi';

export interface LaunchAnswers {
  directive: string;
  name: string;
  location: string;
  budget: number;
  timelineDays: number;
  targetCustomers: string;
  industry: string;
  businessType: BusinessType;
}

interface StreamlinedLaunchWizardProps {
  onComplete: (data: LaunchAnswers) => void;
  isLoading: boolean;
  businessType: BusinessType;
  founderName?: string;
}

export default function StreamlinedLaunchWizard({
  onComplete,
  isLoading,
  businessType,
  founderName,
}: StreamlinedLaunchWizardProps) {
  const isNew = businessType === 'new_brand';
  const [directive, setDirective] = useState(
    isNew ? 'Launch a hotel brand in 30 days' : 'Grow and optimize my existing business',
  );
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('5000');
  const [timelineDays, setTimelineDays] = useState('30');
  const [targetCustomers, setTargetCustomers] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !targetCustomers.trim()) {
      alert('Please provide business name, location, and target customers.');
      return;
    }
    const industry = /hotel|hospitality|resort/i.test(directive)
      ? 'Hospitality'
      : /saas|software|app/i.test(directive)
        ? 'Technology'
        : 'General Business';

    onComplete({
      directive: directive.trim(),
      name: name.trim(),
      location: location.trim(),
      budget: Number(budget) || 3000,
      timelineDays: Number(timelineDays) || 30,
      targetCustomers: targetCustomers.trim(),
      industry,
      businessType,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2 text-on-primary">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary">
              {isNew ? 'Launch your new brand' : 'Connect your business'}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {founderName ? `Hi ${founderName.split(' ')[0]} — ` : ''}
              {isNew
                ? 'Answer a few questions and agents begin research automatically.'
                : 'Tell us about your company so agents can run market research and ops.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <StitchInput
            id="directive"
            label="What do you want to achieve?"
            value={directive}
            onChange={setDirective}
            required
          />
          <StitchInput id="name" label="Business name" value={name} onChange={setName} required />
          <StitchInput id="location" label="Location" value={location} onChange={setLocation} required />
          <StitchInput
            id="budget"
            label="Monthly budget (USD)"
            type="number"
            value={budget}
            onChange={setBudget}
            required
          />
          <StitchSelect
            id="timeline"
            label="Timeline"
            value={timelineDays}
            onChange={setTimelineDays}
            options={[
              { value: '30', label: '30 days' },
              { value: '60', label: '60 days' },
              { value: '90', label: '90 days' },
            ]}
          />
          <StitchInput
            id="customers"
            label="Target customers"
            value={targetCustomers}
            onChange={setTargetCustomers}
            placeholder="e.g. Business travelers, families, luxury leisure"
            required
          />

          <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            <MaterialIcon name="info" className="mr-1 align-middle text-[18px] text-secondary" />
            After submit: CEO sets objective → COO builds execution graph → Research starts automatically.
          </div>

          <Button type="submit" disabled={isLoading} className="w-full gap-2">
            {isLoading
              ? 'Starting execution…'
              : isNew
                ? 'Launch company'
                : 'Connect & start agents'}
            {!isLoading && <ArrowRight size={18} />}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
