import { listVentures } from "@/lib/ventures";
import { ventureNetThisMonth } from "@/lib/pnl";
import { VenturesPageClient } from "@/components/ventures/VenturesPageClient";

export default async function VenturesPage() {
  const ventures = await listVentures();
  const netsByVentureId: Record<string, number> = {};
  for (const v of ventures) {
    netsByVentureId[v.id] = await ventureNetThisMonth(v.id);
  }
  return <VenturesPageClient ventures={ventures} netsByVentureId={netsByVentureId} />;
}
