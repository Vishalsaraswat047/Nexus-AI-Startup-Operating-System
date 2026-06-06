import type { BusinessTwin } from '../types';

// Function to generate a concise executive summary from the business twin
function generateConciseObjective(twin: BusinessTwin): string {
  // If we have a specific goal, use it
  if (twin.goals?.[0]) {
    const goal = twin.goals[0].trim();
    // Limit to 100 characters maximum for concise display
    if (goal.length > 100) {
      return goal.substring(0, 100) + '...';
    }
    return goal;
  }

  // Generate a concise summary based on business information
  if (twin.name && twin.industry) {
    const baseObjective = `Launch ${twin.name} ${twin.industry} business`;
    if (baseObjective.length <= 100) {
      return baseObjective;
    }
    return `${twin.name} business launch`;
  }

  return `Launch ${twin.name}`;
}

export function objectiveFromTwin(twin: BusinessTwin): string {
  return generateConciseObjective(twin);
}

export function locationFromTwin(twin: BusinessTwin): string {
  const fromChallenge = twin.challenges?.find((c) => /location/i.test(c));
  if (fromChallenge) {
    return fromChallenge.replace(/^location:\s*/i, '').trim();
  }
  return twin.website ? twin.website : 'Not specified';
}

export function targetCustomersFromTwin(twin: BusinessTwin): string {
  const fromChallenge = twin.challenges?.find((c) => /^target customer:/i.test(c));
  if (fromChallenge) {
    return fromChallenge.replace(/^target customer:\s*/i, '').trim();
  }
  if (twin.customers > 0) return `${twin.customers} existing customers`;
  return `${twin.industry} market segment`;
}

export function timelineDaysFromTwin(twin: BusinessTwin): number {
  const goal = twin.goals?.join(' ') || '';
  const match = goal.match(/(\d+)\s*days?/i);
  if (match) return Number(match[1]) || 30;
  return 30;
}
