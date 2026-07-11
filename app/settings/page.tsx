"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/panel";
import { workspace } from "@/lib/mosaic-data";

export default function SettingsPage() {
  const [name, setName] = useState(workspace.name);
  const [company, setCompany] = useState(workspace.companyName);
  const [githubRepo, setGithubRepo] = useState("northline/platform");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(false);
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Settings"
        description="Workspace profile and GitHub connection for the MVP."
      />

      <Panel>
        <div className="border-b border-border px-4 py-3 text-[13px] font-medium">
          Workspace
        </div>
        <div className="space-y-3 p-4">
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Workspace name</span>
            <input
              className="input-glow h-9 w-full rounded-md border border-border bg-surface-overlay px-3 text-[13px] outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Company</span>
            <input
              className="input-glow h-9 w-full rounded-md border border-border bg-surface-overlay px-3 text-[13px] outline-none"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>
        </div>
      </Panel>

      <Panel>
        <div className="border-b border-border px-4 py-3 text-[13px] font-medium">
          Integrations
        </div>
        <div className="space-y-3 p-4">
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Default GitHub repository</span>
            <input
              className="input-glow h-9 w-full rounded-md border border-border bg-surface-overlay px-3 text-[13px] outline-none"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
            />
          </label>
          <p className="text-[11px] text-muted-dim">
            Issue creation is simulated in this prototype. Credentials are never
            shown in the UI.
          </p>
        </div>
      </Panel>

      <div className="flex items-center justify-end gap-3">
        {saved ? (
          <span className="check-pop text-xs text-green">Saved locally</span>
        ) : null}
        <Button variant="primary" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
