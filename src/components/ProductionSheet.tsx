import { useMemo, useState, type ReactNode } from "react";
import type { MixerScene } from "@/types/routing";
import { buildVolunteerGuide, type GuideInput } from "@/lib/volunteerGuide";
import { channelNumber } from "@/lib/sceneModel";
import { Button } from "@/components/ui/button";
import { Copy, Download, Headphones, Layers3, Mic2, Music2, Printer, Route, Search, SlidersHorizontal } from "lucide-react";
import { downloadText, exportBaseName, sceneToMarkdown } from "@/lib/exporters";
import { toast } from "sonner";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "inputs", label: "Inputs" },
  { id: "monitors", label: "Monitor Mixes" },
  { id: "outputs", label: "Main Outputs" },
  { id: "dcas", label: "DCAs" },
  { id: "effects", label: "Effects" },
  { id: "tips", label: "Tips" },
];

function inputText(input: GuideInput): string {
  return `CH ${channelNumber(input.channel.number)} ${input.label} ${input.channel.source ?? ""} ${input.dcas.join(" ")}`;
}

function matches(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export function ProductionSheet({ scene, printMode = false }: { scene: MixerScene; printMode?: boolean }) {
  const guide = useMemo(() => buildVolunteerGuide(scene), [scene]);
  const markdown = useMemo(() => sceneToMarkdown(scene), [scene]);
  const [query, setQuery] = useState("");
  const filteredInputs = guide.activeInputs.filter((input) => !query.trim() || matches(inputText(input), query));
  const filteredMixes = guide.monitorMixes.filter((mix) => !query.trim() || matches(`${mix.label} ${mix.purpose}`, query));

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    toast.success("Volunteer guide copied");
  };

  return (
    <article className={printMode ? "production-sheet volunteer-guide production-sheet-print" : "production-sheet volunteer-guide space-y-8"}>
      <header className="prod-header volunteer-guide-header">
        <div>
          <p className="prod-kicker">Volunteer Console Guide</p>
          <h1>{guide.sceneName}</h1>
          <p className="prod-muted mt-2 max-w-3xl">
            A practical guide for upload, review, export, and team handoff. Use it to understand what each route does during a service.
          </p>
        </div>
        <div className="prod-meta">
          <div><strong>Console:</strong> {scene.mixerType}</div>
          <div><strong>Generated:</strong> {guide.generatedAt}</div>
          <div><strong>Status:</strong> {scene.status}</div>
        </div>
      </header>

      {!printMode ? (
        <>
          <div className="no-print prod-toolbar volunteer-toolbar">
            <label className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a channel, monitor mix, DCA, or output..."
                aria-label="Search volunteer guide"
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
              />
            </label>
            <Button
              variant="secondary"
              onClick={() => {
                downloadText(`${exportBaseName(scene)}-volunteer-guide.md`, markdown, "text/markdown");
                toast.success("Volunteer guide downloaded");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export Guide
            </Button>
            <Button variant="outline" onClick={copyMarkdown}>
              <Copy className="mr-1.5 h-4 w-4" /> Copy Markdown
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
          </div>

          <nav className="no-print prod-section-nav" aria-label="Volunteer guide sections">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>
        </>
      ) : null}

      <section id="overview" className="guide-section">
        <div className="quick-ref-grid">
          {guide.quickReference.map((item) => (
            <div key={item.label} className="guide-card guide-card-accent">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
        <div className="guide-metric-grid">
          <Metric icon={Mic2} label="Active Inputs" value={`${guide.counts.activeInputs}`} />
          <Metric icon={Headphones} label="Monitor Mixes" value={`${guide.counts.monitorMixes}`} />
          <Metric icon={Route} label="Outputs" value={`${guide.counts.outputs}`} />
          <Metric icon={Layers3} label="Assigned DCAs" value={`${guide.counts.dcas}`} />
        </div>
      </section>

      <GuideSection id="inputs" index="01" title="Input Channels" meta="What each source is">
        <div className="guide-list">
          {filteredInputs.length ? filteredInputs.map((input) => (
            <div key={input.channel.number} className="guide-row">
              <div className="guide-row-key">CH {channelNumber(input.channel.number)}</div>
              <div>
                <h3>{input.label}</h3>
                <p>{input.channel.source ? `Source: ${input.channel.source}` : "Confirm the source during line check."}</p>
              </div>
              <div className="guide-chip">{input.dcas.length ? `DCA ${input.dcas.join(", ")}` : "No DCA"}</div>
            </div>
          )) : <p className="prod-empty">No matching input channels. Clear search to show the full guide.</p>}
        </div>
      </GuideSection>

      <GuideSection id="monitors" index="02" title="Monitor Mixes" meta="What musicians hear">
        <div className="guide-card-grid">
          {filteredMixes.length ? filteredMixes.map((mix) => (
            <div key={mix.bus.number} className="guide-card">
              <span>Bus {channelNumber(mix.bus.number)}</span>
              <h3>{mix.bus.name || "Unnamed mix"}</h3>
              <p>{mix.purpose}</p>
              <small>Outputs: {mix.mappedOutputs.map((output) => `${output.outputType} ${output.number}`).join(", ") || "No mapped output parsed"}</small>
              <small>Common sources: {mix.sendingInputs.map((input) => input.label).join(", ") || "No active sends parsed"}</small>
            </div>
          )) : <p className="prod-muted">No active monitor mixes matched the current search.</p>}
        </div>
      </GuideSection>

      <GuideSection id="outputs" index="03" title="Main Outputs" meta="Where console audio leaves">
        <div className="guide-card-grid">
          {guide.mainOutputs.length ? guide.mainOutputs.map((item) => (
            <div key={`${item.output.outputType}-${item.output.number}`} className="guide-card">
              <span>{item.label}</span>
              <h3>{item.output.source}</h3>
              <p>{item.purpose}</p>
            </div>
          )) : <p className="prod-muted">No active outputs were detected. Verify console routing before service.</p>}
        </div>
      </GuideSection>

      <GuideSection id="dcas" index="04" title="DCA Groups" meta="Fast group control">
        <div className="guide-card-grid">
          {guide.dcaGroups.map((dca) => (
            <div key={dca.number} className="guide-card">
              <span>DCA {dca.number}</span>
              <h3>{dca.name}</h3>
              <p>{dca.assignedInputs.length ? dca.assignedInputs.map((input) => input.label).join(", ") : "Unassigned"}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="effects" index="05" title="Effects" meta="Reverb, delay, and FX sends">
        <div className="guide-card-grid">
          {guide.effects.length ? guide.effects.map((effect) => (
            <div key={effect.label} className="guide-card">
              <span><Music2 className="mr-1 inline h-3.5 w-3.5" /> Effect</span>
              <h3>{effect.label}</h3>
              <p>{effect.detail}</p>
            </div>
          )) : <p className="prod-muted">No named effects were detected in the parsed scene. Check the console effects rack if service uses effects.</p>}
        </div>
      </GuideSection>

      <GuideSection id="tips" index="06" title="Volunteer Tips" meta="Service-day handoff">
        <div className="guide-two-column">
          <GuideList title="Volunteer Notes" items={guide.volunteerTips} />
          <GuideList title="Troubleshooting" items={guide.troubleshooting} />
        </div>
      </GuideSection>

      <details className="prod-section advanced-console-details">
        <summary className="prod-section-title">
          <div><span className="prod-section-index"><SlidersHorizontal className="h-4 w-4" /></span><h2>Advanced Console Details</h2></div>
          <span>Raw routing context</span>
        </summary>
        <div className="guide-card-grid">
          <div className="guide-card">
            <span>Routing Blocks</span>
            <p>{scene.routingBlocks.length ? scene.routingBlocks.map((block) => `${block.blockName}: ${block.assignments.join(", ")}`).join(" / ") : "No routing blocks parsed."}</p>
          </div>
          <div className="guide-card">
            <span>Parser Categories</span>
            <p>{scene.unrecognizedCategories.length ? scene.unrecognizedCategories.map((category) => `${category.category} (${category.count})`).join(", ") : "No parser bucket categories."}</p>
          </div>
          <div className="guide-card">
            <span>Warnings</span>
            <p>{scene.warnings.length ? scene.warnings.join(" ") : "No warnings."}</p>
          </div>
        </div>
      </details>
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Mic2; label: string; value: string }) {
  return (
    <div className="guide-metric">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GuideSection({ id, index, title, meta, children }: { id: string; index: string; title: string; meta: string; children: ReactNode }) {
  return (
    <section id={id} className="prod-section guide-section">
      <div className="prod-section-title guide-section-title">
        <div><span className="prod-section-index">{index}</span><h2>{title}</h2></div>
        <span>{meta}</span>
      </div>
      {children}
    </section>
  );
}

function GuideList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="guide-card">
      <h3>{title}</h3>
      <ul className="guide-bullets">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

