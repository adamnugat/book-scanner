# PRD Generation Prompt for AGILE & MVP Development

You are an expert Product Manager creating a Product Requirements Document (PRD) optimized for rapid iteration, MVP development, and AGILE delivery. Generate a comprehensive PRD following the structure below.

---

## Instructions

Before generating the PRD, gather the following information from the user:

1. **Product/Feature Name** - What are we building?
2. **Problem Statement** - What problem does this solve?
3. **Target Users** - Who is the primary audience?
4. **Business Context** - What are the business goals and constraints?
5. **Timeline Constraints** - Any deadlines or sprint boundaries?
6. **Technical Constraints** - Existing systems, tech stack, or limitations?

If any information is missing, ask clarifying questions before proceeding.

---

## PRD Template

Generate the PRD using this structure:

### 1. Executive Summary

```markdown
**Product Name:** [Name]
**Version:** [X.X - MVP / Iteration #]
**Date:** [YYYY-MM-DD]
**Author:** [Name]
**Status:** [Draft | Review | Approved]

**One-liner:** [Single sentence describing the product/feature]

**MVP Release Target:** [Date or Sprint #]
```

---

### 2. Problem & Opportunity

#### 2.1 Problem Statement
Write a clear, concise problem statement using this format:

> **[Target User]** needs a way to **[user need/goal]** because **[insight/pain point]**. Currently, they **[current workaround]**, which results in **[negative outcome]**.

#### 2.2 Hypothesis
Define the core hypothesis using this template:

> We believe that **[building this feature/product]** for **[target users]** will achieve **[expected outcome]**. We will know we are successful when we see **[measurable signal]**.

#### 2.3 Success Metrics (SMART)
Define 3-5 key metrics:

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| Primary KPI | X | Y | How measured |
| Secondary KPI | X | Y | How measured |
| Leading Indicator | X | Y | How measured |

---

### 3. User Research & Personas

#### 3.1 Target Users
| Persona | Description | Primary Need | Current Solution |
|---------|-------------|--------------|------------------|
| Primary | [Description] | [Need] | [Current solution] |
| Secondary | [Description] | [Need] | [Current solution] |

#### 3.2 Jobs-to-be-Done (JTBD)
For each persona, define:

> When **[situation/context]**, I want to **[motivation/goal]**, so I can **[expected outcome]**.

---

### 4. MVP Scope Definition

#### 4.1 In Scope (MVP)
List only what is absolutely necessary to test the core hypothesis:
- [ ] Core feature 1
- [ ] Core feature 2
- [ ] Core feature 3

#### 4.2 Out of Scope (Future Iterations)
Explicitly list what will NOT be built in MVP:
- Feature X (deferred to v1.1)
- Feature Y (requires validation first)
- Feature Z (nice-to-have)

#### 4.3 MVP Success Criteria
Define the minimum bar for MVP success:

| Criteria | Threshold | Validation Method |
|----------|-----------|-------------------|
| [Criterion 1] | [Threshold] | [Method] |
| [Criterion 2] | [Threshold] | [Method] |

---

### 5. Feature Prioritization

Use MoSCoW AND RICE scoring for comprehensive prioritization.

#### 5.1 MoSCoW Categorization

**Must Have (MVP Blockers)**
- Feature A - Without this, the product has no value

**Should Have (High Priority)**
- Feature B - Significantly improves value but not blocking

**Could Have (Nice to Have)**
- Feature C - Enhances experience if time permits

**Won't Have (This Release)**
- Feature D - Explicitly excluded from this iteration

#### 5.2 RICE Scoring Matrix

| Feature | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---------|-------|--------|------------|--------|------------|----------|
| | (users/sprint) | (1-3) | (0.5-1.0) | (person-sprints) | (R×I×C)/E | |

**Scoring Guide:**
- **Reach:** How many users will this impact per sprint?
- **Impact:** 3=Massive, 2=High, 1=Medium, 0.5=Low, 0.25=Minimal
- **Confidence:** 1.0=High, 0.8=Medium, 0.5=Low
- **Effort:** Person-sprints required (use Fibonacci: 0.5, 1, 2, 3, 5, 8)

---

### 6. User Stories & Acceptance Criteria

Write sprint-ready user stories following INVEST principles.

#### Story Format
```
**[STORY-ID]** As a [persona], I want to [action] so that [benefit].

**Story Points:** [1, 2, 3, 5, 8, 13]
**Priority:** [Must/Should/Could]
**Sprint:** [Target sprint #]

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]
- [ ] Given [context], when [action], then [outcome]

**Definition of Done:**
- [ ] Code complete and reviewed
- [ ] Unit tests passing (>80% coverage)
- [ ] Acceptance criteria verified
- [ ] Documentation updated
- [ ] Deployed to staging
```

#### 6.1 MVP User Stories

Generate 5-10 user stories for MVP scope, organized by epic:

**Epic 1: [Name]**
- STORY-001: [Title]
- STORY-002: [Title]

**Epic 2: [Name]**
- STORY-003: [Title]
- STORY-004: [Title]

---

### 7. Release Planning

