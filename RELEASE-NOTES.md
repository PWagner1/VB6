# VB6 Studio Web 0.6.0

Continues the verified 0.5.0 source and its Git history. The earlier described post-0.5 continuation did not survive as a source archive; this release contains new, committed implementations, not a relabeled previous executable. It remains an independent compatibility-oriented browser application, not a complete native VB6 replacement.

## Project-defined interfaces and default types

The compiler supports module-scoped DefBool/DefByte/DefInt/DefLng/DefCur/DefSng/DefDbl/DefDate/DefStr/DefObj/DefVar letter ranges. Explicit As declarations and type suffixes take priority. Invalid and overlapping ranges are diagnosed transactionally.

Implements binds project-class contracts to private Interface_Member procedures. Signatures, accessors, argument names/defaults, public scalar fields, visibility and missing/duplicate implementations are validated. Interface references dispatch only the exposed contract, while Is preserves underlying object identity. TypeOf checks project interface membership. Member VB_UserMemId = 0 attributes provide supported default property/method invocation and assignment, with recursive-default protection. Native COM interfaces/vtables, reference counting and full tagged Variant semantics are not provided.

## Explicit debugger evaluation

Debug > Evaluate Expression opens an independently dockable tool. It can execute source functions and supported adapter calls in the selected paused frame, including ByRef mutations, nested calls and interactive MsgBox/InputBox/modal-form workflows. Existing program breakpoints are not hit inside the temporary evaluation stack. Original paused frames, debugger settings and error context are restored after return/failure/cancellation. The preview returns to its previous minimized state when evaluation finishes.

Evaluation has separately configurable cooperative instruction/time budgets (defaults 100,000 instructions and 5 seconds; maxima 10 million and 60 seconds) and cancellation. On Error Resume Next cannot swallow evaluator cancellation. Native asynchronous waits and evaluated dialogs participate in cancellation. Synchronous native JavaScript is not forcibly preempted. Side effects already performed, including assignments, output and file writes, are not rolled back. Automatic watches, Quick Watch and Data Tips still do not execute source procedures/getters.

## Broader live editing

Straight-line insertion/deletion around unchanged suspended instructions can now be mapped without losing active local storage. Suspended caller frames resume immediately after their original pending call, so newly inserted following statements execute. Mapping uses bounded instruction alignment; ambiguity/oversized edited regions and unsafe active branch/loop/signature/storage changes require restart. Deleted pending instructions reject before mutation. Synthetic procedure returns no longer retrigger a breakpoint on the last source line. This is not unrestricted Edit and Continue or native instruction relocation.

## Native resource files and Resource Editor

Tools > Resource Editor opens a modeless, shared-theme editor with virtual lists, Unicode strings, binary hex editing, ID/type/language fields, optional raster preview, Apply/Revert/Delete and file import/export. Edits are undoable transactions. Dirty selection changes, stale asynchronous imports, closed tools, project switches and edits during execution are guarded. Hex editing/preview is bounded to 64 KiB; larger resource data can be imported/exported intact, with a 20 MiB resource-file limit and 10,000 record limit.

The Windows 32-bit .res container codec validates record headers, ordinals/names, alignment and metadata, preserves unchanged original bytes and opaque record payloads, and edits UTF-16 string blocks. Malformed string-table payloads can still be viewed/exported as opaque data. VBP ResFile32 references import/export the actual binary file. String, custom binary and supported bitmap/icon resources are available through LoadResString, LoadResData and LoadResPicture in independent exported apps. LoadResData returns a zero-based Byte array. Cursor pictures, native resource-menu/dialog execution and complete Windows locale fallback are not implemented; pictures are safe browser image values, not native StdPicture objects.

## Runtime MDI and designer integration

Project > Add MDIForm adds an actual parent form. Normal forms expose design-time MDIChild and WindowState properties. Runtime parent/child instances use nested windows, activation, eight-edge resizing, moving, minimize/maximize/restore, cascade, horizontal/vertical tiles, icon arrangement, Ctrl+F6/Ctrl+F4 and dynamic WindowList menus. QueryUnload/Unload cancellation is coordinated before parent and child windows are hidden; new child instances have independent source state. Parent Initialize/Load/Activate/QueryUnload/Unload procedures use the MDIForm_ prefix. Modal MDI forms and multiple/New MDI parents reject explicitly.

MDI client layout accounts for supported aligned parent controls and parent resizing. The Menu Editor exposes WindowList. Object Browser/completion include the implemented MDI/resource members. Window profiles also reopen registered modeless project tools and retain their active window, without reopening them for an unrelated project. Draft resource text is not silently persisted as committed project data.

The eleventh example, MDI Resource Workspace, demonstrates real VB event handlers, new child instances, native resource strings, window menus and child cancellation. Original child-menu merging, native maximized-child caption integration, every activation/termination/ownership rule and MDI design-time control restriction are not complete.

## Validation and visual scope

See TESTING.md and release-validation-06.json for actual integrated results, and the external archive-verification report for the freshly extracted delivery check. All validation uses real source and emitted application bytes. The new browser suite covers resource files/UI, explicit evaluation/cancellation/dialogs, live edits, interfaces/DefType in an exported app, MDI windows and modeless profile restoration.

Own screenshot goldens were reviewed for the new property rows and eleventh example. Additional resource, evaluation and MDI captures use all three shared themes and a narrow viewport. These are implementation regression images, not native Microsoft VB6 reference pixels. Full language/control semantics, native COM/OCX/DLL execution, UserControl/UserDocument/DataEnvironment/DataReport designers, native add-ins, unrestricted evaluation/editing and exact native font/pixel identity remain outside the verified contract.
