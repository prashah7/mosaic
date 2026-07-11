"use client";

import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";

type FieldStatus = {
  configured: boolean;
  maskedSuffix?: string;
};

type ConfigStatus = {
  hermesBaseUrl: FieldStatus;
  hermesApiKey: FieldStatus;
  openAiApiKey: FieldStatus;
  convexUrl: FieldStatus;
  convexAuthToken: FieldStatus;
  demoFallback: boolean;
};

type Draft = {
  hermesBaseUrl: string;
  hermesApiKey: string;
  openAiApiKey: string;
  convexUrl: string;
  convexAuthToken: string;
};

const EMPTY_DRAFT: Draft = {
  hermesBaseUrl: "",
  hermesApiKey: "",
  openAiApiKey: "",
  convexUrl: "",
  convexAuthToken: "",
};

function ConfiguredState({ status }: { status?: FieldStatus }) {
  if (!status) {
    return <span className="text-[11px] text-muted-dim">Checking</span>;
  }

  return (
    <span
      className={
        status.configured
          ? "inline-flex items-center gap-1 text-[11px] text-green"
          : "text-[11px] text-muted-dim"
      }
    >
      {status.configured ? <CheckCircle2 className="size-3" /> : null}
      {status.configured
        ? `Configured ${status.maskedSuffix ?? ""}`
        : "Not configured"}
    </span>
  );
}

function RuntimeField({
  label,
  name,
  value,
  placeholder,
  type = "password",
  status,
  hint,
  onChange,
}: {
  label: string;
  name: keyof Draft;
  value: string;
  placeholder: string;
  type?: "password" | "url";
  status?: FieldStatus;
  hint?: string;
  onChange: (name: keyof Draft, value: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-xs">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted">{label}</span>
        <ConfiguredState status={status} />
      </span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : "off"}
        spellCheck={false}
        className="input-glow h-9 w-full rounded-md border border-border bg-surface-overlay px-3 font-mono text-[12px] outline-none"
        onChange={(event) => onChange(name, event.target.value)}
      />
      {hint ? <span className="block text-[11px] leading-4 text-muted-dim">{hint}</span> : null}
    </label>
  );
}

export function RuntimeSettingsForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<ConfigStatus>();
  const [demoFallback, setDemoFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<
    { tone: "success" | "error"; text: string } | undefined
  >();

  useEffect(() => {
    let active = true;

    void fetch("/api/settings/runtime", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          data?: ConfigStatus;
          error?: string;
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "Could not load runtime configuration");
        }
        if (active) {
          setStatus(payload.data);
          setDemoFallback(payload.data.demoFallback);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setMessage({
            tone: "error",
            text: cause instanceof Error ? cause.message : "Could not load settings",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const changeDraft = (name: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setMessage(undefined);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(undefined);

    const entered = Object.fromEntries(
      Object.entries(draft)
        .map(([key, value]) => [key, value.trim()])
        .filter(([, value]) => value.length > 0),
    );

    try {
      const response = await fetch("/api/settings/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entered, demoFallback }),
      });
      const payload = (await response.json()) as {
        data?: ConfigStatus;
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Could not save runtime configuration");
      }

      setStatus(payload.data);
      setDraft(EMPTY_DRAFT);
      setMessage({
        tone: "success",
        text: "Runtime configuration updated for this server process.",
      });
    } catch (cause) {
      setMessage({
        tone: "error",
        text: cause instanceof Error ? cause.message : "Could not save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={save}>
      <Panel>
        <PanelHeader
          title="Hermes runtime"
          description="Gateway credentials for live Luci orchestration."
          action={<KeyRound className="size-4 text-muted" aria-hidden />}
        />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <RuntimeField
            label="Hermes base URL"
            name="hermesBaseUrl"
            type="url"
            value={draft.hermesBaseUrl}
            placeholder="https://hermes.example.com"
            status={status?.hermesBaseUrl}
            onChange={changeDraft}
          />
          <RuntimeField
            label="Hermes API key"
            name="hermesApiKey"
            value={draft.hermesApiKey}
            placeholder="Enter a new gateway key"
            status={status?.hermesApiKey}
            onChange={changeDraft}
          />
          <div className="sm:col-span-2">
            <RuntimeField
              label="OpenAI API key"
              name="openAiApiKey"
              value={draft.openAiApiKey}
              placeholder="sk-..."
              status={status?.openAiApiKey}
              hint="This key belongs in the Hermes container. Mosaic stores it only in this server process and does not forward it to Hermes unless that integration is explicitly enabled."
              onChange={changeDraft}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Persistence"
          description="Convex connection used for durable runs and events."
          action={<ShieldCheck className="size-4 text-muted" aria-hidden />}
        />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <RuntimeField
            label="Convex URL"
            name="convexUrl"
            type="url"
            value={draft.convexUrl}
            placeholder="https://deployment.convex.cloud"
            status={status?.convexUrl}
            onChange={changeDraft}
          />
          <RuntimeField
            label="Convex auth token"
            name="convexAuthToken"
            value={draft.convexAuthToken}
            placeholder="Enter a new token"
            status={status?.convexAuthToken}
            onChange={changeDraft}
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 border-t border-border px-4 py-3">
          <input
            type="checkbox"
            checked={demoFallback}
            className="mt-0.5 size-4 accent-accent"
            onChange={(event) => {
              setDemoFallback(event.target.checked);
              setMessage(undefined);
            }}
          />
          <span>
            <span className="block text-[12px] font-medium text-foreground">
              Demo fallback
            </span>
            <span className="block text-[11px] leading-4 text-muted-dim">
              Use deterministic output when Hermes is unavailable.
            </span>
          </span>
        </label>
      </Panel>

      <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
        <div aria-live="polite">
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              Checking runtime
            </span>
          ) : message ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${
                message.tone === "success" ? "text-green" : "text-red"
              }`}
              role={message.tone === "error" ? "alert" : "status"}
            >
              {message.tone === "success" ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <AlertTriangle className="size-3.5" />
              )}
              {message.text}
            </span>
          ) : (
            <span className="text-[11px] text-muted-dim">
              Secrets stay in server memory and reset when the process restarts.
            </span>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          leftIcon={
            saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />
          }
          disabled={loading || saving}
        >
          {saving ? "Saving" : "Save runtime"}
        </Button>
      </div>
    </form>
  );
}
