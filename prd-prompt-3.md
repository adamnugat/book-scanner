# PRD Generation Prompt

You are a Senior Product Manager with deep technical expertise. Your task is to create a comprehensive Product Requirements Document (PRD) that serves as the single source of truth for both business stakeholders and engineering teams.

## Instructions

Generate a complete PRD for the product/feature described below. The document must be actionable, measurable, and technically grounded. Avoid vague language—every requirement should be testable or verifiable.

---

## Product/Feature Description

**[Describe the product, feature, or initiative here]**

---

## PRD Template

Structure your PRD using the following sections:

### 1. Executive Summary

- **Product Name**: 
- **Document Version**: 
- **Last Updated**: 
- **Author(s)**: 
- **Status**: Draft | In Review | Approved
- **Target Release**: 

Provide a 2-3 paragraph overview that answers:
- What problem does this solve?
- Who benefits and how?
- What is the expected business impact?

### 2. Problem Statement

#### 2.1 Current State
Describe the existing situation, pain points, and inefficiencies.

#### 2.2 User Pain Points
List specific, validated pain points with supporting data where available.

#### 2.3 Business Impact
Quantify the cost of the current problem (revenue loss, operational cost, customer churn, etc.).

### 3. Goals & Success Metrics

#### 3.1 Business Objectives
| Objective | Target Metric | Baseline | Target | Timeline |
|-----------|---------------|----------|--------|----------|
| Example: Reduce churn | Monthly churn rate | 5% | 3% | Q2 2025 |

#### 3.2 User Objectives
What should users be able to accomplish that they cannot today?

#### 3.3 Key Performance Indicators (KPIs)
Define 3-5 measurable KPIs with:
- Metric definition
- Measurement method
- Success threshold
- Monitoring frequency

### 4. User & Stakeholder Analysis

#### 4.1 Target Users
| User Persona | Description | Primary Goals | Technical Proficiency |
|--------------|-------------|---------------|----------------------|
| | | | |

#### 4.2 User Journey Map
Describe the end-to-end flow for the primary use case.

#### 4.3 Stakeholders
| Stakeholder | Role | Interest | Influence |
|-------------|------|----------|-----------|
| | | | |

### 5. Functional Requirements

#### 5.1 Core Features
For each feature, specify:

**Feature [F-001]: [Feature Name]**
- **Description**: What it does
- **User Story**: As a [user], I want to [action] so that [benefit]
- **Acceptance Criteria**:
  - [ ] Criterion 1 (testable)
  - [ ] Criterion 2 (testable)
- **Priority**: P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)
- **Dependencies**: List dependent features or systems
- **Technical Notes**: Implementation guidance or constraints

#### 5.2 Feature Prioritization Matrix
| Feature ID | Feature | Impact | Effort | Priority | Release Phase |
|------------|---------|--------|--------|----------|---------------|
| | | H/M/L | H/M/L | P0-P3 | MVP/V1.1/V2 |

### 6. Non-Functional Requirements

#### 6.1 Performance Requirements
| Requirement | Metric | Target | Measurement Method |
|-------------|--------|--------|-------------------|
| Response time | P95 latency | < 200ms | APM monitoring |
| Throughput | Requests/sec | 1000 RPS | Load testing |
| Availability | Uptime | 99.9% | Monitoring |

#### 6.2 Scalability Requirements
- **Current load**: Expected initial usage
- **Growth projection**: 6-month and 12-month forecasts
- **Scaling triggers**: When to scale (thresholds)
- **Scaling strategy**: Horizontal, vertical, or hybrid

#### 6.3 Security Requirements
| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Authentication | Method (OAuth2, JWT, etc.) | Security audit |
| Authorization | RBAC/ABAC model | Penetration testing |
| Data encryption | At rest and in transit | Compliance check |
| Audit logging | What events to log | Log review |

**Compliance Requirements**: List applicable standards (SOC2, GDPR, HIPAA, PCI-DSS, etc.)

#### 6.4 Reliability Requirements
- **Recovery Time Objective (RTO)**: 
- **Recovery Point Objective (RPO)**: 
- **Backup strategy**: 
- **Disaster recovery plan**: 

#### 6.5 Accessibility Requirements
- WCAG compliance level (A, AA, AAA)
- Supported assistive technologies
- Testing approach

### 7. Technical Architecture

#### 7.1 System Context Diagram
Describe or illustrate how this system fits within the broader ecosystem.

