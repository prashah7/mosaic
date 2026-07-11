"use client";

import { useEffect, useMemo, useState } from "react";

type View = "overview" | "runs" | "actions" | "memory";
type RunType = "Post-meeting" | "Pre-meeting" | "Weekly review";
type PostMeetingSourceMode = "seeded" | "pasted";
type ActionItem = { id: number; title: string; owner: string; due: string; status: string; source: string; tone: string };
type InitiativeId = "enterprise-sso" | "usage-insights-beta" | "partner-api-v2";
type SavedRun = { runId: string; type: RunType; output: string; createdAt: string; usage?: { total_tokens?: number } };
type SavedInitiativeState = { actions: ActionItem[]; latestRun: SavedRun | null; runHistory: SavedRun[]; memoryApproved: boolean };
type EvidenceItem = { statement: string; source_ids?: string[] };
type StructuredRun = {
  executive_summary?: string;
  decisions?: Array<EvidenceItem & { status?: string }>;
  risks?: Array<EvidenceItem & { severity?: string }>;
  commitments?: Array<EvidenceItem & { owner?: string | null; deadline?: string | null }>;
  memory_proposals?: Array<EvidenceItem & { operation?: string; type?: string; confidence?: number }>;
  actions?: Array<{ title?: string; owner?: string | null; deadline?: string | null; source_ids?: string[] }>;
  mermaid?: string;
  meeting_brief?: { objective?: string; context?: EvidenceItem[]; decisions_needed?: string[]; questions_to_ask?: string[] };
};

const initiatives: Record<InitiativeId, { title: string; goal: string; subhead: string; seededMeeting: string; sourceCount: number }> = {
  "enterprise-sso": { title: "Enterprise SSO GA", goal: "Launch SAML SSO for 10 design partners", subhead: "Ship a secure, repeatable setup experience without disrupting password login.", seededMeeting: "Identity architecture review", sourceCount: 12 },
  "usage-insights-beta": { title: "Usage Insights Beta", goal: "Give administrators actionable adoption insight", subhead: "Launch an account-level usage dashboard while preserving data-governance boundaries.", seededMeeting: "Usage Insights product review", sourceCount: 7 },
  "partner-api-v2": { title: "Partner API v2 Migration", goal: "Migrate strategic partners safely to API v2", subhead: "Sequence partner migration without overloading the Support escalation rotation.", seededMeeting: "Partner API v2 migration review", sourceCount: 7 },
};

const sources = [
  { id: "S1", type: "PRD", title: "Enterprise SSO — Product brief", detail: "Updated Aug 8 · 1,842 words", color: "indigo" },
  { id: "S2", type: "MEETING", title: "Identity architecture review", detail: "Aug 12 · 42 minutes", color: "teal" },
  { id: "S3", type: "SLACK", title: "#enterprise-pilots thread", detail: "18 messages · Aug 9–13", color: "violet" },
  { id: "S4", type: "TICKETS", title: "Auth platform sprint", detail: "9 linked tickets", color: "amber" },
  { id: "S5", type: "OKRS", title: "Q3 enterprise trust OKRs", detail: "3 company objectives · current health", color: "teal" },
  { id: "S6", type: "PORTFOLIO", title: "Q3 portfolio review", detail: "Shared Support capacity dependency", color: "coral" },
];

const initialActions: ActionItem[] = [
  { id: 1, title: "Ship certificate validation", owner: "Devon Li", due: "Aug 16", status: "In progress", source: "S2", tone: "teal" },
  { id: 2, title: "Confirm support escalation playbook", owner: "Assignment required", due: "Before pilot", status: "Proposed", source: "S2", tone: "amber" },
  { id: 3, title: "Schedule Acme admin walkthrough", owner: "Maya Chen", due: "Aug 18", status: "Proposed", source: "S3", tone: "indigo" },
  { id: 4, title: "Complete security review", owner: "Nadia Ross", due: "Aug 21", status: "Blocked", source: "S1", tone: "coral" },
];

const taskSteps = [
  ["Context retriever", "Ranks relevant evidence across the seeded company knowledge base"],
  ["Synthesizer", "Reconciled meeting decisions with project memory"],
  ["Artifact generator", "Updated initiative and dependency map"],
  ["Memory curator", "Staged 2 updates and 1 supersession"],
  ["Action manager", "Proposed 3 follow-ups; 1 needs an owner"],
];

const storageKey = (initiativeId: InitiativeId) => `mosaic:luci:v1:${initiativeId}`;

