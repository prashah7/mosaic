# Usage Insights Beta security design review — August 21, 2026

**Duration:** 60 minutes  
**Facilitator:** Maya Chen, Product Manager  
**Initiative:** Usage Insights Beta  
**Purpose:** Align Product, Engineering, Security, Infrastructure, and Customer Success on the beta scope and decide what data may be shown to enterprise administrators before renewal conversations.

## Attendees

- Maya Chen — Product Manager
- Omar Singh — Product Designer
- Grace Lin — Engineering Lead
- Nadia Okafor — Security Lead
- Marcus Webb — Infrastructure and Data Platform
- Elena Ruiz — Customer Success
- Robert Hale — Legal and Privacy

## Transcript

### 00:00 — Framing the decision

**Maya:** The objective is an administrator-facing weekly usage dashboard before September renewal conversations. We are not building a general analytics product. By the end of this meeting, I want an agreed beta scope, a data-retention position, and a list of launch gates.

**Grace:** The current build shows weekly active users, feature adoption by account, and a trend line. Sales has requested user-level exports and named-user activity, but those are not in the approved brief.

**Maya:** Let us treat those as requests, not requirements. We need to protect the beta boundary.

### 00:09 — Customer needs and scope pressure

**Elena:** Three administrators asked for a list of inactive users so they can target enablement. They did not ask for message content or individual productivity scores. A team-level adoption trend would solve most of the renewal conversation.

**Omar:** The design supports account, workspace, and team views. The user-level table is already in the prototype because it helped us test the filters, but it creates an expectation that it will ship.

**Maya:** Decision proposal: remove user-level rows and exports from beta. Keep account-level and team-level adoption, with a minimum cohort size so small teams are not identifiable.

### 00:17 — Security and privacy review

**Nadia:** Security supports account-level reporting. I do not support individual activity in the beta without a separate privacy review and an explicit admin permission model. The current event pipeline includes email addresses in a debugging payload. That must be removed before production data is enabled.

**Robert:** Legal agrees. We also need a clear statement that usage metrics measure product interaction, not employee performance. The UI should not use labels such as “inactive employee” or “low performer.”

**Marcus:** The raw events are retained for 90 days today. The dashboard only needs a rolling 12 weeks. I can create an aggregated table and delete the raw event fields used for this feature after 30 days, but I need Security to confirm which fields are allowed in the aggregate.

**Nadia:** Allowed fields for beta are tenant ID, team ID when team size is at least five, feature name, week, and count. No email, user ID, IP address, message content, or event-level timestamp.

### 00:27 — Technical design

**Grace:** Aggregation at ingestion is safer, but it means historical backfill will take two days. We can ship a feature flag for three design partners and keep the old dashboard hidden from everyone else.

**Marcus:** I will provide a backfill estimate today. We also need an access-control check in the API. A user with workspace access must not automatically receive all team-level data; the role needs the Usage Insights permission.

**Omar:** The empty state can explain that data is hidden when a team has fewer than five members. That is clearer than showing a blank chart.

**Maya:** Good. The product requirement is understandable behavior, not a silent filter.

### 00:35 — Contradiction with existing brief

**Grace:** The current brief says “admins can inspect adoption by user.” That conflicts with the proposed beta scope.

**Maya:** We will supersede that line for beta and preserve it as a post-beta consideration. The launch artifact should explicitly say user-level reporting is deferred pending privacy review.

**Robert:** Please include that the decision is about the beta, not a permanent rejection of the capability.

### 00:41 — Launch gates and ownership

**Maya:** Read back the gates: remove email and user identifiers from the debug payload; implement five-person minimum cohorting; add the Usage Insights permission; complete the 12-week aggregate backfill; update the brief and UI language; and obtain Security and Legal approval.

**Grace:** Engineering will remove the debug payload and add the permission check by August 26. I own the API work.

**Marcus:** I own the aggregate table and backfill estimate by August 25, with the backfill complete by August 28 if the estimate holds.

**Nadia:** Security will review the field allowlist and API access test on August 29.

**Robert:** Legal will review the UI wording and beta data statement by August 29.

**Omar:** Design will remove user-level affordances and add the small-cohort empty state by August 27.

**Elena:** Customer Success will recruit three design partners who agree to the beta limitation and document their feedback by September 3.

### 00:51 — Metrics and follow-up

**Maya:** Success for beta is not “every requested report exists.” It is three design partners using the account-level dashboard weekly, a useful renewal conversation, zero privacy incidents, and no unauthorized data exposure.

**Grace:** We should add a metric for permission-denied requests so we can detect an access-control regression.

**Nadia:** Agreed. That metric should not include the requested data payload.

### 00:56 — Close

**Maya:** Final decision: beta reports account-level and team-level adoption only, with a minimum cohort of five. User-level reporting and exports are deferred pending privacy review. Security and Legal approval are launch gates. We will review readiness on August 30 and start the first partner pilot on September 2 if all gates pass.

## Explicit outcomes

- **Decisions:** Defer user-level reporting; ship account/team aggregates with five-person minimum cohorting; require explicit Usage Insights permission.
- **Commitments:** Engineering, Infrastructure, Security, Legal, Design, and Customer Success owners and dates are stated above.
- **Risks:** Debug payload may expose identifiers; historical backfill may slip; unclear beta wording could create customer expectations.
- **Open questions:** Whether the aggregate backfill can complete by August 28; what post-beta privacy review is required for user-level reporting.
