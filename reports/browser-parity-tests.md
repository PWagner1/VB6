# Compatibility browser tests

14 passed; 0 failed. Chromium 144.0.7559.96.

- PASS: Native FRX UI import: decoded text/list/image, PictureBox raster plus VB drawing
- PASS: Virtual filesystem UI: exact binary download and validated hexadecimal edits
- PASS: CommonDialog binary open/save: real file chooser, VB Get, exact download bytes
- PASS: RichTextBox: idempotent and mixed formatting, compiled VB handlers, paragraph units
- PASS: RichTextBox: keyboard editing, atomic CRLF/surrogate deletion, undo/redo, readonly, SelRTF
- PASS: RichTextBox: real RTF download, native file chooser and formatted file round-trip
- PASS: RichTextBox: inactive OLE/unknown content, atomic malformed loads and explicit-loss prevention
- PASS: RichTextBox: Find flags, UTF-16 line indices, composition synchronization and trailing paragraphs
- PASS: RichTextBox: MaxLength and malformed clipboard data reject safely without page errors
- PASS: RichTextBox: 4,000-paragraph construction and late-document formatting
- PASS: Bound grids: real VB validation handlers, typed writeback and live provider updates
- PASS: Bound grids: type rejection, ByRef cancellation and stale-edit protection
- PASS: Bound grids: cursor synchronization, sort/filter, close and subscription cleanup
- PASS: Bound grids: 10,000 rows, cached read-through view and bounded rendered cells
