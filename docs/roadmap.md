# RouteView roadmap

This roadmap separates the released application from future work. Items below are
not promises or currently shipped features unless listed under **Implemented**.

## Implemented in v1.0.0

- local X32/M32 `.scn` upload and conservative parsing
- normalized channels, buses, DCAs, outputs, and routing views
- volunteer-facing production sheet and handoff workflow
- Markdown, HTML, JSON, plain-text, CSV, and browser print/PDF exports
- demo scene, upload validation, loading status, replacement flow, and empty states
- parser, scene-model, topology, upload, export, routing, and metadata tests

## Near-term candidates

- expand the sanitized fixture corpus across mixer/editor/firmware variations
- improve parser coverage for categories currently summarized as unsupported
- add browser-level accessibility and import/export regression checks
- improve route-graph explanations and print pagination consistency
- measure large valid scenes on representative lower-power laptops

## Future ideas

- scene-to-scene comparison and routing-risk summaries
- richer routing-map visual layers
- additional handoff and print presets
- separate typed adapters for other console families, only if the domain model remains clear
- optional offline installability that preserves local-only scene processing

Unknown commands will continue to be surfaced rather than guessed. Collaboration or
sharing work must remain explicitly opt-in and must not weaken the current privacy
boundary.
