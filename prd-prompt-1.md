# User-Centric PRD Generation Prompt

You are a Product Manager creating a Product Requirements Document (PRD) with a strong focus on user-centric design. Follow this structured approach to develop requirements that are grounded in real user needs, behaviors, and desired outcomes.

---

## Instructions

Work through each section sequentially. For each section, I will provide context about my product, and you will help me develop detailed, actionable content. Ask clarifying questions when needed before proceeding.

---

## Section 1: Product Context

Before diving into user research, establish the foundation:

**Answer these questions:**
1. What is the product or feature you're building?
2. What problem space does it address?
3. What is the current state (new product, enhancement, pivot)?
4. What are the business objectives driving this initiative?
5. What constraints exist (timeline, budget, technical, regulatory)?

---

## Section 2: User Personas & Segmentation

### 2.1 Identify User Segments

Define distinct user groups based on:
- **Demographics**: Age, location, profession, income level
- **Behavioral patterns**: Usage frequency, feature preferences, platform choices
- **Psychographics**: Values, motivations, attitudes toward technology
- **Context of use**: When, where, and how they interact with similar products

### 2.2 Create Detailed Personas

For each primary persona, develop:

```
PERSONA TEMPLATE
================
Name: [Representative name]
Role/Title: [Their professional or life role]
Photo placeholder: [Description for visualization]

DEMOGRAPHICS
- Age range:
- Location:
- Occupation:
- Tech proficiency: [Novice / Intermediate / Advanced]

BEHAVIORAL PROFILE
- Goals when using this type of product:
- Frequency of need:
- Current solutions they use:
- Devices/platforms preferred:

PSYCHOGRAPHIC PROFILE
- Core motivations:
- Frustrations with current solutions:
- Values that influence decisions:
- Risk tolerance: [Risk-averse / Moderate / Risk-tolerant]

KEY QUOTE
"[A representative statement that captures their mindset]"

SCENARIO
[A brief narrative of a typical day/situation where they would need this product]
```

### 2.3 Persona Prioritization Matrix

| Persona | Market Size | Revenue Potential | Strategic Fit | Accessibility | Priority Score |
|---------|-------------|-------------------|---------------|---------------|----------------|
| | High/Med/Low | High/Med/Low | High/Med/Low | High/Med/Low | |

**Primary persona**: The user we design for first
**Secondary personas**: Users we accommodate but don't optimize for
**Excluded personas**: Users explicitly not in scope (and why)

---

## Section 3: Jobs-to-be-Done (JTBD) Framework

### 3.1 Core Job Statement

Structure: **"When [situation], I want to [motivation], so I can [expected outcome]."**

Identify jobs at three levels:

**Functional Jobs** (practical tasks)
- What is the user literally trying to accomplish?
- What are the steps in their current process?

**Emotional Jobs** (how they want to feel)
- How do they want to feel during the experience?
- How do they want to feel after completing the job?

**Social Jobs** (how they want to be perceived)
- How do they want others to see them?
- What status or identity does completing this job support?

### 3.2 Job Map

Break down the main job into stages:

| Stage | User Action | Current Pain Points | Desired Outcome |
|-------|-------------|---------------------|-----------------|
| 1. Define | What triggers the need? | | |
| 2. Locate | How do they find solutions? | | |
| 3. Prepare | What setup is required? | | |
| 4. Confirm | How do they validate readiness? | | |
| 5. Execute | What is the core action? | | |
| 6. Monitor | How do they track progress? | | |
| 7. Modify | What adjustments are needed? | | |
| 8. Conclude | How do they finish? | | |

### 3.3 Outcome Statements

For each job, define measurable outcomes:

**Structure**: **[Direction of improvement] + [unit of measure] + [object of control] + [context]**

Examples:
- "Minimize the time it takes to complete checkout when purchasing multiple items"
- "Reduce the likelihood of errors when entering payment information"
- "Increase confidence that the order was successfully placed"

---

## Section 4: User Stories & Acceptance Criteria

