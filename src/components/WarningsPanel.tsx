import type { MixerScene } from "@/types/routing";
import { AlertTriangle, Bug, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function WarningsPanel({ scene }: { scene: MixerScene }) {
  const [showLines, setShowLines] = useState(false);
  const hasWarnings = scene.warnings.length > 0 || scene.unrecognizedLines.length > 0;

  if (!hasWarnings) {
    return (
      <div className="panel flex items-center gap-2 p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>Parser ran clean. No warnings or unrecognized lines.</span>
      </div>
    );
  }

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h4 className="text-sm font-semibold">Parser Warnings</h4>
      </div>
      <ul className="space-y-1 text-sm">
        {scene.warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">{w}</span>
          </li>
        ))}
      </ul>
      {scene.unrecognizedLines.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <button
            type="button"
            onClick={() => setShowLines((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Bug className="h-3.5 w-3.5" />
            {showLines ? "Hide" : "Show"} {scene.unrecognizedLines.length} unrecognized line(s)
          </button>
          {showLines && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed">
              {scene.unrecognizedLines.join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
