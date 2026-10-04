#!/usr/bin/env python3
"""Verify packaged release bytes by fresh extraction, rebuilding and real tests.

Requires the same tools as validation. Does not install dependencies, publish,
change the source archive, or reset an existing work directory.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import zipfile

FONT_EXTENSIONS = {'.ttf', '.otf', '.woff', '.woff2', '.eot'}

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def extract_checked(archive: Path, target: Path) -> int:
    target.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(archive) as z:
        bad = z.testzip()
        if bad:
            raise ValueError(f'ZIP CRC failure: {bad}')
        for info in z.infolist():
            p = PurePosixPath(info.filename)
            if p.is_absolute() or '..' in p.parts or '\\' in info.filename:
                raise ValueError(f'Unsafe archive path: {info.filename}')
            if p.suffix.lower() in FONT_EXTENSIONS:
                raise ValueError(f'Unexpected redistributed font: {info.filename}')
            if info.file_size > 100_000_000:
                raise ValueError(f'Unexpectedly large entry: {info.filename}')
        z.extractall(target)
        return len(z.infolist())

def command(args: list[str], cwd: Path, log: Path) -> None:
    with log.open('w') as output:
        subprocess.run(args, cwd=cwd, stdout=output, stderr=subprocess.STDOUT,
                       check=True, timeout=300)

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--release-dir', type=Path, required=True)
    ap.add_argument('--work', type=Path, required=True)
    ap.add_argument('--version', default='0.6.0')
    ap.add_argument('--check-goldens', action='store_true')
    options = ap.parse_args()
    release, work = options.release_dir.resolve(), options.work.resolve()
    work.mkdir(parents=True, exist_ok=False)
    prefix = f'VB6-Studio-Web-{options.version}'
    evidence: dict = {'version': options.version, 'passed': False, 'steps': {}}
    steps = evidence['steps']
    try:
        source_zip = release / f'{prefix}-Source.zip'
        extract_checked(source_zip, work / 'source')
        source = work / 'source' / prefix
        manifest = (source / 'SOURCE-SHA256SUMS.txt').read_text().splitlines()
        for line in manifest:
            expected, name = line.split('  ', 1)
            path = (source / name).resolve()
            if not path.is_relative_to(source) or sha(path) != expected:
                raise ValueError(f'Source manifest mismatch: {name}')
        steps['sourceManifest'] = {'matched': len(manifest), 'archiveSHA256': sha(source_zip)}
        generated = sorted(p for d in ['dist', 'examples'] for p in (source / d).rglob('*') if p.is_file())
        before = {str(p.relative_to(source)): sha(p) for p in generated}
        command(['npm', 'run', 'build'], source, work / 'build.log')
        different = [name for name, digest in before.items() if sha(source / name) != digest]
        if different:
            raise ValueError(f'Non-identical rebuild: {different}')
        app = release / f'{prefix}.html'
        if sha(app) != sha(source / 'dist/VB6-Studio-Web.html'):
            raise ValueError('Delivered standalone HTML differs from rebuilt source')
        steps['freshBuild'] = {'byteIdenticalFiles': len(before), 'standaloneHTMLMatches': True,
                               'standaloneHTMLSHA256': sha(app)}
        command(['npm', 'test'], source, work / 'node.log')
        tap = (work / 'node.log').read_text()
        count = re.search(r'^# pass (\d+)$', tap, re.M)
        if not count or not re.search(r'^# fail 0$', tap, re.M):
            raise ValueError('Node report does not record a complete zero-failure suite')
        steps['nodeTests'] = {'passed': int(count[1]), 'failed': 0}
        suites = [('general', 'browser-tests.py', 'browser-tests.json'),
                  ('compatibility', 'browser-parity-tests.py', 'browser-parity-tests.json'),
                  ('visual', 'browser-visual-tests.py', 'browser-visual-tests.json'),
                  ('features', 'browser-features-04.py', 'browser-features-04.json'),
                  ('recovery', 'recovery-browser-tests.py', 'recovery/recovery-browser.json'),
                  ('finalization', 'browser-finalization-05.py', 'finalization-05/browser-finalization-05.json'),
                  ('boundaries', 'browser-boundaries-06.py', 'boundaries-06/browser-boundaries-06.json')]
        def run_suite(item: tuple[str, str, str]) -> tuple[str, dict]:
            label, script, report = item
            args = [sys.executable, f'tools/{script}']
            if label == 'visual' and options.check_goldens:
                args.append('--check-goldens')
            command(args, source, work / f'{label}.log')
            result = json.loads((source / 'reports' / report).read_text())
            if result['failed']:
                raise ValueError(f'{label} failures: {result["failed"]}')
            summary = {key: result[key] for key in ['passed', 'failed']}
            if label == 'visual':
                summary['ownScreenshotStates'] = result['implementationScreenshotCount']
                summary['nativeVB6ReferencePixels'] = False
            return label, summary
        with ThreadPoolExecutor(max_workers=4) as pool:
            steps['browserTests'] = dict(pool.map(run_suite, suites))
        steps['browserTotals'] = {'passed': sum(x['passed'] for x in steps['browserTests'].values()),
                                 'failed': 0, 'loading': 'emitted HTML via inline Chromium loading'}
        sdk = work / 'sdk'
        extract_checked(release / f'VB6-Runtime-SDK-{options.version}.zip', sdk)
        sdk_script = r'''
import assert from 'node:assert/strict';
import {RuntimeAPI as A} from './src/runtime/entry.js';
assert.equal(Object.keys(A.THEMES).length, 3);
assert.equal(A.colorValue(-2147483633, '#fff', 'standard'), '#d4d0c8');
assert.equal(new A.VBCurrency('922337203685477.5807').toString(), '922337203685477.5807');
const rs = new A.MemoryRecordset();rs.Fields.Append('ID', 3);rs.Open();rs.AddNew('ID', 42);
assert.equal(rs.Fields.Item('ID').Value, 42);
assert.equal(A.parseRTF(String.raw`{\rtf1 Hello}`).runs.map(r => r.text).join(''), 'Hello');
assert.equal(new A.VBErrorValue(2001).number, 2001);
assert.notEqual(A.MISSING, undefined);
assert.equal(A.dateToSerial(A.serialToDate(-1.25)), -1.25);
let resources=A.setResourceString(null,101,'Zażółć 🙂',1045);
resources=A.setResource(resources,{type:10,name:201,language:0,data:'AAH/'});
const raw=A.writeRES(resources),decoded=A.readRES(raw),store=new A.ResourceStore(decoded,1045);
assert.equal(store.string(101),'Zażółć 🙂');assert.deepEqual(A.writeRES(decoded),raw);
const first=store.data(201,10);first.set([0],77);assert.equal(store.data(201,10).get([0]),0);
const output=[];await new A.VirtualMachine({name:'SDKDefInt',startup:'Sub Main',modules:[{name:'M',kind:'module',code:'DefInt A-Z\nSub Main()\nDim a\na = 17\nDebug.Print a\nEnd Sub'}]},{print:s=>output.push(s)}).start();assert.deepEqual(output,['17']);
console.log('Independent SDK ESM, themes/system color, Currency, recordset, RTF, Error, Missing, dates, RES roundtrip, independent Byte arrays and source DefInt execution: PASS');
'''
        command(['node', '--input-type=module', '-e', sdk_script], sdk, work / 'sdk.log')
        steps['independentSDK'] = {'passed': True}
        bundle = release / f'{prefix}-history.bundle'
        if bundle.exists():
            command(['git', 'clone', '--branch', 'main', str(bundle), str(work / 'history')], work, work / 'git-clone.log')
            repo = work / 'history'
            command(['git', 'fsck', '--full'], repo, work / 'git-fsck.log')
            commit = subprocess.check_output(['git', 'rev-parse', 'main'], cwd=repo, text=True).strip()
            tag = subprocess.check_output(['git', 'rev-parse', f'v{options.version}^{{commit}}'], cwd=repo, text=True).strip()
            if commit != tag:
                raise ValueError('Release tag differs from recovered main')
            steps['gitRecovery'] = {'passed': True, 'main': commit, 'tag': f'v{options.version}'}
        archives = [p for p in release.iterdir() if p.suffix == '.zip' and options.version in p.name and p.name.startswith(('VB6-Studio-Web-', 'VB6-Runtime-SDK-', 'VB6-Example-Apps-'))]
        for archive in archives:
            with zipfile.ZipFile(archive) as z:
                if z.testzip():
                    raise ValueError(f'CRC failed: {archive.name}')
                if any(PurePosixPath(n).suffix.lower() in FONT_EXTENSIONS for n in z.namelist()):
                    raise ValueError(f'Font file in {archive.name}')
        steps['zipCRC'] = {'passed': True, 'archives': [p.name for p in sorted(archives)]}
        checksums = (release / f'{prefix}-SHA256SUMS.txt').read_text().splitlines()
        for line in checksums:
            expected, name = line.split('  ', 1)
            if sha(release / name) != expected:
                raise ValueError(f'Delivery checksum differs: {name}')
        steps['deliveryChecksums'] = {'matched': len(checksums)}
        evidence['passed'] = True
    except Exception as error:
        evidence['error'] = str(error)
        raise
    finally:
        (release / f'{prefix}-Archive-Verification.json').write_text(json.dumps(evidence, indent=2) + '\n')
        text = [f'VB6 Studio Web {options.version} — delivered archive verification', '',
                'PASS' if evidence['passed'] else 'FAIL', '', json.dumps(steps, indent=2), '',
                'Own screenshot goldens are not native VB6 screenshots. Native pixel equality, hardware WebGPU, other browsers and direct file-launch behavior are not certified here.']
        if 'error' in evidence:
            text.append(evidence['error'])
        (release / f'{prefix}-Archive-Verification.txt').write_text('\n'.join(text) + '\n')
    print(json.dumps(evidence, indent=2))
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
