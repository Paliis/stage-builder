/**
 * ZIP export for relevance review: machine JSON + spreadsheet CSV + form guide (UA).
 * Output: exports/ro-helper-relevance-<ISO>.zip (gitignored)
 *
 * Usage: npm run ro-helper:export-relevance
 */
import { zipSync } from "fflate";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const matrixPath = join(root, "docs", "RO_HELPER_CARD_MATRIX.csv");
const roRoot = join(root, "content", "ro-helper");

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
  const scalar = {};
  for (const line of block.split(/\r?\n/)) {
    const sm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (sm) scalar[sm[1]] = sm[2].replace(/^["']|["']$/g, "");
  }
  const body = text.slice(m[0].length).trimStart();
  return { raw: block, scalar, body };
}

function blockUntil(raw, field, nextKey) {
  const a = raw.indexOf(`${field}:`);
  if (a === -1) return "";
  const b = raw.indexOf(`\n${nextKey}:`, a + 1);
  return b === -1 ? raw.slice(a) : raw.slice(a, b);
}

/** @returns {{ rule: string, note?: string }[]} */
function extractIpscRefs(raw) {
  const blk = blockUntil(raw, "ipsc_refs", "primary_url");
  const refs = [];
  const re = /rule:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(blk)) !== null) refs.push({ rule: m[1] });
  return refs;
}

/** @returns {{ rule: string, note?: string, url: string }[]} */
function extractFpsuRefs(raw) {
  const blk = blockUntil(raw, "fpsu_refs", "fpsu_delta_verified");
  const items = [];
  const chunks = blk.split(/\n  - /).slice(1);
  for (const ch of chunks) {
    const rule = /rule:\s*"([^"]*)"/.exec(ch);
    const url = /url:\s*"([^"]*)"/.exec(ch);
    const note = /note:\s*"([^"]*)"/.exec(ch);
    if (rule && url) items.push({ rule: rule[1], url: url[1], note: note ? note[1] : "" });
  }
  return items;
}

