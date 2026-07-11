import { RuntimeSettingsForm } from "@/components/runtime-settings-form";
import { PageHeader } from "@/components/ui/panel";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Runtime settings"
        description="Connect Mosaic to Hermes and Convex for this running demo."
      />
      <RuntimeSettingsForm />
    </div>
  );
}
