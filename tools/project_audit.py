#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

IGNORE_DIRS = {".git", ".next", "node_modules", ".vercel", "dist", "build", "coverage", ".turbo", "__pycache__"}
SOURCE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".md", ".sql", ".py"}
CODE_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
IGNORE_FILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml", "tsconfig.tsbuildinfo", "audit-report.json", "audit-report.html"}

@dataclass
class Finding:
    severity: str
    category: str
    file: str
    line: int
    message: str
    evidence: str = ""
    recommendation: str = ""

def add(findings, severity, category, file, line, message, evidence="", recommendation=""):
    findings.append(Finding(severity, category, file, line, message, evidence[:400], recommendation))

def line_no(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1

def safe_read(path: Path, max_bytes: int = 1_048_576):
    try:
        if path.stat().st_size > max_bytes:
            return None
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None

def iter_files(root: Path):
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        rel_parts = p.relative_to(root).parts
        if any(part in IGNORE_DIRS for part in rel_parts):
            continue
        if p.name in IGNORE_FILES:
            continue
        if p.suffix.lower() in SOURCE_EXTS or p.name.startswith(".env"):
            yield p

def normalized_block(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"//.*", "", text)
    return re.sub(r"\s+", " ", text).strip()

def scan_file(file: str, text: str, findings: list[Finding]):
    lines = text.splitlines()
    ext = Path(file).suffix.lower()

    if len(lines) > 800:
        add(findings, "high", "maintainability", file, 1, f"Very large file: {len(lines)} lines.",
            recommendation="Split UI, validation, data access, and domain logic.")
    elif len(lines) > 500:
        add(findings, "medium", "maintainability", file, 1, f"Large file: {len(lines)} lines.",
            recommendation="Review whether reusable helpers/components can reduce complexity.")

    patterns = [
        ("critical", "security", r"\bsk-[A-Za-z0-9_-]{20,}\b", "Potential OpenAI key in source.",
         "Rotate the key and move secrets to environment variables."),
        ("critical", "security", r"\bAIza[0-9A-Za-z_-]{20,}\b", "Potential Google API key in source.",
         "Rotate the key and move secrets to environment variables."),
        ("high", "security", r"dangerouslySetInnerHTML", "dangerouslySetInnerHTML is used.",
         "Sanitize or strictly trust the rendered content."),
        ("medium", "typescript", r"@ts-(ignore|nocheck|expect-error)", "TypeScript suppression found.",
         "Fix or document the underlying type issue."),
        ("low", "logging", r"\bconsole\.(log|debug|warn|error)\s*\(", "Console logging found.",
         "Remove noisy logs or route them through a controlled logger."),
        ("low", "unfinished-work", r"\b(TODO|FIXME|HACK|XXX)\b", "Unfinished-work marker found.",
         "Review before production release."),
        ("medium", "error-handling", r"catch\s*\([^)]*\)\s*\{\s*\}", "Empty catch block hides failures.",
         "Handle, report, or deliberately log the error."),
        ("high", "authentication", r"(localStorage|sessionStorage)\.(getItem|setItem)\s*\([^)]*(resident|auth|session|user)",
         "Client storage appears to influence identity/session logic.",
         "Resolve identity from authenticated session state."),
        ("high", "error-handling", r"(setError|alert)\s*\(\s*(error|err)(\.message)?\s*\)",
         "Raw technical error may be exposed to users.",
         "Map errors to professional user-facing messages."),
    ]

    for severity, category, pattern, message, recommendation in patterns:
        for m in re.finditer(pattern, text, re.I | re.S):
            evidence = lines[line_no(text, m.start()) - 1].strip() if lines else m.group(0)
            add(findings, severity, category, file, line_no(text, m.start()), message, evidence, recommendation)

    if ext in {".ts", ".tsx"}:
        any_count = len(re.findall(r"\bany\b", text))
        if any_count >= 5:
            add(findings, "medium", "typescript", file, 1, f"'any' appears {any_count} times.",
                recommendation="Use domain types, unions, or unknown with validation.")

    if ext in {".tsx", ".jsx"}:
        effect_count = text.count("useEffect(")
        state_count = text.count("useState(")
        if effect_count >= 4:
            add(findings, "medium", "react", file, 1, f"{effect_count} useEffect calls found.",
                recommendation="Extract data/state logic into focused hooks or server-side loading.")
        if state_count >= 10:
            add(findings, "medium", "react", file, 1, f"{state_count} useState calls found.",
                recommendation="Group form state or split the component.")

    if "bed_number" in text and re.search(r"\{\s*bed\.bed_number\s*\}|label\s*:\s*bed\.bed_number", text):
        m = re.search(r"\{\s*bed\.bed_number\s*\}|label\s*:\s*bed\.bed_number", text)
        add(findings, "high", "bed-label-consistency", file, line_no(text, m.start()),
            "Bed number may be rendered directly without canonical normalization.", m.group(0),
            "Use one shared normalizer for display, sorting, duplicate checks, and inserts.")

    db_writes = sum(len(re.findall(p, text, re.I)) for p in [r"\.insert\s*\(", r"\.update\s*\(", r"\.upsert\s*\(", r"\.delete\s*\("])
    if db_writes >= 3 and "supabase" in text.lower() and not re.search(r"rollback|revert|transaction|rpc", text, re.I):
        add(findings, "high", "data-consistency", file, 1,
            f"{db_writes} database writes found without obvious transaction/rollback handling.",
            recommendation="Use a transactional RPC or compensating rollback with rechecks.")

def duplicate_code_scan(texts: dict[str, str], findings: list[Finding]):
    groups = defaultdict(list)
    for file, text in texts.items():
        if Path(file).suffix.lower() not in CODE_EXTS:
            continue
        lines = text.splitlines()
        for start in range(0, max(0, len(lines) - 11), 6):
            block = "\n".join(lines[start:start+12])
            norm = normalized_block(block)
            if len(norm) < 220:
                continue
            groups[hashlib.sha256(norm.encode()).hexdigest()].append((file, start + 1))
    count = 0
    for matches in groups.values():
        if len({f for f, _ in matches}) < 2:
            continue
        add(findings, "medium", "duplicate-code", matches[0][0], matches[0][1],
            f"Possible duplicated code block in {len(matches)} locations.",
            ", ".join(f"{f}:{n}" for f, n in matches[:6]),
            "Review whether the logic belongs in a shared helper/component.")
        count += 1
        if count >= 40:
            break

def project_checks(root: Path, findings: list[Finding]):
    if not (root / "package.json").exists():
        add(findings, "critical", "project", "package.json", 1, "package.json not found.",
            recommendation="Run the script from the actual project root.")
        return {}

    try:
        pkg = json.loads((root / "package.json").read_text(encoding="utf-8"))
    except Exception as exc:
        add(findings, "critical", "project", "package.json", 1, "package.json is invalid JSON.", str(exc))
        return {}

    scripts = pkg.get("scripts", {})
    for name in ("lint", "build"):
        if name not in scripts:
            add(findings, "high", "tooling", "package.json", 1, f"Missing npm script: {name}")
    if not any("test" in key.lower() for key in scripts):
        add(findings, "high", "testing", "package.json", 1, "No npm test script detected.",
            recommendation="Add focused tests for admissions, contracts, billing, beds, and authentication.")

    has_tests = any((root / p).exists() for p in ["tests", "test", "__tests__", "playwright.config.ts", "vitest.config.ts", "jest.config.ts"])
    if not has_tests:
        add(findings, "high", "testing", ".", 1, "No obvious automated test setup detected.")

    return {
        "name": pkg.get("name"),
        "version": pkg.get("version"),
        "scripts": scripts,
        "hasAppRouter": (root / "app").exists(),
        "hasComponents": (root / "components").exists(),
        "hasLib": (root / "lib").exists(),
        "hasSupabase": (root / "supabase").exists(),
    }

def score(findings):
    weights = {"critical": 18, "high": 8, "medium": 3, "low": 1}
    return max(0, 100 - min(100, sum(weights.get(f.severity, 1) for f in findings)))

def html_report(report):
    rows = []
    for f in report["findings"]:
        rows.append(
            "<tr>"
            f"<td>{html.escape(f['severity'].upper())}</td>"
            f"<td>{html.escape(f['category'])}</td>"
            f"<td>{html.escape(f['file'])}:{f['line']}</td>"
            f"<td>{html.escape(f['message'])}</td>"
            f"<td><pre>{html.escape(f['evidence'])}</pre></td>"
            f"<td>{html.escape(f['recommendation'])}</td>"
            "</tr>"
        )
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>HMS Audit</title>
<style>body{{font-family:Arial;margin:24px;background:#f8fafc}}.card,table{{background:white;border:1px solid #ddd}}
.card{{padding:18px;margin-bottom:18px;border-radius:10px}}table{{border-collapse:collapse;width:100%}}
th,td{{border:1px solid #ddd;padding:9px;vertical-align:top;text-align:left}}th{{background:#eef2f7}}pre{{white-space:pre-wrap}}</style>
</head><body><div class="card"><h1>Hostel Management System Audit</h1>
<p>Health score: <strong>{report['healthScore']}/100</strong></p>
<p>Files scanned: {report['summary']['filesScanned']} | Findings: {report['summary']['totalFindings']}</p>
<p>This is a heuristic static scan. Confirm findings before editing production code.</p></div>
<table><thead><tr><th>Severity</th><th>Category</th><th>Location</th><th>Finding</th><th>Evidence</th><th>Recommendation</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table></body></html>"""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    findings = []
    project = project_checks(root, findings)
    texts = {}
    files = []

    for path in iter_files(root):
        rel = path.relative_to(root).as_posix()
        text = safe_read(path)
        files.append(rel)
        if text is None:
            add(findings, "low", "filesystem", rel, 1, "File skipped because it is too large or unreadable.")
            continue
        texts[rel] = text
        scan_file(rel, text, findings)

    duplicate_code_scan(texts, findings)

    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings.sort(key=lambda f: (order.get(f.severity, 9), f.category, f.file, f.line))
    counts = Counter(f.severity for f in findings)

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "healthScore": score(findings),
        "project": project,
        "summary": {
            "filesScanned": len(files),
            "totalFindings": len(findings),
            "bySeverity": dict(counts),
        },
        "findings": [asdict(f) for f in findings],
        "recommendedCommands": ["npm run lint", "npx tsc --noEmit", "npm run build", "npm audit"],
        "limitations": [
            "Static heuristics can produce false positives and false negatives.",
            "Supabase RLS, policies, triggers, RPCs, and live schema are not validated.",
            "Runtime behavior and real database concurrency are not tested.",
        ],
    }

    (root / "audit-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (root / "audit-report.html").write_text(html_report(report), encoding="utf-8")

    print("Audit complete.")
    print(f"Files scanned: {len(files)}")
    print(f"Findings: {len(findings)}")
    print(f"Health score: {report['healthScore']}/100")
    print(f"JSON: {root / 'audit-report.json'}")
    print(f"HTML: {root / 'audit-report.html'}")
    print("Review every finding before changing production code.")

if __name__ == "__main__":
    main()