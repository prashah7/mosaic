"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PageHeader } from "@/components/ui/panel";

type Initiative = {
  id: string;
  name: string;
  objective: string;
  health: string;
  successMetrics: string[];
};

export default function InitiativesPage() {
  const [items, setItems] = useState<Initiative[]>([]);
  useEffect(() => {
    fetch("/api/initiatives")
      .then((response) => response.json())
      .then((body) => setItems(body.data ?? []));
  }, []);

  return (
    <div className="stagger mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Initiatives"
        description="Goals Luci can prepare, synthesize, and move forward."
        action={
          <Link href="/initiatives/new">
            <Button variant="primary">New initiative</Button>
          </Link>
        }
      />
      <div className="space-y-2">
        {items.map((item) => (
          <Panel key={item.id} className="p-4">
            <Link
              href={`/initiatives/${item.id}`}
              className="block focus-ring rounded-md"
            >
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="mt-1 text-xs text-muted">{item.objective}</p>
              <p className="mt-2 text-[11px] text-muted-dim">
                {item.successMetrics.length} success metric
                {item.successMetrics.length === 1 ? "" : "s"} ·{" "}
                {item.health.replaceAll("_", " ")}
              </p>
            </Link>
          </Panel>
        ))}
      </div>
    </div>
  );
}
