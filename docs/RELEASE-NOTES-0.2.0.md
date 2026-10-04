# VB6 Studio Web 0.2.0

A compatibility release built on the delivered 0.1.0 source. This is an independently implemented browser IDE and source runtime, **not full or binary-compatible Microsoft Visual Basic 6.0**.

## Runtime values and language

Currency now has a signed 64-bit integer backing store at four decimal places. Parsing, range checks, ties-to-even rounding, Currency-pair addition/subtraction/multiplication and comparisons avoid an intermediate binary floating-point conversion. `Nothing` is distinct from `Null` and `Empty`. `As New` uses lazy initialization and recreates an instance after assignment to `Nothing`. Conditional compilation supports `#Const`, `#If`, `#ElseIf`, `#Else`, and `#End If`, with source-line preservation and project constants. Browser platform constants do not masquerade as Win32.

User-defined record assignment now copies values rather than aliasing the source record. Nested records, member arrays, fixed-length strings, typed record arrays, typed UDT function returns and array value assignment are implemented. Existing `ByRef` field aliases survive assignment into their owning record. Typed record arguments and fixed-array operations have additional guards. Invalid `ByVal` UDT and typed-array declarations are diagnosed. `ReDim` failures preserve the prior array; `ReDim Preserve` validates dimensions before committing. This is not a complete implementation of Variant subtypes or native SAFEARRAY lifetime/locking behavior.

## Binary and random-access files

The private virtual filesystem supports byte-preserving binary data and typed `Get`/`Put`, including little-endian numeric values, Currency, dates, fixed/variable strings, supported Variant descriptors, arrays and UDT records. Random mode honors record lengths and one-based record positions. `Seek`, `LOF`, `Loc`, `EOF`, file copy/rename, access modes, shared/exclusive opens and byte/record locking have browser-private implementations. Locks do not extend to other processes or browser tabs.

Snapshots preserve bytes using the versioned base64 format and read older text snapshots. The IDE can edit bounded binary files as hexadecimal and download exact bytes. CommonDialog file open/save uses actual browser chooser/download events. Windows-1252 encoding refuses unsupported characters instead of silently replacing them. No automatic host-drive or Win32 device access is added.

## Paused debugging

Compatible paused source changes can be applied without losing active frames or locals. F5 and stepping apply pending compatible code changes. The debugger rejects incompatible active-procedure topology, signatures and module layouts atomically rather than guessing a new frame layout. Breakpoints are remapped or reported as invalidated.

`Set Next Statement` is available with Ctrl+F9 and the Debug menu. It uses an executable source line within the current procedure and refuses unsafe control-flow/declaration boundary crossings. This is a guarded browser implementation, not unrestricted native Edit and Continue or instruction-address relocation.

## Native project resources

FRX text, supported list records and raster pictures are decoded. Supported PNG/JPEG/GIF/BMP/ICO/DIB data can feed browser controls and picture/drawing surfaces. Untouched binary resource blobs keep their bytes and offsets; changed supported resources use copy-on-write append. Module/form metadata, nested property records, member attributes, class options, project references/membership and unrecognized source assets are retained on the tested interchange paths.

Unknown OCX property bags, ItemData layouts, native OLE and metafiles are retained as opaque data and reported where applicable. They are not executed or reconstructed as native controls. Windows-1252 native source is preserved when representable; lossy native export is refused. Imported projects are not certified to compile unchanged in Microsoft VB6.

## RichTextBox

The new structured rich-text model parses and writes a supported RTF subset and renders text nodes rather than interpreting RTF as HTML. Character formatting includes fonts, sizes, colors, background colors, bold, italic, underline, strike and hidden text. Paragraph formatting includes alignment and indents. Selection indices use UTF-16 with CRLF line breaks. Selection formatting, plain/RTF replacements, mixed-selection results, undo/redo, find flags and RTF/plain-text file operations are integrated with the VB runtime.

Unknown or embedded structures stay in the unchanged original RTF. Editing such a document cannot silently export a flattened replacement: serialization refuses loss until the caller explicitly flattens it. Native OLE payloads are never activated. Malformed pasted RTF and MaxLength rejection do not produce unhandled page errors. Complex tables, embedded objects, all RichEdit layout rules, bidirectional typography and physical IME behavior are not fully implemented or certified.

A ninth example, **Rich Text Editor**, includes executable VB handlers for selection formatting, undo/redo, status updates and file dialogs.

## Disconnected data and grids

The in-memory provider now has typed fields, null values, size/overflow validation, pending edits, `Update`/`CancelUpdate`, current-row deletion, bookmarks, cursor state, field arrays and `GetRows`. It supports cached sorted/filtered views, validated flat AND/OR criteria, quoted names/strings and supported LIKE patterns. Unsupported SQL, external providers, cursors, field types and filter constructs fail explicitly.

Bound grids read rows through the provider instead of copying every cell. Provider changes, sorting, filtering, navigation and closure update the grid. Grid edits write typed values back; VB cancellation handlers run before commit; stale, deleted and filtered row writes are rejected. Unbinding/disposal removes subscriptions. Provider-owned dimensions cannot be overwritten as though the grid were unbound.

This is a disconnected browser provider, not ADO/DAO binary compatibility, SQLite, Access/Jet, ODBC, a SQL engine, or an online database connector. Scalar TextBox/Label DataField binding remains unimplemented.

## Build and verification

The release passes **325 Node tests and 50 Chromium integration checks** (36 general + 14 compatibility checks), compared with the supplied baseline's 140 Node / 34 reported browser checks. All nine standalone examples are checked. Build-time example IDs are deterministic; interactive projects retain fresh IDs. The release package includes readable source, emitted bundles, tests and reports.

Seven real feature worktrees were created and merged. No independent coding subagents were launched: that execution capability was not available. Concurrent test processes were used, not presented as subagents. There are no remote repository changes.

The browser environment is headless Chromium on Linux. Hardware WebGPU, Firefox/Safari, native OCX/COM execution, exhaustive differential VB6 compatibility and pixel-identical rendering are not certified. Direct `file://` navigation probes were blocked by the environment's administrator policy; exact generated HTML was tested using inline document loading and real downloads. See `TESTING.md` for measurements, limitations and reproduction commands.
