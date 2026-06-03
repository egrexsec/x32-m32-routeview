import { Activity, Cable, GitBranch, Radio, Speaker } from "lucide-react";
import type { MixerScene } from "@/types/routing";
import { buildTopologyGraphView } from "@/lib/topologyGraph";
import { buildParserCoverageHealth } from "@/lib/parserHealth";

export function RouteCoveragePanel({ scene }: { scene: MixerScene }) {
  const topology = buildTopologyGraphView(scene, { activeOnly: true });
  const health = buildParserCoverageHealth(scene);

  const stats = [
    {
      icon: Cable,
      label: "Active Inputs",
      value: topology.summary.activeInputCount,
      detail: `${topology.summary.sendEdgeCount} active sends`,
    },
    {
      icon: Activity,
      label: "Active Buses",
      value: topology.summary.activeBusCount,
      detail: `${topology.summary.signalTraceCount} derived traces`,
    },
    {
      icon: Speaker,
      label: "Mapped Outputs",
      value: topology.summary.mappedOutputCount,
      detail: `${topology.summary.busOutputEdgeCount + topology.summary.directOutputEdgeCount} output edges`,
    },
    {
      icon: Radio,
      label: "Routing Blocks",
      value: topology.summary.routingBlockCount,
      detail: `${health.categorizedPercent}% parser categorized`,
    },
  ];

  return (
    <section className="panel p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <GitBranch className="h-3.5 w-3.5" />
            Topology Coverage
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">Scene routing is parsed into a usable engineering model.</h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            RouteView currently models offline scene topology well enough for documentation, search, and export. It is not yet a
            full live-console graph engine, so this panel makes the current coverage explicit.
          </p>
        </div>
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Parse Status</div>
          <div className="font-mono text-lg font-semibold">{scene.status}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, detail }) => (
          <div key={label} className="rounded-lg border bg-background/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Current Coverage</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Input channels, bus sends, DCA assignments, output patches, and routing blocks are modeled.</li>
            <li>• Derived topology powers production sheets, trace lists, and graph-style engineering views.</li>
            <li>• Uncategorized scene commands remain visible instead of being silently dropped.</li>
          </ul>
        </div>
        <div className="rounded-lg border bg-background/70 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Still Missing for Full Platform Maturity</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Stereo linking and matrix/main-bus-first modeling</li>
            <li>• Live OSC state sync and route validation</li>
            <li>• Multi-console/session comparison primitives</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