### 4.1 Epic Definition

**Epic**: [High-level capability]
**Value statement**: As a [persona], I need [capability] so that [business/user value].

### 4.2 User Story Format

```
USER STORY
==========
ID: [EPIC-XXX]
Title: [Concise description]

As a [specific persona],
I want to [specific action],
So that [measurable benefit].

ACCEPTANCE CRITERIA (Given-When-Then)
-------------------------------------
Scenario 1: [Happy path]
  Given [precondition]
  When [action]
  Then [expected result]
  And [additional expectation]

Scenario 2: [Edge case]
  Given [precondition]
  When [action]
  Then [expected result]

Scenario 3: [Error handling]
  Given [precondition]
  When [action]
  Then [error handling behavior]

NON-FUNCTIONAL REQUIREMENTS
---------------------------
- Performance: [specific metric]
- Accessibility: [WCAG level, specific needs]
- Security: [relevant requirements]
- Compatibility: [devices, browsers, etc.]

DEFINITION OF DONE
------------------
□ All acceptance criteria pass
□ Unit tests written and passing
□ Accessibility audit complete
□ Documentation updated
□ Stakeholder review complete
```

### 4.3 Story Prioritization

Use the RICE framework for each story:
- **Reach**: How many users will this impact per quarter?
- **Impact**: How much will this improve the outcome? (3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal)
- **Confidence**: How certain are we about estimates? (100%/80%/50%)
- **Effort**: Person-weeks required

**RICE Score** = (Reach × Impact × Confidence) / Effort

---

## Section 5: User Journey Mapping

### 5.1 Journey Map Template

For each primary persona and key scenario:

```
JOURNEY MAP: [Persona Name] - [Scenario Name]
=============================================

STAGES
------
[Stage 1] → [Stage 2] → [Stage 3] → [Stage 4] → [Stage 5]

For each stage, document:

┌─────────────────────────────────────────────────────────────┐
│ STAGE: [Name]                                               │
├─────────────────────────────────────────────────────────────┤
│ User Goal: What are they trying to achieve?                 │
│                                                             │
│ Actions: What do they do?                                   │
│ • [Action 1]                                                │
│ • [Action 2]                                                │
│                                                             │
│ Touchpoints: Where does interaction occur?                  │
│ • [Channel/interface]                                       │
│                                                             │
│ Thoughts: What are they thinking?                           │
│ "[Internal monologue]"                                      │
│                                                             │
│ Emotions: How do they feel?                                 │
│ 😫 ──────●────────────────────── 😊                         │
│ [Frustrated]              [Satisfied]                       │
│                                                             │
│ Pain Points:                                                │
│ • [Specific frustration]                                    │
│                                                             │
│ Opportunities:                                              │
│ • [How we can improve this stage]                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Moments of Truth

Identify critical moments that disproportionately impact user perception:

| Moment | Stage | Why It Matters | Current Experience | Target Experience |
|--------|-------|----------------|-------------------|-------------------|
| | | | | |

### 5.3 Cross-Channel Consistency

Document how the experience should feel across touchpoints:

| Attribute | Mobile | Desktop | Email | Support |
|-----------|--------|---------|-------|---------|
| Tone | | | | |
| Response time | | | | |
| Capabilities | | | | |
| Handoff points | | | | |

---

## Section 6: Pain Points & Gains Analysis

### 6.1 Pain Point Classification

**Severity Scale:**
- 🔴 **Blocker**: Prevents task completion entirely
- 🟠 **Major**: Significantly degrades experience, workarounds exist
- 🟡 **Minor**: Causes friction but doesn't prevent success
- ⚪ **Cosmetic**: Preference-based, low impact

**Pain Point Documentation:**

| ID | Pain Point | Persona | Severity | Frequency | Current Workaround | Evidence Source |
|----|------------|---------|----------|-----------|-------------------|-----------------|
| | | | 🔴🟠🟡⚪ | Daily/Weekly/Monthly | | Interview/Survey/Analytics |

### 6.2 Root Cause Analysis

For each major pain point, apply the "5 Whys":

```
PAIN POINT: [Description]

