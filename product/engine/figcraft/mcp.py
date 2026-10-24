"""Minimal stdio MCP client for figcraft-cli.
The binary path comes from FIGCRAFT_BIN, else /home/claude/fc/figcraft-cli-linux-x86_64 (where START-HERE puts it)."""
import json, subprocess, itertools, sys, os

DEFAULT_BIN = os.environ.get("FIGCRAFT_BIN", "/home/claude/fc/figcraft-cli-linux-x86_64")


class FigCraft:
    def __init__(self, binary=None, args=("mcp",)):
        binary = binary or DEFAULT_BIN
        self.p = subprocess.Popen([binary, *args], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True, bufsize=1)
        self.ids = itertools.count(1)
        self.rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                "clientInfo": {"name": "ds-builder", "version": "0.1"}})
        self.notify("notifications/initialized")

    def notify(self, method, params=None):
        self.p.stdin.write(json.dumps({"jsonrpc": "2.0", "method": method, "params": params or {}}) + "\n")

    def rpc(self, method, params):
        i = next(self.ids)
        self.p.stdin.write(json.dumps({"jsonrpc": "2.0", "id": i, "method": method, "params": params}) + "\n")
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise RuntimeError("figcraft-cli closed")
            msg = json.loads(line)
            if msg.get("id") == i:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg["result"]

    def tool(self, _tool, **args):
        res = self.rpc("tools/call", {"name": _tool, "arguments": args})
        if res.get("isError"):
            text = " ".join(c.get("text", "") for c in res.get("content", []))
            raise RuntimeError(f"{_tool} failed: {text[:2000]}")
        out = []
        for c in res.get("content", []):
            if c.get("type") == "text":
                try:
                    out.append(json.loads(c["text"]))
                except Exception:
                    out.append(c["text"])
            else:
                out.append(c)
        if "structuredContent" in res:
            return res["structuredContent"]
        return out[0] if len(out) == 1 else out

    def cmd(self, command, **params):
        return self.tool("run_command", command=command, params=params)

    def close(self):
        self.p.stdin.close()
        self.p.wait(timeout=10)
