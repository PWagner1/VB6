# Browser integration validation

Chromium 144.0.7559.96 · 35 passed · 1 failed · 18.62 seconds

## Checks

- PASS — Standalone startup: orders (632.25 ms)
- PASS — Standalone startup: calculator (259.02 ms)
- PASS — Standalone startup: clock (247.47 ms)
- PASS — Standalone startup: graphics (299.04 ms)
- PASS — Standalone startup: data (253.09 ms)
- PASS — Standalone startup: controls (253.28 ms)
- PASS — Standalone startup: language (257.06 ms)
- PASS — Standalone startup: events (265.79 ms)
- PASS — Standalone startup: richtext (214.56 ms)
- PASS — Order form: nested controls, typed events, add/remove and totals (419.52 ms)
- PASS — Order validation: actual VB MsgBox blocks the handler (395.3 ms)
- PASS — Order save: sequential VB file I/O writes the private filesystem (438.46 ms)
- PASS — Calculator: indexed control-array event arguments evaluate 7 + 5 (539.99 ms)
- PASS — Timer: queued events tick and stop when disabled (668.3 ms)
- PASS — Common controls: populated tree/list/tab collections and slider events (350.65 ms)
- PASS — Custom WithEvents/ByRef cancellation and dynamic Load/Unload/Controls.Add (491.77 ms)
- PASS — Data grid: in-cell editing and in-memory recordset rebinding (449.34 ms)
- PASS — Modal form: owner inertness, queued click, unload and synchronous return (462.62 ms)
- PASS — DoEvents: UI input cancels a running VB loop without freezing the page (460.88 ms)
- PASS — All 37 offered browser control types initialize without script errors (438.93 ms)
- PASS — Runtime adapter boundary denies DOM, VM, constructor and implementation fields (188.92 ms)
- PASS — Classic IDE shell: menus, toolbox, project explorer, inspector and form (564.95 ms)
- PASS — Designer: add control, edit property, undo and redo through UI (694.37 ms)
- PASS — Designer: pointer dragging with twip snapping and keyboard movement (613.3 ms)
- PASS — Editor: designer event navigation, real source search and completion (663.64 ms)
- PASS — IDE run/stop: opaque-origin iframe, denied parent DOM and rejected spoofed message (906.36 ms)
- PASS — Debugger: conditional breakpoint, correct source, locals, Immediate mutation and step (879.98 ms)
- PASS — Live debugger: edit paused source, automatic apply, step and Set Next Statement (753.29 ms)
- PASS — File actions: downloadable lossless project and independent runnable HTML export (702.16 ms)
- PASS — Export injection guard: VB string containing closing script tags remains inert (562.59 ms)
- FAIL — Large source: 20,000-line indexing, bounded gutter DOM and source-only undo (442.49 ms)
  Assertion failed
- PASS — Tree/List virtualization: 10,000 items each with bounded rendered rows (1278.92 ms)
- PASS — Grid virtualization: 10,000 × 1,000 logical cells, last row and column reachable (507.09 ms)
- PASS — Graphics example draws with available fallback; GPU capability recorded, not assumed (374.97 ms)
- PASS — 390px touch viewport: scaled standalone form and working touch events (384.15 ms)
- PASS — 390px touch viewport: IDE shell fits and properties drawer opens (521.48 ms)

## Observed measurements

```json
{
  "virtualizedCollections": {
    "populateMs": 919.3999999999069,
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
