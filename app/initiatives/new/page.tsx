"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PageHeader } from "@/components/ui/panel";

export default function NewInitiativePage() {
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [metrics, setMetrics] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/initiatives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, objective, successMetrics: metrics.split("\n").map((item) => item.trim()).filter(Boolean) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create initiative");
      setMessage(`Created ${body.data.name}. ID: ${body.data.id}`);
      setName(""); setObjective(""); setMetrics("");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not create initiative");
    } finally { setSaving(false); }
  }

  return (
    <div className="stagger mx-auto max-w-2xl space-y-5">
      <PageHeader title="New initiative" description="Give Luci a goal and measurable outcomes to coordinate." />
      <Panel className="p-4 sm:p-5">
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs text-muted">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50" placeholder="Checkout reliability" /></label>
          <label className="block text-xs text-muted">Objective<textarea required value={objective} onChange={(event) => setObjective(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50" placeholder="Reduce failed checkout attempts..." /></label>
          <label className="block text-xs text-muted">Success metrics <span className="text-muted-dim">(one per line)</span><textarea required value={metrics} onChange={(event) => setMetrics(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent/50" placeholder="Reduce failures below 2%" /></label>
          {message ? <p className="rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-foreground">{message}</p> : null}
          <div className="flex justify-end gap-2"><Link href="/initiatives"><Button type="button" variant="ghost">Cancel</Button></Link><Button type="submit" variant="primary" disabled={saving}>{saving ? "Creating…" : "Create initiative"}</Button></div>
        </form>
      </Panel>
    </div>
  );
}
