# Partner API v2 migration planning — August 22, 2026

**Duration:** 60 minutes  
**Facilitator:** Maya Chen, Product Manager  
**Initiative:** Partner API v2 Migration  
**Purpose:** Sequence the migration for strategic partners while protecting platform reliability and Support capacity.

## Attendees

- Maya Chen — Product Manager
- Rafael Gomez — API Engineering Lead
- Priya Nair — Developer Infrastructure
- Nadia Okafor — Security Lead
- Marcus Webb — SRE and Infrastructure
- Elena Ruiz — Partner Success
- Theo Grant — Support Operations

## Transcript

### 00:00 — Desired outcome

**Maya:** We have six weeks to migrate three strategic partners from API v1 to v2. Today we need a sequence, a rollback plan, and an agreement on what must be true before the first partner moves. Reliability is the priority; migration volume is second.

**Rafael:** The v2 contract is stable for reads. Two write endpoints still return a different validation error shape than the documentation. That is fixable, but partners may build against the wrong response if we publish now.

**Elena:** Northstar wants a sandbox by August 29. Ledgerly wants production migration on September 5, but only if they get a named escalation contact. Acme is least prepared and should not be first.

### 00:08 — Sequencing options

**Maya:** Proposal: Northstar first in sandbox, Ledgerly second in a limited production canary, Acme last after we learn from both. Any objection?

**Theo:** Support has capacity for one partner migration at a time. The portfolio review also shows Enterprise SSO onboarding in the same week. If API migration and SSO escalate together, the same Support rotation will be overloaded.

**Marcus:** From an SRE perspective, a one-partner canary with a 5% request cap is safe. We need dashboards for error rate, latency, and v1 fallback traffic before enabling it.

**Maya:** We will not commit to three simultaneous migrations. The success metric is safe migration, not calendar compression.

### 00:16 — Security requirements

**Nadia:** V2 changes the scope of OAuth tokens. Before production, Security needs a token-audience review, confirmation that v1 and v2 scopes cannot be mixed accidentally, and evidence that deprecated endpoints are still monitored.

**Rafael:** The scope names are documented, but the gateway currently accepts a v1 scope on one v2 route and rejects it only downstream. That is a correctness and audit issue.

**Priya:** I can add gateway validation and a contract test for route/scope compatibility by August 27. I need Nadia’s test cases by tomorrow.

**Nadia:** I will provide them by August 23. Production approval will wait for the test results.

### 00:24 — Rollback and infrastructure

**Marcus:** Rollback must be configuration-driven. We should be able to route a partner back to v1 without redeploying. The v2 canary should have an automatic rollback if 5xx errors exceed 1% for five minutes or p95 latency increases by more than 20%.

**Rafael:** The gateway supports partner-level routing, but the automatic rollback signal is not wired to it.

**Marcus:** I will wire the signal and exercise rollback in staging by August 30. We also need a runbook with the exact command and approver.

**Maya:** The runbook approver is me for the pilot, with Marcus as the incident operator. No migration proceeds without a tested rollback.

### 00:32 — Partner readiness

**Elena:** Northstar has completed the v2 sandbox checklist. Ledgerly has two unanswered questions about pagination and idempotency. Acme has not assigned an engineering contact.

**Maya:** Then Acme is not in the first wave. Elena, please get a named technical contact by September 2 or move Acme to the next cohort.

**Elena:** Agreed. I will also schedule a Northstar sandbox review on August 29 and a Ledgerly contract review on September 1.

### 00:39 — Documentation and support

**Rafael:** The migration guide needs examples for the two new error shapes and a v1-to-v2 endpoint map. I can publish a draft on August 28.

**Theo:** Support needs that draft before partner calls. I will create a migration escalation queue and a one-page triage guide by September 1, but I cannot guarantee same-day response if SSO and API migration peak together.

**Maya:** We will state a next-business-day response for standard migration questions and immediate escalation for production errors. That is a temporary migration policy.

### 00:46 — Decision review

**Maya:** Let us lock the plan: Northstar sandbox August 29; Ledgerly contract review September 1 and a 5% production canary after Security and SRE approval; Acme deferred until it has a technical contact. V1 remains available as rollback during the pilot.

**Nadia:** Add that token scope validation is a hard gate, not a follow-up.

**Marcus:** Add the automated rollback thresholds to the go/no-go checklist.

**Rafael:** Add documentation sign-off before Ledgerly receives production credentials.

### 00:53 — Metrics and risks

**Maya:** We will track migration completion, v2 5xx rate, p95 latency, fallback traffic, support tickets, and partner-reported defects. A successful pilot is one partner migrated without a Sev-1 or Sev-2 incident and with rollback proven.

**Theo:** The cross-initiative Support capacity conflict is still a risk. We should review the SSO and API calendars together on August 26.

**Maya:** I will add that dependency to the portfolio review and resolve sequencing before the first partner call.

### 00:57 — Close

**Maya:** Final decisions: migrate one partner at a time; Northstar first in sandbox; Ledgerly next behind a 5% canary; Acme deferred; v1 remains the tested rollback path. Security scope validation, SRE rollback, documentation, and Support readiness are gates. Owners will update the shared checklist by end of day August 23.

## Explicit outcomes

- **Decisions:** One partner at a time; Northstar first; Ledgerly second behind a 5% canary; Acme deferred; v1 remains rollback.
- **Commitments:** Engineering, Developer Infrastructure, Security, SRE, Partner Success, and Support commitments have explicit owners and dates.
- **Risks:** Shared Support capacity, scope mixing between v1/v2, untested rollback automation, and partner readiness gaps.
- **Open questions:** Whether Ledgerly can resolve pagination/idempotency questions by September 1; whether Support capacity requires moving the first production canary.
