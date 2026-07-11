import type { Action, Artifact, Initiative, MemoryRecord, Run, Source } from "./types";

const now = "2026-07-11T12:00:00.000Z";
const initiativeId = "init_sso";

const initiatives: Initiative[] = [{
  id: initiativeId,
  name: "Enterprise SSO launch",
  objective: "Launch SAML SSO for three enterprise design partners by September 30 without disrupting password login.",
  description: "Design-partner launch for SAML SSO with Test Connection, admin configuration, and audit logging readiness.",
  successMetrics: ["Three design partners activated on SAML", "95% authentication success rate", "No disruption to password login"],
  targetDate: "2026-09-30",
  stage: "Engineering readiness",
  health: "AT_RISK",
  stakeholders: ["Sambit Nayak (PM)", "Priya Chen (Engineering)", "Marcus Webb (Infra)", "Legal", "Customer Success"],
  createdAt: now,
}];

const sources: Source[] = [
  { id: "src_rr", name: "PM R&R — Sambit Nayak", type: "MARKDOWN", initiativeId, content: "Product Manager, Platform. Owns Enterprise SSO outcomes, admin identity settings, and cross-functional alignment.", excerpt: "Owns Enterprise SSO outcomes and coordinates Eng, Infra, Legal, and Customer Success.", createdAt: now },
  { id: "src_prd", name: "Enterprise SSO PRD v1.3", type: "PDF", initiativeId, content: "Goal: launch SAML SSO for three enterprise design partners by September 30. In scope: SAML, SCIM, Test Connection, and audit logging.", excerpt: "Three partners activated, 95% auth success, no password-login disruption.", createdAt: now },
  { id: "src_prior", name: "Prior planning sync — July 1", type: "TRANSCRIPT", initiativeId, content: "Team aligned that password login must remain available as fallback. Priya tentatively owns configuration UI.", excerpt: "Password login must remain available as fallback.", createdAt: now },
  { id: "src_transcript", name: "Architecture planning — July 8", type: "TRANSCRIPT", initiativeId, content: "Priya: ship SAML first and defer SCIM. Marcus: admins need Test Connection. Legal: audit logging is required. Open: no owner assigned for audit logging.", excerpt: "SCIM is deferred; Test Connection is required; audit logging has no owner.", createdAt: now },
  { id: "src_tickets", name: "Current engineering tickets", type: "TICKET", initiativeId, content: "ENG-210 SAML in progress; ENG-211 configuration UI ready; missing audit logging and Test Connection tickets.", excerpt: "Missing: audit logging ticket and Test Connection ticket.", createdAt: now },
  { id: "src_slack", name: "#enterprise-sso thread", type: "SLACK", initiativeId, content: "CS needs an SSO ETA. Eng confirms SCIM deferral. Security needs an audit log owner before go-live.", excerpt: "Security needs an audit log owner before partner go-live.", createdAt: now },
  { id: "src_decisions", name: "Decision log", type: "DECISION_LOG", initiativeId, content: "Decision: ship SAML first and defer SCIM. Open: assign audit logging owner.", excerpt: "SAML first; SCIM deferred; audit logging owner remains open.", createdAt: now },
];

const runs: Run[] = [];
const artifacts: Artifact[] = [];
const actions: Action[] = [{
  id: "act_eng211", initiativeId, runId: "seed", title: "Add Test Connection ticket", description: "Track the admin Test Connection requirement before SSO enablement.", owner: "Priya Chen", status: "IN_PROGRESS", priority: "HIGH", sourceIds: ["src_tickets", "src_transcript"], createdAt: now,
}];
const memory: MemoryRecord[] = [
  { id: "mem_decision_1", initiativeId, type: "DECISION", statement: "Ship SAML first and defer SCIM for the first launch.", status: "CONFIRMED", confidence: 0.94, sourceIds: ["src_transcript", "src_decisions"], createdAt: now },
  { id: "mem_risk_1", initiativeId, type: "RISK", statement: "Audit logging is required for partner go-live but has no owner or ticket.", status: "CONFIRMED", confidence: 0.88, sourceIds: ["src_transcript", "src_slack"], createdAt: now },
];

export const db = { initiatives, sources, runs, artifacts, actions, memory };
export function getInitiative(id: string) { return db.initiatives.find((item) => item.id === id); }
export function id(prefix: string) { return `${prefix}_${crypto.randomUUID().slice(0, 8)}`; }
