import type { ExecutionGraph, NextStepOption, ExecutionDeliverable } from './executionTypes';
import { appendEvent } from './eventLog';
import { writeMemory } from './memoryOps';
import {
  buildPhaseRecommendation,
  departmentsForPhase,
  nextRecommendationsForCategory,
  phaseSequenceForCategory,
  type PhaseKey,
  type PhaseRecommendation,
} from './businessPlaybook';

export interface CeoRecommendation {
  completedSummary: string;
  learned: string;
  blocked: string;
  nextStep: string;
  reason: string;
  departments: string[];
  options: NextStepOption[];
  revenueDriver: string;
  launchUnblocker: string;
  highestRoi: string;
  basedOnFindings: string[];
}

interface RecommendationContext {
  category?: string;
  stage?: string;
  objective?: string;
  location?: string;
}

function newId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function optionsToNextSteps(
  recs: PhaseRecommendation[],
  category: string | undefined,
): NextStepOption[] {
  return recs.map((rec, i) => ({
    id: newId(),
    phaseKey: rec.phaseKey,
    label: rec.label,
    description: rec.description,
    reason: rec.reason,
    departments: departmentsForPhase(rec.phaseKey, category),
    isPrimary: i === 0,
    revenueImpact: rec.revenueImpact,
    blocksLaunch: rec.blocksLaunch,
    roi: rec.roi,
    isOperational: rec.isOperational,
  }));
}

function completedPhaseKeys(execution: ExecutionGraph): string[] {
  return execution.phases.filter((p) => p.status === 'completed').map((p) => p.key);
}

function extractKeyFindings(deliverables: ExecutionDeliverable[], phaseKey: string): string[] {
  const phaseDeliverables = deliverables.filter((d) => {
    const phase = executionGraph_phases_find(execute_graph(), phaseKey);
    return phase && d.phaseId === phase.id;
  });

  const findings: string[] = [];

  for (const del of phaseDeliverables) {
    if (del.details && del.details.length > 0) {
      for (const detail of del.details) {
        const clean = detail.replace(/^[•\-\*]\s*/, '').trim();
        if (clean.length > 10 && clean.length < 200) {
          findings.push(clean);
        }
      }
    } else if (del.summary) {
      findings.push(del.summary);
    }
  }

  return findings;
}

function executionGraph_phases_find(execution: ExecutionGraph | null, key: string): { id: string } | null {
  if (!execution) return null;
  return execution.phases.find((p) => p.key === key) || null;
}

function execute_graph(): ExecutionGraph | null {
  return null;
}

function generateSmartRecommendation(
  completedPhaseKey: string,
  deliverables: ExecutionDeliverable[],
  execution: ExecutionGraph,
  category: string,
): string {
  const phase = execution.phases.find((p) => p.key === completedPhaseKey);
  if (!phase) return 'Continue to the next phase in the sequence.';

  const phaseDeliverables = deliverables.filter((d) => d.phaseId === phase.id);

  if (phaseDeliverables.length === 0) {
    return `Based on ${category} industry standards, the next logical step after ${phase.name} is typically determined by market validation results.`;
  }

  const keyFindings: string[] = [];

  for (const del of phaseDeliverables) {
    if (del.details) {
      for (const detail of del.details) {
        const cleanDetail = detail.replace(/^[•\-\*]\s*/, '').trim();
        if (cleanDetail.length > 20) {
          keyFindings.push(cleanDetail);
        }
      }
    }
  }

  if (keyFindings.length === 0) {
    return `Completed ${phase.name} phase with deliverables. Based on findings, the next recommended action is to proceed to the next phase in the ${category} playbook.`;
  }

  const sample = keyFindings.slice(0, 3);

  if (completedPhaseKey === 'research') {
    const competitorFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('competitor') || f.toLowerCase().includes('pricing')
    );
    const customerFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('customer') || f.toLowerCase().includes('persona')
    );
    const pricingFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('price') || f.toLowerCase().includes('₹') || f.toLowerCase().includes('rupee')
    );

    if (pricingFindings.length > 0) {
      return `Research found: ${pricingFindings[0]}. Next step recommendation is pricing strategy to lock in revenue model before brand work.`;
    }
    if (competitorFindings.length > 0) {
      return `Key competitor insight: ${competitorFindings[0]}. Next step should be business model definition to exploit the competitive gap identified.`;
    }
    if (customerFindings.length > 0) {
      return `Customer insight: ${customerFindings[0]}. Next step should be pricing to convert this demand into revenue.`;
    }
  }

  if (completedPhaseKey === 'business_model') {
    const revenueFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('revenue') || f.toLowerCase().includes('margin') || f.toLowerCase().includes('cost')
    );
    if (revenueFindings.length > 0) {
      return `Financial analysis: ${revenueFindings[0]}. Pricing strategy is the natural next step to operationalize the revenue model.`;
    }
  }

  if (completedPhaseKey === 'pricing') {
    const pricingFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('₹') || f.toLowerCase().includes('price') || f.toLowerCase().includes('tier')
    );
    if (pricingFindings.length > 0) {
      return `Pricing locked: ${pricingFindings[0]}. Operations setup is now the critical path to revenue.`;
    }
  }

  if (completedPhaseKey === 'operations') {
    const opsFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('workflow') || f.toLowerCase().includes('vendor') || f.toLowerCase().includes('tool')
    );
    if (opsFindings.length > 0) {
      return `Operations ready: ${opsFindings[0]}. Customer acquisition can now begin with confidence.`;
    }
  }

  if (completedPhaseKey === 'customer_acquisition') {
    const channelFindings = keyFindings.filter((f) =>
      f.toLowerCase().includes('channel') || f.toLowerCase().includes('cac') || f.toLowerCase().includes('acquisition')
    );
    if (channelFindings.length > 0) {
      return `Growth data: ${channelFindings[0]}. Ready to scale or optimize the winning channel.`;
    }
  }

  return `Based on ${keyFindings.length} findings from ${phase.name}, the next step is determined by the strategic priority.`;
}

