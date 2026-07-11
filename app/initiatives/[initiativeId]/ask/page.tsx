import { AskLuciChat } from "@/components/ask-luci-chat";
import { getInitiative } from "@/lib/mosaic-data";

type PageProps = {
  params: Promise<{ initiativeId: string }>;
};

export default async function AskLuciPage({ params }: PageProps) {
  const { initiativeId } = await params;
  const initiative = getInitiative(initiativeId);

  if (!initiative) {
    return <p className="p-6 text-sm text-muted">Initiative not found.</p>;
  }

  return <AskLuciChat initiative={initiative} />;
}
