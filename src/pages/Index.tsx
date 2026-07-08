import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadPanel } from "@/components/UploadPanel";
import { RoutingSummary } from "@/components/RoutingSummary";
import { BusesTab, DCAsTab, InputsTab, OutputsTab } from "@/components/RoutingTabs";
import { SignalFlowTab } from "@/components/SignalFlowTab";
import { SignalGraphTab } from "@/components/SignalGraphTab";
import { ParserBucketsTab } from "@/components/ParserBucketsTab";
import { ProductionSheet } from "@/components/ProductionSheet";
import { ExportTab } from "@/components/ExportTab";
import { PrintView } from "@/components/PrintView";
import { WarningsPanel } from "@/components/WarningsPanel";
import { RouteCoveragePanel } from "@/components/RouteCoveragePanel";
import { parseSceneText } from "@/parsers/x32M32Parser";
import { demoScene } from "@/lib/demoScene";
import type { MixerScene } from "@/types/routing";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, CheckCircle2, FileDown, FileText, FileUp, Share2, Sparkles } from "lucide-react";
import { buildVolunteerGuide } from "@/lib/volunteerGuide";

const Index = () => {
  const [scene, setScene] = useState<MixerScene | null>(null);
  const documentationRef = useRef<HTMLDivElement | null>(null);

  const handleParse = useCallback(
    (text: string, meta?: { fileName?: string; fileSize?: number }) => {
      setScene(parseSceneText(text, meta));
    },
    [],
  );

  const loadDemo = useCallback(() => setScene({ ...demoScene, parsedAt: new Date().toISOString() }), []);
  const clear = useCallback(() => setScene(null), []);

  useEffect(() => {
    if (!scene) return;
    const timer = window.setTimeout(() => {
      documentationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [scene]);

  return (
    <main className="min-h-screen bg-background">
      <header className="hero-bg relative overflow-hidden text-white no-print">
        <div className="console-grid absolute inset-0 opacity-[0.08]" aria-hidden />
        <div className="container relative py-10 md:py-14">
          <p className="prod-kicker text-primary/90">X32 / M32 RouteView</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight md:text-5xl">
            Turn an X32/M32 scene file into a volunteer-friendly sound board guide.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">
            Upload your <code className="font-mono">.scn</code> file, review the generated guide, then export it for your church media team.
          </p>
          <WorkflowMap activeStep={scene ? 3 : 1} tone="dark" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}>
              <FileUp className="mr-1.5 h-4 w-4" /> Upload Your .scn File
            </Button>
            <Button size="lg" variant="secondary" onClick={loadDemo}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Preview With Demo
            </Button>
          </div>
        </div>
      </header>

      <div id="upload" className="container space-y-6 py-8">
        <UploadPanel scene={scene} onParseText={handleParse} onLoadDemo={loadDemo} onClear={clear} />

        {scene ? (
          <>
            <DocumentationReadyPanel scene={scene} />

            <div ref={documentationRef} id="documentation" className="space-y-6">
              <section className="panel p-4 md:p-6">
                <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="prod-kicker">You are here: Review Volunteer Guide</p>
                    <h2 className="text-2xl font-bold tracking-tight">Volunteer guide</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Next: export and share this guide with your team.</p>
                  </div>
                  <Button size="lg" onClick={() => window.print()}>
                    <FileDown className="mr-1.5 h-4 w-4" /> Export PDF
                  </Button>
                </div>
                <ProductionSheet scene={scene} />
              </section>

              <section id="export-documentation" className="scroll-mt-6">
                <ExportTab scene={scene} />
              </section>

              <details className="panel p-4 md:p-6">
                <summary className="cursor-pointer text-sm font-semibold">Advanced Console Details</summary>
                <div className="mt-5 space-y-5">
                  <RoutingSummary scene={scene} />
                  <WarningsPanel scene={scene} />
                  <RouteCoveragePanel scene={scene} />
                  <AdvancedTools scene={scene} />
                </div>
              </details>
            </div>
          </>
        ) : (
          <EmptyHint />
        )}
      </div>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground no-print">
        RouteView is a documentation tool. It does not connect to a console or modify scene data.
      </footer>

      {scene ? <PrintView scene={scene} /> : null}

      {scene ? (
        <button
          type="button"
          className="back-to-top no-print"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      ) : null}
    </main>
  );
};

function DocumentationReadyPanel({ scene }: { scene: MixerScene }) {
  const guide = useMemo(() => buildVolunteerGuide(scene), [scene]);

  return (
    <section className="ready-panel no-print">
      <div className="ready-panel-main">
        <span className="ready-icon"><CheckCircle2 className="h-5 w-5" /></span>
        <div>
          <p className="prod-kicker">Scene Analyzed Successfully</p>
          <h2>Your volunteer guide is ready.</h2>
          <p>You are here: Review Volunteer Guide. Next: Export and Share.</p>
        </div>
      </div>
      <div className="ready-metrics">
        <ReadyMetric label="Console" value={scene.mixerType} />
        <ReadyMetric label="Inputs" value={`${guide.counts.activeInputs}/${guide.counts.inputs}`} />
        <ReadyMetric label="Monitor Mixes" value={`${guide.counts.monitorMixes}`} />
        <ReadyMetric label="Main Outputs" value={`${guide.counts.outputs}`} />
        <ReadyMetric label="Group Controls" value={`${guide.counts.dcas}`} />
        <ReadyMetric label="FX" value={`${guide.counts.effects}`} />
      </div>
      <div className="ready-actions">
        <Button size="lg" onClick={() => window.print()}>
          <FileDown className="mr-1.5 h-4 w-4" /> Export PDF
        </Button>
        <button type="button" onClick={() => document.getElementById("export-documentation")?.scrollIntoView({ behavior: "smooth" })}>
          More export options
        </button>
      </div>
    </section>
  );
}

function ReadyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdvancedTools({ scene }: { scene: MixerScene }) {
  return (
    <Tabs defaultValue="inputs" className="w-full">
      <div className="mb-4 rounded-lg border bg-muted/20 p-2 no-print">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="buses">Monitor Mixes</TabsTrigger>
          <TabsTrigger value="dcas">Group Controls</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
          <TabsTrigger value="signal">Signal Flow</TabsTrigger>
          <TabsTrigger value="graph">Signal Graph</TabsTrigger>
          <TabsTrigger value="engineering">Items RouteView Could Not Explain</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="inputs"><InputsTab scene={scene} /></TabsContent>
      <TabsContent value="buses"><BusesTab scene={scene} /></TabsContent>
      <TabsContent value="dcas"><DCAsTab scene={scene} /></TabsContent>
      <TabsContent value="outputs"><OutputsTab scene={scene} /></TabsContent>
      <TabsContent value="signal"><SignalFlowTab scene={scene} /></TabsContent>
      <TabsContent value="graph"><SignalGraphTab scene={scene} /></TabsContent>
      <TabsContent value="engineering"><ParserBucketsTab scene={scene} /></TabsContent>
    </Tabs>
  );
}

function EmptyHint() {
  return (
    <div className="panel panel-bg p-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 text-primary">
          <FileUp className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-lg font-semibold">Step 1: Upload your .scn file</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          RouteView analyzes the file in your browser and builds a guide your volunteers can review and share.
        </p>
      </div>
      <div className="workflow-steps mt-8">
        <WorkflowStep icon={FileUp} title="Step 1: Upload your .scn file" text="Drop your X32/M32 scene file into the upload box." />
        <WorkflowStep icon={FileText} title="Step 2: Review the generated guide" text="Check the summary, quick reference, monitor mixes, and team notes." />
        <WorkflowStep icon={Share2} title="Step 3: Export it for your team" text="Print or save the PDF, with Markdown and HTML available as secondary options." />
      </div>
    </div>
  );
}

function WorkflowMap({ activeStep, tone = "light" }: { activeStep: number; tone?: "light" | "dark" }) {
  const steps = ["Upload Scene File", "RouteView Analyzes It", "Review Volunteer Guide", "Export and Share"];
  return (
    <ol className={`workflow-map workflow-map-${tone}`} aria-label="RouteView workflow">
      {steps.map((step, index) => (
        <li key={step} className={index + 1 === activeStep ? "is-active" : index + 1 < activeStep ? "is-done" : ""}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
          {index < steps.length - 1 ? <ArrowDown className="workflow-arrow h-4 w-4" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  );
}

function WorkflowStep({ icon: Icon, title, text }: { icon: typeof FileUp; title: string; text: string }) {
  return (
    <div className="workflow-step">
      <Icon className="h-5 w-5" />
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

export default Index;
