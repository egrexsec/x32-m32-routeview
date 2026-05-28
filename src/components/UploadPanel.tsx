import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, FileText, Sparkles, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { StatusBadge } from "./StatusBadge";
import type { MixerScene } from "@/types/routing";

interface Props {
  scene: MixerScene | null;
  onParseText: (text: string, meta?: { fileName?: string; fileSize?: number }) => void;
  onLoadDemo: () => void;
  onClear: () => void;
}

function formatBytes(n?: number) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadPanel({ scene, onParseText, onLoadDemo, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        onParseText(text, { fileName: file.name, fileSize: file.size });
        toast.success(`Parsed ${file.name}`);
      };
      reader.onerror = () => toast.error("Could not read file");
      reader.readAsText(file);
    },
    [onParseText],
  );

  return (
    <section className="panel panel-bg p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Upload Scene File</h2>
          <p className="text-sm text-muted-foreground">
            Drag in a Behringer X32 or Midas M32 <code className="font-mono">.scn</code> file, or paste scene text below.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={onLoadDemo}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Try Demo Data
          </Button>
          {scene && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={[
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition",
            dragging ? "border-primary bg-primary/5" : "border-border bg-muted/40",
          ].join(" ")}
        >
          <FileUp className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Drop .scn file here</p>
          <p className="text-xs text-muted-foreground">or</p>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => inputRef.current?.click()}
          >
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".scn,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-muted-foreground">
            Or paste scene text
          </label>
          <Textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={`# 4.06\n/ch/01/config "Kick" 1 YE 33\n/bus/01/config "Drums" 1 RD ...`}
            className="mt-1 h-32 font-mono text-xs"
          />
          <Button
            size="sm"
            variant="secondary"
            className="mt-2 self-end"
            disabled={!pasted.trim()}
            onClick={() => {
              onParseText(pasted, { fileName: "pasted-scene.scn", fileSize: pasted.length });
              toast.success("Parsed pasted scene");
            }}
          >
            <FileText className="mr-1.5 h-4 w-4" /> Parse Text
          </Button>
        </div>
      </div>

      {scene && (
        <div className="mt-5 grid gap-3 rounded-md border bg-background p-3 md:grid-cols-4">
          <Meta label="File" value={scene.fileName ?? "—"} mono />
          <Meta label="Size" value={formatBytes(scene.fileSize)} />
          <Meta label="Mixer" value={scene.mixerType} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="mt-1">
              <StatusBadge status={scene.status} />
            </div>
          </div>
        </div>
      )}
    </section>
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
