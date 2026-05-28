# X32/M32 RouteView

RouteView is a browser-based documentation and signal-topology visualization tool for Behringer X32 and Midas M32 console scene files.

It transforms `.scn` files into readable production documentation, routing maps, signal traces, and engineering reference sheets without requiring X32-Edit or M32-Edit.

The application is designed to remain universally applicable across:

- Houses of worship
- Touring rigs
- Broadcast environments
- Corporate AV
- Theater
- Schools and education
- Rental and production companies
- Personal studios

RouteView does not assume a specific workflow or venue type.
All labels, routing, buses, outputs, colors, and topology are derived directly from the uploaded `.scn` file.

---

# Features

## Scene Import

- Upload X32/M32 `.scn` files
- Drag-and-drop scene support
- Paste raw scene text directly
- Demo scene loading
- Conservative parser behavior
- Parser warning and diagnostics system

---

## Production Sheet

The Production Sheet is the primary operational view.

It generates:

- Input channel documentation
- DCA group layouts
- Mix bus summaries
- Output routing maps
- Signal traces
- Routing block references

### Input Channels

Displays:

- Channel number
- Channel name
- Scribble strip color
- DCA assignments
- Preamp information
- Notes field

### Scribble Strip Color Rendering

Scene color codes are rendered visually:

| Scene Code | Display |
| --- | --- |
| RD | Red |
| GN | Green |
| YE | Yellow |
| CY | Cyan |
| MG | Magenta |
| WH | White |
| OFF | Neutral |

### DCA Groups

Displays DCA 1–8 assignments using console-style grouping.

### Mix Buses

Displays:

- Bus names
- Sending channels
- Send levels
- PRE/POST tap normalization
- Mapped outputs

### Physical Outputs

Outputs are grouped into physical-style banks:

- XLR outputs
- AES50 routing
- Card routing
- Ultranet routing
- Routing blocks

### Signal Traces

Derived signal topology tracing:

```text
CH 01 Kick
→ Bus 01 Drums
→ XLR 15
```

Signal traces are generated dynamically from:

- Channel sends
- Bus mappings
- Output assignments
- Routing topology

No hardcoded workflow assumptions are used.

---

# Universal Scene-Driven Architecture

RouteView is intentionally:

- topology-driven
- parser-driven
- workflow-agnostic

The application never assumes:

- church routing
- broadcast workflows
- monitor structures
- naming conventions
- venue-specific organization

Everything derives from the uploaded `.scn` file.

---

# Derived Scene Model

RouteView now uses a derived topology layer.

Architecture:

```text
Raw Scene Parse
        ↓
DerivedSceneModel
        ↓
Presentation Layers
```

The `DerivedSceneModel` computes:

- Active inputs
- Active buses
- Output banks
- Signal traces
- Send relationships
- Routing topology
- Active/inactive filtering

This architecture enables:

- Signal tracing
- Advanced exports
- Search/filter systems
- Future compare/diff tools
- Volunteer vs Engineer views
- Routing intelligence

---

# Current Views

| View | Purpose |
| --- | --- |
| Production Sheet | Operational routing documentation |
| Export | Markdown, CSV, and print/PDF exports |
| Inputs | Detailed input channel data |
| Buses | Detailed bus and send data |
| DCAs | DCA assignment views |
| Outputs | Output and patch mapping |
| Signal Flow | Simplified routing relationships |
| Engineering Data | Advanced parser and categorized scene data |

---

# Search & Filtering

RouteView includes:

- Quick Find search
- Active/inactive filtering
- Hide unused channels
- Trace filtering
- Output filtering

Search can locate:

- Channels
- Buses
- Outputs
- Routing references
- Signal traces

---

# Export Features

Supported exports:

- Markdown
- CSV
- Print/PDF

Exports can optionally include:

- Parser bucket categories
- Production Sheet sections
- Routing details
- Engineering data

---

# Print Optimization

The print system is optimized for:

- Clipboard documentation
- FOH reference sheets
- Volunteer handouts
- Technical routing archives
- PDF exports

Includes:

- Print-safe color rendering
- Compact spacing
- Sticky table headers
- Page-break protection
- Inter/system font stack
- Console-style layout formatting

---

# Supported Mixer Files

Currently supported:

- Behringer X32 `.scn`
- Midas M32 `.scn`

The parser is intentionally conservative.

It:

- extracts recognized routing data
- preserves unsupported lines
- categorizes parser buckets
- avoids destructive assumptions
- never modifies original scene files

---

# Parser Support

Currently recognized:

```text
/ch/01/config
/ch/01/grp
/ch/01/preamp
/ch/01/mix/01
/bus/01/config
/dca/1/config
/outputs/main/01
/config/routing/IN
```

Parser buckets categorize additional engineering data including:

- Channel EQ
- Dynamics
- Gate
- Inserts
- Bus processing
- Matrix processing
- User routing
- Effects rack
- Headamps
- Talkback
- Console configuration

Only truly unmatched lines are marked uncategorized.

---

# Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack React Query
- Vitest

---

# Getting Started

## Prerequisites

Recommended:

- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Development Server

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

## Preview Build

```bash
npm run preview
```

## Run Tests

```bash
npm run test
```

## Run Linting

```bash
npm run lint
```

---

# Basic Usage

1. Open the application
2. Upload an X32/M32 `.scn` file
3. Review the Production Sheet
4. Search/filter routing data
5. Inspect Engineering Data if needed
6. Export documentation as Markdown, CSV, or PDF

---

# Project Structure

```text
src/
├── components/        # UI views and production sheets
├── lib/               # Derived scene model and utilities
├── pages/             # Main application pages
├── parsers/           # Scene parsers
├── types/             # Shared routing models
└── App.tsx
```

---

# Current Roadmap

## Immediate Priorities

- Visual signal-path graphing
- Parser coverage metrics
- Compact density modes
- Output trace overlays
- Advanced routing visualization

## Future Features

- Scene diff/compare
- Volunteer vs Engineer modes
- Additional mixer support
- Advanced topology graphs
- Standalone PDF generation
- Saved documentation profiles

---

# Important Notes

RouteView is a documentation and visualization tool only.

It does not:

- connect to live consoles
- modify scene files
- push changes to hardware
- replace console editor software

Use it to:

- understand routing
- troubleshoot topology
- document scenes
- archive configurations
- onboard volunteers
- review signal flow

---

# Contributing

Keep changes:

- focused
- operationally useful
- topology-driven
- workflow-agnostic
- parser-safe

The goal is to help engineers quickly understand real-world console scenes under production conditions.

---

# License

No license has been defined yet.
