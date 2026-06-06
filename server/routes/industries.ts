import { Router } from 'express';
import {
  ALL_INDUSTRY_OS,
  getIndustryOS,
  matchIndustryOS,
  type IndustryOS,
} from '../operations/industryWorkflows';

const router = Router();

interface IndustryListItem {
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

interface IndustryDetail extends IndustryListItem {
  mode1: IndustryOS['mode1'];
  mode2: IndustryOS['mode2'];
  continuousLoopQuestions: string[];
}

function toListItem(os: IndustryOS): IndustryListItem {
  return {
    slug: os.slug,
    displayName: os.displayName,
    icon: os.icon,
    blurb: os.blurb,
    primaryAgents: os.primaryAgents,
    keyMetrics: os.keyMetrics,
    mode1StageCount: os.mode1.length,
    mode2StageCount: os.mode2.length,
    mode1StageNames: os.mode1.map((s) => s.name),
    mode2StageNames: os.mode2.map((s) => s.name),
    topLoopQuestions: os.continuousLoopQuestions.slice(0, 3),
  };
}

router.get('/', (_req, res) => {
  const list: IndustryListItem[] = ALL_INDUSTRY_OS.map(toListItem);
  res.json({ industries: list, total: list.length });
});

router.get('/match', (req, res) => {
  const input = String(req.query.q ?? '').trim();
  if (!input) {
    return res.json({ match: null });
  }
  const matched = matchIndustryOS(input);
  if (!matched) {
    return res.json({ match: null });
  }
  res.json({ match: toListItem(matched) });
});

router.get('/:slug', (req, res) => {
  const os = getIndustryOS(req.params.slug);
  if (!os) {
    return res.status(404).json({ error: 'Industry not found', slug: req.params.slug });
  }
  const detail: IndustryDetail = { ...toListItem(os), mode1: os.mode1, mode2: os.mode2, continuousLoopQuestions: os.continuousLoopQuestions };
  res.json({ industry: detail });
});

export default router;
