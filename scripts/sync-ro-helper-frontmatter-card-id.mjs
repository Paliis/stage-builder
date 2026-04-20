/**
 * Set card_id in content/ro-helper uk and en markdown frontmatter to match INDEX.md
 * for the same discipline/category/slug path.
 *
 * Usage: node scripts/sync-ro-helper-frontmatter-card-id.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const indexPath = join(root, "content", "ro-helper", "INDEX.md");

const indexRaw = readFileSync(indexPath, "utf8");
/** @type {Map<string, string>} */
const keyToId = new Map();
for (const line of indexRaw.split(/\r?\n/)) {
  if (!/^\| C\d+ \|/.test(line)) continue;
  const p = line.split("|").map((s) => s.trim());
  if (p.length < 11) continue;
  const card_id = p[1];
  const slug = p[2];
  const discipline = p[3];
  const category = p[4];
  const key = `${discipline}|${category}|${slug}`;
  if (keyToId.has(key)) {
    console.warn("Duplicate INDEX key:", key, keyToId.get(key), "and", card_id);
  }
  keyToId.set(key, card_id);
}

function walkMd(dir, locale, baseRel, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkMd(p, locale, baseRel ? `${baseRel}/${name}` : name, out);
    else if (name.endsWith(".md")) out.push({ path: p, rel: baseRel ? `${baseRel}/${name}` : name, locale });
  }
}

let fixed = 0;
let missing = 0;
for (const locale of ["uk", "en"]) {
  const locRoot = join(root, "content", "ro-helper", locale);
  /** @type {{ path: string; rel: string; locale: string }[]} */
  const files = [];
  walkMd(locRoot, locale, "", files);
  for (const f of files) {
    const parts = f.rel.replace(/\\/g, "/").split("/");
    if (parts.length !== 3) continue;
    const [discipline, category, file] = parts;
    const slug = file.replace(/\.md$/, "");
    const key = `${discipline}|${category}|${slug}`;
    const expected = keyToId.get(key);
    if (!expected) {
      console.warn("No INDEX row for", f.locale, key);
      missing++;
      continue;
    }
    let raw = readFileSync(f.path, "utf8");
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    const idLine = fm.match(/^card_id:\s*.+$/m);
    const current = idLine ? idLine[0].replace(/^card_id:\s*/, "").replace(/["']/g, "").trim() : "";
    if (current === expected) continue;
    const nextFm = fm.replace(/^card_id:\s*.+$/m, `card_id: ${expected}`);
    raw = raw.slice(0, fmMatch.index) + "---\n" + nextFm + "\n---" + raw.slice(fmMatch.index + fmMatch[0].length);
    writeFileSync(f.path, raw, "utf8");
    fixed++;
    console.log("card_id", current, "->", expected, f.locale, key);
  }
}
console.log("Updated files:", fixed, "INDEX misses:", missing);
