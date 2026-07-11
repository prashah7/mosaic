# Enterprise SSO decision log

## D-02 — Password login remains available during SAML rollout

- Status: Confirmed
- Date: August 4
- Owner: Maya Chen
- Rationale: Preserve administrator recovery and avoid a lockout path.

## D-04 — Self-serve IdP metadata upload for v1

- Status: Confirmed, under review
- Date: August 8
- Owner: Maya Chen
- Rationale: The product goal requires a repeatable, low-touch setup experience.
- Conflict: On August 13, Devon proposed temporary Support-assisted setup because certificate validation has more failure modes than expected. This does not supersede D-04 without Product and Security approval.

## D-05 — SCIM is out of v1 scope

- Status: Confirmed
- Date: August 8
- Owner: Maya Chen
- Rationale: Keep the pilot focused on SAML activation reliability.
