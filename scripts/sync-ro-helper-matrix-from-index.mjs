/**
 * Regenerate docs/RO_HELPER_CARD_MATRIX.csv from content/ro-helper/INDEX.md
 * so the validator and matrix use the same card_id ordering as INDEX.
 *
 * Enriches label_* and hints from the previous CSV when slug+discipline+category match.
 *
 * Usage: node scripts/sync-ro-helper-matrix-from-index.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const indexPath = join(root, "content", "ro-helper", "INDEX.md");
const matrixPath = join(root, "docs", "RO_HELPER_CARD_MATRIX.csv");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function csvEscape(s) {
  const t = String(s ?? "");
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

const indexRaw = readFileSync(indexPath, "utf8");
const indexRows = [];
for (const line of indexRaw.split(/\r?\n/)) {
  if (!/^\| C\d+ \|/.test(line)) continue;
  const p = line.split("|").map((s) => s.trim());
  if (p.length < 11) continue;
  indexRows.push({
    card_id: p[1],
    slug: p[2],
    discipline: p[3],
    category: p[4],
    status_uk: p[5],
    status_en: p[6],
    fpsu_delta_verified: p[7],
    reviewer: p[8],
    notes: p[9],
  });
}

/** @type {Map<string, { label_en: string; label_uk: string; ipsc: string; fpsu: string }>} */
const enrich = new Map();
const oldCsv = readFileSync(matrixPath, "utf8").trim().split(/\r?\n/).slice(1);
for (const line of oldCsv) {
  if (!line.trim()) continue;
  const c = parseCsvLine(line);
  if (c.length < 10) continue;
  const key = `${c[2].trim()}|${c[1].trim()}|${c[3].trim()}`;
  enrich.set(key, {
    label_en: c[4] ?? "",
    label_uk: c[5] ?? "",
    ipsc: c[6] ?? "",
    fpsu: c[7] ?? "",
  });
}

const lines = [
  "card_id,slug,discipline,category,label_en,label_uk,ipsc_anchor_hint,fpsu_section_hint,status_uk,status_en,notes",
];
for (const r of indexRows) {
  const key = `${r.discipline}|${r.slug}|${r.category}`;
  const e = enrich.get(key);
  const slugTitle = r.slug.replace(/-/g, " ");
  const label_en = e?.label_en || slugTitle;
  const label_uk = e?.label_uk || slugTitle;
  const ipsc = e?.ipsc || r.notes.replace(/\|/g, ";").slice(0, 200) || "verify per PDF";
  const fpsu = e?.fpsu || "XI; verify FPSU docs";
  const row = [
    r.card_id,
    r.slug,
    r.discipline,
    r.category,
    label_en,
    label_uk,
    ipsc,
    fpsu,
    r.status_uk,
    r.status_en,
    r.notes,
  ].map(csvEscape);
  lines.push(row.join(","));
}

writeFileSync(matrixPath, lines.join("\n") + "\n", "utf8");
console.log("Wrote", matrixPath, "rows:", indexRows.length);
