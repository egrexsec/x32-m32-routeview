import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function InputsTab({ scene }: { scene: MixerScene }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return scene.inputs;
    return scene.inputs.filter((c) =>
      [c.number, c.name, c.source, ...(c.dcaAssignments ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [scene.inputs, q]);

  if (!scene.inputs.length) return <Empty label="No input channels were found in this scene." />;

  return (
    <div>
      <div className="relative mb-3 max-w-xs no-print">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search channels…"
          className="pl-8"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 w-16">Ch</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">DCA</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.number} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono tabular-nums">{c.number.toString().padStart(2, "0")}</td>
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.source ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{(c.dcaAssignments ?? []).join(", ") || "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{c.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BusesTab({ scene }: { scene: MixerScene }) {
  if (!scene.buses.length) return <Empty label="No mix buses were found." />;
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 w-16">Bus</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {scene.buses.map((b) => (
            <tr key={b.number} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2 font-mono tabular-nums">{b.number.toString().padStart(2, "0")}</td>
              <td className="px-3 py-2 font-medium">{b.name}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{b.type ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{b.notes ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DCAsTab({ scene }: { scene: MixerScene }) {
  if (!scene.dcas.length) return <Empty label="No DCA groups were found." />;
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 w-16">DCA</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Assigned Channels</th>
          </tr>
        </thead>
        <tbody>
          {scene.dcas.map((d) => (
            <tr key={d.number} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2 font-mono tabular-nums">{d.number}</td>
              <td className="px-3 py-2 font-medium">{d.name}</td>
              <td className="px-3 py-2 font-mono text-xs">
                {(d.assignedChannels ?? []).length
                  ? (d.assignedChannels ?? []).map((n) => n.toString().padStart(2, "0")).join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const OUTPUT_GROUPS = ["XLR", "Aux", "AES50-A", "AES50-B", "Card", "Ultranet", "Matrix", "Unknown"] as const;

export function OutputsTab({ scene }: { scene: MixerScene }) {
  if (!scene.outputs.length) return <Empty label="No outputs were found." />;
  return (
    <div className="space-y-4">
      {OUTPUT_GROUPS.map((g) => {
        const rows = scene.outputs.filter((o) => o.outputType === g);
        if (!rows.length) return null;
        return (
          <div key={g} className="overflow-hidden rounded-md border">
            <div className="flex items-center justify-between bg-muted/60 px-3 py-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</h4>
              <span className="text-xs text-muted-foreground">{rows.length}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 w-20">#</th>
                  <th className="px-3 py-1.5">Source</th>
                  <th className="px-3 py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-mono tabular-nums">{o.number}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{o.source}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{o.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