function readSavedInitiativeState(initiativeId: InitiativeId): SavedInitiativeState {
  const fallback: SavedInitiativeState = { actions: initialActions, latestRun: null, runHistory: [], memoryApproved: false };
  try {
    const raw = window.localStorage.getItem(storageKey(initiativeId));
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<SavedInitiativeState>;
    return {
      actions: Array.isArray(saved.actions) ? saved.actions : fallback.actions,
      latestRun: saved.latestRun ?? null,
      runHistory: Array.isArray(saved.runHistory) ? saved.runHistory : [],
      memoryApproved: Boolean(saved.memoryApproved),
    };
  } catch {
    return fallback;
  }
}

function TileMark({ small = false }: { small?: boolean }) {
  return <span className={small ? "tile-mark small" : "tile-mark"}><i /><i /><i /><i /></span>;
}

function Citation({ id, onClick }: { id: string; onClick: (id: string) => void }) {
  return <button className="citation" onClick={() => onClick(id)}>{id}</button>;
}

function readMosaicResult(output: string): StructuredRun | null {
  try {
    return JSON.parse(output) as StructuredRun;
  } catch {
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]) as StructuredRun; } catch { return null; }
  }
}

export function MosaicApp() {
  const [view, setView] = useState<View>("overview");
  const [initiativeId, setInitiativeId] = useState<InitiativeId>("enterprise-sso");
  const [showRun, setShowRun] = useState(false);
  const [runType, setRunType] = useState<RunType>("Post-meeting");
  const [running, setRunning] = useState(false);
  const [runStatusLabel, setRunStatusLabel] = useState("");
  const [activeTask, setActiveTask] = useState(5);
  const [sourceDrawer, setSourceDrawer] = useState<string | null>(null);
  const [actions, setActions] = useState(initialActions);
  const [memoryApproved, setMemoryApproved] = useState(false);
  const [artifactTab, setArtifactTab] = useState<"sources" | "map" | "memory">("map");
  const [toast, setToast] = useState("");
  const [runtimeMode, setRuntimeMode] = useState<"Hermes" | "Fixture fallback">("Hermes");
  const [runError, setRunError] = useState("");
  const [latestRun, setLatestRun] = useState<SavedRun | null>(null);
  const [runHistory, setRunHistory] = useState<SavedRun[]>([]);
  const [storageReadyFor, setStorageReadyFor] = useState<InitiativeId | null>(null);
  const [postMeetingSourceMode, setPostMeetingSourceMode] = useState<PostMeetingSourceMode>("seeded");
  const [postMeetingSource, setPostMeetingSource] = useState("");
  const [postMeetingRequest, setPostMeetingRequest] = useState("Update project state, propose memory changes, and create follow-up actions.");
  const [preMeetingObjective, setPreMeetingObjective] = useState("Prepare me for the design partner onboarding review.");
  const [weeklyReviewFocus, setWeeklyReviewFocus] = useState("");

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setActiveTask((current) => {
        if (current >= taskSteps.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [running, runType]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setStorageReadyFor(null);
    const saved = readSavedInitiativeState(initiativeId);
    setActions(saved.actions);
    setLatestRun(saved.latestRun);
    setRunHistory(saved.runHistory);
    setMemoryApproved(saved.memoryApproved);
    setStorageReadyFor(initiativeId);
  }, [initiativeId]);

  useEffect(() => {
    if (storageReadyFor !== initiativeId) return;
    window.localStorage.setItem(storageKey(initiativeId), JSON.stringify({ actions, latestRun, runHistory, memoryApproved } satisfies SavedInitiativeState));
  }, [actions, initiativeId, latestRun, memoryApproved, runHistory, storageReadyFor]);

  const source = sources.find((item) => item.id === sourceDrawer);
  const activeInitiative = initiatives[initiativeId];
  const counts = useMemo(() => ({
    proposed: actions.filter((a) => a.status === "Proposed").length,
    active: actions.filter((a) => a.status === "In progress").length,
    blocked: actions.filter((a) => a.status === "Blocked").length,
    done: actions.filter((a) => a.status === "Done").length,
  }), [actions]);

  const runCopy = {
    "Post-meeting": {
      sourceLabel: "Meeting source",
      sourceHelp: "Use the seeded identity-architecture transcript for the demo, or paste new meeting material.",
      sourcePlaceholder: "Paste a transcript or synthesized meeting notes here…",
      context: "Initiative brief, prior decisions, Slack, tickets",
    },
    "Pre-meeting": {
      sourceLabel: "Meeting objective or agenda",
      sourceHelp: "What meeting are you preparing for? Luci will retrieve the relevant project context and memory.",
      sourcePlaceholder: "e.g. Decide whether the v1 SSO setup should be self-serve or admin-assisted.",
      context: "Initiative memory, previous meetings, PRD, tickets",
    },
    "Weekly review": {
      sourceLabel: "Review focus (optional)",
      sourceHelp: "Leave blank for a complete initiative review, or name a question Luci should emphasize.",
      sourcePlaceholder: "e.g. Focus on launch readiness and blockers for design partners.",
      context: "Completed runs, current memory, actions, artifacts",
    },
  } as const;

  const currentRunCopy = runCopy[runType];
  const primaryRunInput = runType === "Post-meeting" ? postMeetingSource : runType === "Pre-meeting" ? preMeetingObjective : weeklyReviewFocus;
  const needsPrimaryInput = runType === "Post-meeting" && postMeetingSourceMode === "pasted";

  async function startRun() {
    if (needsPrimaryInput && !primaryRunInput.trim()) {
      setRunError("Add the meeting transcript, notes, or synthesized summary before running Luci.");
      return;
    }
    setActiveTask(0);
    setRunning(true);
    setRunStatusLabel("Submitting to Hermes…");
    setRunError("");
    try {
      const response = await fetch("/api/luci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiativeId,
          runId: `run-${Date.now()}`,
          runType: runType === "Post-meeting" ? "POST_MEETING" : runType === "Pre-meeting" ? "PRE_MEETING" : "WEEKLY_REVIEW",
          sourceMode: postMeetingSourceMode,
          sourceText: runType === "Post-meeting" && postMeetingSourceMode === "pasted" ? postMeetingSource : undefined,
          intent: runType === "Post-meeting"
            ? postMeetingRequest
            : runType === "Pre-meeting" ? preMeetingObjective : weeklyReviewFocus,
        }),
      });
      const result = await response.json();
      setRuntimeMode(result.mode === "hermes" ? "Hermes" : "Fixture fallback");
      if (result.mode !== "hermes" || !result.run_id) {
        await new Promise((resolve) => window.setTimeout(resolve, 3400));
        setRunning(false);
        setShowRun(false);
        setToast(`${runType} completed in fixture mode`);
        return;
      }

      for (let attempt = 0; attempt < 300; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const statusResponse = await fetch(`/api/luci/${encodeURIComponent(result.run_id)}`, { cache: "no-store" });
        const status = await statusResponse.json();
        setRunStatusLabel(status.status === "running" ? "Luci is reading evidence and creating artifacts…" : `Hermes run: ${status.status}`);
        if (status.status === "completed") {
          setActiveTask(taskSteps.length - 1);
          const output = status.output || "Hermes completed this run without a text response.";
          const structured = readMosaicResult(output);
          const proposedActions = structured?.actions?.filter((action) => action.title) ?? [];
          if (proposedActions.length) {
            setActions((current) => [
              ...proposedActions.map((action, index) => ({
                id: Date.now() + index,
                title: action.title as string,
                owner: action.owner || "Assignment required",
                due: action.deadline || "No deadline set",
                status: "Proposed",
                source: action.source_ids?.[0] || "Evidence",
                tone: action.owner ? "indigo" : "amber",
              })),
              ...current,
            ]);
          }
          const savedRun: SavedRun = { runId: result.run_id, type: runType, output, usage: status.usage, createdAt: new Date().toISOString() };
          setLatestRun(savedRun);
          setRunHistory((current) => [savedRun, ...current.filter((run) => run.runId !== savedRun.runId)].slice(0, 20));
          setRunning(false);
          setRunStatusLabel("");
          setShowRun(false);
          setToast(`${runType} completed by Hermes${proposedActions.length ? ` · ${proposedActions.length} proposed actions added` : ""}`);
          return;
        }
        if (["failed", "cancelled"].includes(status.status)) {
          throw new Error(status.error || `Hermes run ${status.status}`);
        }
      }
      throw new Error("Hermes run timed out after 5 minutes");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Hermes run failed";
      setRunError(message);
      setRunning(false);
      setRunStatusLabel("");
    }
  }

  function advanceAction(id: number) {
    const order = ["Proposed", "In progress", "Done"];
    setActions((current) => current.map((action) => {
      if (action.id !== id || action.owner === "Assignment required" || action.status === "Blocked") return action;
      return { ...action, status: order[Math.min(order.indexOf(action.status) + 1, order.length - 1)] };
    }));
    setToast("Action status updated");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><TileMark /><span>Mosaic</span></div>
        <nav aria-label="Main navigation">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>⌂</span> Overview</button>
          <button className={view === "runs" ? "active" : ""} onClick={() => setView("runs")}><span>◫</span> Runs <b>3</b></button>
          <button className={view === "actions" ? "active" : ""} onClick={() => setView("actions")}><span>✓</span> Actions <b>{actions.length}</b></button>
          <button className={view === "memory" ? "active" : ""} onClick={() => setView("memory")}><span>◎</span> Memory <b>12</b></button>
        </nav>
        <div className="side-section">
          <p>WORKSPACE</p>
          <div className="person-row"><span className="avatar">MC</span><span><strong>Maya Chen</strong><small>Product Manager</small></span></div>
          <div className="scope-card"><span>R&amp;R</span><p>Identity, enterprise readiness, partner activation</p></div>
        </div>
        <div className="side-foot"><span className="status-dot" /> {runtimeMode === "Hermes" ? "Hermes ready" : "Demo runtime"} <small>{runtimeMode}</small></div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="initiative-title"><span className="project-icon">{initiativeId === "enterprise-sso" ? "S" : initiativeId === "usage-insights-beta" ? "U" : "A"}</span><div><small>INITIATIVE</small><select aria-label="Select initiative" value={initiativeId} onChange={(event) => setInitiativeId(event.target.value as InitiativeId)}><option value="enterprise-sso">Enterprise SSO GA</option><option value="usage-insights-beta">Usage Insights Beta</option><option value="partner-api-v2">Partner API v2 Migration</option></select></div></div>
          <div className="top-actions"><button className="quiet-button">⌕</button><button className="luci-button" onClick={() => setShowRun(true)}><TileMark small /> Ask Luci</button><span className="avatar top">MC</span></div>
        </header>

        <div className="content">
          <div className="goal-header">
            <div><p className="eyebrow">GOAL · SYNTHETIC INITIATIVE</p><h1>{activeInitiative.goal}</h1><p className="subhead">{activeInitiative.subhead}</p></div>
            <div className="health-card"><span>AT RISK</span><strong>72%</strong><small>Target · Sep 30</small></div>
          </div>

          <div className="metrics-row">
            <div><small>PARTNERS ACTIVATED</small><strong>3 <i>/ 10</i></strong><span className="mini-progress"><i style={{ width: "30%" }} /></span></div>
            <div><small>SETUP TIME</small><strong>18 <i>min</i></strong><span className="trend amber">↓ target &lt;15 min</span></div>
            <div><small>AUTH SUCCESS</small><strong>97.8<i>%</i></strong><span className="trend teal">↑ 1.4% this week</span></div>
            <div><small>OPEN BLOCKERS</small><strong>2</strong><span className="trend coral">1 escalated</span></div>
          </div>

          {latestRun && <section className="card live-output-card">
            <div><p className="eyebrow">LUCI · LIVE HERMES RESPONSE</p><h2>{latestRun.type} completed</h2><p>Generated by the connected Hermes agent for this run.</p></div>
            <RunArtifacts result={readMosaicResult(latestRun.output)} rawOutput={latestRun.output} onOpenActions={() => setView("actions")} />
            {latestRun.usage?.total_tokens && <small>{latestRun.usage.total_tokens.toLocaleString()} tokens processed</small>}
          </section>}

          {view === "overview" && <>
            <div className="workspace-grid">
              {!latestRun ? <section className="card synthesis-card">
                <div className="card-head"><div><span className="luci-orb"><TileMark small /></span><div><p className="eyebrow">LUCI · POST-MEETING SYNTHESIS</p><h2>Identity architecture review</h2></div></div><span className="time-chip">Today · 11:42 AM</span></div>
                <div className="signal-banner"><span>↗</span><div><strong>The implementation approach changed.</strong><p>Engineering recommends admin-assisted setup for v1, conflicting with the approved self-serve flow.</p></div><span className="severity">REVIEW</span></div>
                <div className="summary-section"><h3>What changed</h3><ul>
                  <li><span className="bullet coral" /><p><strong>Setup model needs a decision.</strong> The PRD approves self-serve metadata upload, but certificate validation risk led Engineering to propose an assisted launch. <Citation id="S1" onClick={setSourceDrawer} /> <Citation id="S2" onClick={setSourceDrawer} /></p></li>
                  <li><span className="bullet teal" /><p><strong>Certificate validation has an owner.</strong> Devon committed to ship validation and failure states by Aug 16. <Citation id="S2" onClick={setSourceDrawer} /></p></li>
                  <li><span className="bullet amber" /><p><strong>The support path is unowned.</strong> The escalation playbook must be confirmed before partner onboarding. <Citation id="S2" onClick={setSourceDrawer} /></p></li>
                </ul></div>
                <div className="insight-grid"><div><span>◆</span><small>DECISION NEEDED</small><strong>Self-serve vs assisted v1</strong></div><div><span>△</span><small>DEPENDENCY</small><strong>Security review gates GA</strong></div><div><span>?</span><small>OPEN QUESTION</small><strong>Who owns escalation?</strong></div></div>
                <div className="card-footer"><button onClick={() => setArtifactTab("memory")}>Review 3 memory changes</button><button onClick={() => setView("actions")}>Open 4 actions →</button></div>
              </section> : <section className="card synthesis-card saved-synthesis-card"><div className="card-head"><div><span className="luci-orb"><TileMark small /></span><div><p className="eyebrow">LUCI · EVIDENCE-BACKED RUN</p><h2>Latest artifacts are loaded above</h2></div></div><span className="done-pill">PERSISTED</span></div><div className="saved-synthesis-copy"><strong>This replaces the seeded example.</strong><p>The synthesis, decisions, risks, memory proposals, actions, and Mermaid map above come from the most recent Luci run for this initiative.</p><button onClick={() => setView("runs")}>Open saved run history →</button></div></section>}

              <aside className="card activity-card">
                <div className="card-head simple"><div><p className="eyebrow">RUN ACTIVITY</p><h2>{running ? "Luci is working" : "Run completed"}</h2></div><span className={running ? "live-pill" : "done-pill"}>{running ? "LIVE" : "1m 18s"}</span></div>
                <div className="task-list">{taskSteps.map(([name, detail], index) => <div className={`task ${index <= activeTask ? "done" : "waiting"} ${running && index === activeTask ? "current" : ""}`} key={name}><span>{index <= activeTask ? "✓" : index + 1}</span><div><strong>{name}</strong><p>{index <= activeTask ? detail : "Waiting for prior task"}</p></div></div>)}</div>
                <button className="trace-button" onClick={() => setView("runs")}>View full run trace <span>→</span></button>
              </aside>
            </div>

            <section className="card artifact-card">
              <div className="artifact-tabs"><button className={artifactTab === "sources" ? "active" : ""} onClick={() => setArtifactTab("sources")}>Sources <b>{sources.length}</b></button><button className={artifactTab === "map" ? "active" : ""} onClick={() => setArtifactTab("map")}>Initiative map</button><button className={artifactTab === "memory" ? "active" : ""} onClick={() => setArtifactTab("memory")}>Memory changes <b>3</b></button></div>
              {artifactTab === "map" && <InitiativeMap />}
              {artifactTab === "sources" && <div className="source-grid">{sources.map((item) => <button key={item.id} onClick={() => setSourceDrawer(item.id)}><span className={`source-icon ${item.color}`}>{item.id}</span><span><strong>{item.title}</strong><small>{item.type} · {item.detail}</small></span><i>→</i></button>)}</div>}
              {artifactTab === "memory" && <MemoryReview approved={memoryApproved} onApprove={() => { setMemoryApproved(true); setToast("Memory updates approved with provenance"); }} />}
            </section>
          </>}

          {view === "actions" && <ActionsBoard actions={actions} counts={counts} onAdvance={advanceAction} />}
          {view === "memory" && <MemoryView approved={memoryApproved} onApprove={() => setMemoryApproved(true)} onSource={setSourceDrawer} />}
          {view === "runs" && <RunsView onNew={() => setShowRun(true)} onSource={setSourceDrawer} savedRuns={runHistory} onOpenRun={(run) => { setLatestRun(run); setView("overview"); }} />}
        </div>
      </section>

      {showRun && <div className="modal-backdrop" onMouseDown={() => !running && setShowRun(false)}><section className="run-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head"><div><span className="luci-orb"><TileMark small /></span><div><p className="eyebrow">NEW LUCI RUN</p><h2>What should Luci do?</h2></div></div><button disabled={running} onClick={() => setShowRun(false)}>×</button></div>
        <div className="run-types">{(["Post-meeting", "Pre-meeting", "Weekly review"] as RunType[]).map((type) => <button disabled={running} className={runType === type ? "active" : ""} onClick={() => { setRunType(type); setRunError(""); }} key={type}><span>{type === "Post-meeting" ? "◫" : type === "Pre-meeting" ? "◇" : "▦"}</span><strong>{type}</strong><small>{type === "Post-meeting" ? "Turn a transcript into project state" : type === "Pre-meeting" ? "Prepare with memory and context" : "Align progress to the goal"}</small></button>)}</div>
        <div className="run-form">
          {runType === "Post-meeting" ? <>
            <label>{currentRunCopy.sourceLabel}<small>{currentRunCopy.sourceHelp}</small></label>
            <div className="source-mode-picker">
              <button type="button" disabled={running} className={postMeetingSourceMode === "seeded" ? "active" : ""} onClick={() => setPostMeetingSourceMode("seeded")}><strong>Use seeded transcript</strong><small>Identity architecture review · S2</small></button>
              <button type="button" disabled={running} className={postMeetingSourceMode === "pasted" ? "active" : ""} onClick={() => setPostMeetingSourceMode("pasted")}><strong>Paste new meeting source</strong><small>Transcript, notes, or AI summary</small></button>
            </div>
            {postMeetingSourceMode === "seeded" ? <div className="seeded-source-note"><span>✓</span><p><strong>{activeInitiative.seededMeeting} and its initiative knowledge set will be analyzed</strong><small>Includes OKRs, decisions, meeting history, tickets, portfolio dependencies, and initiative memory where available.</small></p></div> : <textarea value={postMeetingSource} onChange={(event) => setPostMeetingSource(event.target.value)} placeholder={currentRunCopy.sourcePlaceholder} />}
          </> : <label>{currentRunCopy.sourceLabel}<small>{currentRunCopy.sourceHelp}</small>
            <textarea value={primaryRunInput} onChange={(event) => runType === "Pre-meeting" ? setPreMeetingObjective(event.target.value) : setWeeklyReviewFocus(event.target.value)} placeholder={currentRunCopy.sourcePlaceholder} />
          </label>}
          {runType === "Post-meeting" && <label>Ask Luci <em>optional</em><small>Tell Luci what to emphasize in the output—not the meeting facts.</small>
            <textarea className="compact-input" value={postMeetingRequest} onChange={(event) => setPostMeetingRequest(event.target.value)} placeholder="e.g. Create a PM summary and call out launch risks." />
          </label>}
        </div>
        <div className="selected-sources"><div><span>{activeInitiative.sourceCount}</span><p><strong>Context Luci will retrieve</strong><small>{currentRunCopy.context} plus the selected initiative&apos;s seeded evidence and memory</small></p></div><button type="button" onClick={() => { setArtifactTab("sources"); setShowRun(false); }}>Review</button></div>
        {running && <div className="run-progress"><span><i style={{ width: `${((activeTask + 1) / taskSteps.length) * 100}%` }} /></span><p>{runStatusLabel || `${taskSteps[activeTask]?.[0]} · ${taskSteps[activeTask]?.[1]}`}</p></div>}
        {runError && <div className="run-error"><strong>Hermes run failed</strong><p>{runError}</p></div>}
        <div className="modal-foot"><span><i className="status-dot" /> {runtimeMode} · OpenAI connector</span><button className="cancel" disabled={running} onClick={() => setShowRun(false)}>Cancel</button><button className="run-button" disabled={running} onClick={startRun}>{running ? "Luci is working…" : "Run Luci →"}</button></div>
      </section></div>}

      {source && <div className="drawer-backdrop" onMouseDown={() => setSourceDrawer(null)}><aside className="source-drawer" onMouseDown={(e) => e.stopPropagation()}><div className="drawer-head"><span className={`source-icon ${source.color}`}>{source.id}</span><button onClick={() => setSourceDrawer(null)}>×</button></div><p className="eyebrow">{source.type} · SOURCE EVIDENCE</p><h2>{source.title}</h2><p className="drawer-meta">{source.detail}</p><div className="quote"><span>Referenced passage</span><p>“For the first release, admins should be able to upload their IdP metadata and complete setup without support. Any change to that assumption needs product and security review.”</p></div><div className="used-by"><span>Used by Luci in</span><strong>Post-meeting synthesis · Today</strong><strong>Initiative memory · Decision D-04</strong></div></aside></div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function RunArtifacts({ result, rawOutput, onOpenActions }: { result: StructuredRun | null; rawOutput: string; onOpenActions: () => void }) {
  if (!result) return <details className="raw-run-output"><summary>View raw Luci response</summary><pre>{rawOutput}</pre></details>;
  const sources = (item: { source_ids?: string[] }) => item.source_ids?.slice(0, 2).join(" · ") || "Seeded evidence";
  return <div className="run-artifacts">
    {result.executive_summary && <section className="artifact-summary"><p className="eyebrow">EXECUTIVE SYNTHESIS</p><p>{result.executive_summary}</p></section>}
    {result.meeting_brief && <section className="artifact-brief"><p className="eyebrow">PRE-MEETING BRIEF</p><h3>{result.meeting_brief.objective}</h3><div className="brief-columns"><div><strong>Decisions needed</strong><ul>{result.meeting_brief.decisions_needed?.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>Questions to ask</strong><ul>{result.meeting_brief.questions_to_ask?.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>}
    <div className="artifact-grid">
      <section><p className="eyebrow">DECISIONS</p>{result.decisions?.slice(0, 3).map((item) => <article key={item.statement}><span className="artifact-status">{item.status || "CONFIRMED"}</span><strong>{item.statement}</strong><small>{sources(item)}</small></article>)}</section>
      <section><p className="eyebrow">RISKS &amp; DEPENDENCIES</p>{result.risks?.slice(0, 3).map((item) => <article key={item.statement}><span className="artifact-status risk">{item.severity || "RISK"}</span><strong>{item.statement}</strong><small>{sources(item)}</small></article>)}</section>
      <section><p className="eyebrow">COMMITMENTS</p>{result.commitments?.slice(0, 3).map((item) => <article key={item.statement}><strong>{item.statement}</strong><small>{item.owner || "Assignment required"} · {item.deadline || "No deadline"}</small></article>)}</section>
    </div>
    {result.memory_proposals?.length ? <section className="memory-artifact"><p className="eyebrow">MEMORY PROPOSALS · REVIEW REQUIRED</p>{result.memory_proposals.slice(0, 4).map((item) => <article key={item.statement}><span>{item.operation}</span><strong>{item.statement}</strong><small>{item.type} · {Math.round((item.confidence || 0) * 100)}% confidence</small></article>)}</section> : null}
    {result.actions?.length ? <button className="artifact-action" onClick={onOpenActions}>Open {result.actions.length} proposed actions in Kanban →</button> : null}
    {result.mermaid && <details className="mermaid-artifact"><summary>View generated Mermaid initiative map</summary><pre>{result.mermaid}</pre></details>}
    <details className="raw-run-output"><summary>View raw Luci response</summary><pre>{rawOutput}</pre></details>
  </div>;
}

function InitiativeMap() {
  return <div className="map-wrap"><div className="map-title"><div><p className="eyebrow">LIVE ARTIFACT</p><h3>Enterprise SSO initiative map</h3></div><span>Updated from today’s run</span></div><div className="initiative-map">
    <div className="map-line h one" /><div className="map-line h two" /><div className="map-line v left" /><div className="map-line v right" />
    <div className="map-node goal"><small>GOAL</small><strong>SAML SSO GA</strong><span>Sep 30 · 10 partners</span></div>
    <div className="map-node work a"><i className="teal" /><small>WORKSTREAM</small><strong>Identity platform</strong><span>Certificate validation · Devon</span></div>
    <div className="map-node work b"><i className="indigo" /><small>WORKSTREAM</small><strong>Admin experience</strong><span>Setup model · Decision needed</span></div>
    <div className="map-node work c"><i className="amber" /><small>DEPENDENCY</small><strong>Security review</strong><span>GA gate · Aug 21</span></div>
    <div className="map-node work d"><i className="coral" /><small>RISK</small><strong>Support readiness</strong><span>Escalation owner missing</span></div>
  </div></div>;
}

function MemoryReview({ approved, onApprove }: { approved: boolean; onApprove: () => void }) {
  return <div className="memory-review"><div className="memory-change conflict"><span>SUPERSESSION</span><div><strong>Setup will be self-serve for v1</strong><p>Conflicts with the new assisted-setup recommendation. Preserve the old decision until Maya confirms the change.</p><small>Existing memory · S1 ↔ New evidence · S2</small></div><button>{approved ? "Superseded" : "Review"}</button></div><div className="memory-change"><span>NEW FACT</span><div><strong>Certificate validation ships Aug 16</strong><p>Devon explicitly committed to validation and actionable failure states.</p><small>Confidence 98% · S2</small></div><button>{approved ? "Confirmed" : "Include"}</button></div><div className="memory-change"><span>OPEN QUESTION</span><div><strong>Support escalation owner is unknown</strong><p>Keep visible until a human assigns responsibility.</p><small>Confidence 100% · S2</small></div><button>{approved ? "Tracked" : "Include"}</button></div>{!approved && <div className="memory-actions"><p>Luci never overwrites project memory silently.</p><button onClick={onApprove}>Approve selected changes</button></div>}</div>;
}

function ActionsBoard({ actions, counts, onAdvance }: { actions: typeof initialActions; counts: Record<string, number>; onAdvance: (id: number) => void }) {
  const columns = ["Proposed", "In progress", "Blocked", "Done"];
  return <section className="board-view"><div className="view-head"><div><p className="eyebrow">FOLLOW-THROUGH</p><h2>Initiative actions</h2><p>Every card stays linked to the run and evidence that created it.</p></div><button className="primary-action">+ Add action</button></div><div className="board-stats"><span>{counts.proposed} proposed</span><span>{counts.active} in progress</span><span>{counts.blocked} blocked</span><span>{counts.done} done</span></div><div className="kanban">{columns.map((column) => <div className="kanban-col" key={column}><header><span className={`column-dot ${column.toLowerCase().replace(" ", "-")}`} />{column}<b>{actions.filter((a) => a.status === column).length}</b></header><div className="kanban-list">{actions.filter((a) => a.status === column).map((action) => <article className="action-card" key={action.id} onClick={() => onAdvance(action.id)}><div className="action-top"><span className={`priority ${action.tone}`} /> <small>{action.source} · TODAY’S RUN</small></div><h3>{action.title}</h3><div className={action.owner === "Assignment required" ? "owner missing" : "owner"}><span>{action.owner === "Assignment required" ? "?" : action.owner.split(" ").map((x) => x[0]).join("")}</span><p><strong>{action.owner}</strong><small>{action.due}</small></p></div>{action.owner === "Assignment required" && <button className="assign">Assign owner</button>}<footer><span>Linked evidence</span><i>→</i></footer></article>)}</div></div>)}</div></section>;
}

function MemoryView({ approved, onApprove, onSource }: { approved: boolean; onApprove: () => void; onSource: (id: string) => void }) {
  return <section className="memory-view"><div className="view-head"><div><p className="eyebrow">M3 · DURABLE INITIATIVE MEMORY</p><h2>What Luci remembers</h2><p>Curated facts and decisions with provenance—not a transcript dump.</p></div><span className="memory-count">12 confirmed records</span></div><div className="memory-layout"><div className="card memory-timeline"><div className="timeline-item current"><span /><div><small>PROPOSED · TODAY</small><h3>Admin-assisted setup recommended for v1</h3><p>Engineering recommends assistance until certificate validation is proven with design partners.</p><button onClick={() => onSource("S2")}>View evidence S2</button></div></div><div className="timeline-item"><span /><div><small>CONFIRMED · AUG 8</small><h3>Self-serve metadata upload approved</h3><p>The original product decision. It will remain in history if superseded.</p><button onClick={() => onSource("S1")}>View evidence S1</button></div></div><div className="timeline-item"><span /><div><small>CONFIRMED · AUG 6</small><h3>Security review gates general availability</h3><p>No partner rollout can graduate before Security signs off.</p><button onClick={() => onSource("S1")}>View evidence S1</button></div></div></div><div className="card memory-controls"><p className="eyebrow">MEMORY CURATOR</p><h3>{approved ? "Memory is current" : "3 updates need review"}</h3><p>Luci found one conflict, one new commitment, and one open question.</p><div className="memory-rules"><span>✓ Sources preserved</span><span>✓ No silent overwrite</span><span>✓ Confidence recorded</span></div>{!approved && <button onClick={onApprove}>Review proposed changes</button>}</div></div></section>;
}

function RunsView({ onNew, onSource, savedRuns, onOpenRun }: { onNew: () => void; onSource: (id: string) => void; savedRuns: SavedRun[]; onOpenRun: (run: SavedRun) => void }) {
  return <section className="runs-view"><div className="view-head"><div><p className="eyebrow">OBSERVABLE WORK</p><h2>Luci runs</h2><p>Every synthesis, source, memory change, and action is attributable.</p></div><button className="primary-action" onClick={onNew}>+ New run</button></div><div className="runs-list">{savedRuns.map((run) => <article key={run.runId}><span className={`run-type ${run.type === "Post-meeting" ? "post" : run.type === "Pre-meeting" ? "pre" : "week"}`}>{run.type === "Post-meeting" ? "◫" : run.type === "Pre-meeting" ? "◇" : "▦"}</span><div><small>{run.type.toUpperCase()} · {new Date(run.createdAt).toLocaleString()}</small><h3>Saved Luci artifact set</h3><p>{readMosaicResult(run.output)?.actions?.length ?? 0} actions · {readMosaicResult(run.output)?.memory_proposals?.length ?? 0} memory proposals · persisted in this workspace</p></div><span className="run-status">COMPLETED</span><button onClick={() => onOpenRun(run)}>Open artifacts →</button></article>)}<article><span className="run-type post">◫</span><div><small>POST-MEETING · SEEDED</small><h3>Identity architecture review</h3><p>5 specialist tasks · cited synthesis and proposed follow-up</p></div><span className="run-status">COMPLETED</span><button onClick={() => onSource("S2")}>Open source →</button></article></div></section>;
}
