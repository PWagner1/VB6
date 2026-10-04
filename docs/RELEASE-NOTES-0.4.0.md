# VB6 Studio Web 0.4.0

This release continues from the verified 0.3.0 source and history. The earlier continuation snapshot was not available as source and was not treated as a passing baseline. The delivered source, IDE, runtime SDK and ten example apps are complete packages for this release, not a claim of complete native VB6 compatibility.

## IDE and visual workflows

A modeless **Object Browser** replaces the generic modal list. F2 opens a real MDI tool with library selection, Classes/Members columns, search, private-member visibility, declaration signatures, source navigation, Back/Forward history, signature copying and refresh. Its virtual lists support keyboard selection, incremental prefix navigation and bounded DOM rows. The browser lists implemented source declarations and browser adapters; it does not load native COM type libraries or invent members that are unavailable.

Project-wide **Find/Replace** (Ctrl+Shift+F / Ctrl+Shift+H) searches the current project or module, with case and whole-word options, line previews and exact UTF-16 source locations. Replace All operates on the reviewed Find All snapshot, rejects stale sources/changed options, validates all replacements before commit and produces one project undo unit. Replacements are literal strings. Results are bounded at 20,000; a truncated search cannot be silently treated as a complete replacement plan.

**Bookmarks** support Ctrl+F2, next/previous navigation, cross-module wrap, split-pane markers, Ctrl+gutter click and Clear All. Positions track edits and are restored through source undo/redo. Bookmarks persist in browser-project metadata, not comments inserted into native code.

The new tools use the existing compact classic chrome and all three themes. They remain live while code is edited, participate in MDI close/reset/cascade/resize behavior and have keyboard splitters/focus/selection. Object Browser list icons are original SVG shapes rather than font glyphs. Narrow layouts and contrast states were reviewed. These improvements do not certify native Windows pixel equality.

## Language and calling conventions

Named arguments (`:=`) now bind to project-procedure parameters and explicitly described intrinsic signatures. Argument expressions are evaluated once in source order; ByRef aliases are retained. Duplicate/unknown names and positional arguments after named arguments are rejected.

Omitted optional values have a distinct Missing sentinel rather than sharing Empty's representation. Optional defaults are evaluated in the declaring frame; IsMissing, ParamArray and explicit Empty behavior have regressions. Static procedures and locals keep storage per class/form instance, with form-instance storage cleared after a successful unload.

Added supported TypeOf object tests, qualified New Scripting.Dictionary, Mid/Mid$ assignment and string LSet/RSet. String-returning `$` intrinsic aliases retain their type-specific Null behavior rather than disappearing during identifier normalization. Declaration and parameter-modifier validation is stricter.

Native/adapter named arguments are not guessed when no signature is exposed. Full grammar, interface dispatch, default-member binding and every native type/promotion rule remain incomplete.

## Runtime correctness

Gregorian calendar helpers now distinguish elapsed-week and calendar-week boundaries, handle month-end/leap-year clamping, first-day/first-week rules, checked years 100–9999 and negative fractional OLE DATE values. Date serial binary Get/Put uses the same conversion. Civil-day arithmetic and a Warsaw DST regression avoid substituting elapsed milliseconds for all calendar operations. System defaults are invariant Gregorian/en-US conventions, not a full Windows NLS/Hijri implementation.

CVErr creates an immutable Variant/Error value. IsError, VarType 10, TypeName, explicit conversions and binary Error descriptors are supported; implicit arithmetic, comparison and truth conversion reject the Error value rather than turning it into an ordinary number/string.

CallByName dispatches supported project methods/properties and allowlisted browser-object adapters, including tested indexed properties. It enforces call type, argument count, private/read-only access and blocked internal/prototype names. This is not arbitrary COM activation or native dispatch.

## Runtime Workbench

The tenth editable example demonstrates named and omitted arguments, Mid/LSet/RSet, CVErr, negative OLE dates, date/year boundaries, CallByName and two independently stateful Counter instances. It is executed from VB source through the same runtime as user projects. The sample is exported as `dist/examples/compatibility.html` and saved as `examples/compatibility.vb6web`.

## Validation and packaging

508 Node regressions and 122 browser behavior cases pass: 36 general, 14 compatibility, 42 visual and 30 new feature cases. A separately invoked comparison of the 34 reviewed implementation screenshot goldens adds one browser case. See TESTING.md and raw reports for the final recorded result; native reference pixels were not used.

The source package includes build tools, tests, all source modules, built distributions, example projects and an internal SHA-256 manifest. The separate archive-verification report is generated by extracting the delivered source ZIP, rebuilding, rerunning tests, checking the independent SDK and recovering Git history. No font files, Microsoft runtime/OCX binaries or external CDN dependencies are included.

## Remaining boundaries

Native COM/OCX/DLL execution, Windows APIs, full Variant/coercion/lifetime semantics, runtime MDIForm and UserControl designers, native external database providers, complete control/API/state matrices, every original IDE/dialog/Options surface, unrestricted Edit and Continue and native font/pixel fidelity remain unfinished. Hardware WebGPU, other browsers, physical devices/IME and native file-origin behavior are not certified by the Chromium inline-load regressions.

Three genuine feature worktrees were merged. No coding subagents were available or launched, and no remote repository was modified.