function generateCompletedSummary(
  phaseKey: string,
  deliverables: ExecutionDeliverable[],
  execution: ExecutionGraph,
): string {
  const phase = execution.phases.find((p) => p.key === phaseKey);
  const phaseName = phase?.name ?? phaseKey;

  const phaseDeliverables = deliverables.filter((d) => d.phaseId === phase?.id);

  if (phaseDeliverables.length === 0) {
    return `${phaseName} phase completed for ${execution.objective} in ${execution.location}.`;
  }

  const findings: string[] = [];
  for (const del of phaseDeliverables) {
    if (del.summary) {
      findings.push(del.summary);
    }
  }

  if (findings.length === 0) {
    return `${phaseName} completed with ${phaseDeliverables.length} deliverables for ${execution.objective}.`;
  }

  return findings.slice(0, 2).join('. ');
}

function generateLearnedFromDeliverables(
  phaseKey: string,
  deliverables: ExecutionDeliverable[],
  execution: ExecutionGraph,
): string {
  const phase = execution.phases.find((p) => p.key === phaseKey);
  const phaseName = phase?.name ?? phaseKey;
  const category = execution.objective;

  const phaseDeliverables = deliverables.filter((d) => d.phaseId === phase?.id);

  if (phaseDeliverables.length === 0) {
    return `${phaseName} phase completed. No specific findings to report.`;
  }

  const allDetails: string[] = [];
  for (const del of phaseDeliverables) {
    if (del.details) {
      allDetails.push(...del.details);
    }
  }

  if (allDetails.length === 0) {
    return `${phaseName} complete. Key deliverables produced but details are summarized.`;
  }

  const keyInsights: string[] = allDetails
    .slice(0, 4)
    .map((d) => d.replace(/^[•\-\*]\s*/, '').trim())
    .filter((d) => d.length > 15 && d.length < 200);

  if (keyInsights.length === 0) {
    return `${phaseName} completed with ${phaseDeliverables.length} deliverables.`;
  }

  return `Key findings from ${phaseName}: ${keyInsights.slice(0, 3).join('. ')}.`;
}

export function generateCeoRecommendation(
  companyId: string,
  phaseKey: string,
  execution: ExecutionGraph,
  ctx: RecommendationContext = {},
): CeoRecommendation {
  const category = ctx.category || 'Other';
  const phase = execution.phases.find((p) => p.key === phaseKey);
  const phaseName = phase?.name ?? phaseKey;

  const completedSummary = generateCompletedSummary(phaseKey, execution.deliverables, execution);
  const learned = generateLearnedFromDeliverables(phaseKey, execution.deliverables, execution);
  const blocked = inferBlocked(phaseKey, execution, category);

  const completedKeys = completedPhaseKeys(execution);
  const recs = nextRecommendationsForCategory(category, phaseKey, completedKeys, 3);

  const safeRecs: PhaseRecommendation[] =
    recs.length > 0
      ? recs
      : [buildPhaseRecommendation('scaling')];

  const options = optionsToNextSteps(safeRecs, category);
  const primary = options[0];
  const primaryMeta = safeRecs[0];
  const departments = primary?.departments ?? departmentsForPhase('research', category);

  const revenueDriver = driverForRec(primaryMeta, category);
  const launchUnblocker = unblockerForRec(primaryMeta, execution);
  const highestRoi = roiNarrative(primaryMeta);
  const basedOnFindings = generateBasedOnFindings(phaseKey, execution.deliverables, execution, category);

  const recommendation: CeoRecommendation = {
    completedSummary,
    learned,
    blocked,
    nextStep: primary?.label ?? 'Continue execution',
    reason: primary?.reason ?? 'Highest-impact next action based on business context.',
    departments,
    options,
    revenueDriver,
    launchUnblocker,
    highestRoi,
    basedOnFindings,
  };

  appendEvent(companyId, {
    type: 'ceo_recommendation',
    fromAgent: 'CEO Agent',
    department: 'Executive Layer',
    message: `Next business-critical decision: ${recommendation.nextStep}`,
    payload: {
      completed: completedSummary,
      learned,
      blocked,
      nextStep: recommendation.nextStep,
      reason: recommendation.reason,
      departments,
      revenueDriver,
      launchUnblocker,
      highestRoi,
      category,
      basedOnFindings,
    },
  });

  writeMemory(companyId, {
    type: 'strategic',
    content: `CEO recommendation after ${phaseName} for ${category} business: ${recommendation.nextStep}. ${basedOnFindings.slice(0, 2).join(' ')}`,
    agent: 'CEO Agent',
  });

  return recommendation;
}

