#!/usr/bin/env python3
"""Download remaining image sources, then rewrite only successfully saved images.

Uses the environment's normal proxy/TLS policy. Blocked sources stay untouched.
Run again after allowing the listed hosts or supplying the image files.
"""
import hashlib
import html
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
SOURCES = json.loads((Path(__file__).with_name('external-images.json')).read_text())
DEST = ROOT / 'assets' / 'external'
DEST.mkdir(parents=True, exist_ok=True)
files = {name: (ROOT / name).read_text() for name in ['index.html', 'style.css', 'reading-panels.js']}
saved, blocked = [], []
for url in SOURCES:
    try:
        with urllib.request.urlopen(url, timeout=25) as response:
            mime = response.headers.get_content_type()
            extension = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
                         'image/svg+xml': '.svg', 'image/avif': '.avif', 'image/gif': '.gif'}.get(mime)
            if not extension:
                raise ValueError('Response is not a supported image: ' + mime)
            data = response.read(20 * 1024 * 1024 + 1)
            if not data or len(data) > 20 * 1024 * 1024:
                raise ValueError('Empty or oversized image')
        filename = hashlib.sha256(url.encode()).hexdigest()[:16] + extension
        (DEST / filename).write_bytes(data)
        local = 'assets/external/' + filename
        for name in files:
            for original in [html.escape(url, quote=True), url]:
                files[name] = files[name].replace(original, local)
        saved.append({'source': url, 'local': local})
    except Exception as error:
        blocked.append({'source': url, 'error': str(error)})
for name, content in files.items():
    (ROOT / name).write_text(content)
# Invalidate cached resources whenever source files change.
index = (ROOT / 'index.html').read_text()
for name in ['style.css', 'theme.js', 'app.js', 'reading-panels.js', 'card-pages.js']:
    digest = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()[:12]
    index = re.sub(r'((?:src|href)="' + re.escape(name) + r')(?:\?v=[^"\s]+)?"',
                   lambda match: match[1] + '?v=' + digest + '"', index)
(ROOT / 'index.html').write_text(index)
print(json.dumps({'saved': saved, 'blocked': blocked}, ensure_ascii=False, indent=2))