Why 1: [First-level cause]
Why 2: [Deeper cause]
Why 3: [Even deeper]
Why 4: [Structural cause]
Why 5: [Root cause]

ROOT CAUSE: [Fundamental issue to address]
```

### 6.3 Gains Analysis

**Gain Types:**
- **Required gains**: Minimum expectations; solution won't work without these
- **Expected gains**: Standard expectations based on competing solutions
- **Desired gains**: Beyond expectations; would delight users
- **Unexpected gains**: Beyond imagination; create wow moments

| Gain | Type | Persona | How We Deliver | Success Metric |
|------|------|---------|----------------|----------------|
| | Required/Expected/Desired/Unexpected | | | |

### 6.4 Value Proposition Canvas Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER PROFILE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   JOBS                    PAINS                   GAINS             │
│   • [Job 1]               • [Pain 1]              • [Gain 1]        │
│   • [Job 2]               • [Pain 2]              • [Gain 2]        │
│   • [Job 3]               • [Pain 3]              • [Gain 3]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 ↕ FIT
┌─────────────────────────────────────────────────────────────────────┐
│                         VALUE PROPOSITION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   PRODUCTS/SERVICES       PAIN RELIEVERS          GAIN CREATORS     │
│   • [Feature 1]           • [Relief 1]            • [Creator 1]     │
│   • [Feature 2]           • [Relief 2]            • [Creator 2]     │
│   • [Feature 3]           • [Relief 3]            • [Creator 3]     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section 7: Empathy-Driven Requirements

### 7.1 Empathy Mapping

For each persona:

```
                        THINK & FEEL
            ┌─────────────────────────────────┐
            │ What really matters to them?    │
            │ Major preoccupations?           │
            │ Worries and aspirations?        │
            └─────────────────────────────────┘
                           │
     HEAR                  │                    SEE
┌──────────────┐           │           ┌──────────────┐
│ What friends │           │           │ What is      │
│ say?         │◄──────────┼──────────►│ their        │
│ What boss    │           │           │ environment? │
│ says?        │           │           │ What do they │
│ What         │           │           │ see others   │
│ influences   │           │           │ doing?       │
│ them?        │           │           │              │
└──────────────┘           │           └──────────────┘
                           │
            ┌─────────────────────────────────┐
            │ SAY & DO                        │
            │ Attitude in public?             │
            │ Behavior toward others?         │
            │ Contradictions?                 │
            └─────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
     ┌──────▼──────┐              ┌───────▼──────┐
     │    PAINS    │              │    GAINS     │
     │ Fears?      │              │ Wants/needs? │
     │ Frustrations│              │ Success      │
     │ Obstacles?  │              │ measures?    │
     └─────────────┘              └──────────────┘
