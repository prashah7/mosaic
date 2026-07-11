"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useOnboarding } from "@/components/onboarding-provider";

export default function LoginPage() {
  const router = useRouter();
  const { complete, goTo } = useOnboarding();
  const [email, setEmail] = useState("sambit@northline.dev");
  const [password, setPassword] = useState("••••••••");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    complete();
    goTo("complete");
    setIsSubmitting(false);
    router.push("/");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="page-enter space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-dim">
            Welcome back
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
            Sign in to Mosaic
          </h1>
          <p className="mt-2 text-sm text-muted">
            Simulated auth for the hackathon prototype.
          </p>
        </div>

        <Panel className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5 text-xs">
              <span className="text-muted">Email</span>
              <input
                type="email"
                className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-xs">
              <span className="text-muted">Password</span>
              <input
                type="password"
                className="input-glow h-10 w-full rounded-lg border border-border bg-surface-overlay px-3 text-sm outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button
              type="submit"
              variant="primary"
              className="w-full pressable"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Panel>

        <p className="text-center text-xs text-muted">
          New here?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
