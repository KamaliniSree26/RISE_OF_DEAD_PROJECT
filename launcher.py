#!/usr/bin/env python3
"""
LAST LIGHT: Escape the Infected City - Local Game Server & Launcher
Starts a local HTTP server and automatically opens the game in the user's default browser.
Includes robust automatic port discovery to prevent WinError 10048 if port 8000/8080 is busy.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PREFERRED_PORTS = [8000, 8001, 8002, 8081, 8082, 8888, 3000, 5000]

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html'
    }

    def end_headers(self):
        # Enable caching headers and standard MIME types
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def find_available_server():
    # 1. Try preferred candidate ports
    for port in PREFERRED_PORTS:
        try:
            httpd = ReusableTCPServer(("", port), Handler)
            return httpd, port
        except OSError:
            continue

    # 2. Scan sequential ports from 8003 to 8099
    for port in range(8003, 8100):
        try:
            httpd = ReusableTCPServer(("", port), Handler)
            return httpd, port
        except OSError:
            continue

    # 3. Fallback: Ask OS to assign an available port (port 0)
    httpd = ReusableTCPServer(("", 0), Handler)
    assigned_port = httpd.server_address[1]
    return httpd, assigned_port

def main():
    # Ensure working directory is the game directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    httpd, port = find_available_server()
    url = f"http://localhost:{port}"

    print("=" * 65)
    print("  RISE OF DEAD: 3D Jungle Zombie Survival & Escape")
    print("=" * 65)
    print(f"  [+] Active Game Server: {url}")
    print(f"  [+] Opening in your default web browser...")
    print("  [+] Press Ctrl+C in this terminal window to stop the server.")
    print("=" * 65)

    try:
        webbrowser.open(url)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  [+] Server stopped. Thanks for playing Rise of Dead!")
    finally:
        httpd.server_close()

if __name__ == "__main__":
    main()
