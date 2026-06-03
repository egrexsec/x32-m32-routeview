import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { GitBranch, Search, Workflow } from "lucide-react";
import { buildTopologyGraphView, type TopologyNode } from "@/lib/topologyGraph";

export function SignalGraphTab({ scene }: { scene: MixerScene }) {
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const topology = useMemo(
    () => buildTopologyGraphView(scene, { query, activeOnly }),
    [activeOnly, query, scene],
  );

  const hasGraphNodes =
    topology.inputs.length || topology.buses.length || topology.outputs.length || topology.routingBlocks.length;
  const nodeLookup = useMemo(
    () => new Map(topology.graph.nodes.map((node) => [node.id, node] as const)),
    [topology.graph.nodes],
  );

  if (!hasGraphNodes) {
    return (
      <div className="panel flex items-center gap-2 p-4 text-sm">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <span>No graphable scene topology was found for the current filter.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Visual Signal Graph</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Normalized topology view showing parsed routing entities. This is not React Flow yet, but it now runs on a
              reusable node-edge model instead of ad hoc UI grouping.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right md:grid-cols-4">
            <GraphStat label="Nodes" value={topology.graph.nodes.length} />
            <GraphStat label="Edges" value={topology.graph.edges.length} />
            <GraphStat label="Visible" value={topology.inputs.length + topology.buses.length + topology.outputs.length} />
            <GraphStat label="Routes" value={topology.summary.signalTraceCount} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
            <span>Show active topology only</span>
          </label>
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter graph by channel, bus, output, route block..."
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      {topology.edges.length === 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-muted-foreground">
          The current filter leaves no visible route edges. Clear the search or include inactive topology to inspect the
          full parse model.
        </div>
      ) : null}

      <div className="signal-graph rounded-lg border bg-background p-4">
        <div className="signal-graph-columns signal-graph-columns--wide">
          <GraphColumn title="Route Blocks" nodes={topology.routingBlocks} emptyLabel="No routing block nodes" />
          <GraphColumn title="Inputs" nodes={topology.inputs} emptyLabel="No input nodes" />
          <GraphColumn title="Buses" nodes={topology.buses} emptyLabel="No bus nodes" />
          <GraphColumn title="Outputs" nodes={topology.outputs} emptyLabel="No output nodes" />
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Edge List
        </div>
        <div className="divide-y">
          {topology.edges.length ? (
            topology.edges.map((edge) => (
              <div key={edge.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className="rounded-full border bg-background px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {edge.kind}
                </span>
                <span className="font-semibold">{nodeLookup.get(edge.source)?.label ?? edge.source}</span>
                <Workflow className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">{nodeLookup.get(edge.target)?.label ?? edge.target}</span>
                {edge.label ? <span className="text-xs text-muted-foreground">({edge.label})</span> : null}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">No visible edges matched the current filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function GraphStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function GraphColumn({ title, nodes, emptyLabel }: { title: string; nodes: TopologyNode[]; emptyLabel: string }) {
  return (
    <div className="signal-graph-column">
      <div className="signal-graph-title">{title}</div>
      <div className="signal-graph-node-list">
        {nodes.length ? nodes.map((node) => <GraphNode key={node.id} node={node} />) : <p className="text-xs text-muted-foreground">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function GraphNode({ node }: { node: TopologyNode }) {
  return (
    <div className="signal-graph-node" data-node-id={node.id}>
      <span className="font-mono font-semibold">{node.label}</span>
      {node.secondaryLabel ? <span className="text-muted-foreground">{node.secondaryLabel}</span> : null}
    </div>
  );
}
