import { useMemo, useState } from "react";
import type { InputChannel, MixerScene, MixBus, OutputPatch } from "@/types/routing";

type ColorMeta = { label: string; className: string };

const COLOR_MAP: Record<string, ColorMeta> = {
  RD: { label: "Red", className: "scribble-rd" },
  GN: { label: "Green", className: "scribble-gn" },
  YE: { label: "Yellow", className: "scribble-ye" },
  CY: { label: "Cyan", className: "scribble-cy" },
  MG: { label: "Magenta", className: "scribble-mg" },
  WH: { label: "White", className: "scribble-wh" },
  OFF: { label: "—", className: "scribble-off" },
};

function channelNumber(n: number): string {
  return n.toString().padStart(2, "0");
}

function channelName(channel: InputChannel): string {
  const fallback = `Ch ${channel.number}`;
  return channel.name?.trim() || fallback;
}

function isUnusedChannel(channel: InputChannel): boolean {
  const normalized = channel.name?.trim().toLowerCase() ?? "";
  return !normalized || normalized === `ch ${channel.number}` || normalized === channelNumber(channel.number) || normalized.includes("unused");
}

function colorMeta(color?: string): ColorMeta {
  return COLOR_MAP[(color ?? "OFF").toUpperCase()] ?? COLOR_MAP.OFF;
}

function preampLabel(channel: InputChannel): string {
  const preamp = channel.processing?.preamp;
  if (preamp) return preamp;
  return "—";
}

function dcaLabel(channel: InputChannel): string {
  return (channel.dcaAssignments ?? []).join(", ") || "—";
}

function dcaAssignments(scene: MixerScene) {
  return Array.from({ length: 8 }, (_, index) => {
    const number = index + 1;
    const dca = scene.dcas.find((item) => item.number === number);
    const assigned = scene.inputs.filter((channel) => (dca?.assignedChannels ?? []).includes(channel.number));
    return {
      number,
      name: dca?.name || `DCA ${number}`,
      assigned,
    };
  });
}

function busType(bus: MixBus): string {
  const name = bus.name.toLowerCase();
  if (/monitor|mon|iem|wedge|stage/.test(name)) return "Stage Monitor";
  if (/stream|broadcast|online|record|rec/.test(name)) return "Broadcast / Stream";
  if (/fx|verb|delay|reverb/.test(name)) return "FX Rack Send";
  if (/matrix|sub|fill|lobby|foyer/.test(name)) return "Matrix / Fill / Subs";
  return bus.type ?? "Mix Bus";
}

function sendingChannels(scene: MixerScene, busNumber: number) {
  return scene.inputs
    .map((channel) => {
      const send = (channel.sends ?? []).find((item) => item.bus === busNumber);
      if (!send || !send.enabled || send.level === "-oo") return null;
      return { channel, send };
    })
    .filter(Boolean) as { channel: InputChannel; send: NonNullable<InputChannel["sends"]>[number] }[];
}

function outputGroups(outputs: OutputPatch[], type: string, size = 4) {
  const rows = outputs.filter((output) => output.outputType === type);
  const max = rows.reduce((highest, output) => Math.max(highest, Number(output.number) || 0), 0);
  const groupCount = Math.max(1, Math.ceil(max / size));
  return Array.from({ length: groupCount }, (_, groupIndex) => {
    const start = groupIndex * size + 1;
    const end = start + size - 1;
    return {
      label: `${type} ${start}-${end}`,
      rows: rows.filter((output) => Number(output.number) >= start && Number(output.number) <= end),
    };
  });
}

