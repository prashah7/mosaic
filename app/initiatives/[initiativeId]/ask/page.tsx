"use client";

import { use } from "react";
import { AskLuciChat } from "@/components/ask-luci-chat";
import { getInitiative } from "@/lib/mosaic-data";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default function AskLuciPage({ params }: PageProps) {
  const { initiativeId } = use(params);
  const initiative = getInitiative(initiativeId);

  if (!initiative) {
    return (
      <p className="px-4 py-8 text-sm text-muted">Initiative not found.</p>
    );
  }

  return <AskLuciChat initiative={initiative} />;
}
