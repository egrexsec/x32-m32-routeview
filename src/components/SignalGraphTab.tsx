import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { buildDerivedSceneModel, channelDisplayName, channelNumber, type SignalTrace } from "@/lib/sceneModel";
import { GitBranch, Search } from "lucide-react";

function nodeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function matchesTrace(trace: SignalTrace, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return trace.path.some((part) => part.toLowerCase().includes(q));
}

export function SignalGraphTab({ scene }: { scene: MixerScene }) {
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const model = useMemo(() => buildDerivedSceneModel(scene), [scene]);

  const traces = useMemo(() => {
    const filtered = model.signalTraces.filter((trace) => matchesTrace(trace, query));
    return (activeOnly ? filtered.filter((trace) => trace.outputs.length > 0 || trace.send) : filtered).slice(0, 120);
  }, [activeOnly, model.signalTraces, query]);

  const columns = useMemo(() => {
    const inputs = new Map<string, string>();
    const buses = new Map<string, string>();
    const outputs = new Map<string, string>();

    for (const trace of traces) {
      inputs.set(`ch-${trace.input.number}`, `CH ${channelNumber(trace.input.number)}\n${channelDisplayName(trace.input)}`);
      if (trace.bus) buses.set(`bus-${trace.bus.number}`, `Bus ${channelNumber(trace.bus.number)}\n${trace.bus.name}`);
      else if (trace.send) buses.set(`bus-${trace.send.bus}`, `Bus ${channelNumber(trace.send.bus)}`);
      for (const output of trace.outputs) {
        outputs.set(`${output.outputType}-${output.number}`, `${output.outputType} ${output.number}\n${output.source}`);
      }
    }

    return { inputs: Array.from(inputs), buses: Array.from(buses), outputs: Array.from(outputs) };
  }, [traces]);

  if (!model.signalTraces.length) {
    return (
      <div className="panel flex items-center gap-2 p-4 text-sm">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <span>No signal traces were derived from this scene yet.</span>
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
              Scene-derived topology view showing input channels, mix buses, and mapped outputs. No venue-specific assumptions are used.
            </p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Visible Traces</div>
            <div className="font-mono text-xl font-semibold">{traces.length}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} />
            <span>Show active traces only</span>
          </label>
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter graph by channel, bus, output..."
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="signal-graph rounded-lg border bg-background p-4">
        <div className="signal-graph-columns">
          <GraphColumn title="Inputs" nodes={columns.inputs} />
          <GraphColumn title="Buses" nodes={columns.buses} />
          <GraphColumn title="Outputs" nodes={columns.outputs} />
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trace List
        </div>
        <div className="divide-y">
          {traces.map((trace) => (
            <div key={trace.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
              {trace.path.map((part, index) => (
                <span key={`${trace.id}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <span className="text-primary">→</span> : null}
                  <span className={index === 0 ? "font-semibold" : "text-muted-foreground"}>{part}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GraphColumn({ title, nodes }: { title: string; nodes: [string, string][] }) {
  return (
    <div className="signal-graph-column">
      <div className="signal-graph-title">{title}</div>
      <div className="signal-graph-node-list">
        {nodes.length ? nodes.map(([id, label]) => <GraphNode key={id} id={id} label={label} />) : <p className="text-xs text-muted-foreground">None</p>}
      </div>
    </div>
  );
}

function GraphNode({ id, label }: { id: string; label: string }) {
  return (
    <div className="signal-graph-node" data-node-id={nodeId(id)}>
      {label.split("\n").map((line, index) => (
        <span key={`${id}-${index}`} className={index === 0 ? "font-mono font-semibold" : "text-muted-foreground"}>{line}</span>
      ))}
    </div>
  );
}