function csvEscape(val) {
  const s = val == null ? "" : String(val);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsvLine(cols) {
  return cols.map(csvEscape).join(",") + "\n";
}

const FORM_README_UA = `# Форма перевірки релевантності RO Helper

Цей архів згенеровано автоматично. Далі — як користуватися **CSV**, **JSON** і ручною частиною.

## 1. Файли в архіві

| Файл | Призначення |
|------|-------------|
| \`relevance.csv\` | Таблиця: одна строка = одна картка (308). Зручно в Excel / Google Sheets / LibreOffice. |
| \`relevance.json\` | Ті самі дані для скриптів, jq, Python, перевірок у CI. |
| \`schema.json\` | Короткий опис полів JSON (версія схеми). |
| \`REVIEW_FORM_UA.md\` | Цей файл (копія) — опис колонок і процесу. |
| \`context/RO_HELPER_CARD_MATRIX.csv\` | Копія повної матриці карток (як у репо). |
| \`context/RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv\` | Копія таблиці дельт IPSC ↔ ФПСУ (якщо файл є в репо). |

## 2. Машинна перевірка (JSON)

- Кореневі поля: \`generated_at\`, \`schema_version\`, \`cards\` (масив).
- Для кожної картки: \`matrix\` (поля з CSV), \`paths\`, \`uk\`, \`en\`, \`checks\` (наприклад \`primary_urls_match\`).
- Приклади (jq):
  - Усі slug: \`jq -r '.cards[].slug' relevance.json\`
  - Картки без збігу primary_url: \`jq '.cards[] | select(.checks.primary_urls_match == false)' relevance.json\`
  - Довжина тіла UK: \`jq '.cards[] | {slug, n: .uk.body_chars}' relevance.json\`

## 3. Ручна перевірка (CSV)

Колонки **даних** (зліва) заповнені з репозиторію — їх не перезаписувати при імпорті назад, якщо не хочете втратити зміни.

Колонки **manual_*** призначені для рев’ю: заповнюйте після читання карток у \`content/ro-helper/\` або PDF з архіву \`ro-helper:export-review\`.

Рекомендовані значення:

| Колонка | Зміст |
|---------|--------|
| \`manual_relevance\` | \`yes\` / \`partial\` / \`no\` — чи відповідає текст темі картки та матриці |
| \`manual_ipsc_anchor_ok\` | \`yes\` / \`no\` / \`na\` — чи збігаються \`ipsc_refs\` з поточним PDF дисципліни |
| \`manual_fpsu_refs_ok\` | \`yes\` / \`no\` — чи доречні посилання ФПСУ для теми (не дубль / не промах) |
| \`manual_pair_uk_en_ok\` | \`yes\` / \`no\` — чи UK і EN узгоджені за змістом (RO_HELPER_V0 §2.1 п.7) |
| \`manual_notes\` | Вільний текст: що виправити, цитата з PDF, тощо |
| \`manual_action\` | \`none\` / \`edit_md\` / \`escalate\` / \`matrix_update\` |
| \`manual_reviewer\` | Підпис / ініціали |
| \`manual_date\` | Дата рев’ю \`YYYY-MM-DD\` |

Після заповнення CSV можна:
- зберегти як \`relevance-reviewed.csv\` і надіслати назад у команду;
- або імпортувати колонки \`manual_*\` у трекер (Linear, Notion) за \`card_id\`.

## 4. Зв’язок з іншими артефактами

- Повний ZIP markdown + матриця для офлайн-читання: \`npm run ro-helper:export-review\`.
- Автоперевірки структури: \`npm run ro-helper:validate\` (також у \`npm run check\`).
- Мапінг IPSC ↔ ФПСУ: \`docs/RO_HELPER_IPSC_FPSU_TOPIC_MAP.md\`, дельти: \`docs/RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv\`.
`;

const SCHEMA_JSON = {
  schema_version: 1,
  description:
    "RO Helper relevance export — one object per matrix row (card_id × discipline slug)",
  fields: {
    matrix: "Columns from docs/RO_HELPER_CARD_MATRIX.csv for this row",
    paths: { uk: "repo-relative path", en: "repo-relative path" },
    uk: {
      title: "frontmatter title",
      primary_url: "IPSC PDF URL",
      ipsc_refs: "array of {rule, note?}",
      fpsu_refs: "array of {rule, url, note?}",
      body_chars: "number",
      has_ipsc_section: "boolean",
      has_local_section: "boolean",
      upsf_link_count: "number of upsf.org.ua in body",
    },
    en: "same shape as uk",
    checks: {
      primary_urls_match: "uk.primary_url === en.primary_url",
    },
  },
};

async function main() {
  if (!existsSync(matrixPath)) {
    console.error("Missing:", matrixPath);
    process.exit(1);
  }
  const csvRaw = await readFile(matrixPath, "utf8");
  const lines = csvRaw.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const dataLines = lines.slice(1).filter(Boolean);

  const manualHeaders = [
    "manual_relevance",
    "manual_ipsc_anchor_ok",
    "manual_fpsu_refs_ok",
    "manual_pair_uk_en_ok",
    "manual_notes",
    "manual_action",
    "manual_reviewer",
    "manual_date",
  ];

  const outHeaders = [
    "card_id",
    "slug",
    "discipline",
    "category",
    "label_en",
    "label_uk",
    "ipsc_anchor_hint",
    "fpsu_section_hint",
    "status_uk",
    "status_en",
    "notes_matrix",
    "path_uk",
    "path_en",
    "primary_url_uk",
    "primary_url_en",
    "primary_urls_match",
    "ipsc_edition_uk",
    "ipsc_rules_uk",
    "fpsu_urls_uk",
    "title_uk",
    "body_chars_uk",
    "has_ipsc_section_uk",
    "has_local_section_uk",
    "upsf_link_count_uk",
    "title_en",
    "body_chars_en",
    "has_ipsc_section_en",
    "has_local_section_en",
    "upsf_link_count_en",
    "fpsu_delta_verified_uk",
    "reviewer_uk",
    ...manualHeaders,
  ];

  const csvLines = [rowToCsvLine(outHeaders).trimEnd()];
  /** @type {unknown[]} */
  const jsonCards = [];

  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (cols.length < 10) continue;
    const row = {
      card_id: cols[0]?.trim(),
      slug: cols[1]?.trim(),
      discipline: cols[2]?.trim(),
      category: cols[3]?.trim(),
      label_en: cols[4]?.trim(),
      label_uk: cols[5]?.trim(),
      ipsc_anchor_hint: cols[6]?.trim(),
      fpsu_section_hint: cols[7]?.trim(),
      status_uk: cols[8]?.trim(),
      status_en: cols[9]?.trim(),
      notes_matrix: cols.slice(10).join(",").trim(),
    };

    const pathUk = `content/ro-helper/uk/${row.discipline}/${row.category}/${row.slug}.md`;
    const pathEn = `content/ro-helper/en/${row.discipline}/${row.category}/${row.slug}.md`;
    const absUk = join(root, ...pathUk.split("/"));
    const absEn = join(root, ...pathEn.split("/"));

    const textUk = await readFile(absUk, "utf8");
    const textEn = await readFile(absEn, "utf8");
    const fmUk = parseFrontmatter(textUk);
    const fmEn = parseFrontmatter(textEn);
    if (!fmUk || !fmEn) throw new Error(`Missing frontmatter: ${pathUk} or ${pathEn}`);

    const ipscUk = extractIpscRefs(fmUk.raw);
    const fpsuUk = extractFpsuRefs(fmUk.raw);
    const puUk = fmUk.scalar.primary_url || "";
    const puEn = fmEn.scalar.primary_url || "";
    const primaryMatch = puUk === puEn;

    const countUpsf = (b) => (b.match(/upsf\.org\.ua/gi) || []).length;
    const hasIpsc = (b) => /##\s+IPSC\b/i.test(b);
    const hasLocal = (b, loc) =>
      loc === "uk" ? /##\s+Локально\s*\(ФПСУ\)/.test(b) : /##\s+Local\s*\(FPSU\)/i.test(b);

    const csvRow = [
      row.card_id,
      row.slug,
      row.discipline,
      row.category,
      row.label_en,
      row.label_uk,
      row.ipsc_anchor_hint,
      row.fpsu_section_hint,
      row.status_uk,
      row.status_en,
      row.notes_matrix,
      pathUk,
      pathEn,
      puUk,
      puEn,
      primaryMatch ? "yes" : "no",
      fmUk.scalar.ipsc_edition || "",
      ipscUk.map((r) => r.rule).join("; "),
      fpsuUk.map((r) => r.url).join("; "),
      fmUk.scalar.title || "",
      fmUk.body.length,
      hasIpsc(fmUk.body) ? "yes" : "no",
      hasLocal(fmUk.body, "uk") ? "yes" : "no",
      countUpsf(fmUk.body),
      fmEn.scalar.title || "",
      fmEn.body.length,
      hasIpsc(fmEn.body) ? "yes" : "no",
      hasLocal(fmEn.body, "en") ? "yes" : "no",
      countUpsf(fmEn.body),
      fmUk.scalar.fpsu_delta_verified || "",
      fmUk.scalar.reviewer || "",
      ...manualHeaders.map(() => ""),
    ];
    csvLines.push(rowToCsvLine(csvRow).trimEnd());

    jsonCards.push({
      matrix: row,
      paths: { uk: pathUk, en: pathEn },
      uk: {
        title: fmUk.scalar.title,
        primary_url: puUk,
        ipsc_edition: fmUk.scalar.ipsc_edition,
        ipsc_refs: ipscUk,
        fpsu_refs: fpsuUk,
        body_chars: fmUk.body.length,
        has_ipsc_section: hasIpsc(fmUk.body),
        has_local_section: hasLocal(fmUk.body, "uk"),
        upsf_link_count: countUpsf(fmUk.body),
        reviewer: fmUk.scalar.reviewer,
        fpsu_delta_verified: fmUk.scalar.fpsu_delta_verified,
      },
      en: {
        title: fmEn.scalar.title,
        primary_url: puEn,
        ipsc_edition: fmEn.scalar.ipsc_edition,
        ipsc_refs: extractIpscRefs(fmEn.raw),
        fpsu_refs: extractFpsuRefs(fmEn.raw),
        body_chars: fmEn.body.length,
        has_ipsc_section: hasIpsc(fmEn.body),
        has_local_section: hasLocal(fmEn.body, "en"),
        upsf_link_count: countUpsf(fmEn.body),
        reviewer: fmEn.scalar.reviewer,
        fpsu_delta_verified: fmEn.scalar.fpsu_delta_verified,
      },
      checks: {
        primary_urls_match: primaryMatch,
      },
    });
  }

  const generatedAt = new Date().toISOString();
  const relevanceJson = JSON.stringify(
    { generated_at: generatedAt, schema_version: 1, matrix_header: header, cards: jsonCards },
    null,
    2
  );

  const files = {
    "relevance.csv": new TextEncoder().encode(csvLines.join("\n") + "\n"),
    "relevance.json": new TextEncoder().encode(relevanceJson),
    "schema.json": new TextEncoder().encode(JSON.stringify(SCHEMA_JSON, null, 2)),
    "REVIEW_FORM_UA.md": new TextEncoder().encode(FORM_README_UA),
  };

  const matrixCopy = join(root, "docs", "RO_HELPER_CARD_MATRIX.csv");
  const deltaCopy = join(root, "docs", "RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv");
  if (existsSync(matrixCopy)) {
    files["context/RO_HELPER_CARD_MATRIX.csv"] = new Uint8Array(await readFile(matrixCopy));
  }
  if (existsSync(deltaCopy)) {
    files["context/RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv"] = new Uint8Array(await readFile(deltaCopy));
  }

  const outDir = join(root, "exports");
  mkdirSync(outDir, { recursive: true });
  const stamp = generatedAt.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const zipName = `ro-helper-relevance-${stamp}.zip`;
  const zipPath = join(outDir, zipName);
  const zipped = zipSync(files, { level: 6 });
  writeFileSync(zipPath, zipped);

  console.log(`RO Helper relevance pack: ${zipPath}`);
  console.log(`Cards: ${jsonCards.length}, files in zip: ${Object.keys(files).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
