import { AppShell } from "@/components/AppShell";
import { AppSettingsProvider } from "@/components/AppSettingsProvider";
import { Toaster } from "sonner";
import { getAppShellData } from "@/lib/app-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const data = await getAppShellData();

  return (
    <AppSettingsProvider settings={data.appSettings}>
      <AppShell {...data}>{children}</AppShell>
      <Toaster position="top-center" richColors />
    </AppSettingsProvider>
  );
}
