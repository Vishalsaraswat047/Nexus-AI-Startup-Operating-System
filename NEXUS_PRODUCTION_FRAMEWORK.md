# Nexus AI — Production-Level Agent Operating Framework

Nexus AI is a **digital company**, not a collection of chat agents. Agents are evaluated by **outcomes** (tools, integrations, workflows, memory, approvals, execution), not responses.

## Execution-first rule

The user manages **objectives**, not agents. After essential onboarding questions, execution **starts automatically**:

CEO objective → COO execution graph → departments activate → agents run workflows → deliverables → dashboard updates from **calculated** task state (never AI-estimated progress).

When a phase completes, the **dynamic next-step engine** presents recommendations; the user chooses; execution continues.

## Build order (implementation sequence)

1. **Persistence + event log** — All tasks, approvals, agent actions, and KPIs stored server-side; dashboard reads derived metrics only.
2. **Task bus** — Assign, hand off, complete; every step is a stored, visible event.
3. **Approval policy** — Green / Yellow / Red classification gates tool and workflow execution.
4. **CEO / COO split** — CEO emits objectives + KPIs + departments + timeline only; COO owns projects, task graph, assignments.
5. **Agent runtime schema** — Role, Knowledge, Skills, Tools, Permissions, Approval Rules, Memory Access, Execution Engine, Communication, KPI Tracking.
6. **Vertical workflows** — First slice: Social Media presence (check → approve → act → memory → KPI).
7. **Replanning loop** — Risk → root cause → COO review → reassignment → timeline update → notify user.

## Command structure

```
User → CEO Agent → COO Agent → Department Managers → Worker Agents → Tools → Real World
```

CEO **never performs work** — only objectives, KPIs, strategic direction, department selection, priorities.

## Approval tiers

| Tier | Examples | Gate |
|------|----------|------|
| Green | Research, analysis, drafts, planning, monitoring | Automatic |
| Yellow | Publishing, email, account creation, listings, outreach | User approval |
| Red | Payments, ad spend, legal commitments, data deletion | Explicit approval |

## Memory types

Strategic, Operational, Customer, Business, Learning, Failure — every agent action writes memory; no reliance on chat history.

## Dashboard rule

Dashboard displays **database truth** only — metrics from agent activity, task completion, projects, integrations, and recorded KPIs. No hardcoded or fake percentages.
