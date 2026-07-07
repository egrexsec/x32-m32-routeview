import { useMemo, useState, type ReactNode } from "react";
import type { InputChannel, MixerScene } from "@/types/routing";
import {
  buildDerivedSceneModel,
  channelDisplayName,
  channelNumber,
  isDefaultOrUnusedInput,
  type OutputBank,
  type SignalTrace,
} from "@/lib/sceneModel";

type ColorMeta = { label: string; className: string };

const COLOR_MAP: Record<string, ColorMeta> = {
  RD: { label: "RED", className: "scribble-rd" },
  GN: { label: "GREEN", className: "scribble-gn" },
  YE: { label: "YELLOW", className: "scribble-ye" },
  CY: { label: "CYAN", className: "scribble-cy" },
  MG: { label: "MAGENTA", className: "scribble-mg" },
  WH: { label: "WHITE", className: "scribble-wh" },
  OFF: { label: "-", className: "scribble-off" },
};

const DOC_SECTIONS = [
  { id: "inputs", label: "Inputs" },
  { id: "dcas", label: "DCAs" },
  { id: "buses", label: "Buses" },
  { id: "outputs", label: "Outputs" },
  { id: "traces", label: "Signal Traces" },
  { id: "handoff", label: "Handoff Notes" },
];

function colorMeta(color?: string): ColorMeta {
  return COLOR_MAP[(color ?? "OFF").toUpperCase()] ?? COLOR_MAP.OFF;
}

function preampLabel(channel: InputChannel): string {
  return channel.processing?.preamp || "-";
}

function dcaLabel(channel: InputChannel): string {
  return (channel.dcaAssignments ?? []).join(", ") || "-";
}

function dcaAssignments(scene: MixerScene) {
  return Array.from({ length: 8 }, (_, index) => {
    const number = index + 1;
    const dca = scene.dcas.find((item) => item.number === number);
    const assigned = scene.inputs.filter((channel) => (dca?.assignedChannels ?? []).includes(channel.number));
    return { number, name: dca?.name || `DCA ${number}`, assigned };
  });
}

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function Highlight({ value, query }: { value: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{value}</>;
  const index = value.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index < 0) return <>{value}</>;
  return (
    <>
      {value.slice(0, index)}
      <mark className="rounded-sm bg-warning/35 px-0.5 text-foreground">{value.slice(index, index + trimmed.length)}</mark>
      {value.slice(index + trimmed.length)}
    </>
  );
}

function traceMatches(trace: SignalTrace, query: string): boolean {
  if (!query.trim()) return true;
  return trace.path.some((part) => matchesQuery(part, query));
}

