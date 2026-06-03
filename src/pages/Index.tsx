import { useCallback, useState } from "react";
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
import { Activity, FileUp, Sparkles } from "lucide-react";

const Index = () => {
  const [scene, setScene] = useState<MixerScene | null>(null);

  const handleParse = useCallback(
    (text: string, meta?: { fileName?: string; fileSize?: number }) => {
      setScene(parseSceneText(text, meta));
    },
    [],
  );

  const loadDemo = useCallback(() => setScene({ ...demoScene, parsedAt: new Date().toISOString() }), []);
  const clear = useCallback(() => setScene(null), []);

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
            <RoutingSummary scene={scene} />
            <WarningsPanel scene={scene} />
            <RouteCoveragePanel scene={scene} />

            <section className="panel">
              <Tabs defaultValue="production" className="w-full">
                <div className="border-b px-2 pt-2 no-print">
                  <TabsList className="flex flex-wrap">
                    <TabsTrigger value="production">Production Sheet</TabsTrigger>
                    <TabsTrigger value="export">Export</TabsTrigger>
                    <TabsTrigger value="advanced">Engineering</TabsTrigger>
                  </TabsList>
                </div>
                <div className="p-4 md:p-6">
                  <TabsContent value="production"><ProductionSheet scene={scene} /></TabsContent>
                  <TabsContent value="export"><ExportTab scene={scene} /></TabsContent>
                  <TabsContent value="advanced"><AdvancedTools scene={scene} /></TabsContent>
                </div>
              </Tabs>
            </section>
          </>
        ) : (
          <EmptyHint />
        )}
      </div>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground no-print">
        RouteView is a documentation tool. It does not connect to a console or modify scene data.
      </footer>

      {scene ? <PrintView scene={scene} /> : null}
    </main>
  );
};

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
    <div className="panel panel-bg flex flex-col items-center justify-center p-10 text-center">
      <div className="rounded-full bg-primary/10 p-3 text-primary">
        <FileUp className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-base font-semibold">No scene loaded yet</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Upload an X32 or M32 <code className="font-mono">.scn</code> file, paste scene text, or load demo data to see a
        full routing breakdown.
      </p>
    </div>
  );
}

export default Index;
