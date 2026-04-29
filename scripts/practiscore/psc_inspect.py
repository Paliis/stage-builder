#!/usr/bin/env python3
"""
Inspect a PractiScore .psc file (ZIP): list entries and optionally print JSON keys.

Usage:
  python scripts/practiscore/psc_inspect.py path/to/file.psc
  python scripts/practiscore/psc_inspect.py path/to/file.psc --keys
"""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path


def top_keys(obj, prefix: str = "") -> list[str]:
    out: list[str] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{prefix}.{k}" if prefix else k
            if isinstance(v, (dict, list)):
                out.append(f"{p} ({type(v).__name__})")
            else:
                out.append(f"{p} = {v!r}")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("psc", type=Path, help="Path to .psc")
    ap.add_argument("--keys", action="store_true", help="Print top-level keys of each JSON member")
    args = ap.parse_args()

    p = args.psc
    if not p.is_file():
        print(f"error: not found: {p}", file=sys.stderr)
        return 1

    with zipfile.ZipFile(p, "r") as z:
        print("Members:", z.namelist())
        for name in z.namelist():
            if not name.endswith(".json"):
                continue
            raw = z.read(name).decode("utf-8", errors="replace")
            print(f"\n--- {name} ({len(raw)} chars) ---")
            if args.keys:
                try:
                    data = json.loads(raw)
                    for line in top_keys(data):
                        print(line)
                except json.JSONDecodeError as e:
                    print("JSON error:", e)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
