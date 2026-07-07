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
import { Activity, ArrowUp, CheckCircle2, Download, FileText, FileUp, Share2, Sparkles } from "lucide-react";
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
        <div className="container relative py-12 md:py-16">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary/90">
            <Activity className="h-4 w-4" /> X32 / M32 Scene Documentation
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            X32/M32 <span className="text-primary">RouteView</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/75 md:text-lg">
            Upload a console scene file and generate clean routing documentation in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}>
              <FileUp className="mr-1.5 h-4 w-4" /> Upload .scn File
            </Button>
            <Button size="lg" variant="secondary" onClick={loadDemo}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Try Demo Data
            </Button>
          </div>
          <p className="mt-6 max-w-2xl text-sm text-white/60">
            Built for engineers, church production teams, and volunteers who need clear documentation from X32/M32 scene
            files without opening the console software.
          </p>
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
                    <p className="prod-kicker">Review Documentation</p>
                    <h2 className="text-2xl font-bold tracking-tight">Volunteer guide</h2>
                  </div>
                  <Button onClick={() => document.getElementById("export-documentation")?.scrollIntoView({ behavior: "smooth" })}>
                    <Download className="mr-1.5 h-4 w-4" /> Export Documentation
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
          <p className="prod-kicker">Documentation Ready</p>
          <h2>{guide.sceneName}</h2>
          <p>Review the volunteer guide, export Markdown, and share it with the audio team.</p>
        </div>
      </div>
      <div className="ready-metrics">
        <ReadyMetric label="Console" value={scene.mixerType} />
        <ReadyMetric label="Inputs" value={`${guide.counts.activeInputs}/${guide.counts.inputs}`} />
        <ReadyMetric label="Outputs" value={`${guide.counts.outputs}`} />
        <ReadyMetric label="Buses" value={`${guide.counts.monitorMixes}`} />
        <ReadyMetric label="DCAs" value={`${guide.counts.dcas}`} />
        <ReadyMetric label="FX" value={`${guide.counts.effects}`} />
      </div>
      <Button size="lg" onClick={() => document.getElementById("export-documentation")?.scrollIntoView({ behavior: "smooth" })}>
        <Download className="mr-1.5 h-4 w-4" /> Export Documentation
      </Button>
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
          <TabsTrigger value="buses">Buses</TabsTrigger>
          <TabsTrigger value="dcas">DCAs</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
          <TabsTrigger value="signal">Signal Flow</TabsTrigger>
          <TabsTrigger value="graph">Signal Graph</TabsTrigger>
          <TabsTrigger value="engineering">Engineering Data</TabsTrigger>
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
        <h3 className="mt-3 text-lg font-semibold">Create a volunteer-ready console guide</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an X32 or M32 scene file, review the documentation RouteView builds, then export it for your team.
        </p>
      </div>
      <div className="workflow-steps mt-8">
        <WorkflowStep icon={FileUp} title="Upload Scene" text="Choose a .scn file or paste scene text." />
        <WorkflowStep icon={FileText} title="Review Docs" text="Read inputs, monitors, outputs, DCAs, effects, and tips." />
        <WorkflowStep icon={Share2} title="Export & Share" text="Download the Markdown guide for your team." />
      </div>
    </div>
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
