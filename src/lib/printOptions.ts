export type PrintProfile = "volunteer" | "technical";
export type PrintTheme = "routeview" | "console" | "contrast" | "grayscale" | "routing";
export type PrintDensity = "compact" | "standard" | "large";
export type PrintPaper = "a4" | "letter";

export interface PrintOptions {
  profile: PrintProfile;
  theme: PrintTheme;
  density: PrintDensity;
  paper: PrintPaper;
  accentColor: string;
  documentTitle: string;
  venueName: string;
  preparedBy: string;
  revision: string;
  confidential: boolean;
  includeCover: boolean;
  includeAdvanced: boolean;
  includeTroubleshooting: boolean;
  showUnassigned: boolean;
}

export const defaultPrintOptions: PrintOptions = {
  profile: "volunteer",
  theme: "routeview",
  density: "standard",
  paper: "a4",
  accentColor: "#2563eb",
  documentTitle: "Volunteer Console Guide",
  venueName: "",
  preparedBy: "",
  revision: "1.0",
  confidential: false,
  includeCover: true,
  includeAdvanced: false,
  includeTroubleshooting: true,
  showUnassigned: false,
};

export const printThemeLabels: Record<PrintTheme, string> = {
  routeview: "RouteView Blue",
  console: "Console Dark",
  contrast: "High Contrast",
  grayscale: "Grayscale",
  routing: "Color-Coded Routing",
};
