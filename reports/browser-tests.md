# Browser integration validation

Chromium 144.0.7559.96 · 36 passed · 0 failed · 35.71 seconds

## Checks

- PASS — Standalone startup: orders (748.09 ms)
- PASS — Standalone startup: calculator (396.22 ms)
- PASS — Standalone startup: clock (433.19 ms)
- PASS — Standalone startup: graphics (367.54 ms)
- PASS — Standalone startup: data (438.31 ms)
- PASS — Standalone startup: controls (464.69 ms)
- PASS — Standalone startup: language (413.77 ms)
- PASS — Standalone startup: events (437.74 ms)
- PASS — Standalone startup: richtext (505.89 ms)
- PASS — Order form: nested controls, typed events, add/remove and totals (663.45 ms)
- PASS — Order validation: actual VB MsgBox blocks the handler (568.15 ms)
- PASS — Order save: sequential VB file I/O writes the private filesystem (748.17 ms)
- PASS — Calculator: indexed control-array event arguments evaluate 7 + 5 (722.0 ms)
- PASS — Timer: queued events tick and stop when disabled (946.14 ms)
- PASS — Common controls: populated tree/list/tab collections and slider events (513.18 ms)
- PASS — Custom WithEvents/ByRef cancellation and dynamic Load/Unload/Controls.Add (751.41 ms)
- PASS — Data grid: in-cell editing and in-memory recordset rebinding (663.38 ms)
- PASS — Modal form: owner inertness, queued click, unload and synchronous return (620.43 ms)
- PASS — DoEvents: UI input cancels a running VB loop without freezing the page (577.44 ms)
- PASS — All 37 offered browser control types initialize without script errors (726.73 ms)
- PASS — Runtime adapter boundary denies DOM, VM, constructor and implementation fields (323.58 ms)
- PASS — Classic IDE shell: menus, toolbox, project explorer, inspector and form (1081.74 ms)
- PASS — Designer: add control, edit property, undo and redo through UI (1495.58 ms)
- PASS — Designer: pointer dragging with twip snapping and keyboard movement (1136.27 ms)
- PASS — Editor: designer event navigation, real source search and completion (1213.2 ms)
- PASS — IDE run/stop: opaque-origin iframe, denied parent DOM and rejected spoofed message (1452.11 ms)
- PASS — Debugger: conditional breakpoint, correct source, locals, Immediate mutation and step (1798.96 ms)
- PASS — Live debugger: edit paused source, automatic apply, step and Set Next Statement (1739.92 ms)
- PASS — File actions: downloadable lossless project and independent runnable HTML export (1843.25 ms)
- PASS — Export injection guard: VB string containing closing script tags remains inert (1622.6 ms)
- PASS — Large source: 20,000-line indexing, bounded gutter DOM and source-only undo (1237.0 ms)
- PASS — Tree/List virtualization: 10,000 items each with bounded rendered rows (3642.25 ms)
- PASS — Grid virtualization: 10,000 × 1,000 logical cells, last row and column reachable (732.13 ms)
- PASS — Graphics example draws with available fallback; GPU capability recorded, not assumed (551.78 ms)
- PASS — 390px touch viewport: scaled standalone form and working touch events (710.48 ms)
- PASS — 390px touch viewport: IDE shell fits and properties drawer opens (1123.38 ms)

## Observed measurements

```json
{
  "sourceEditor": {
    "loadMs": 89,
    "lines": 20000,
    "cursor": {
      "line": 19990,
      "column": 5,
      "offset": 408667
    },
    "gutterNodes": 22,
    "sourceCharacters": 408893
  },
  "virtualizedCollections": {
    "populateMs": 3031.2000000001863,
    "treeCount": 10000,
    "listCount": 10000,
    "treeDOM": 19,
    "listDOM": 12
  },
  "virtualizedGrid": {
    "resizeMs": 0.10000000009313226,
    "rows": 10000,
    "columns": 1000,
    "cells": 127,
    "tableWidth": 80280
  },
  "graphicsEnvironment": {
    "secureContext": false,
    "webGPUAPI": false,
    "backend": "canvas2d",
    "canvases": 1
  }
}
```

## Scope and limitations

- Headless Chromium only; Firefox, Safari and physical mobile devices not validated.
- Navigation restrictions require inline set_content; native file:// persistence and download launch behavior are not browser-navigation tested.
- This environment does not provide a validated secure WebGPU context. Canvas fallback is exercised; hardware GPU execution is not certified.
- Timings are single-run observations, not cross-machine performance guarantees.
