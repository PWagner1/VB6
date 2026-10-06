# @vb6/com-ole

Dependency-free JavaScript contracts for COM identity, explicit reference ownership,
trusted class activation, connection points, enumeration and a scoped running object
table. Works in Node and modern browsers without the VB6 IDE. MIT licensed.

All objects begin with one owned reference. Successful `QueryInterface`, factory
activation and ROT lookup return an owned reference; the recipient calls `Release`.
Interfaces are fixed at construction, and all interfaces share one `IUnknown`
identity. Final release invalidates the object synchronously. Enumerators return
`{hresult, values, fetched}` and pointer-bearing results own references independently
of the enumerator. `ConnectionPoint.Fire` returns failures without skipping other sinks.

The portable registry never loads DLLs, imports project-supplied code, scans an OS
registry, opens a file or executes a moniker string. Its exact display names are
case-sensitive capabilities registered by trusted embedding code. This package is
not a binary COM ABI, DCOM transport, Windows OLE document server or a certification
of arbitrary third-party COM/OCX components. Native execution uses the separately
opted-in Windows companion.

Run `npm test` in this directory for standalone contract tests.
