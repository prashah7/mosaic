# Enterprise SSO GA — initiative brief

## Outcome

Launch SAML SSO for ten design partners by September 30, without disrupting password login.

## Success metrics

- Eight of ten design partners activate by GA.
- Median administrator setup time is below fifteen minutes.
- Authentication success is at least 97% during pilot and GA.
- No P0 authentication incidents occur during rollout.
- Support escalation playbook is tested before the fifth partner activates.

## Scope and guardrails

Decision D-04: the v1 setup will be self-serve. Administrators upload IdP metadata and complete setup without Support assistance. General availability remains gated on Security review.

Acme and Globex are the first pilots. Password login remains available throughout rollout. SCIM provisioning, Just-in-Time role mapping, and custom domain enforcement are explicitly out of v1 scope.

## Known dependencies

- Identity Engineering ships certificate validation and actionable failure states.
- Security completes the identity threat-model review.
- Support confirms an escalation playbook before onboarding.
- Customer Success coordinates pilot onboarding and activation measurement.
