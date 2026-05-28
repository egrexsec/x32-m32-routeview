# X32/M32 RouteView

A browser-based documentation tool for Behringer X32 and Midas M32 scene files.

RouteView turns `.scn` console scene files into clean, readable routing documentation for engineers, church production teams, volunteers, and anyone who needs to understand a console setup without opening X32-Edit or M32-Edit.

## What It Does

- Upload or drag-and-drop an X32/M32 `.scn` file
- Paste raw scene text directly into the app
- Load demo data for testing
- Parse core scene routing information
- View routing in organized tabs
- Review warnings for missing or partially recognized data
- Export documentation as Markdown
- Export routing data as CSV
- Print or save the routing view as a PDF

## Supported Mixer Files

Currently supported:

- Behringer X32 `.scn` files
- Midas M32 `.scn` files

The parser is intentionally conservative. It extracts the routing data it recognizes, stores unrecognized scene lines for debugging, and avoids modifying the original scene data.

## Current Routing Views

RouteView currently organizes parsed data into these sections:

| View | Purpose |
| --- | --- |
| Inputs | Channel numbers, names, sources, DCA assignments, notes |
| Buses | Mix bus numbers, names, types, notes |
| DCAs | DCA group names and assigned channels |
| Outputs | XLR, Aux, AES50, Card, Ultranet, Matrix, and unknown output groups |
| Signal Flow | Simplified documentation view of inputs, buses/DCAs, outputs, and routing blocks |
| Export | Markdown, CSV, and print/PDF output |

## Important Notes

RouteView is a documentation tool only.

It does **not**:

- Connect to a live console
- Modify scene files
- Push changes back to X32/M32 hardware
- Replace full console-editing software

Use it to inspect, document, share, and archive routing layouts.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- TanStack React Query
- Vitest

## Getting Started

### Prerequisites

Install Node.js and npm.

Recommended:

- Node.js 18 or newer
- npm 9 or newer

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

Then open the local URL shown in your terminal.

### Build for Production

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Linting

```bash
npm run lint
```

## Basic Usage

1. Open the app in your browser.
2. Upload a `.scn` file from an X32 or M32 console.
3. Review the parsed routing summary and warnings.
4. Use the tabs to inspect inputs, buses, DCAs, outputs, and signal flow.
5. Export the results as Markdown or CSV.
6. Use the print view to save a PDF copy for your team documentation.

## Example Use Cases

- Create routing cheat sheets for church A/V teams
- Document console scenes before major services or events
- Review routing changes before handing off to volunteers
- Export clean tables for Notion, Google Docs, Excel, or Google Sheets
- Archive known-good routing snapshots for troubleshooting
- Compare scene organization over time

## Project Structure

```text
src/
├── components/        # UI components and routing views
├── lib/               # Demo data and export helpers
├── pages/             # App pages
├── parsers/           # Mixer scene parsers
├── types/             # Routing and mixer data types
└── App.tsx            # App router and providers
```

## Parser Scope

The current X32/M32 parser recognizes common scene lines such as:

```text
/ch/01/config "Kick" 1 YE 33
/bus/01/config "Drums" 1 RD
/dca/1/config 1 "Band" WH
/outputs/main/01 1 0 OFF
/config/routing/IN AN1-8 AN9-16 AES50A-1-8
```

Future parser improvements can expand support for deeper routing details, more output types, and additional mixer families.

## Roadmap Ideas

- Better DCA assignment detection
- More detailed input source mapping
- Scene-to-scene comparison
- Saved routing profiles
- PDF export without relying on browser print
- Import support for additional mixer formats
- Dedicated church production documentation templates
- Validation checks for common routing issues

## Contributing

Keep changes focused and practical. This app is meant to help production teams quickly understand real console scenes, so clarity matters more than complexity.

Recommended contribution flow:

1. Create a feature branch.
2. Make the smallest useful change.
3. Run tests and linting.
4. Open a pull request with a clear summary of what changed.

## License

No license has been defined yet.
