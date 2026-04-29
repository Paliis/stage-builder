#!/usr/bin/env python3
"""
Clone a PractiScore .psc export into a sanitized test pack (new UUIDs, fake names).

Usage:
  python scripts/practiscore/psc_clone_test.py --from "path/to/export.psc" [--out exports/my-test.psc]

Requires Python 3.9+ (stdlib only).
"""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path


def new_uuid() -> str:
    return str(uuid.uuid4())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--from",
        dest="source",
        required=True,
        help="Source .psc file (ZIP with match_def.json + match_scores.json)",
    )
    ap.add_argument(
        "--out",
        default="scripts/practiscore/fixtures/practiscore-roundtrip-test.psc",
        help="Output .psc path (default: scripts/practiscore/fixtures/practiscore-roundtrip-test.psc)",
    )
    ap.add_argument(
        "--name",
        default="Stage Builder PSC round-trip test",
        help="Renamed match_title in match_def.json",
    )
    args = ap.parse_args()

    src = Path(args.source)
    if not src.is_file():
        print(f"error: not found: {src}", file=sys.stderr)
        return 1

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(src, "r") as z:
        names = z.namelist()
        if "match_def.json" not in names or "match_scores.json" not in names:
            print(f"error: expected match_def.json and match_scores.json in {names}", file=sys.stderr)
            return 1

        d = json.loads(z.read("match_def.json").decode("utf-8"))
        scores = json.loads(z.read("match_scores.json").decode("utf-8"))

    mid = new_uuid()
    d["match_id"] = mid
    d["match_name"] = args.name
    d["device_arch"] = "script"
    d["device_model"] = "psc_clone_test.py"
    d["app_version"] = "generated"
    d["os_version"] = "0"

    for st in d.get("match_stages", []) or []:
        old = st.get("stage_uuid")
        if old:
            nv = new_uuid()
            st["stage_uuid"] = nv

    for sh in d.get("match_shooters", []) or []:
        nv = new_uuid()
        sh["sh_uuid"] = nv
        sh["sh_uid"] = nv
        sh["sh_ln"] = "Test"
        sh["sh_fn"] = "Shooter"

    scores["match_id"] = mid
    scores["match_scores"] = []
    scores["match_scores_history"] = {}

    deflated = zipfile.ZIP_DEFLATED

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        dpath = root / "match_def.json"
        spath = root / "match_scores.json"
        dpath.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
        spath.write_text(json.dumps(scores, ensure_ascii=False, indent=2), encoding="utf-8")

        with zipfile.ZipFile(out, "w", deflated) as zw:
            zw.write(dpath, "match_def.json")
            zw.write(spath, "match_scores.json")

    print(f"Wrote {out.resolve()} ({out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