function generateBasedOnFindings(
  phaseKey: string,
  deliverables: ExecutionDeliverable[],
  execution: ExecutionGraph,
  category: string,
): string[] {
  const phase = execution.phases.find((p) => p.key === phaseKey);
  if (!phase) return [];

  const phaseDeliverables = deliverables.filter((d) => d.phaseId === phase.id);
  const findings: string[] = [];

  for (const del of phaseDeliverables) {
    if (del.summary) {
      findings.push(del.summary);
    }
    if (del.details) {
      for (const detail of del.details) {
        const clean = detail.replace(/^[•\-\*]\s*/, '').trim();
        if (clean.length > 20 && clean.length < 300) {
          findings.push(clean);
        }
      }
    }
  }

  return findings.slice(0, 5);
}

function inferBlocked(phaseKey: string, execution: ExecutionGraph, category: string): string {
  const blocked = execution.tasks.filter((t) => t.status === 'blocked');
  if (blocked.length > 0) {
    const reasons = blocked.map((t) => t.blockedReason || t.title);
    return `Blocked tasks: ${reasons.join('; ')}. Resolve dependencies before proceeding.`;
  }
  if (phaseKey === 'research' && category === 'Hospitality') {
    return 'Property acquisition may block operations setup — verify property status before operations phase.';
  }
  if (phaseKey === 'research' && category === 'Physical Product') {
    return 'Manufacturing lead times may block launch — confirm supplier MOQ and lead time before pricing.';
  }
  if (phaseKey === 'business_model' && !execution.brandDiscovery && category === 'SaaS') {
    return 'Brand discovery inputs needed before public-facing brand work begins.';
  }
  return 'No critical blockers detected.';
}

function driverForRec(rec: PhaseRecommendation | undefined, category: string): string {
  if (!rec) return 'Continue executing the planned roadmap.';
  switch (rec.phaseKey) {
    case 'business_model':
      return 'Every dollar of revenue depends on a defined, profitable revenue model. This step decides what the company actually sells and at what margin.';
    case 'pricing':
      return 'Pricing converts demand into cash. The right price points are the difference between margin-positive growth and burning capital.';
    case 'operations':
      return 'You cannot bill customers you cannot deliver. Operations is the unblocker between validated demand and first paid invoice.';
    case 'hiring':
      return 'Delivery capacity is the ceiling on revenue. The first critical hires raise that ceiling.';
    case 'sales':
      return `A repeatable sales motion is the fastest path to first revenue for a ${category} business — closing customers, not impressions.`;
    case 'customer_acquisition':
      return 'Predictable lead flow at a known CAC is what makes revenue compound month over month.';
    case 'listings':
      return 'For local/discovery-driven businesses, listings drive inbound revenue from day one.';
    case 'website':
      return 'Website is the conversion surface — but only after the offer and pricing are validated.';
    case 'brand':
      return 'Brand earns trust and lifts conversion — pays off after the offer already converts.';
    case 'social':
      return 'Social amplifies an offer that already sells. Without that, social spend is performative.';
    case 'scaling':
      return 'With positive unit economics, scaling automates bottlenecks and doubles the best channel.';
    case 'research':
    default:
      return 'Validates demand and confirms there is a real, paying customer for what we are building.';
  }
}

function unblockerForRec(rec: PhaseRecommendation | undefined, execution: ExecutionGraph): string {
  if (!rec) return 'No launch blocker for this step.';
  if (rec.blocksLaunch) {
    return `Until this is done, ${execution.objective} cannot launch or earn first revenue.`;
  }
  return 'Not a launch blocker — but the highest-ROI next move once launch path is secure.';
}

function roiNarrative(rec: PhaseRecommendation | undefined): string {
  if (!rec) return 'Continue planned execution.';
  if (rec.roi === 'high' && rec.revenueImpact === 'direct') {
    return 'High ROI, direct revenue impact — this is the most valuable thing the company can do this week.';
  }
  if (rec.roi === 'high' && rec.revenueImpact === 'enabling') {
    return 'High ROI, enabling — unlocks revenue that is currently blocked.';
  }
  if (rec.roi === 'medium') {
    return 'Medium ROI — important but not the single highest-leverage move. Sequence after revenue-critical steps.';
  }
  return 'Lower ROI right now — defer until revenue motion is proven.';
}

export function recommendationsFromCeo(
  recommendation: CeoRecommendation,
): NextStepOption[] {
  return recommendation.options;
}

export { phaseSequenceForCategory };