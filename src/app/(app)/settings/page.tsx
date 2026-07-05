import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { getAppSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  return <SettingsPanel initial={settings} />;
}
