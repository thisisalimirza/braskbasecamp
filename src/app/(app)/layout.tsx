import { AppShell } from "@/components/AppShell";
import { Toaster } from "sonner";
import { getAppShellData } from "@/lib/app-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const data = await getAppShellData();

  return (
    <>
      <AppShell {...data}>{children}</AppShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
