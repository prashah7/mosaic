"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFlowShell, AuthFlowSkip } from "@/components/auth-flow-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";
import { SEED_INITIATIVE_ID } from "@/lib/mosaic-data";

export default function SignupPage() {
  const router = useRouter();
  const { setField, markProgress, complete } = useOnboarding();
  const [email, setEmail] = useState("sambit@northline.dev");
  const [name, setName] = useState("Sambit Nayak");
  const [password, setPassword] = useState("••••••••");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.includes("@") || name.trim().length < 2 || password.length < 6) {
      setError("Enter a valid name, email, and password (6+ characters).");
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const firstName = name.trim().split(/\s+/)[0] ?? "My";
    setField("workspaceName", `${firstName}'s workspace`);
    setIsSubmitting(false);
    router.push("/workspace");
  };

  const handleSkip = () => {
    complete();
    markProgress("entered");
  };

  return (
    <AuthFlowShell
      step="account"
      title="Create your Mosaic account"
      description="Prototype signup — no backend. Next you’ll name a workspace."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AuthFlowSkip
            href={`/initiatives/${SEED_INITIATIVE_ID}`}
            onClick={handleSkip}
          />
          <p className="text-xs text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      }
    >
      <Panel className="p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Full name</span>
            <input
              className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Work email</span>
            <input
              type="email"
              className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block space-y-1.5 text-xs">
            <span className="text-muted">Password</span>
            <input
              type="password"
              className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {error ? (
            <p className="shake text-xs text-red" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Continue"}
          </Button>
        </form>
      </Panel>
    </AuthFlowShell>
  );
}
