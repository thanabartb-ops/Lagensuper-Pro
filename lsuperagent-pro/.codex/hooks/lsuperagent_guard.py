#!/usr/bin/env python3
"""LSUPERAGENT repository guard for Codex hooks and CI-style scans."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys

SECRET_PATTERNS = (
    ("OpenAI secret key", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b")),
    ("Supabase secret key", re.compile(r"\bsb_secret_[A-Za-z0-9_-]{12,}\b")),
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    (
        "assigned backend secret",
        re.compile(
            r"(?im)^\s*(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY|TELEGRAM_BOT_TOKEN)\s*=\s*(?!$|<|your_|example|changeme)[^\s#]{12,}"
        ),
    ),
)
DANGEROUS_COMMANDS = (
    ("recursive deletion of a broad path", re.compile(r"\brm\s+-[^\n]*r[^\n]*f[^\n]*(?:\s/\s|\s~(?:/|\s)|\$HOME)")),
    ("destructive Git reset", re.compile(r"\bgit\s+reset\s+--hard\b")),
    ("forced push", re.compile(r"\bgit\s+push\b[^\n]*(?:--force|-f\b)")),
)
SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".woff", ".woff2", ".zip"}


def project_root() -> pathlib.Path:
    here = pathlib.Path(__file__).resolve()
    return here.parents[2]


def block(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))


def scan_text(text: str) -> str | None:
    for label, pattern in SECRET_PATTERNS:
        if pattern.search(text):
            return f"Potential {label} blocked. Use an approved secret-entry or environment flow."
    return None


def hook_mode() -> int:
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    payload = json.dumps(event.get("tool_input", {}), ensure_ascii=False)
    reason = scan_text(payload)
    if reason:
        block(reason)
        return 0
    if event.get("tool_name") == "Bash":
        command = str(event.get("tool_input", {}).get("command", ""))
        for label, pattern in DANGEROUS_COMMANDS:
            if pattern.search(command):
                block(f"{label.capitalize()} blocked by LSUPERAGENT repository policy.")
                return 0
    print("{}")
    return 0


def scan_repo() -> int:
    root = project_root()
    run = subprocess.run(["git", "-C", str(root), "ls-files", "-z"], check=True, capture_output=True)
    findings: list[str] = []
    for raw in run.stdout.split(b"\0"):
        if not raw:
            continue
        path = root / raw.decode()
        if not path.is_file() or path.suffix.lower() in SKIP_SUFFIXES:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for label, pattern in SECRET_PATTERNS:
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                findings.append(f"{path.relative_to(root)}:{line}: {label}")
    if findings:
        print("Potential secrets found:", file=sys.stderr)
        for item in findings:
            print(f"- {item}", file=sys.stderr)
        return 1
    print("LSUPERAGENT secret guard: PASS")
    return 0


def context_mode() -> int:
    context_file = project_root() / ".codex" / "LSUPERAGENT_CONTEXT.md"
    if context_file.is_file():
        print(context_file.read_text(encoding="utf-8"))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scan-repo", action="store_true")
    parser.add_argument("--context", action="store_true")
    args = parser.parse_args()
    if args.scan_repo:
        return scan_repo()
    if args.context:
        return context_mode()
    return hook_mode()


if __name__ == "__main__":
    raise SystemExit(main())
