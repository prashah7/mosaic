import { notFound } from "next/navigation";
import { AskLuciChat } from "@/components/ask-luci-chat";
import { getInitiative } from "@/lib/mosaic-data";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default async function AskLuciPage({ params }: PageProps) {
  const { initiativeId } = await params;
  const initiative = getInitiative(initiativeId);

  if (!initiative) {
    notFound();
  }

  return <AskLuciChat initiative={initiative} />;
}
