import type { MixerScene } from "@/types/routing";
import { ArrowRight, Cable, Sliders, Speaker, Radio } from "lucide-react";

export function SignalFlowTab({ scene }: { scene: MixerScene }) {
  const inputSummary = summarizeSources(scene);
  const busList = scene.buses.slice(0, 8);
  const outGroups = groupOutputs(scene);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Note: This signal flow is a simplified documentation view, not a full DSP schematic.
      </div>

      <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <FlowCard icon={Cable} title="Input Channels" count={scene.inputs.length}>
          <ul className="space-y-1">
            {inputSummary.map((s) => (
              <li key={s.label} className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="tabular-nums">{s.count}</span>
              </li>
            ))}
            {!inputSummary.length && <li className="text-xs text-muted-foreground">No inputs parsed.</li>}
          </ul>
        </FlowCard>

        <Arrow />

        <FlowCard icon={Sliders} title="Mix Buses / DCAs" count={scene.buses.length + scene.dcas.length}>
          <ul className="space-y-1">
            {busList.map((b) => (
              <li key={b.number} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">Bus {b.number.toString().padStart(2, "0")}</span>
                <span className="truncate pl-2 text-right">{b.name}</span>
              </li>
            ))}
            {scene.buses.length > busList.length && (
              <li className="text-[11px] text-muted-foreground">+ {scene.buses.length - busList.length} more buses</li>
            )}
            {scene.dcas.length > 0 && (
              <li className="border-t pt-1 text-[11px] text-muted-foreground">
                DCAs: {scene.dcas.map((d) => d.name).join(", ")}
              </li>
            )}
          </ul>
        </FlowCard>

        <Arrow />

        <FlowCard icon={Speaker} title="Outputs / Streams / Monitors" count={scene.outputs.length}>
          <ul className="space-y-1">
            {outGroups.map((g) => (
              <li key={g.type} className="flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground">{g.type}</span>
                <span className="tabular-nums">{g.count}</span>
              </li>
            ))}
            {!outGroups.length && <li className="text-xs text-muted-foreground">No outputs parsed.</li>}
          </ul>
        </FlowCard>
      </div>

      {scene.routingBlocks.length > 0 && (
        <div className="panel p-4">
          <div className="mb-2 flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Routing Blocks</h4>
          </div>
          <ul className="space-y-1.5">
            {scene.routingBlocks.map((r, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
                <span className="text-primary">{r.blockName}</span>
                <span className="text-muted-foreground">→</span>
                <span>{r.assignments.join("  ") || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FlowCard({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Cable;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary/10 p-1.5 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-muted-foreground">
      <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
    </div>
  );
}

function summarizeSources(scene: MixerScene) {
  const counts = new Map<string, number>();
  for (const ch of scene.inputs) {
    const tag = (ch.source ?? "Unassigned").replace(/\s*\d+.*$/, "").trim() || "Unassigned";
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function groupOutputs(scene: MixerScene) {
  const counts = new Map<string, number>();
  for (const o of scene.outputs) counts.set(o.outputType, (counts.get(o.outputType) ?? 0) + 1);
  return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
}