#### 7.2 High-Level Architecture
- **Frontend**: Technologies, frameworks, hosting
- **Backend**: Services, runtime, hosting
- **Database**: Type, hosting, backup strategy
- **Infrastructure**: Cloud provider, regions, CDN

#### 7.3 Data Architecture
- **Data model**: Key entities and relationships
- **Data flow**: How data moves through the system
- **Data retention**: Policies and compliance considerations
- **Data migration**: If applicable, migration strategy

#### 7.4 Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | | |
| Backend | | |
| Database | | |
| Cache | | |
| Queue | | |
| Search | | |

### 8. API & Integration Requirements

#### 8.1 Internal APIs
| API Endpoint | Method | Purpose | Auth | Rate Limit |
|--------------|--------|---------|------|------------|
| | | | | |

#### 8.2 External Integrations
| System | Integration Type | Data Exchanged | Frequency | Owner |
|--------|------------------|----------------|-----------|-------|
| | API/Webhook/Batch | | | |

#### 8.3 API Contract Requirements
- Versioning strategy
- Deprecation policy
- Documentation requirements (OpenAPI/Swagger)
- Breaking change policy

### 9. Technical Constraints & Dependencies

#### 9.1 Technical Constraints
| Constraint | Description | Impact | Mitigation |
|------------|-------------|--------|------------|
| Legacy system | Must integrate with X | Limited by X's API | Adapter pattern |
| Technology | Must use company-approved stack | | |
| Timeline | Hard deadline of X | Reduced scope | Phased delivery |

#### 9.2 Dependencies
| Dependency | Type | Owner | Status | Risk Level |
|------------|------|-------|--------|------------|
| | Internal/External | | Confirmed/Pending | H/M/L |

#### 9.3 Assumptions
List assumptions that, if invalid, would significantly impact the project.

### 10. Technical Debt & Maintainability

#### 10.1 Known Technical Debt
| Debt Item | Description | Impact | Remediation Plan |
|-----------|-------------|--------|------------------|
| | | | |

#### 10.2 Code Quality Standards
- Testing requirements (unit, integration, e2e coverage targets)
- Code review process
- Documentation requirements
- Linting and formatting standards

#### 10.3 Maintainability Considerations
- Logging and observability requirements
- Monitoring and alerting strategy
- Runbook requirements
- On-call considerations

### 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation Strategy | Owner |
|------|-------------|--------|---------------------|-------|
| | H/M/L | H/M/L | | |

### 12. Release Strategy

#### 12.1 Phased Rollout Plan
| Phase | Scope | Audience | Success Criteria | Rollback Trigger |
|-------|-------|----------|------------------|------------------|
| Alpha | | Internal team | | |
| Beta | | Limited users | | |
| GA | | All users | | |

#### 12.2 Feature Flags
List features that should be behind feature flags and their criteria for full enablement.

#### 12.3 Rollback Plan
Define rollback procedures and decision criteria.

### 13. Timeline & Milestones

| Milestone | Description | Target Date | Dependencies |
|-----------|-------------|-------------|--------------|
| Design complete | | | |
| Development complete | | | |
| QA complete | | | |
| Release | | | |

### 14. Out of Scope

Explicitly list what is NOT included in this PRD to prevent scope creep.

| Item | Reason | Future Consideration |
|------|--------|---------------------|
| | | Yes/No |

### 15. Open Questions

| # | Question | Owner | Due Date | Resolution |
|---|----------|-------|----------|------------|
| 1 | | | | |

### 16. Appendix

#### 16.1 Glossary
Define technical and business terms used in this document.

#### 16.2 References
- Related PRDs
- Technical specifications
- Research documents
- Competitor analysis

#### 16.3 Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| | | | |

---

## Output Guidelines

When generating the PRD:

1. **Be Specific**: Replace all placeholders with concrete details. Avoid words like "fast," "secure," or "scalable" without quantifiable targets.

2. **Be Testable**: Every requirement should have clear acceptance criteria that can be verified.

3. **Be Realistic**: Consider technical constraints, team capacity, and organizational context.

4. **Bridge Perspectives**: Write for both business stakeholders (focus on outcomes) and engineers (focus on implementation details).

5. **Prioritize Ruthlessly**: Not everything is P0. Use the prioritization matrix honestly.

6. **Acknowledge Unknowns**: Use the Open Questions section for unresolved items rather than making assumptions.

7. **Consider the Full Lifecycle**: Address not just building the feature, but operating, maintaining, and eventually deprecating it.

8. **Version Control**: This is a living document. Track changes and maintain version history.
