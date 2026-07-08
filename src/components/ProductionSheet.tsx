import { useMemo, useState, type ReactNode } from "react";
import type { MixerScene } from "@/types/routing";
import { buildVolunteerGuide, type GuideInput } from "@/lib/volunteerGuide";
import { channelNumber } from "@/lib/sceneModel";
import { Button } from "@/components/ui/button";
import { Download, Headphones, Layers3, Mic2, Music2, Route, Search, SlidersHorizontal } from "lucide-react";
import { downloadText, exportBaseName, sceneToMarkdown } from "@/lib/exporters";
import { toast } from "sonner";

const SECTIONS = [
  { id: "quick-summary", label: "Quick Summary" },
  { id: "quick-reference", label: "Quick Reference" },
  { id: "volunteer-guide", label: "Volunteer Guide" },
  { id: "service-tips", label: "Service-Day Tips" },
  { id: "troubleshooting", label: "Troubleshooting" },
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

  return (
    <article className={printMode ? "production-sheet volunteer-guide production-sheet-print" : "production-sheet volunteer-guide space-y-8"}>
      <header className="prod-header volunteer-guide-header">
        <div>
          <p className="prod-kicker">Volunteer Console Guide</p>
          <h1>{guide.sceneName}</h1>
          <p className="prod-muted mt-2 max-w-3xl">
            A practical guide for service volunteers. Review the summary, check the key routes, then export and share it with your team.
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
                placeholder="Find a channel, monitor mix, group control, or output..."
                aria-label="Search volunteer guide"
                className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm"
              />
            </label>
            <Button
              size="lg"
              onClick={() => {
                downloadText(`${exportBaseName(scene)}-volunteer-guide.md`, markdown, "text/markdown");
                toast.success("Volunteer guide downloaded");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> Export Volunteer Guide
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

      <section id="quick-summary" className="guide-section">
        <div className="prod-section-title guide-section-title">
          <div><span className="prod-section-index">01</span><h2>Quick Summary</h2></div>
          <span>Did the upload work?</span>
        </div>
        <div className="quick-ref-grid">
          <SummaryCard label="Scene" value={guide.sceneName} />
          <SummaryCard label="Console" value={scene.mixerType} />
          <SummaryCard label="Inputs" value={`${guide.counts.activeInputs} active`} />
          <SummaryCard label="Monitor Mixes" value={`${guide.counts.monitorMixes}`} />
          <SummaryCard label="Main Speakers" value={guide.quickReference[0]?.value ?? "Check Main LR"} />
          <SummaryCard label="Livestream" value={guide.quickReference[1]?.value ?? "Not clearly labeled"} />
        </div>
      </section>

      <section id="quick-reference" className="guide-section">
        <div className="prod-section-title guide-section-title">
          <div><span className="prod-section-index">02</span><h2>Quick Reference</h2></div>
          <span>Readable in 30 seconds</span>
        </div>
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
          <Metric icon={Layers3} label="Group Controls" value={`${guide.counts.dcas}`} />
        </div>
      </section>

      <GuideSection id="volunteer-guide" index="03" title="Volunteer Guide" meta="What each area does">
        <div className="guide-two-column">
          <VolunteerInfo
            title="Input Channels"
            what="Microphones, instruments, playback, and other sound sources coming into the board."
            who="Audio volunteers use these during line check and service mixing."
            affects="The main room, monitor mixes, livestream, and recordings depending on routing."
            avoid="Avoid changing input gain during service unless the technical director asks you to."
          />
          <VolunteerInfo
            title="Monitor Mixes (Buses)"
            what="Personal mixes for musicians, speakers, or other destinations."
            who="Musicians, worship leaders, and stage teams."
            affects="Usually only what someone hears on stage or in their in-ear monitors."
            avoid="Do not change input gain to fix a monitor mix. Adjust the send to that monitor mix instead."
          />
          <VolunteerInfo
            title="Group Volume Controls (DCAs)"
            what="One fader that controls a group of related channels."
            who="Volunteers use these for quick section-level changes."
            affects="The channels assigned to that group without changing their individual mix balance."
            avoid="Do not use a group control to fix one bad channel. Find the specific channel first."
          />
          <VolunteerInfo
            title="Extra Output Feeds (Matrices)"
            what="Additional feeds for lobby, overflow, fills, livestream, or recording paths."
            who="Technical directors and advanced volunteers."
            affects="Other rooms, streams, recordings, or distributed speakers."
            avoid="Avoid changing these during service unless you know what destination they feed."
          />
        </div>
      </GuideSection>

      <GuideSection id="inputs" index="04" title="Input Channels" meta="What each source is">
        <div className="guide-list">
          {filteredInputs.length ? filteredInputs.map((input) => (
            <div key={input.channel.number} className="guide-row">
              <div className="guide-row-key">CH {channelNumber(input.channel.number)}</div>
              <div>
                <h3>{input.label}</h3>
                <p>{input.channel.source ? `Source: ${input.channel.source}` : "Confirm the source during line check."}</p>
              </div>
              <div className="guide-chip">{input.dcas.length ? `Group ${input.dcas.join(", ")}` : "No group"}</div>
            </div>
          )) : <p className="prod-empty">No matching input channels. Clear search to show the full guide.</p>}
        </div>
      </GuideSection>

      <GuideSection id="monitors" index="05" title="Monitor Mixes" meta="What musicians hear">
        <div className="guide-card-grid">
          {filteredMixes.length ? filteredMixes.map((mix) => (
            <div key={mix.bus.number} className="guide-card">
              <span>Monitor Mix (Bus {channelNumber(mix.bus.number)})</span>
              <h3>{mix.bus.name || "Unnamed monitor mix"}</h3>
              <p>{mix.purpose}</p>
              <small>Outputs: {mix.mappedOutputs.map((output) => `${output.outputType} ${output.number}`).join(", ") || "No mapped output parsed"}</small>
              <small>Common sources: {mix.sendingInputs.map((input) => input.label).join(", ") || "No active sends parsed"}</small>
            </div>
          )) : <p className="prod-muted">No active monitor mixes matched the current search.</p>}
        </div>
      </GuideSection>

      <GuideSection id="outputs" index="06" title="Main Outputs" meta="Where console audio leaves">
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

      <GuideSection id="dcas" index="07" title="Group Volume Controls" meta="Fast section-level control">
        <div className="guide-card-grid">
          {guide.dcaGroups.map((dca) => (
            <div key={dca.number} className="guide-card">
              <span>Group Volume Control (DCA {dca.number})</span>
              <h3>{dca.name}</h3>
              <p>{dca.assignedInputs.length ? dca.assignedInputs.map((input) => input.label).join(", ") : "Unassigned"}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="effects" index="08" title="Effects" meta="Reverb, delay, and FX sends">
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

      <GuideSection id="service-tips" index="09" title="Service-Day Tips" meta="What to do with this guide">
        <GuideList title="Use this file to train volunteers, document your board setup, or share with your media team." items={guide.volunteerTips} />
      </GuideSection>

      <GuideSection id="troubleshooting" index="10" title="Troubleshooting" meta="What to check first">
        <GuideList title="If something sounds wrong" items={guide.troubleshooting} />
      </GuideSection>

      <details className="prod-section advanced-console-details">
        <summary className="prod-section-title">
          <div><span className="prod-section-index"><SlidersHorizontal className="h-4 w-4" /></span><h2>Advanced Console Details</h2></div>
          <span>Mainly for technical directors and advanced users</span>
        </summary>
        <p className="prod-muted mb-4">
          This section includes AES50, Ultranet, patching, matrices, items RouteView could not fully explain, unknown scene lines, and raw routing details when available.
        </p>
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="guide-card guide-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function VolunteerInfo({
  title,
  what,
  who,
  affects,
  avoid,
}: {
  title: string;
  what: string;
  who: string;
  affects: string;
  avoid: string;
}) {
  return (
    <div className="guide-card volunteer-info-card">
      <h3>{title}</h3>
      <dl>
        <dt>What it is</dt>
        <dd>{what}</dd>
        <dt>Who uses it</dt>
        <dd>{who}</dd>
        <dt>What it affects</dt>
        <dd>{affects}</dd>
        <dt>Avoid</dt>
        <dd>{avoid}</dd>
      </dl>
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
