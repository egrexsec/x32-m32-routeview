import type { MixerScene } from "@/types/routing";
import { ProductionSheet } from "@/components/ProductionSheet";
import type { PrintOptions } from "@/lib/printOptions";
import type { CSSProperties } from "react";

export function PrintView({ scene, options }: { scene: MixerScene; options: PrintOptions }) {
  const style = { "--print-accent": options.accentColor } as CSSProperties;
  return (
    <div
      className="print-view hidden print:block"
      data-theme={options.theme}
      data-density={options.density}
      data-paper={options.paper}
      style={style}
    >
      <ProductionSheet scene={scene} printMode printOptions={options} />
    </div>
  );
}
