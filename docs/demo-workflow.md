# RouteView demo workflow

This walkthrough matches the current app behavior in the repository and is intended to help a new user understand RouteView in a few minutes.

## Start RouteView locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:8080`.

## Option 1: use the built-in demo data

RouteView includes a built-in demo scene in `src/lib/demoScene.ts`.

From the home screen:
1. click **Try Demo Data** in the hero section or upload panel
2. confirm that a parsed scene loads
3. review the file metadata shown in the upload panel

The built-in demo uses a sanitized church-style example scene name:
- `demo_sunday_service.scn`

There is currently **no committed standalone sample `.scn` fixture** in the repo. The built-in demo data is the fastest way to explore the product without providing a real showfile.

## Option 2: upload a real X32/M32 scene

From the **Upload Scene File** panel you can:
- drag and drop a `.scn` file
- click **Choose File** or **Replace File**
- paste scene text directly and click **Parse Text**
- cancel while a file is being read

Confirmed accepted flow from the current UI:
- Behringer X32 `.scn`
- Midas M32 `.scn`
- pasted scene text for quick parser testing

RouteView validates file type, empty files, and oversized files before parsing. During processing it reports the active stage, including reading, parsing, routing analysis, documentation generation, search-index preparation, and finalization.

## Inspect the scene

After loading demo data or a real scene, RouteView exposes three top-level work areas:

### 1. Production Sheet

Use this first for operator handoff.

What you can inspect here:
- **Input Channels**
- **DCA Groups**
- **Mix Buses & Channel Sends**
- **Outputs & Routing Blocks**
- **Signal Traces**

Helpful current controls:
- **Hide inactive items** to reduce noise
- **Quick find** to search channels, buses, outputs, routes, and signal traces
- highlighted channel-name matches and clear empty states when a filter returns nothing

### 2. Export

Use this when you want shareable documentation.

Current export actions:
- **Download `.md`** for markdown documentation
- **Copy** for quick paste into notes or tickets
- **Download `.html`** for standalone printable documentation
- **Download `.json`** for structured archiving or automation
- **Download `.txt`** for simple email/service-note handoffs
- **Download `.csv`** for spreadsheet-oriented review
- **Open Print View** and save to PDF from the browser print dialog

You can also include parser bucket summaries/examples in exports when you want engineering-oriented detail.

### 3. Engineering

Use this for deeper inspection of the parsed scene.

Current engineering tabs:
- **Inputs**
- **Buses**
- **DCAs**
- **Outputs**
- **Signal Flow**
- **Signal Graph**
- **Engineering Data**

These views are the fastest way to answer questions like:
- which channels feed a bus
- which channels are assigned to each DCA
- what the output patches currently map to
- how signal traces move from inputs to buses and outputs
- which parser buckets still contain conservative or partially interpreted data

## Church AV / venue handoff workflow

A practical handoff flow for a church AV team or venue engineer is:

1. load the current `.scn` file before rehearsal or Sunday service
2. review **Production Sheet** for channel names, DCA groupings, bus roles, and mapped outputs
3. use **Signal Traces** and **Signal Flow** to answer routing questions during troubleshooting
4. export Markdown, HTML, plain text, CSV, or JSON for volunteers, guest engineers, automation, or documentation binders
5. use **Open Print View** to save a PDF production sheet for offline handoff

This is especially useful when a replacement operator needs to understand the showfile without opening X32-Edit first.

## Screenshots

The repo currently includes verified screenshots that match the docs flow:
- `docs/assets/screenshots/home.png`
- `docs/assets/screenshots/routeview-production-sheet.png`

## Safety note

Do not commit private church showfiles, credentials, network details, or venue-specific sensitive routing data into the repository. Use the built-in demo data or a sanitized `.scn` file when sharing examples publicly.
