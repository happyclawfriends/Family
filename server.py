import http.server
import socketserver
import json
import os

PORT = 8002
DATA_FILE = "family_tree.json"
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "CHANGE_ME_IN_PRODUCTION")

class FamilyTreeHandler(http.server.BaseHTTPRequestHandler):
    def _send_response(self, status, data, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data.encode('utf-8'))

    def do_GET(self):
        if self.path == "/" or self.path == "":
            self.path = "/index.html"
        
        if self.path == "/api/data":
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, "r", encoding='utf-8') as f:
                    self._send_response(200, f.read())
            else:
                self._send_response(404, json.dumps({"error": "Data file not found"}))
        elif self.path.endswith(".html") or self.path.endswith(".js") or self.path.endswith(".css"):
            file_path = self.path.lstrip("/")
            if os.path.exists(file_path):
                content_type = "text/html" if file_path.endswith(".html") else "text/plain"
                with open(file_path, "r", encoding='utf-8') as f:
                    self._send_response(200, f.read(), content_type)
            else:
                self._send_response(404, "Not Found", "text/plain")
        else:
            self._send_response(404, "Not Found", "text/plain")

    def do_POST(self):
        if self.path == "/api/update":
            # Token verification
            token = self.headers.get("Admin-Token")
            if token != ADMIN_TOKEN:
                self._send_response(403, json.dumps({"error": "Unauthorized: Invalid Admin Token"}))
                return

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                with open(DATA_FILE, "w", encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self._send_response(200, json.dumps({"status": "success"}))
            except Exception as e:
                self._send_response(400, json.dumps({"error": str(e)}))

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), FamilyTreeHandler) as httpd:
        print(f"Serving Family Tree at port {PORT} with Admin Protection")
        httpd.serve_forever()