```

### 7.2 Accessibility & Inclusion Requirements

| Consideration | User Need | Requirement | Acceptance Criteria |
|---------------|-----------|-------------|---------------------|
| Visual | Screen reader users | All images have alt text | WCAG 2.1 AA compliance |
| Motor | Limited dexterity | Keyboard navigation | All functions accessible via keyboard |
| Cognitive | Processing differences | Clear language | Reading level ≤ 8th grade |
| Situational | Bright sunlight | High contrast mode | 4.5:1 contrast ratio minimum |
| Temporary | One-handed use | Thumb-reachable controls | Primary actions in bottom 50% |

### 7.3 Emotional Design Requirements

For each key interaction, define the target emotional response:

| Interaction | Current Emotion | Target Emotion | Design Lever |
|-------------|-----------------|----------------|--------------|
| First launch | Uncertain | Confident | Onboarding guidance |
| Error state | Frustrated | Supported | Helpful error messages |
| Task completion | Relief | Accomplished | Celebration micro-interactions |
| Waiting | Impatient | Informed | Progress indicators |

### 7.4 Trust & Safety Requirements

| Trust Factor | User Concern | Requirement | Evidence/Proof |
|--------------|--------------|-------------|----------------|
| Data privacy | "What do you do with my data?" | | |
| Security | "Is my information safe?" | | |
| Reliability | "Will this work when I need it?" | | |
| Transparency | "Are there hidden costs?" | | |
| Control | "Can I undo or change things?" | | |

---

## Section 8: Requirements Synthesis

### 8.1 Requirements Traceability Matrix

| Req ID | Requirement | Source Persona | JTBD | Pain Point | User Story | Priority |
|--------|-------------|----------------|------|------------|------------|----------|
| | | | | | | P0/P1/P2/P3 |

### 8.2 Success Metrics & KPIs

**User-Centric Metrics:**

| Metric Category | Metric | Current Baseline | Target | Measurement Method |
|-----------------|--------|------------------|--------|-------------------|
| **Adoption** | | | | |
| Activation rate | % completing key action | | | |
| Time to value | Minutes to first success | | | |
| **Engagement** | | | | |
| Task completion rate | % completing core job | | | |
| Error rate | Errors per session | | | |
| **Satisfaction** | | | | |
| NPS | Net Promoter Score | | | |
| CSAT | Customer Satisfaction | | | |
| CES | Customer Effort Score | | | |
| **Retention** | | | | |
| Return rate | % returning within 7 days | | | |
| Churn indicators | | | | |

### 8.3 Release Criteria

**MVP Definition:**
- [ ] All P0 user stories complete with acceptance criteria met
- [ ] Primary persona can complete core job end-to-end
- [ ] No blocker-level pain points remain
- [ ] Accessibility baseline achieved (WCAG 2.1 AA)
- [ ] Core success metrics instrumented

**Definition of Success:**
- [ ] [Quantitative goal 1]
- [ ] [Quantitative goal 2]
- [ ] [Qualitative goal 1]

---

## Section 9: Validation Plan

### 9.1 Research Methods by Phase

| Phase | Method | Participants | Questions to Answer |
|-------|--------|--------------|---------------------|
| Discovery | User interviews | 8-12 from each persona | Validate personas, jobs, pains |
| Definition | Concept testing | 5-8 per concept | Which solution resonates? |
| Design | Usability testing | 5 per round | Can users complete jobs? |
| Development | Beta testing | 50-100 users | Real-world viability? |
| Launch | A/B testing | Statistical sample | Which variant performs better? |

### 9.2 Assumption Testing

| Assumption | Risk if Wrong | Test Method | Success Criteria | Status |
|------------|---------------|-------------|------------------|--------|
| | High/Med/Low | | | Untested/Validated/Invalidated |

---

## Section 10: PRD Output Checklist

Before finalizing, verify your PRD includes:

**User Understanding**
- [ ] 2-4 detailed personas with prioritization
- [ ] Jobs-to-be-done with outcome statements
- [ ] User journey maps for primary scenarios
- [ ] Pain points documented with severity and evidence
- [ ] Gains categorized by type

**Requirements Quality**
- [ ] User stories follow consistent format
- [ ] Acceptance criteria are testable
- [ ] Non-functional requirements specified
- [ ] Requirements traced to user needs
- [ ] Prioritization framework applied

**Empathy & Inclusion**
- [ ] Accessibility requirements defined
- [ ] Emotional design considerations documented
- [ ] Trust and safety addressed
- [ ] Edge cases and error states covered

**Measurement**
- [ ] Success metrics defined with baselines and targets
- [ ] Validation plan in place
- [ ] Assumptions documented for testing

---

## How to Use This Prompt

1. **Start a new conversation** with an AI assistant or use this as a working document
2. **Work through each section** sequentially, providing your product context
3. **Answer the guiding questions** and fill in the templates
4. **Iterate** — return to earlier sections as you learn more
5. **Validate** with real users before finalizing

The goal is not perfection but clarity. A well-structured PRD built on user empathy will guide better decisions throughout product development.
