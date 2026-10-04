# VB6 Studio Web 0.5.0 — release notes

## Baseline and scope

Continued actual recovered source `e3d1b61`, preserving the original history and integrating three real feature branches. Recovered docking, command bars, debug panes and the windowed-input editor are included, rather than substituted with 0.4.0. This release finalizes the documented editor/workspace/diagnostics integration scope, not all original VB6 behavior.

## Changes

### Automatic syntax checking

A self-contained Blob Worker runs the existing compiler against revisioned source snapshots. Unchanged modules reuse compilation results; project-wide validations still repeat. Debouncing avoids compiling each keystroke. Only the latest source/project revision can publish markers, errors and status. Workers are disposed cleanly; failure, unavailability or watchdog expiry switches to a between-module yielding fallback. No project code executes during checking. Automatic limits are explicit; manual Check remains available.

### Editor behavior and performance

Logical UTF-16 selections survive split changes and bounded input-window remounts. Copy, cut and replacement operate on those selections, not a truncated textarea window. Large-module completion retains navigation/accept keys. The literal find index is cached; Replace All builds the replacement in one pass and remains one command undo. No-match replacements do not generate fake history. Adjacent typing coalesces separately from command edits. Ctrl+Y cuts a complete source line; Shift+F4 advances local search. Tab selection ending at the next line boundary no longer indents that next line. Delayed clipboard reads reject stale module, selection, source or read-only state. Control renames invalidate completion; constants from other procedures no longer leak into List Constants.

### Data Tips and selected-text drag/drop

Paused Auto Data Tips resolve only guarded storage paths in the matching selected frame. A changed source, frame, pause or pointer target discards stale results. Inspection does not invoke user procedures or getters. Selected source moves or copies within and between modules, including real pointer drags, autoscroll and target cues. Cross-module moves are a single undoable transaction. Stale, read-only or cancelled operations do not mutate source. Dropping into debug inputs does not execute an expression.

### Workspace profiles and interaction cleanup

Named layouts now contain dock groups, command bars, MDI geometry, split/procedure modes, selection direction and scroll offsets. Project identity prevents unrelated document restoration. JSON import validates every profile before changing saved layouts; old v1 docking profiles remain readable. Limits are 20 saved names, 256 documents/views and a 2 MiB file. Named dictionaries cannot overwrite prototypes. Reset also restores command bars. Serialization and restoration are tested independently of browser storage permissions.

Dock tabs and toolbar Zoom keep keyboard focus through rebuilding. Keyboard movement/resizing rolls back on Escape, blur or replacement. Pointer drags track the correct pointer and cancel safely on lost capture/blur/Escape. MDI windows roll back cancelled geometry. Restore IDs avoid collisions. Narrow floating-window positions remain reachable.

### Build and integration

The bundler now rejects missing named imports and unsupported export forms before emitting a broken app. IDE and runtime/export version markers are synchronized at 0.5.0. Legacy test assertions were corrected for the actual recovered compact-patch undo representation, bookmark versus Definition shortcuts, multiple command bars and Options labels; functional assertions were retained and expanded. Screenshot capture waits for syntax status to settle.

## Verification and remaining limits

See TESTING.md and reports/release-validation-05.json for the completed aggregate, and the external archive-verification file for tests rerun from the delivered source ZIP. Own screenshot goldens are not native VB6 pixels. Environment-blocked launch probes are not counted as passing browser checks.

Native COM/OCX/DLL/Windows APIs, native add-ins/type libraries, all original designers/tools, complete Variant/lifetime/coercion and control semantics, unrestricted debugger evaluation/live edit, exact font/pixel fidelity and cross-browser/hardware certification remain incomplete. See COMPATIBILITY.md.
