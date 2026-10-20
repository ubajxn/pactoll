#!/usr/bin/env python3
"""Tiny server that serves static files AND handles save requests from the proposal/holiday-card editors."""

import base64
import http.server
import json
import os
import re

PORT = 8234
ROOT = os.path.dirname(os.path.abspath(__file__))

class SaveHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _strip_browser_artifacts(self, html):
        html = re.sub(r'<grammarly-[^>]*>.*?</grammarly-[^>]*>', '', html, flags=re.DOTALL)
        html = re.sub(r'<grammarly-[^>]*/?>', '', html)
        html = re.sub(r'<superhuman-[^>]*>.*?</superhuman-[^>]*>', '', html, flags=re.DOTALL)
        html = re.sub(r'<superhuman-[^>]*/?>', '', html)
        html = re.sub(r'<div id="aiFabShadowRoot"[^>]*></div>', '', html)
        html = re.sub(r'<div id="origin-liveAnnouncer"[^>]*>.*?</div></div>', '', html, flags=re.DOTALL)
        html = re.sub(r'<style id="react-aria-pressable-style">.*?</style>', '', html, flags=re.DOTALL)
        html = re.sub(r'\s*data-grammarly[^=]*="[^"]*"', '', html)
        html = re.sub(r'\s*data-new-gr[^=]*="[^"]*"', '', html)
        html = re.sub(r'\s*data-gr-[^=]*="[^"]*"', '', html)
        html = re.sub(r'\s*spellcheck="[^"]*"', '', html)
        return html

    def _save_html(self, html, paths):
        for p in paths:
            with open(p, 'w', encoding='utf-8') as f:
                f.write(html)

    def _json_ok(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'ok': True}).encode())

    def do_GET(self):
        if self.path == '/list-images':
            img_dir = os.path.join(ROOT, 'images')
            files = []
            if os.path.isdir(img_dir):
                for f in sorted(os.listdir(img_dir)):
                    if f.lower().endswith(('.png','.jpg','.jpeg','.svg','.webp','.gif')):
                        files.append('images/' + f)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'files': files}).encode())
        else:
            super().do_GET()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        data = json.loads(body)
        html = self._strip_browser_artifacts(data.get('html', ''))

        if self.path == '/save-proposal':
            self._save_html(html, [
                os.path.join(ROOT, 'proposal.html'),
                os.path.join(ROOT, 'admin', 'public', 'proposal.html'),
            ])
            self._json_ok()
        elif self.path == '/save-holiday-card':
            self._save_html(html, [
                os.path.join(ROOT, 'holiday-card.html'),
            ])
            self._json_ok()
        elif self.path == '/upload-image':
            filename = data.get('filename', 'upload.png')
            filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
            img_data = base64.b64decode(data.get('data', ''))
            img_dir = os.path.join(ROOT, 'images')
            os.makedirs(img_dir, exist_ok=True)
            img_path = os.path.join(img_dir, filename)
            with open(img_path, 'wb') as f:
                f.write(img_data)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'path': 'images/' + filename}).encode())
        elif self.path == '/list-images':
            img_dir = os.path.join(ROOT, 'images')
            files = []
            if os.path.isdir(img_dir):
                for f in sorted(os.listdir(img_dir)):
                    if f.lower().endswith(('.png','.jpg','.jpeg','.svg','.webp','.gif')):
                        files.append('images/' + f)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'files': files}).encode())
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    with http.server.HTTPServer(('', PORT), SaveHandler) as s:
        print(f'Serving on http://localhost:{PORT} with save support')
        s.serve_forever()
