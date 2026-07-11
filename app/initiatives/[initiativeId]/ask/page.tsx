"use client";

import { use } from "react";
import { AskLuciChat } from "@/components/ask-luci-chat";
import { useBackendInitiative } from "@/lib/backend-client";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default function AskLuciPage({ params }: PageProps) {
  const { initiativeId } = use(params);
  const { initiative, error } = useBackendInitiative(initiativeId);

  if (!initiative) {
    return <p className="p-6 text-sm text-muted">{error ?? "Loading initiative…"}</p>;
  }

  return <AskLuciChat initiative={initiative} />;
}
