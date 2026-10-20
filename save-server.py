#!/usr/bin/env python3
"""Tiny server that serves static files AND handles save requests from the proposal editor."""

import http.server
import json
import os
import re

PORT = 8234
ROOT = os.path.dirname(os.path.abspath(__file__))

class SaveHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_POST(self):
        if self.path == '/save-proposal':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            data = json.loads(body)
            html = data.get('html', '')

            # Strip Grammarly and other browser extension artifacts
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

            # Write to both locations
            proposal_path = os.path.join(ROOT, 'proposal.html')
            admin_path = os.path.join(ROOT, 'admin', 'public', 'proposal.html')

            with open(proposal_path, 'w', encoding='utf-8') as f:
                f.write(html)
            with open(admin_path, 'w', encoding='utf-8') as f:
                f.write(html)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True}).encode())
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
