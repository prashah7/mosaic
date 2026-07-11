# Enterprise SSO GA readiness review — August 20, 2026

**Duration:** 60 minutes  
**Facilitator:** Maya Chen, Product Manager  
**Initiative:** Enterprise SSO GA  
**Purpose:** Decide whether the SAML setup experience is ready for the next design-partner onboarding wave and close the remaining Security, Infrastructure, and Support gaps.

## Attendees

- Maya Chen — Product Manager
- Priya Nair — Engineering Lead
- Devon Brooks — Identity Platform Engineer
- Nadia Okafor — Security Lead
- Marcus Webb — Infrastructure Lead
- Elena Ruiz — Customer Success
- Theo Grant — Support Operations

## Transcript

### 00:00 — Opening and goal

**Maya:** Thanks, everyone. We have one hour. The decision we need is whether we can onboard the next three design partners on August 31, and if not, what exact gate is still open. Our success criteria remain ten partners by September 30, at least 95% authentication success, and no disruption to password login. I want a clear owner and date for every remaining blocker.

**Priya:** Engineering has the SAML configuration UI in staging. The happy path works, but we still have two confusing certificate-validation errors that send admins to Support without enough detail.

### 00:08 — Product and customer context

**Elena:** Acme and Bluebird both want to start next week. Acme has a security administrator available on August 27. Bluebird will not schedule until we can explain what happens when their certificate is rejected.

**Theo:** Support can cover the first three onboarding sessions, but the current escalation playbook says “route identity issues to Platform” without a response-time target. That is not enough for a customer-facing launch.

**Maya:** Good. The original decision was self-serve setup for v1. We should not quietly switch to a Support-led process. If we need a temporary assisted path, we need to call it a launch mitigation and preserve the original product decision.

### 00:16 — Engineering readiness

**Devon:** I can ship actionable certificate errors and validation telemetry by August 23. The telemetry will distinguish an expired certificate, an invalid chain, and an unreachable metadata endpoint. I need Marcus to confirm the log fields do not include certificate contents or customer secrets.

**Marcus:** Infrastructure can review the fields today. We also found that the staging callback endpoint has a 30-second timeout, while the production gateway uses 10 seconds. That mismatch could make staging look healthier than production.

**Priya:** I will align the environments and add a timeout test to ENG-214 by August 22. The current Test Connection button should stay disabled until metadata validation completes; otherwise admins can save a configuration that we already know is invalid.

### 00:25 — Security review

**Nadia:** Security will not approve GA until three things are demonstrated: certificate material is never logged, audit events are emitted for create/update/enable actions, and failed Test Connection attempts are rate-limited. I can review the first two in the staging evidence package on August 24. Rate-limit verification depends on Infrastructure.

**Marcus:** The rate limit is implemented at the edge, but we have not tested it against repeated requests from the same tenant. I will provide a test result by August 23. I also want the audit event schema versioned before we turn it on for customers.

**Maya:** Is audit schema versioning a GA blocker or a follow-up?

**Nadia:** Versioning is a blocker for the event contract, not for the UI. We can approve the first launch if the event names and required fields are frozen and the retention policy is documented.

### 00:34 — Decision and contradiction review

**Maya:** We have a conflict with the PRD language. The PRD still says administrators complete setup without Support, but the current rollout plan includes assisted onboarding. I propose: keep self-serve as the v1 product decision, allow Support-assisted onboarding for the first three partners as a temporary launch control, and revisit after ten successful setups.

**Priya:** Engineering agrees, as long as assisted onboarding does not become a hidden requirement in the UI.

**Nadia:** Security agrees, provided the assisted path does not bypass certificate validation or audit events.

**Elena:** Customer Success can own the appointment and handoff checklist for the first three partners.

### 00:42 — Dependencies and action assignment

**Maya:** Let us read back actions. Devon owns actionable errors and telemetry by August 23. Marcus owns the production-like timeout test, rate-limit test, and log-field review by August 23. Priya owns the staging environment alignment and Test Connection behavior by August 22. Nadia owns Security sign-off on August 24, contingent on the evidence package. Elena owns the assisted-onboarding checklist by August 25. Theo owns the Support escalation response-time target by August 25.

**Theo:** I can commit to a four-business-hour first response for launch-week identity escalations, with urgent authentication failures routed immediately to Platform.

**Maya:** Accepted. That is an explicit launch-week commitment, not a permanent SLA.

### 00:50 — Go/no-go criteria

**Maya:** I am hearing August 26 as the internal go/no-go review. The launch on August 31 is conditional on Security approval, successful production-like validation, the playbook, and no open critical defects. Does anyone disagree?

**Nadia:** I agree, but the approval must include evidence that password login remains available as fallback.

**Priya:** We will add that to the regression suite.

### 00:56 — Close

**Maya:** Final decisions: self-serve remains the v1 product direction; Support-assisted onboarding is a temporary control for the first three partners; Security sign-off and production-like validation are launch gates; password fallback stays protected. I will update the PRD contradiction and send the decision log before end of day. We will meet for go/no-go on August 26.

**Elena:** I will schedule Acme for August 27 as tentative, pending the August 26 review.

**Maya:** Great. Thanks, everyone.

## Explicit outcomes

- **Decisions:** Preserve self-serve v1; use temporary Support assistance for the first three partners; require Security sign-off and production-like validation before GA.
- **Commitments:** Devon, Marcus, Priya, Nadia, Elena, and Theo have explicit deliverables and dates listed above.
- **Risks:** Certificate-validation failures, environment timeout mismatch, incomplete rate-limit evidence, and unclear escalation expectations.
- **Open questions:** Whether all GA evidence will be complete by August 26; whether assisted onboarding is still needed after ten successful setups.
