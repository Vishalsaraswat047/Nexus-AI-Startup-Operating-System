export interface IndustryListItem {
  slug: string;
  displayName: string;
  icon: string;
  blurb: string;
  primaryAgents: string[];
  keyMetrics: string[];
  mode1StageCount: number;
  mode2StageCount: number;
  mode1StageNames: string[];
  mode2StageNames: string[];
  topLoopQuestions: string[];
}

export interface IndustryStage {
  id: string;
  name: string;
  description: string;
  agents: string[];
  deliverables: string[];
  approvalRequired?: boolean;
  ceoGate?: 'proceed' | 'pivot' | 'refine';
  taskTitles?: string[];
}

export interface IndustryDetail extends IndustryListItem {
  mode1: IndustryStage[];
  mode2: IndustryStage[];
  continuousLoopQuestions: string[];
}

const base = '/api/industries';

export async function fetchIndustriesApi(): Promise<IndustryListItem[]> {
  const res = await fetch(`${base}/`);
  if (!res.ok) throw new Error('Failed to load industries');
  const data = await res.json();
  return data.industries as IndustryListItem[];
}

export async function fetchIndustryApi(slug: string): Promise<IndustryDetail | null> {
  const res = await fetch(`${base}/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load industry');
  const data = await res.json();
  return data.industry as IndustryDetail;
}

export async function matchIndustryApi(query: string): Promise<IndustryListItem | null> {
  const res = await fetch(`${base}/match?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data.match as IndustryListItem | null) ?? null;
}

export const CATEGORY_TO_INDUSTRY_HINTS: Record<string, string[]> = {
  Hospitality: [
    'hotel',
    'restaurant',
    'cloud_kitchen',
    'hotel_chain',
    'gym',
    'salon',
    'beauty',
    'dental',
    'wedding',
    'event_mgmt',
    'travel',
  ],
  Healthcare: ['clinic', 'hospital', 'pharmacy', 'dental', 'beauty', 'medical_equipment'],
  Education: ['coaching', 'school', 'edtech', 'coaching_alias'],
  SaaS: ['saas', 'ai_startup', 'ai_product', 'edtech', 'saas_co'],
  'E-commerce': ['d2c', 'ecommerce', 'jewellery', 'supermarket', 'wholesale', 'cloud_kitchen'],
  'Physical Product': [
    'clothing',
    'furniture',
    'electronics',
    'jewellery',
    'agriculture',
    'dairy',
    'poultry',
    'fish',
    'organic_food',
    'food_processing',
  ],
  'Service Business': [
    'car_wash',
    'salon',
    'beauty',
    'interior',
    'architecture',
    'real_estate_agent',
    'law',
    'ca',
    'banker_liaison',
    'cleaning',
    'security_guard',
  ],
  Agency: [
    'marketing_agency',
    'software_agency',
    'ai_automation_agency',
    'dm_freelancer',
    'it_managed_services',
  ],
  Other: ['franchise'],
};

export function industriesForCategory(
  category: string,
  industries: IndustryListItem[],
): IndustryListItem[] {
  const hints = CATEGORY_TO_INDUSTRY_HINTS[category] ?? [];
  if (hints.length === 0) {
    return industries;
  }
  const hintSet = new Set(hints);
  const matched = industries.filter((i) => hintSet.has(i.slug));
  if (matched.length === 0) return industries;
  return matched;
}
