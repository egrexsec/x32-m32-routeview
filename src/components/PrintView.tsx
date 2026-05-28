import type { MixerScene } from "@/types/routing";
import { ProductionSheet } from "@/components/ProductionSheet";

export function PrintView({ scene }: { scene: MixerScene }) {
  return (
    <div className="print-view hidden print:block">
      <ProductionSheet scene={scene} printMode />
    </div>
  );
}
