import { useState } from 'react';
import { StitchInput } from '../stitch/StitchPrimitives';
import MaterialIcon from '../ui/MaterialIcon';
import { ExecutionPanel } from './ExecutionPrimitives';

interface BrandDiscoveryPanelProps {
  onSubmit: (answers: {
    mainBrandValues: string;
    whatsNew: string;
    brandPersonality: string;
    taglineOrVision: string;
  }) => void;
  busy?: boolean;
}

export default function BrandDiscoveryPanel({ onSubmit, busy }: BrandDiscoveryPanelProps) {
  const [mainBrandValues, setMainBrandValues] = useState('');
  const [whatsNew, setWhatsNew] = useState('');
  const [brandPersonality, setBrandPersonality] = useState('');
  const [taglineOrVision, setTaglineOrVision] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainBrandValues.trim()) return;
    onSubmit({
      mainBrandValues: mainBrandValues.trim(),
      whatsNew: whatsNew.trim(),
      brandPersonality: brandPersonality.trim(),
      taglineOrVision: taglineOrVision.trim(),
    });
  };

  return (
    <ExecutionPanel
      title="CEO Agent — brand discovery"
      subtitle="Market research is done. Before brand strategy runs, the CEO needs your inputs."
    >
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <MaterialIcon name="crown" className="text-secondary text-2xl" />
        <p className="text-sm text-on-surface-variant">
          Research agents finished the market scan. I need your vision for the brand — values,
          what makes you different, and how you want to be perceived — so Design and Marketing
          execute with your intent, not generic AI guesses.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <StitchInput
          id="brand-values"
          label="What are your main brand values?"
          value={mainBrandValues}
          onChange={setMainBrandValues}
          placeholder="e.g. Comfort, local authenticity, sustainable luxury"
          required
        />
        <StitchInput
          id="whats-new"
          label="What's new / your differentiator?"
          value={whatsNew}
          onChange={setWhatsNew}
          placeholder="e.g. Only boutique hotel with rooftop farm-to-table in this district"
        />
        <StitchInput
          id="personality"
          label="Brand personality & tone"
          value={brandPersonality}
          onChange={setBrandPersonality}
          placeholder="e.g. Warm, modern, premium but approachable"
        />
        <StitchInput
          id="tagline"
          label="Tagline or brand vision (one line)"
          value={taglineOrVision}
          onChange={setTaglineOrVision}
          placeholder="e.g. Stay rooted in the city, rise above the ordinary"
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={busy || !mainBrandValues.trim()}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Submit to CEO & unlock next steps'}
          </button>
        </div>
      </form>
    </ExecutionPanel>
  );
}
