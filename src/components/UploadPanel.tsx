import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileUp, RefreshCcw, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./StatusBadge";
import type { MixerScene } from "@/types/routing";
import { formatBytes, MAX_SCENE_BYTES, validateSceneFile } from "@/lib/uploadValidation";

interface Props {
  scene: MixerScene | null;
  onParseText: (text: string, meta?: { fileName?: string; fileSize?: number }) => void;
  onLoadDemo: () => void;
  onClear: () => void;
}

const STAGES = [
  "Reading scene file...",
  "Finding inputs...",
  "Finding monitor mixes...",
  "Finding outputs...",
  "Building volunteer guide...",
];

type UploadState =
  | { kind: "idle"; message?: string }
  | { kind: "processing"; stage: string; fileName: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function UploadPanel({ scene, onParseText, onLoadDemo, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateSceneFile(file);
      if (validationError) {
        setUploadState({ kind: "error", message: validationError });
        toast.error("Scene file not accepted");
        return;
      }

      setUploadState({ kind: "processing", stage: STAGES[0], fileName: file.name });
      const reader = new FileReader();
      readerRef.current = reader;

      reader.onload = () => {
        try {
          const text = String(reader.result ?? "");
          const stages = STAGES;
          let stageIndex = 0;
          const runNextStage = () => {
            setUploadState({ kind: "processing", stage: stages[stageIndex], fileName: file.name });
            stageIndex += 1;
            if (stageIndex < stages.length) {
              window.requestAnimationFrame(runNextStage);
              return;
            }
            onParseText(text, { fileName: file.name, fileSize: file.size });
            setUploadState({ kind: "success", message: "Scene Analyzed Successfully. Your volunteer guide is ready." });
            toast.success("Scene analyzed successfully");
            readerRef.current = null;
          };
          window.requestAnimationFrame(runNextStage);
        } catch (error) {
          const message = error instanceof Error ? error.message : "RouteView could not read this scene.";
          setUploadState({
            kind: "error",
            message: `${message} Try exporting the scene again from your console or X32-Edit.`,
          });
          toast.error("RouteView could not read this scene");
        }
      };

      reader.onabort = () => {
        setUploadState({ kind: "idle", message: "Upload canceled." });
        readerRef.current = null;
      };
      reader.onerror = () => {
        setUploadState({ kind: "error", message: "RouteView could not read this scene. Try exporting the scene again from your console or X32-Edit." });
        toast.error("Could not read file");
        readerRef.current = null;
      };
      reader.readAsText(file);
    },
    [onParseText],
  );

  const cancelUpload = () => {
    if (readerRef.current?.readyState === FileReader.LOADING) readerRef.current.abort();
    setUploadState({ kind: "idle", message: "Upload canceled." });
  };

  return (
    <section className="panel panel-bg p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="prod-kicker">What should I do next?</p>
          <h2 className="text-lg font-semibold tracking-tight">Step 1: Upload your .scn file</h2>
          <p className="text-sm text-muted-foreground">
            Drop your X32/M32 <code className="font-mono">.scn</code> file here, or click to choose a file.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Accepted file type: .scn. Your file is analyzed in the browser.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={onLoadDemo}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Try Demo Data
          </Button>
          {scene ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClear();
                setUploadState({ kind: "idle" });
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={[
            "relative flex min-h-[17rem] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition",
            dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40",
          ].join(" ")}
          role="button"
          tabIndex={0}
          aria-label="Upload an X32 or M32 scene file"
        >
          <FileUp className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-base font-semibold">{scene ? "Drop a replacement X32/M32 .scn file here" : "Drop your X32/M32 .scn file here"}</p>
          <p className="text-sm text-muted-foreground">or click to choose a file</p>
          <p className="mt-2 text-xs text-muted-foreground">Accepted file type: .scn. Analyzed in your browser.</p>
          <Button size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
            {scene ? <RefreshCcw className="mr-1.5 h-4 w-4" /> : null}
            {scene ? "Replace File" : "Choose File"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".scn"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <UploadStatus state={uploadState} onCancel={cancelUpload} />

      {scene ? (
        <div className="mt-5 grid gap-3 rounded-md border bg-background p-3 md:grid-cols-4">
          <Meta label="File" value={scene.fileName ?? "-"} mono />
          <Meta label="Size" value={formatBytes(scene.fileSize)} />
          <Meta label="Mixer" value={scene.mixerType} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="mt-1">
              <StatusBadge status={scene.status} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UploadStatus({ state, onCancel }: { state: UploadState; onCancel: () => void }) {
  if (state.kind === "idle" && !state.message) return null;

  const tone =
    state.kind === "error"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : state.kind === "success"
        ? "border-success/40 bg-success/10 text-success"
        : "border-primary/35 bg-primary/10 text-primary";

  return (
    <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${tone}`} role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        {state.kind === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
        {state.kind === "processing" ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" aria-hidden /> : null}
        <span>{state.kind === "processing" ? `${state.stage} - ${state.fileName}` : state.message}</span>
      </div>
      {state.kind === "processing" ? (
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="mr-1.5 h-4 w-4" /> Cancel
        </Button>
      ) : null}
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
