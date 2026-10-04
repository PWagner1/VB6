#!/usr/bin/env python3
"""Probe file and local HTTP launches without treating policy blocks as app passes."""
from __future__ import annotations
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json, os, shutil, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

def main():
    chromium = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium:
        raise SystemExit('Chromium is required')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    results = []
    targets = [('standalone-ide', 'VB6-Studio-Web.html', 'vb6Studio'),
               ('split-ide', 'index.html', 'vb6Studio'),
               ('standalone-workbench', 'examples/compatibility.html', 'vb6Application')]
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=chromium, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
            for scheme in ('file', 'http'):
                for name, path, symbol in targets:
                    page = browser.new_page()
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    url = (ROOT / 'dist' / path).as_uri() if scheme == 'file' else f'http://127.0.0.1:{server.server_port}/{path}'
                    item = {'name': name, 'scheme': scheme, 'path': path, 'passed': False}
                    try:
                        page.goto(url, wait_until='load', timeout=12000)
                        page.wait_for_function(f'typeof {symbol} !== "undefined"', timeout=8000)
                        if symbol == 'vb6Application':
                            page.wait_for_function('vb6Application.forms[0].controlMap.get("txtoutput").Text.includes("Missing")', timeout=8000)
                        if errors:
                            raise AssertionError(str(errors))
                        item['passed'] = True
                    except Exception as error:
                        item['error'] = str(error)
                    finally:
                        item['pageErrors'] = errors
                        page.close()
                    results.append(item)
                    print(scheme, name, 'PASS' if item['passed'] else item.get('error'), flush=True)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=2)
    report = {'version': json.loads((ROOT / 'package.json').read_text())['version'], 'probes': results,
              'httpPassed': sum(x['passed'] for x in results if x['scheme'] == 'http'),
              'filePassed': sum(x['passed'] for x in results if x['scheme'] == 'file')}
    (ROOT / 'reports' / 'launch-probe.json').write_text(json.dumps(report, indent=2) + '\n')
    # File policy errors are disclosed, not counted as passing behavior cases.
    return int(any(not x['passed'] for x in results if x['scheme'] == 'http'))

if __name__ == '__main__':
    raise SystemExit(main())
