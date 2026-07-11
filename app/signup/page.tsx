"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";

export default function SignupPage() {
  const router = useRouter();
  const { setField, markProgress } = useOnboarding();
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
    await new Promise((resolve) => setTimeout(resolve, 650));
    setField("workspaceName", `${name.split(" ")[0]}'s workspace`);
    markProgress("entered");
    setIsSubmitting(false);
    router.push("/onboarding");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="page-enter space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
            Step 1 · Account
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
            Create your Mosaic account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Prototype signup — no backend. Next you’ll name a workspace, then
            explore the seeded SSO demo.
          </p>
        </div>

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
              className="w-full pressable"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account…" : "Continue"}
            </Button>
          </form>
        </Panel>

        <p className="text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
