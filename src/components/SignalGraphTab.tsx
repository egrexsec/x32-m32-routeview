import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { buildDerivedSceneModel, channelDisplayName, channelNumber, type SignalTrace } from "@/lib/sceneModel";
import { GitBranch, Search } from "lucide-react";

function nodeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function matchesText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function matchesTrace(trace: SignalTrace, query: string): boolean {
  if (!query.trim()) return true;
  return trace.path.some((part) => matchesText(part, query));
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
      for (const output of trace.outputs) outputs.set(`${output.outputType}-${output.number}`, `${output.outputType} ${output.number}\n${output.source}`);
    }

    // Fallback topology: still show scene structure even when no explicit send/output traces exist.
    if (!inputs.size && !buses.size && !outputs.size) {
      const visibleInputs = (activeOnly ? model.activeInputs : model.inputs)
        .filter(({ channel }) => !query.trim() || matchesText(`CH ${channelNumber(channel.number)} ${channelDisplayName(channel)} ${channel.source ?? ""}`, query))
        .slice(0, 48);
      const visibleBuses = (activeOnly ? model.activeBuses : model.buses)
        .filter(({ bus }) => !query.trim() || matchesText(`Bus ${channelNumber(bus.number)} ${bus.name}`, query))
        .slice(0, 32);
      const visibleOutputs = (activeOnly ? model.activeOutputBanks : model.outputBanks)
        .flatMap((bank) => bank.outputs)
        .filter((output) => !query.trim() || matchesText(`${output.outputType} ${output.number} ${output.source}`, query))
        .slice(0, 48);

      for (const { channel } of visibleInputs) inputs.set(`ch-${channel.number}`, `CH ${channelNumber(channel.number)}\n${channelDisplayName(channel)}`);
      for (const { bus } of visibleBuses) buses.set(`bus-${bus.number}`, `Bus ${channelNumber(bus.number)}\n${bus.name}`);
      for (const output of visibleOutputs) outputs.set(`${output.outputType}-${output.number}`, `${output.outputType} ${output.number}\n${output.source}`);
    }

    return { inputs: Array.from(inputs), buses: Array.from(buses), outputs: Array.from(outputs) };
  }, [activeOnly, model.activeBuses, model.activeInputs, model.activeOutputBanks, model.buses, model.inputs, model.outputBanks, query, traces]);

  const hasGraphNodes = columns.inputs.length || columns.buses.length || columns.outputs.length;

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
              Scene-derived topology view showing input channels, mix buses, and mapped outputs. If explicit traces are unavailable, this view falls back to the parsed scene structure.
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
            <span>Show active topology only</span>
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

      {traces.length === 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-muted-foreground">
          No explicit signal traces were derived from sends/output mappings, so the graph is showing parsed topology nodes instead.
        </div>
      ) : null}

      <div className="signal-graph rounded-lg border bg-background p-4">
        <div className="signal-graph-columns">
          <GraphColumn title="Inputs" nodes={columns.inputs} />
          <GraphColumn title="Buses" nodes={columns.buses} />
          <GraphColumn title="Outputs" nodes={columns.outputs} />
        </div>
      </div>

      {traces.length ? (
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
      ) : null}
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
