import type { MixerScene } from "@/types/routing";
import { Cable, Sliders, Users, Speaker, AlertTriangle } from "lucide-react";

export function RoutingSummary({ scene }: { scene: MixerScene }) {
  const stats = [
    { icon: Cable, label: "Input Channels", value: scene.inputs.length },
    { icon: Sliders, label: "Mix Buses", value: scene.buses.length },
    { icon: Users, label: "DCA Groups", value: scene.dcas.length },
    { icon: Speaker, label: "Outputs", value: scene.outputs.length },
    { icon: AlertTriangle, label: "Warnings", value: scene.warnings.length },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      ))}
    </section>
  );
}
