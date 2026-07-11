# Enterprise SSO GA readiness review — August 20, 2026

**Duration:** 60 minutes  
**Facilitator:** Maya Chen, Product Manager  
**Participants:** Maya Chen (PM), Priya Nair (Engineering), Devon Brooks (Identity Platform), Nadia Okafor (Security), Marcus Webb (Infrastructure), Elena Ruiz (Customer Success), Theo Grant (Support)

### 00:00 — Goal

**Maya:** We need to decide whether the next three design partners can be onboarded on August 31. Success remains ten partners by September 30, 95% authentication success, and no disruption to password login. Every blocker needs an owner and date.

**Priya:** The SAML configuration UI works in staging, but certificate-validation errors are still confusing and send admins to Support.

### 00:08 — Customer and Support context

**Elena:** Acme has a security administrator available on August 27. Bluebird will not schedule until we can explain rejected certificates.

**Theo:** Support can cover the first three onboarding sessions, but the escalation playbook only says to route identity issues to Platform. It has no response-time target or permanent owner.

**Maya:** The approved product decision is self-serve setup for v1. We should not quietly change that to Support-led setup. If we need temporary assistance, it must be a launch mitigation and not a hidden product requirement.

### 00:16 — Engineering and Infrastructure

**Devon:** I will ship actionable certificate errors and validation telemetry by August 23. The telemetry will distinguish expired certificates, invalid chains, and unreachable metadata endpoints. Marcus must confirm certificate contents and secrets are not logged.

**Marcus:** I will review the log fields today. Staging currently has a 30-second callback timeout while production uses 10 seconds. That mismatch could hide a production failure.

**Priya:** I will align the environments and add a timeout test to ENG-214 by August 22. Test Connection should remain disabled until metadata validation completes.

### 00:25 — Security gate

**Nadia:** Security will not approve GA until certificate material is never logged, audit events exist for create/update/enable actions, and failed Test Connection attempts are rate-limited. I will review the evidence package on August 24. Rate-limit verification depends on Marcus.

**Marcus:** The edge rate limit exists, but same-tenant repeated requests are untested. I will provide the test by August 23. The audit event schema must be frozen before customer enablement.

**Maya:** Is schema versioning a UI blocker?

**Nadia:** It is a blocker for the event contract, not for the UI. We can approve if event names, required fields, and retention are documented.

### 00:34 — Contradiction and temporary mitigation

**Maya:** The PRD still says administrators complete setup without Support, while the rollout plan includes assisted onboarding. I propose keeping self-serve as the v1 product decision, allowing Support assistance for the first three partners only, and revisiting after ten successful setups.

**Priya:** Agreed, as long as the assisted path does not become a hidden UI requirement.

**Nadia:** Agreed, provided assistance does not bypass validation or audit events.

**Elena:** Customer Success can own the appointment and handoff checklist for the first three partners.

### 00:42 — Commitments

**Maya:** Readback: Devon owns actionable errors and telemetry by August 23. Marcus owns timeout, rate-limit, and log-field validation by August 23. Priya owns environment alignment and Test Connection behavior by August 22. Nadia owns Security sign-off on August 24, contingent on evidence. Elena owns the temporary assisted-onboarding checklist by August 25. Theo owns the launch-week Support response-time target by August 25.

**Theo:** I commit to a four-business-hour first response for launch-week identity escalations, with urgent authentication failures routed immediately to Platform. This is a launch-week commitment, not a permanent SLA.

### 00:50 — Go/no-go

**Maya:** The internal go/no-go is August 26. August 31 is conditional on Security approval, production-like validation, the playbook, and no critical defects.

**Nadia:** Approval must include evidence that password login remains available as fallback.

**Priya:** We will add that to the regression suite.

### 00:56 — Close

**Maya:** Final decisions: self-serve remains the v1 product direction; Support-assisted onboarding is temporary for the first three partners; Security sign-off and production-like validation are launch gates; password fallback stays protected. I will update the PRD contradiction and decision log today. We meet for go/no-go on August 26.

**Elena:** I will schedule Acme for August 27 as tentative, pending the August 26 review.
