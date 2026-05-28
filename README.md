# X32/M32 RouteView

RouteView is a topology-aware documentation and visualization platform for Behringer X32 and Midas M32 scene files.

It converts `.scn` files into readable operational documentation, signal-flow references, routing maps, engineering summaries, and production-ready print sheets.

Unlike traditional console editors, RouteView focuses on:

- understanding signal topology
- documenting routing
- visualizing console structure
- troubleshooting signal flow
- onboarding volunteers and engineers
- generating operational reference sheets

RouteView is intentionally:

- parser-driven
- topology-driven
- workflow-agnostic
- non-destructive

Everything displayed in the application is derived directly from the uploaded `.scn` file.

---

# Supported Environments

RouteView is designed to work universally across:

- Houses of worship
- Touring productions
- Broadcast environments
- Corporate AV
- Theater
- Educational facilities
- Rental companies
- Personal studios

The application does not assume any specific workflow, naming convention, or venue type.

---

# Core Features

## Scene Parsing

- Upload X32/M32 `.scn` files
- Drag-and-drop support
- Paste raw scene text
- Conservative parser architecture
- Categorized parser buckets
- Parser diagnostics and warnings
- Unmatched line detection
- Parser health metrics

---

## Production Sheet

The Production Sheet is the primary operational view.

It automatically generates:

- Input channel documentation
- DCA group layouts
- Mix bus summaries
- Output routing maps
- Routing block references
- Signal traces
- Physical output groupings

### Input Channel Documentation

Displays:

- Channel number
- Channel label/name
- Scribble strip color
- DCA assignments
- Preamp information
- Optional notes field

### Scribble Strip Rendering

Scene color codes are rendered visually:

| Code | Color |
| --- | --- |
| RD | Red |
| GN | Green |
| YE | Yellow |
| CY | Cyan |
| MG | Magenta |
| WH | White |
| OFF | Neutral |

---

## Signal Tracing

RouteView derives signal paths from:

- channel sends
- bus relationships
- output mappings
- routing topology

Example:

```text
CH 01 Kick
→ Bus 01 Drums
→ XLR 15
```

Signal tracing is topology-driven and contains no hardcoded venue assumptions.

---

## Visual Signal Graph

The Signal Graph provides a topology-oriented visualization layer.

Displays:

- Inputs
- Buses
- Outputs
- Signal relationships
- Parsed topology structure

Includes:

- Active-only filtering
- Quick filtering/search
- Fallback topology rendering
- Trace inspection

---

## Physical Output Visualization

Outputs are grouped into console-style physical banks:

- XLR outputs
- AES50 routing
- Card outputs
- Ultranet routing
- Routing blocks

This improves:

- troubleshooting
- patch verification
- stagebox mapping
- operational readability

---

# Architecture

RouteView uses a layered scene-topology architecture.

```text
Raw Scene Parse
        ↓
DerivedSceneModel
        ↓
Presentation Layers
```

The `DerivedSceneModel` computes:

- active inputs
- active buses
- active outputs
- output banks
- signal traces
- routing topology
- send relationships
- active/inactive filtering

This architecture enables:

- topology visualization
- signal tracing
- advanced exports
- future diff/compare systems
- validation tooling
- routing intelligence

---

# Application Views

| View | Purpose |
| --- | --- |
| Production Sheet | Operational documentation |
| Export | Markdown, CSV, and PDF/print exports |
| Inputs | Detailed channel data |
| Buses | Bus and send information |
| DCAs | DCA assignments |
| Outputs | Physical output and routing maps |
| Signal Flow | Simplified routing relationships |
| Signal Graph | Visual topology rendering |
| Engineering Data | Parser diagnostics and categorized advanced data |

---

# Search & Filtering

RouteView includes:

- Quick Find search
- Active/inactive filtering
- Trace filtering
- Output filtering
- Hide unused channels

Search supports:

- channels
- buses
- outputs
- signal traces
- routing references

---

# Engineering Data & Parser Health

The Engineering Data system provides:

- categorized parser buckets
- parser coverage metrics
- unmatched line reporting
- issue-ready parser follow-ups
- advanced engineering visibility

Coverage metrics include:

- recognized structures
- categorized advanced lines
- unmatched parser coverage
- parser health summaries

Only truly unmatched lines are marked uncategorized.

---

# Export System

Supported export formats:

- Markdown
- CSV
- Print/PDF

Export options include:

- Production Sheet sections
- Parser bucket categories
- Routing details
- Engineering data
- Signal traces

---

# Print Optimization

The print engine is optimized for:

- FOH reference sheets
- volunteer handouts
- routing archives
- clipboard documentation
- PDF generation

Features:

- print-safe scribble colors
- compact spacing
- page-break protection
- sticky headers
- Inter/system typography
- console-inspired layouts

---

# Supported Mixer Files

Currently supported:

- Behringer X32 `.scn`
- Midas M32 `.scn`

The parser is intentionally conservative.

It:

- extracts recognized routing data
- preserves unsupported lines
- avoids destructive assumptions
- never modifies uploaded files
- categorizes advanced parser buckets

---

# Parser Coverage

Currently recognized patterns include:

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

Advanced parser buckets include:

- Channel EQ
- Dynamics
- Gates
- Inserts
- Bus processing
- Matrix processing
- User routing
- Effects rack
- Headamps
- Talkback
- Console configuration

---

# Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack React Query
- Vitest

---

# Getting Started

## Requirements

Recommended:

- Node.js 18+
- npm 9+

## Install

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

## Build Production Version

```bash
npm run build
```

## Preview Production Build

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

# Basic Workflow

1. Upload an X32/M32 `.scn` file
2. Review the Production Sheet
3. Inspect routing and topology
4. Search/filter operational data
5. Review parser diagnostics if needed
6. Export documentation as Markdown, CSV, or PDF

---

# Project Structure

```text
src/
├── components/        # UI views and topology visualization
├── lib/               # Derived scene models and utilities
├── pages/             # Main application pages
├── parsers/           # X32/M32 parser logic
├── types/             # Shared routing models
└── App.tsx
```

---

# Roadmap

## Near-Term Priorities

- Interactive graph edges
- Reverse signal tracing
- Routing validation engine
- Compact density modes
- Export unification
- RoutingGraphBuilder subsystem

## Future Features

- Scene diff/compare
- Volunteer vs Engineer modes
- Advanced topology rendering
- Saved documentation profiles
- Additional mixer support
- Standalone PDF engine

---

# Design Philosophy

RouteView is not intended to replace console editor software.

It is designed to:

- explain routing
- visualize topology
- improve operational clarity
- accelerate troubleshooting
- generate readable documentation
- help engineers understand console structure quickly

The focus is:

```text
Operational topology intelligence
```

rather than:

```text
Remote console control
```

---

# Contributing

Contributions should remain:

- parser-safe
- topology-driven
- operationally useful
- workflow-agnostic
- production-focused

The goal is to help engineers quickly understand real-world console scenes under live production conditions.

---

# License

No license has been defined yet.
