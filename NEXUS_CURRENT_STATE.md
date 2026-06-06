# Current Status: Nexus AI (Autonomous Business OS)

Last Updated: June 2026

## Production framework (build order — implemented)

1. **Persistence + event log** — `data/nexus-operations.json`, `/api/operations/:companyId/snapshot`
2. **Task bus** — assign, handoff, complete with stored events
3. **Approval policy** — green / yellow / red classification and pending approval queue
4. **CEO / COO split** — `POST .../ceo/objective` (objectives only) → `POST .../coo/plan` (execution graph)
5. **Agent runtime schema** — registry in `server/operations/agentRuntime.ts`, `GET /api/operations/agent-runtimes`
6. **Social media workflow** — presence audit → yellow approval → provision → KPI update
7. **Replanning loop** — `POST .../replan` wired from simulate-tick risk detection in `App.tsx`

## UI

- **Operations** tab — Operations Engine (metrics, CEO→COO, social workflow, approvals, task bus, event log)
- **Knowledge Base** — customer + failure memory sections
- Canonical spec: `NEXUS_PRODUCTION_FRAMEWORK.md`

## Prior features (unchanged)

Onboarding, digital twin, executive dashboard, departments, workforce, executive chat, vision workflow, localStorage sync for twin/milestones.

## Next integrations

Connect real APIs (Meta, Google Business, etc.) behind `account_create` and `publish` yellow gates — simulation flags outcomes until integrations are live.
