> Historical recovery record. This file describes the recovered pre-0.5 snapshot, including its old version marker and known test failures. Version 0.5.0 continues that actual source; current behavior and results are in README.md, docs/TESTING.md and reports/release-validation-05.json. Do not treat the historical failures below as the current release result.

# VB6 Studio Web — recovered IDE development

Recovery date: 2026-10-04. **This is recovered development work, not a new parity-certified release.**

## What has actually been recovered

The available 0.1.0, 0.2.0, 0.3.0 and 0.4.0 source/application archives survive. Three original Git bundles survive. Their union includes 34 original commits and the original feature/visual branches; the last verified original release is `3675c359e91f373aa4c6d5a9e0b7fe23e7b99629` (`v0.4.0`). These original objects have not been rewritten.

The later IDE continuation ZIP was a byte-for-byte copy of 0.4.0, not the missing newer source. The advertised IDE-Update app and source archive were not created. No hidden current workspace, deleted Git object or notebook source cache supplied the missing implementation.

Actual source-writing commands survived in the conversation's recoverable execution records. Those commands, not screenshots or feature descriptions, were used to reconstruct the later IDE development sequence on a separate `recovery/ide-development` branch. The `recovery-recorded-ide` tag identifies that reconstructed code before the new recovery-validation material. The source and application now contain real additions beyond 0.4.0:

| Reconstructed area | Included implementation |
| --- | --- |
| Editor | Incremental source/procedure indexes; cached visible syntax; declaration-aware completion and parameter help; Definition/Last Position; native text-input windowing for large sources; compact source-patch undo. |
| Docking | Four-edge docking model and live DOM manager; in-page floating, resize, linked tabs, pointer and keyboard controls, named layouts and serialization. |
| Command bars | Standard/Edit/Debug/Form Editor definitions, customization, custom bars, command ordering/separators, edge and floating placement. |
| Debugger | Safe storage inspection, typed local edits, caller-frame selection, bounded storage trees, Quick Watch, Run to Cursor and stored watch definitions; independent Immediate/Locals/Watch/Call Stack/Breakpoints/Errors/Output panes. |
| Tools and designer | Add Procedure, Procedure Attributes, four-page Options, editor colors, color palette, source printing and added spacing/sizing commands. |
| Integration | IDE shell hooks, command/menu routing, runtime bridge, themes, build CSS inputs and source/test additions. |

The reconstructed delta covers 36 source/test/build files, including generated runtime payload, before adding new recovery documentation and tests. The original runtime/language/designer work through 0.4.0 is retained in full.

## Source fidelity and limits

This is a reconstruction from recorded source, **not a byte-for-byte restoration of every vanished workspace file**. Original post-0.4 development commit objects and exact author/commit timestamps are missing; replacement recovery commits have new IDs. Some shell paths, quoting, formatting and integration fixes had to be transcribed from the records. We cannot compare those files against missing originals. The scripts in `recovery/recorded-patches/` are provenance material, not a promised standalone replay/install procedure; use the complete source tree.

Not every scratch file, experimental alternative branch or last unrecorded edit can be certified as recovered. Earlier alternative docking/command-bar branches also appear in historical records, but the supplied integrated app follows the later recovered implementation sequence, not every alternative simultaneously. No worker-based diagnostic implementation was recovered; the existing Options text/flags referring to that feature are unfinished. Native COM/OCX support, all VB6 tools, 100% language/runtime parity and native pixel identity have not been achieved.

Source package metadata still reads 0.4.0 because that is the inherited version constant; the filename and this report distinguish the newer reconstructed development snapshot. Do not mistake this for the original 0.4.0 app or a completed 0.5.0 release.

## Validation performed during recovery

- `npm run build`: succeeded; new standalone IDE contains 1,234,180 bytes, versus the original 1,047,541 bytes.
- `npm test`: **574 passed, zero failed**. The original 0.4.0 Node baseline has 508 tests; the recovered additions supply 66 more.
- `python tools/recovery-browser-tests.py`: **20 passed, zero failed**. This is newly written validation, not claimed historical test source.
- Unmodified legacy general browser suite: **35 passed, one failed**.
- Unmodified legacy runtime compatibility suite: **14 passed, zero failed**.
- Unmodified legacy 0.4 feature suite: **29 passed, one failed**.

The two legacy failures are retained, not silently counted as passes: the large-source test expects the old history entry kind `value`, while recovered compact undo uses `patch`; the old bookmark test expects Shift+F2/Ctrl+Shift+F2, while the recovered editor uses these for Definition/Last Position and Ctrl+Alt+F2/Ctrl+Alt+Shift+F2 for bookmarks. The recovery suite independently verifies patch undo/redo and the recovered bookmark keys. The old suite's assertions have not been rewritten to conceal this difference.

The new suite exercises actual menu/dialog actions, docked tab keyboard navigation, four dock edges and a splitter, float/redock identity, saved layouts, toolbar customization, Options cancellation/apply, Add Procedure/undo, metadata, color palette/undo, seven debugger panes, a break-on-change watch definition, completion commit, typed locals, caller-frame inspection, Quick Watch, and all three themes. A 50,000-line fixture was opened at line 49,995 while the native input held only 256 lines; typing and undo/redo retained the full source. This is functional verification, not a cross-machine speed guarantee.

Fresh Chromium screenshots are in `reports/recovery/`. They are not native Microsoft VB6 reference images or a 100% pixel-parity comparison. Full 0.3 visual-golden testing was not rerun against changed IDE geometry. Chromium was exercised using inline HTML loading; native file-navigation/local-storage persistence, Firefox, Safari, physical mobile devices and hardware WebGPU are not certified. The app and exported examples have no required external CDN.

## Read the right reports

`reports/recovery/` contains this recovery's actual logs and screenshots. Other `reports/` and release documents belong to the inherited 0.4.0 release and are historical evidence, not new-test results. Early recovery test attempts are retained as separate `*-first*` logs; their selector errors were corrected in the new test harness, not hidden by editing application results.

`recovery/archive-inventory.json` records the initial ZIP inventory, sizes, hashes and CRC/font checks. Aliases and duplicates are noted there; original artifacts remain separate from reconstructed output.

## Run and build

Open the recovered standalone HTML in a browser. Browser-origin restrictions can require static hosting. From this complete source directory:

```sh
npm run build
npm run serve
```

Build uses Node.js 22+ with no npm package dependencies. Validation:

```sh
npm test
python tools/recovery-browser-tests.py
```

The browser tests need Python Playwright and Chromium; set `CHROMIUM_PATH` when needed. The inherited `npm run validate` still includes legacy assertions and old visual baselines and is not claimed clean for this development snapshot.

## Git recovery

The accompanying bundle contains original surviving history plus separately identified reconstruction commits:

```sh
git clone VB6-Recovered-IDE-Development-History.bundle vb6-restored
cd vb6-restored
git switch recovery/ide-development
```

Original `main` and tag `v0.4.0` remain at the original release. `recovered-0.2.0/*`, `recovered-0.3.0/*` and `recovered-0.4.0/*` preserve the surviving bundle branches. This recovery does not claim missing original newer commit objects exist, and no remote repository was modified.
