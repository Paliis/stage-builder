/**
 * Fills fpsu_refs in frontmatter and adds UPSF 2020 links under Local (FPSU) sections.
 * Run from repo root: node scripts/inject-ro-helper-fpsu-refs.mjs
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FPSU_REFS_BY_SLUG } from "./data/ro-helper-fpsu-urls.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");
const ROOT = join(REPO, "content", "ro-helper");

/** @param {{ rule: string; url: string; note_uk: string; note_en: string }[]} refs */
function yamlFpsuRefs(refs, locale) {
  const lines = ["fpsu_refs:"];
  for (const r of refs) {
    const note = locale === "uk" ? r.note_uk : r.note_en;
    lines.push(`  - rule: ${JSON.stringify(r.rule)}`);
    lines.push(`    note: ${JSON.stringify(note)}`);
    lines.push(`    url: ${JSON.stringify(r.url)}`);
  }
  return `${lines.join("\n")}\n`;
}

/** @param {{ rule: string; url: string; note_uk: string; note_en: string }[]} refs */
function markdownLinkList(refs, locale) {
  const bullets = refs.map((r) => {
    const label = locale === "uk" ? `${r.rule} — ${r.note_uk}` : `${r.rule} — ${r.note_en}`;
    return `- [${label}](${r.url})`;
  });
  const title =
    locale === "uk"
      ? "**Первинник — Правила ФПСУ 2020 (офіційний зміст на upsf.org.ua):**"
      : "**Primary source — FPSU Rules 2020 (official text on upsf.org.ua):**";
  return `${title}\n\n${bullets.join("\n")}\n\n`;
}

function injectFrontmatter(content, refs, locale) {
  const block = yamlFpsuRefs(refs, locale);
  if (!/fpsu_refs:[\s\S]*?\nfpsu_delta_verified:/.test(content)) {
    console.warn("skip (no fpsu_refs block): pattern mismatch");
    return content;
  }
  return content.replace(/fpsu_refs:[\s\S]*?\nfpsu_delta_verified:/, `${block}fpsu_delta_verified:`);
}

function injectBodyLocalSection(content, refs, locale) {
  const headingUk = "## Локально (ФПСУ)";
  const headingEn = "## Local (FPSU)";
  const heading = content.includes(headingUk) ? headingUk : content.includes(headingEn) ? headingEn : null;
  if (!heading) return content;

  const idx = content.indexOf(heading);
  const after = content.slice(idx + heading.length, idx + heading.length + 600);
  if (after.includes("upsf.org.ua")) return content;

  const insertion = markdownLinkList(refs, locale);
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${esc})(\\r?\\n)`);
  return content.replace(re, `$1$2${insertion}`);
}

async function walkMarkdown(dir) {
  /** @type {string[]} */
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkMarkdown(p)));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

function slugFromPath(absPath) {
  const base = absPath.replace(/\\/g, "/").split("/").pop() || "";
  return base.replace(/\.md$/, "");
}

async function main() {
  let updated = 0;
  let skipped = 0;
  for (const locale of ["uk", "en"]) {
    const dir = join(ROOT, locale);
    const files = await walkMarkdown(dir);
    for (const file of files) {
      const slug = slugFromPath(file);
      const refs = FPSU_REFS_BY_SLUG[slug];
      if (!refs) {
        console.warn(`No FPSU map for slug "${slug}" (${file})`);
        skipped++;
        continue;
      }
      let content = await readFile(file, "utf8");
      const before = content;
      content = injectFrontmatter(content, refs, locale);
      content = injectBodyLocalSection(content, refs, locale);
      if (content !== before) {
        await writeFile(file, content, "utf8");
        updated++;
      }
    }
  }
  console.log(`Updated ${updated} files. Skipped (no map): ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