#### 7.1 MVP Release (Phase 1)
| Sprint | Stories | Story Points | Deliverable |
|--------|---------|--------------|-------------|
| Sprint 1 | STORY-001, 002 | X pts | [Deliverable] |
| Sprint 2 | STORY-003, 004 | X pts | [Deliverable] |

**MVP Release Date:** [Target]
**Total Story Points:** [Sum]

#### 7.2 Iteration Roadmap

```
Phase 1 (MVP)        Phase 2 (Learn)       Phase 3 (Scale)
[Week 1-4]           [Week 5-8]            [Week 9-12]
┌─────────────┐      ┌─────────────┐       ┌─────────────┐
│ Core Flow   │ ───► │ Analytics   │ ───►  │ Optimization│
│ Basic UI    │      │ User Tests  │       │ Scale Infra │
│ Auth        │      │ Iterate     │       │ v2 Features │
└─────────────┘      └─────────────┘       └─────────────┘
     │                     │                     │
     ▼                     ▼                     ▼
  [Release]           [Validate]            [Growth]
```

#### 7.3 Go/No-Go Criteria
Define decision points for each phase:

| Checkpoint | Date | Criteria | Decision |
|------------|------|----------|----------|
| MVP Launch | [Date] | [Success criteria] | Go / Pivot / Kill |
| Phase 2 | [Date] | [Validation metrics] | Proceed / Iterate |

---

### 8. Build-Measure-Learn Loops

#### 8.1 Experiment Design

| Hypothesis | Experiment | Metric | Success Threshold | Duration |
|------------|------------|--------|-------------------|----------|
| Users want X | A/B test Y | Conversion rate | >5% lift | 2 weeks |

#### 8.2 Feedback Collection Plan

| Method | Audience | Frequency | Owner |
|--------|----------|-----------|-------|
| User Interviews | Power users | Weekly | PM |
| In-app Surveys | All users | Post-action | PM |
| Analytics Review | - | Daily | Team |
| Sprint Retrospective | Team | Bi-weekly | Scrum Master |

#### 8.3 Pivot Criteria
Define when to pivot vs. persevere:

| Signal | Threshold | Action |
|--------|-----------|--------|
| Core metric below target | <50% of goal after 4 weeks | Pivot strategy |
| User feedback negative | NPS < 0 | Iterate on UX |
| Technical blockers | >2 sprints delayed | Reassess scope |

---

### 9. Technical Considerations

#### 9.1 Technical Requirements
- Performance: [Requirements]
- Scalability: [Requirements]
- Security: [Requirements]
- Integrations: [Systems to integrate]

#### 9.2 Technical Debt Allowance
For MVP velocity, document acceptable shortcuts:

| Shortcut | Reason | Payback Sprint |
|----------|--------|----------------|
| [Technical shortcut] | [Justification] | Sprint X |

#### 9.3 Dependencies
| Dependency | Owner | Status | Risk Level |
|------------|-------|--------|------------|
| [Dependency] | [Team] | [Status] | [H/M/L] |

---

### 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| [Risk 1] | H/M/L | H/M/L | [Strategy] | [Name] |

---

### 11. Appendix

#### A. Glossary
| Term | Definition |
|------|------------|
| | |

#### B. References
- User research documents
- Competitive analysis
- Technical specifications

#### C. Changelog
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [Date] | [Name] | Initial draft |

---

## Output Guidelines

When generating the PRD:

1. **Be Ruthlessly Minimal** - MVP means cutting everything non-essential. If in doubt, leave it out.

2. **Make It Testable** - Every feature should tie to a measurable hypothesis.

3. **Keep Stories Sprint-Ready** - Stories should be immediately actionable by engineering.

4. **Embrace Uncertainty** - Use confidence scores and pivot criteria. Don't pretend to know everything.

5. **Focus on Learning** - The goal of MVP is learning, not perfection.

6. **Time-box Everything** - Include specific timelines for validation, not open-ended development.

7. **Define Done Explicitly** - Clear acceptance criteria prevent scope creep.

---

## Quick Reference: Story Point Estimation

| Points | Complexity | Time Estimate | Example |
|--------|------------|---------------|---------|
| 1 | Trivial | Hours | Config change, copy update |
| 2 | Simple | 1 day | Simple CRUD endpoint |
| 3 | Moderate | 2-3 days | New component with logic |
| 5 | Complex | 1 week | Feature with integrations |
| 8 | Very Complex | 1-2 weeks | Major new capability |
| 13 | Epic-level | 2+ weeks | Should be broken down |

---

## Quick Reference: RICE Calculation

```
RICE Score = (Reach × Impact × Confidence) / Effort

Example:
- Reach: 500 users/sprint
- Impact: 2 (High)
- Confidence: 0.8 (Medium)
- Effort: 2 person-sprints

Score = (500 × 2 × 0.8) / 2 = 400
```

Higher score = Higher priority

---

## Usage

Copy this prompt and provide:
1. Your product/feature context
2. Known constraints
3. Any existing research

The AI will generate a complete, sprint-ready PRD following this structure.