export function ProductionSheet({ scene, printMode = false }: { scene: MixerScene; printMode?: boolean }) {
  const [hideInactive, setHideInactive] = useState(true);
  const [query, setQuery] = useState("");
  const generated = new Date(scene.parsedAt).toLocaleString();
  const derived = useMemo(() => buildDerivedSceneModel(scene), [scene]);
  const dcas = useMemo(() => dcaAssignments(scene), [scene]);

  const inputChannels = useMemo(
    () =>
      (hideInactive ? derived.activeInputs : derived.inputs)
        .map((item) => item.channel)
        .filter((channel) => channel.number >= 1 && channel.number <= 32)
        .filter((channel) => !query.trim() || matchesQuery(`CH ${channelNumber(channel.number)} ${channelDisplayName(channel)} ${channel.source ?? ""}`, query)),
    [derived.activeInputs, derived.inputs, hideInactive, query],
  );

  const visibleBuses = useMemo(
    () =>
      (hideInactive ? derived.activeBuses : derived.buses).filter(
        ({ bus }) => !query.trim() || matchesQuery(`Bus ${channelNumber(bus.number)} ${bus.name} ${bus.type ?? ""}`, query),
      ),
    [derived.activeBuses, derived.buses, hideInactive, query],
  );

  const visibleOutputBanks = useMemo(
    () =>
      (hideInactive ? derived.activeOutputBanks : derived.outputBanks)
        .map((bank) => ({
          ...bank,
          outputs: bank.outputs.filter(
            (output) => !query.trim() || matchesQuery(`${bank.title} ${output.number} ${output.source} ${output.notes ?? ""}`, query),
          ),
        }))
        .filter((bank) => !query.trim() || bank.outputs.length > 0),
    [derived.activeOutputBanks, derived.outputBanks, hideInactive, query],
  );

  const visibleRoutingBlocks = useMemo(
    () => derived.routingBlocks.filter((block) => !query.trim() || matchesQuery(`${block.blockName} ${block.assignments.join(" ")}`, query)),
    [derived.routingBlocks, query],
  );

  const visibleTraces = useMemo(
    () => derived.signalTraces.filter((trace) => traceMatches(trace, query)).slice(0, 80),
    [derived.signalTraces, query],
  );

  const visibleResultCount =
    inputChannels.length +
    visibleBuses.length +
    visibleOutputBanks.reduce((sum, bank) => sum + bank.outputs.length, 0) +
    visibleRoutingBlocks.length +
    visibleTraces.length;

  return (
    <div className={printMode ? "production-sheet production-sheet-print" : "production-sheet space-y-8"}>
      <header className="prod-header">
        <div>
          <p className="prod-kicker">X32 / M32 Production Sheet</p>
          <h1>{scene.fileName ?? "Scene Documentation"}</h1>
        </div>
        <div className="prod-meta">
          <div><strong>Scene File:</strong> {scene.fileName ?? "-"}</div>
          <div><strong>Generated:</strong> {generated}</div>
        </div>
      </header>

      {!printMode ? (
        <>
          <div className="no-print prod-toolbar">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={hideInactive} onChange={(event) => setHideInactive(event.target.checked)} />
              <span>Hide inactive items</span>
            </label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Quick find: channel, bus, output, route..."
              aria-label="Search generated documentation"
              className="min-w-[260px] flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            {query ? (
              <button type="button" className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setQuery("")}>
                Reset search
              </button>
            ) : null}
            <span>{inputChannels.length} input / {visibleBuses.length} bus / {visibleOutputBanks.length} output bank</span>
          </div>

          <nav className="no-print prod-section-nav" aria-label="Documentation sections">
            {DOC_SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>
        </>
      ) : null}

      {query && visibleResultCount === 0 ? (
        <div className="prod-empty rounded-lg border">
          No results found for "{query}". Try a channel name, bus number, output label, DCA name, route block, or warning text.
        </div>
      ) : null}

      <DocSection id="inputs" index="01" title="Input Channels" meta="CH 01-32">
        <div className="prod-table-wrap">
          <table className="prod-table prod-input-table">
            <thead><tr><th>Ch</th><th>Label / Name</th><th>Color</th><th>DCA Assignment</th><th>Preamp / Pad</th><th>Notes</th></tr></thead>
            <tbody>
              {inputChannels.map((channel) => {
                const meta = colorMeta(channel.color);
                return (
                  <tr key={channel.number} className={isDefaultOrUnusedInput(channel) ? "opacity-70" : undefined}>
                    <td className="prod-mono">{channelNumber(channel.number)}</td>
                    <td className="prod-strong"><Highlight value={channelDisplayName(channel)} query={query} /></td>
                    <td><span className={`scribble-chip ${meta.className}`}>{meta.label}</span></td>
                    <td>{dcaLabel(channel)}</td>
                    <td>{preampLabel(channel)}</td>
                    <td>{channel.notes ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!inputChannels.length ? <p className="prod-empty">No input channels found. Try clearing search or showing inactive items.</p> : null}
        </div>
      </DocSection>

      <DocSection id="dcas" index="02" title="DCA Groups" meta="DCA 1-8">
        <div className="dca-grid dca-fader-grid">
          {dcas.map((dca) => {
            const assigned = hideInactive ? dca.assigned.filter((channel) => !isDefaultOrUnusedInput(channel)) : dca.assigned;
            return (
              <div key={dca.number} className="dca-card dca-fader-card">
                <div className="dca-card-head"><span className="dca-number">DCA {dca.number}</span><strong>{dca.name}</strong></div>
                <div className="dca-fader-line" aria-hidden />
                {assigned.length ? <ul>{assigned.map((channel) => <li key={channel.number}><span className="prod-mono">{channelNumber(channel.number)}</span> {channelDisplayName(channel)}</li>)}</ul> : <p className="prod-muted">Unassigned</p>}
              </div>
            );
          })}
        </div>
      </DocSection>

      <DocSection id="buses" index="03" title="Mix Buses & Channel Sends" meta="Bus 01-16">
        <div className="bus-grid">
          {visibleBuses.map(({ bus, sendingInputs, mappedOutputs }) => (
            <div key={bus.number} className="bus-card">
              <div className="bus-card-head"><strong>Bus {channelNumber(bus.number)}</strong><span>{bus.name}</span></div>
              <div className="bus-type bus-role-mix">{bus.type ?? "Mix Bus"}</div>
              {mappedOutputs.length ? <p className="prod-muted">Mapped outputs: {mappedOutputs.map((output) => `${output.outputType} ${output.number}`).join(", ")}</p> : null}
              {sendingInputs.length ? (
                <ul>
                  {sendingInputs.map(({ channel, send }) => (
                    <li key={`${bus.number}-${channel.number}`}><span className="prod-mono">CH {channelNumber(channel.number)}</span> <Highlight value={channelDisplayName(channel)} query={query} /> - {send.level} {send.tap ? `(${send.tap})` : ""}</li>
                  ))}
                </ul>
              ) : <p className="prod-muted">No parsed active sends.</p>}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="outputs" index="04" title="Outputs & Routing Blocks" meta="Physical / Digital Routing">
        <div className="patch-grid">
          {visibleOutputBanks.map((bank) => <OutputBankCard key={bank.title} bank={bank} />)}
          {visibleRoutingBlocks.map((block) => <PatchBlock key={block.blockName} title={`${block.blockName} Routing Block`} values={block.assignments} />)}
          {!visibleOutputBanks.length && !visibleRoutingBlocks.length ? <p className="prod-muted">No outputs or routing blocks matched the current filter.</p> : null}
        </div>
      </DocSection>

      <DocSection id="traces" index="05" title="Signal Traces" meta="Derived from active sends and outputs">
        <div className="trace-grid">
          {visibleTraces.length ? visibleTraces.map((trace) => <TraceCard key={trace.id} trace={trace} />) : <p className="prod-muted">No signal traces matched the current filter.</p>}
        </div>
      </DocSection>

      <DocSection id="handoff" index="06" title="Handoff Notes" meta="For volunteers and guest engineers">
        <div className="handoff-grid">
          <div className="patch-card">
            <h3>Before service</h3>
            <p className="prod-muted">Confirm the scene file name, input labels, DCA groups, monitor buses, and output patches match the current room setup.</p>
          </div>
          <div className="patch-card">
            <h3>Troubleshooting</h3>
            <p className="prod-muted">Use Quick find to locate a channel, bus, output, DCA, or route block. Check warnings and uncategorized parser lines before relying on unsupported scene details.</p>
          </div>
        </div>
      </DocSection>
    </div>
  );
}

function DocSection({ id, index, title, meta, children }: { id: string; index: string; title: string; meta: string; children: ReactNode }) {
  return (
    <details id={id} className="prod-section" open>
      <summary className="prod-section-title">
        <div><span className="prod-section-index">{index}</span><h2>{title}</h2></div>
        <span>{meta}</span>
      </summary>
      {children}
    </details>
  );
}

function OutputBankCard({ bank }: { bank: OutputBank }) {
  return (
    <div className="patch-card output-bank-card">
      <h3>{bank.title}</h3>
      <div className="output-bank-grid">
        {bank.outputs.length ? bank.outputs.map((output) => (
          <div key={`${bank.title}-${output.number}`} className="output-port">
            <span className="prod-mono">{String(output.number).padStart(2, "0")}</span>
            <strong>{output.source}</strong>
            {output.notes ? <small>{output.notes}</small> : null}
          </div>
        )) : <p className="prod-muted">No mapped outputs found.</p>}
      </div>
    </div>
  );
}

function TraceCard({ trace }: { trace: SignalTrace }) {
  return (
    <div className="trace-card">
      {trace.path.map((part, index) => (
        <span key={`${trace.id}-${index}`}>
          {index > 0 ? <b>-&gt;</b> : null}
          {part}
        </span>
      ))}
    </div>
  );
}

function PatchBlock({ title, values }: { title: string; values?: string[] }) {
  return (
    <div className="patch-card">
      <h3>{title}</h3>
      {values?.length ? <div className="patch-pills">{values.map((value, index) => <span key={`${title}-${index}`} className="patch-pill">{value}</span>)}</div> : <p className="prod-muted">No routing block found.</p>}
    </div>
  );
}
