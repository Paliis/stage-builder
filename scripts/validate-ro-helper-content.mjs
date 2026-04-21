/**
 * Validates RO Helper markdown pack vs docs/RO_HELPER_CARD_MATRIX.csv
 * and basic quality rules (RO_HELPER_V0 / RO_HELPER_CONTENT_TZ).
 *
 * Usage: node scripts/validate-ro-helper-content.mjs
 * Exit 1 on any error; warnings printed to stderr.
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const matrixPath = join(root, "docs", "RO_HELPER_CARD_MATRIX.csv");
const roRoot = join(root, "content", "ro-helper");

/** Parse one CSV line with optional "..." fields */
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

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const block = m[1];
  /** @type {Record<string, string>} */
  const scalar = {};
  const lines = block.split(/\r?\n/);
  for (const line of lines) {
    const sm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (sm) scalar[sm[1]] = sm[2].replace(/^["']|["']$/g, "");
  }
  return { raw: block, scalar, body: text.slice(m[0].length).trimStart() };
}

/** Top-level YAML key starts at beginning of line */
function blockUntilNextTopKey(raw, fieldName, nextKeys) {
  const start = raw.indexOf(`${fieldName}:`);
  if (start === -1) return "";
  let end = raw.length;
  for (const k of nextKeys) {
    const p = raw.indexOf(`\n${k}:`, start + 1);
    if (p !== -1 && p < end) end = p;
  }
  return raw.slice(start, end);
}

function hasListField(raw, fieldName, nextKeys) {
  const block = blockUntilNextTopKey(raw, fieldName, nextKeys);
  return block.includes("\n  - ");
}

function listHasUrl(raw) {
  const block = blockUntilNextTopKey(raw, "fpsu_refs", ["fpsu_delta_verified"]);
  return /url:\s*"https:\/\/upsf\.org\.ua\//.test(block) || /url:\s*https:\/\/upsf\.org\.ua\//.test(block);
}

function listHasRule(raw) {
  const block = blockUntilNextTopKey(raw, "ipsc_refs", ["primary_url", "fpsu_refs"]);
  return /rule:\s*"/.test(block) || /rule:\s*[\d.]/.test(block);
}

function listNonEmpty(raw, fieldName, nextKeys) {
  const block = blockUntilNextTopKey(raw, fieldName, nextKeys);
  return block.includes("\n  - ");
}

async function walkArticleMd(localeDir) {
  /** @type {string[]} */
  const rel = [];
  async function walk(d, baseRel) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = join(d, e.name);
      const r = baseRel ? `${baseRel}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(p, r);
      else if (e.isFile() && e.name.endsWith(".md")) rel.push(r.replace(/\\/g, "/"));
    }
  }
  await walk(localeDir, "");
  return rel;
}

async function main() {
  const errors = [];
  const warnings = [];

  if (!existsSync(matrixPath)) {
    console.error("Missing matrix:", matrixPath);
    process.exit(1);
  }
  const csv = await readFile(matrixPath, "utf8");
  const lines = csv.trim().split(/\r?\n/);
  const dataRows = lines.slice(1).filter(Boolean);

  /** @type {{ card_id: string; slug: string; discipline: string; category: string }[]} */
  const expected = [];
  for (const line of dataRows) {
    const cols = parseCsvLine(line);
    if (cols.length < 4) continue;
    expected.push({
      card_id: cols[0].trim(),
      slug: cols[1].trim(),
      discipline: cols[2].trim(),
      category: cols[3].trim(),
    });
  }

  /** Every matrix row must have UK; EN is optional until translated. */
  const expectedRel = new Set();
  for (const row of expected) {
    expectedRel.add(`uk/${row.discipline}/${row.category}/${row.slug}.md`);
    expectedRel.add(`en/${row.discipline}/${row.category}/${row.slug}.md`);
  }

  for (const row of expected) {
    const ukRel = `uk/${row.discipline}/${row.category}/${row.slug}.md`;
    const enRel = `en/${row.discipline}/${row.category}/${row.slug}.md`;
    const enAbs = join(roRoot, ...enRel.split("/"));
    const locales = ["uk"];
    if (existsSync(enAbs)) locales.push("en");
    else warnings.push(`Missing EN (optional): content/ro-helper/${enRel} (${row.card_id})`);

    for (const loc of locales) {
      const rel = `${loc}/${row.discipline}/${row.category}/${row.slug}.md`;
      const abs = join(roRoot, ...rel.split("/"));
      if (!existsSync(abs)) {
        errors.push(`Missing file: content/ro-helper/${rel} (${row.card_id})`);
        continue;
      }
      const text = await readFile(abs, "utf8");
      const fm = parseFrontmatter(text);
      if (!fm) {
        errors.push(`No YAML frontmatter: ${rel}`);
        continue;
      }
      const { raw, scalar, body } = fm;
      if (scalar.slug !== row.slug) errors.push(`${rel}: frontmatter slug "${scalar.slug}" != matrix "${row.slug}"`);
      if (scalar.discipline !== row.discipline)
        errors.push(`${rel}: discipline "${scalar.discipline}" != matrix "${row.discipline}"`);
      if (scalar.category !== row.category)
        errors.push(`${rel}: category "${scalar.category}" != matrix "${row.category}"`);
      if (scalar.locale !== loc) errors.push(`${rel}: locale "${scalar.locale}" != path "${loc}"`);
      if (scalar.card_id && scalar.card_id !== row.card_id)
        errors.push(`${rel}: card_id "${scalar.card_id}" != matrix "${row.card_id}"`);

      if (!scalar.primary_url?.startsWith("http")) errors.push(`${rel}: missing or invalid primary_url`);

      // V0: ipsc_refs is required and must list rule anchors (rule: ...)
      if (!hasListField(raw, "ipsc_refs", ["primary_url"])) errors.push(`${rel}: ipsc_refs must be a non-empty list`);
      else if (!listHasRule(raw)) errors.push(`${rel}: ipsc_refs entries need rule:`);

      // V0: fpsu_refs is optional unless fpsu_delta_verified=true
      const fpsuVerified = scalar.fpsu_delta_verified === "true";
      const hasFpsuRefsField = raw.includes("fpsu_refs:");
      if (fpsuVerified) {
        if (!hasFpsuRefsField) errors.push(`${rel}: fpsu_delta_verified=true but fpsu_refs is missing`);
        else if (!listNonEmpty(raw, "fpsu_refs", ["fpsu_delta_verified"])) errors.push(`${rel}: fpsu_refs must be non-empty when fpsu_delta_verified=true`);
        else if (!listHasUrl(raw)) errors.push(`${rel}: fpsu_refs entries need upsf.org.ua url`);
      }

      if (scalar.fpsu_delta_verified !== "false" && scalar.fpsu_delta_verified !== "true")
        warnings.push(`${rel}: fpsu_delta_verified not boolean-like: ${scalar.fpsu_delta_verified}`);

      if (body.length < 120) warnings.push(`${rel}: body very short (${body.length} chars)`);

      const hasIpsc = /##\s+IPSC\b/i.test(body);
      if (!hasIpsc) warnings.push(`${rel}: no "## IPSC" section heading`);

      // V0: Local (FPSU) section is only present when FPSU deltas are published.
      const hasLocal =
        loc === "uk" ? /##\s+Локально\s*\(ФПСУ\)/.test(body) : /##\s+Local\s*\(FPSU\)/i.test(body);
      if (fpsuVerified && !hasLocal) warnings.push(`${rel}: fpsu_delta_verified=true but Local (FPSU) section is missing`);

      if (loc === "uk" && /\bдуло\b/i.test(body))
        warnings.push(`${rel}: UK text contains colloquial "дуло" (TZ §1.1 — prefer ствол / дульний зріз)`);

      if (fpsuVerified && loc === "uk" && body.includes("upsf.org.ua") === false)
        warnings.push(`${rel}: fpsu_delta_verified=true but UK body has no upsf.org.ua link`);
      if (fpsuVerified && loc === "en" && body.includes("upsf.org.ua") === false)
        warnings.push(`${rel}: fpsu_delta_verified=true but EN body has no upsf.org.ua link`);
    }
  }

  for (const loc of ["uk", "en"]) {
    const localeDir = join(roRoot, loc);
    if (!existsSync(localeDir)) {
      errors.push(`Missing locale dir: ${localeDir}`);
      continue;
    }
    const found = await walkArticleMd(localeDir);
    for (const rel of found) {
      const key = `${loc}/${rel}`;
      if (!expectedRel.has(key)) warnings.push(`Unexpected article (not in matrix): content/ro-helper/${key}`);
    }
  }

  console.log(`Matrix rows: ${dataRows.length} → UK required: ${expected.length} (+ EN when present)`);
  console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);

  for (const w of warnings) console.warn("WARN:", w);
  for (const e of errors) console.error("ERR:", e);

  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
