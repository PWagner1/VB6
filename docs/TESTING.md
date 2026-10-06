# Testing and validation

Use the exact source revision's CI results and freshly generated local output as
validation evidence. The porting contracts and remaining work are indexed in
[reports/README.md](../reports/README.md). Passing implemented tests does not
establish complete native VB6 compatibility.

## Reproduce

```sh
npm run build
npm test
python tools/browser-tests.py
python tools/browser-parity-tests.py
npm run test:visual
npm run test:features
npm run test:recovery
npm run test:finalization
npm run test:boundaries
```

Node.js 22+ is required. Browser suites require Python, Playwright, Pillow and an
installed Chromium executable. The build has no npm package dependencies. Exact
visual comparisons (`npm run test:visual:goldens`) require the recorded
browser/font environment. Reviewed implementation golden hashes remain in
`tests/visual-goldens.json`; they are not Microsoft VB6 reference pixels.

The Validate workflow runs the build, Node tests, core browser integration suites,
separate cross-browser window/theme/export checks and Windows system contracts.
The workflow file is authoritative for its current coverage. Other focused suites
are listed in `package.json` and their owning compatibility documents. No fixed
historical test count should be interpreted as the current result.

## Generated evidence

Tests continue to write JSON, logs, screenshots, downloads and benchmarks beneath
`reports/`. These are local or CI artifacts, not checked-in porting trackers. The
root `.gitignore` allows only the maintained report index. New durable trackers
need a deliberate exception; fixtures and reviewed golden inputs belong in
`tests/`. Ignoring generated output does not prevent artifact uploads.

CI uploads evidence with the run that produced it. Download it before the
workflow's retention period expires. Old checked-in reports and the obsolete
root `SOURCE-SHA256SUMS.txt` are available in Git history; do not use them to
certify a different revision. Source ZIP manifests are still generated afresh by
the packaging tools and checked by the archive verifier.

## Source archive and SDK verification

```sh
python tools/validate-release.py
python tools/package-release.py --out <release-directory> --git-bundle
python tools/verify-release.py --release-dir <release-directory> --work <new-empty-directory> --version 0.6.0
```

The release validator runs the build, Node tests and all seven core browser
suites, recording fresh logs and a versioned summary in
`reports/release-validation.json`. Failed or interrupted runs do not retain a
passing summary. Add `--check-goldens` only in the recorded visual environment.
Launch probes (`npm run probe:launch`) remain separate from inline validation.

Packaging requires a passing integrated summary and the freshly generated report
files and previews. Missing evidence is an error with reproduction instructions,
not a reason to reuse deleted snapshots or synthesize success. The historical
manual `visual-review-06.json` is not required; the maintained visual audit and
reviewed golden hashes remain the review records.

The archive verifier extracts the actual source ZIP, validates every listed hash,
rejects font/path violations, rebuilds generated files, compares delivered bytes,
reruns Node and browser suites, checks the isolated SDK and verifies history and
archive integrity. Its result is a separate validation attempt, not a substitute
for a native VB6 differential oracle.

## Historical evidence and verification limits

The earlier 0.6.0 integrated snapshot recorded 719 Node cases and 220 Chromium
cases, including comparison of 34 implementation screenshot states. Its six
separate launch probes were blocked with `ERR_BLOCKED_BY_ADMINISTRATOR` before
startup; zero launch probes passed. Those observations describe that historical
environment only. Their removed logs and screenshots remain in Git history.

Own-golden screenshots are not native appearance certification. Hardware WebGPU,
physical devices, native IME, arbitrary locale/font installations and screen
readers require their own evidence. Automatic watches intentionally do not execute
source code; explicit evaluation has cooperative budgets, and live editing rejects
unsupported transformations. See [Compatibility](COMPATIBILITY.md) and the
[visual audit](VISUAL-AUDIT.md) for detailed boundaries.
