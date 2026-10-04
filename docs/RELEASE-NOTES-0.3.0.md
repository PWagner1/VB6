# VB6 Studio Web 0.3.0 — visual and interaction release

Continues the supplied 0.2.0 browser IDE/runtime without a framework, native helper, CDN, copied Microsoft artwork or redistributed font files. This release substantially improves classic visual/interaction fidelity; **native pixel equality and complete VB6 compatibility are not certified**.

## Implemented

Shared Windows Classic, Windows Standard (2000), and High Contrast Black palettes now drive IDE chrome, designer controls, runtime drawing and standalone exports. OLE system-color roles are resolved consistently while explicit RGB colors remain intact. Classic 20/21/29/21px caption/menu/toolbar/status geometry, 17px property/tree rows and original SVG toolbox/chrome glyphs replace the mixed larger styling and font-dependent symbols. Browser-specific document/debug tabs are opt-in.

IDE documents are live MDI windows with retained independent editor state, dragging, eight-direction resize, minimize/maximize/restore, cascade, horizontal/vertical tiling and keyboard cycling/closing. Panels can be shown independently, floated inside the page, docked and resized through pointer or keyboard operations.

Retained submenu trees now support keyboard mnemonics, arrows, focus return, hover switching and narrow viewport placement. Properties provides active-only editors, categorized/common properties, Font expansion, a font editor, system/RGB color palettes, keyboard editing and cancellation. Options and New Project now have real tab pages with cancellation/focus behavior; Options separates application theme from IDE appearance.

Code windows support full-module, procedure and declarations views plus two independently scrolling projections of the same module. Source edits, find/replace, breakpoints, execution markers and undo use global source positions. The active-pane marker remains valid when a split closes. Source selection/font/separator styling is shared with the active theme.

Classic runtime ComboBox replaces datalist-dependent popups and supports editable, list-only and simple styles, permanent arrows, keyboard commit/cancel and bounded rendering of 10,000 items. UpDown is a real two-arrow widget with repeat/wrap/bounds/keyboard behavior rather than a narrow numeric input. Horizontal/vertical scrollbars have classic arrows, track and thumb interactions. MsgBox/InputBox use theme-scoped modal surfaces, correct tested default/cancel mapping, nested inertness and focus return. MSChart now paints initially after mount and honors system theme colors.

## Validation

363 Node tests, 36 general Chromium cases, 14 compatibility cases and 42 visual/interaction cases pass. A separate same-environment golden check compares all 34 own screenshot states; with that check the browser case total is 93. Each screenshot is repeated and checked for zero changed pixels. **These are our screenshots, not native VB6 reference pixels.** Raw reports, fixtures, golden metadata and before/after images are included.

The original compiler/runtime, binary/FRX, rich-text, recordset, designer, debugger, modal, export and large-data tests were rerun. Headless Chromium/Linux used Canvas2D; hardware WebGPU and other browsers/physical devices are not certified. Source archive verification is provided separately after fresh extraction and rebuilding.

## Delivery and boundaries

The release includes a single-file IDE, modular source, runtime SDK, static browser distribution, nine exported/editable examples, visual audit, regression screenshots and an optional Git history bundle. `Tools → Options → General` changes the themes; the application theme is embedded by `File → Make <project>.html…`.

No remote was modified. Four real worktrees were implemented and merged; no independent coding subagent was available or launched. Native fonts/icons, every original dialog/command/state, Add-Ins, runtime MDI/UserControl designers, COM/OCX execution and full native control APIs remain outside the completion claim. See `VISUAL-AUDIT.md`, `COMPATIBILITY.md` and `TESTING.md` for exact scope.