export function ProductionSheet({ scene, printMode = false }: { scene: MixerScene; printMode?: boolean }) {
  const [hideUnused, setHideUnused] = useState(false);
  const generated = new Date(scene.parsedAt).toLocaleString();
  const inputChannels = useMemo(() => {
    const mainInputs = scene.inputs.filter((channel) => channel.number >= 1 && channel.number <= 32);
    return hideUnused ? mainInputs.filter((channel) => !isUnusedChannel(channel)) : mainInputs;
  }, [hideUnused, scene.inputs]);
  const dcas = useMemo(() => dcaAssignments(scene), [scene]);
  const xlrGroups = outputGroups(scene.outputs, "XLR");
  const aes50A = scene.routingBlocks.find((block) => block.blockName === "AES50A");
  const aes50B = scene.routingBlocks.find((block) => block.blockName === "AES50B");
  const outBlock = scene.routingBlocks.find((block) => block.blockName === "OUT");

  return (
    <div className={printMode ? "production-sheet production-sheet-print" : "production-sheet space-y-6"}>
      <header className="prod-header">
        <div>
          <p className="prod-kicker">X32 / M32 Production Sheet</p>
          <h1>{scene.fileName ?? "Scene Documentation"}</h1>
        </div>
        <div className="prod-meta">
          <div><strong>Show / Scene:</strong> {scene.fileName ?? "—"}</div>
          <div><strong>Generated:</strong> {generated}</div>
        </div>
      </header>

      {!printMode ? (
        <div className="no-print rounded-lg border bg-muted/30 p-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={hideUnused} onChange={(event) => setHideUnused(event.target.checked)} />
            <span>Hide unused channels</span>
          </label>
        </div>
      ) : null}

      <section className="prod-section">
        <div className="prod-section-title">
          <h2>Main Input Channels</h2>
          <span>CH 01–32</span>
        </div>
        <div className="prod-table-wrap">
          <table className="prod-table prod-input-table">
            <thead>
              <tr>
                <th>Ch</th>
                <th>Label / Name</th>
                <th>Color</th>
                <th>DCA / Subgroup</th>
                <th>Preamp / Pad</th>
                <th>Notes / Use-Case</th>
              </tr>
            </thead>
            <tbody>
              {inputChannels.map((channel) => {
                const meta = colorMeta(channel.color);
                return (
                  <tr key={channel.number}>
                    <td className="prod-mono">{channelNumber(channel.number)}</td>
                    <td className="prod-strong">{channelName(channel)}</td>
                    <td>
                      <span className={`scribble-chip ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td>{dcaLabel(channel)}</td>
                    <td>{preampLabel(channel)}</td>
                    <td>{channel.notes ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="prod-section">
        <div className="prod-section-title">
          <h2>DCA Groups</h2>
          <span>Volunteer Fader Map</span>
        </div>
        <div className="dca-grid">
          {dcas.map((dca) => (
            <div key={dca.number} className="dca-card">
              <div className="dca-card-head">[DCA {dca.number}] {dca.name}</div>
              {dca.assigned.length ? (
                <ul>
                  {dca.assigned.map((channel) => (
                    <li key={channel.number}>
                      <span className="prod-mono">{channelNumber(channel.number)}</span> {channelName(channel)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="prod-muted">Unassigned</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="prod-section">
        <div className="prod-section-title">
          <h2>Mix Busses & Aux Sends</h2>
          <span>Monitor / Stream / FX Overview</span>
        </div>
        <div className="bus-grid">
          {scene.buses.map((bus) => {
            const sends = sendingChannels(scene, bus.number);
            return (
              <div key={bus.number} className="bus-card">
                <div className="bus-card-head">
                  <strong>Mix Bus {channelNumber(bus.number)}</strong>
                  <span>{bus.name}</span>
                </div>
                <div className="bus-type">{busType(bus)}</div>
                {sends.length ? (
                  <ul>
                    {sends.map(({ channel, send }) => (
                      <li key={`${bus.number}-${channel.number}`}>
                        <span className="prod-mono">CH {channelNumber(channel.number)}</span> {channelName(channel)} — {send.level} {send.tap ? `(${send.tap})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="prod-muted">No parsed active sends.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="prod-section">
        <div className="prod-section-title">
          <h2>Hardware Outputs & Patching</h2>
          <span>Physical Troubleshooting Map</span>
        </div>
        <div className="patch-grid">
          {xlrGroups.map((group) => (
            <div key={group.label} className="patch-card">
              <h3>{group.label}</h3>
              <table className="prod-table compact">
                <tbody>
                  {group.rows.length ? group.rows.map((output) => (
                    <tr key={`${group.label}-${output.number}`}>
                      <td className="prod-mono">Out {output.number}</td>
                      <td>{output.source}</td>
                      <td>{output.notes ?? ""}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3}>No mapped outputs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
          <PatchBlock title="Local Output Blocks" values={outBlock?.assignments} />
          <PatchBlock title="AES50-A Blocks" values={aes50A?.assignments} />
          <PatchBlock title="AES50-B Blocks" values={aes50B?.assignments} />
        </div>
      </section>
    </div>
  );
}

function PatchBlock({ title, values }: { title: string; values?: string[] }) {
  return (
    <div className="patch-card">
      <h3>{title}</h3>
      {values?.length ? (
        <div className="patch-pills">
          {values.map((value, index) => (
            <span key={`${title}-${index}`} className="patch-pill">{value}</span>
          ))}
        </div>
      ) : (
        <p className="prod-muted">No routing block found.</p>
      )}
    </div>
  );
}
