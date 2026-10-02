#!/usr/bin/env node
// Scannt library/ und erzeugt data/catalog.js, das index.html per <script> lädt.
// So funktioniert die Seite auch direkt über file:// – ohne Server und ohne Internet.
//
//   node tools/build-catalog.mjs           Katalog bauen
//   node tools/build-catalog.mjs --check   nur prüfen, welche Dokumente noch Metadaten brauchen
//
// Struktur:
//   library/<Bereich>/<Thema>/.../<datei>       Ordner = Kategorien (beliebig tief)
//   <ordner>/_category.json                     optional: title, description, icon, color
//   <datei>.meta.json                           Metadaten zum Dokument (schreibt der KI-Agent)

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(ROOT, 'library');
const OUT = join(ROOT, 'data', 'catalog.js');
const CHECK_ONLY = process.argv.includes('--check');

const DOC_EXTENSIONS = new Set(['pdf', 'html', 'htm', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'mp4', 'webm', 'mp3', 'docx', 'pptx', 'xlsx', 'odt']);
const META_SUFFIX = '.meta.json';

const warnings = [];
const missingMeta = [];

function readJson(abs) {
  try { return JSON.parse(readFileSync(abs, 'utf8')); }
  catch (err) { warnings.push(`Ungültiges JSON: ${abs} (${err.message})`); return null; }
}

// "01_Energie_und_Arbeit" -> "Energie und Arbeit"
function titleFromName(name) {
  return name.replace(/\.[^.]+$/, '').replace(/^\d+[_\-. ]+/, '').replace(/[_-]+/g, ' ').trim();
}

function pdfPageCount(abs) {
  const raw = readFileSync(abs).toString('latin1');
  const n = (raw.match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
  return n || null;
}

const byName = (a, b) => a.localeCompare(b, 'de', { numeric: true });

function normalizeChapters(chapters, rel) {
  if (!Array.isArray(chapters)) return [];
  return chapters
    .map((c) => (typeof c === 'string' ? { title: c } : c))
    .filter((c) => {
      if (c && typeof c.title === 'string' && c.title.trim()) return true;
      warnings.push(`Kapitel ohne Titel ignoriert in ${rel}${META_SUFFIX}`);
      return false;
    })
    .map((c) => ({
      title: c.title.trim(),
      ...(Number.isInteger(c.page) ? { page: c.page } : {}),
      ...(c.anchor ? { anchor: String(c.anchor).replace(/^#/, '') } : {}),
      keywords: Array.isArray(c.keywords) ? c.keywords.map(String) : [],
    }));
}

function scanDir(abs, rel) {
  const name = rel.split('/').pop() || '';
  const meta = existsSync(join(abs, '_category.json')) ? readJson(join(abs, '_category.json')) || {} : {};
  const node = {
    id: rel,
    title: meta.title || titleFromName(name) || 'Bibliothek',
    description: meta.description || '',
    icon: meta.icon || '',
    color: meta.color || '',
    children: [],
    docs: [],
  };

  const entries = readdirSync(abs).sort(byName);
  for (const entry of entries) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue;
    const entryAbs = join(abs, entry);
    const entryRel = rel ? `${rel}/${entry}` : entry;
    const stat = statSync(entryAbs);

    if (stat.isDirectory()) {
      node.children.push(scanDir(entryAbs, entryRel));
      continue;
    }
    if (entry.endsWith(META_SUFFIX)) {
      if (!existsSync(entryAbs.slice(0, -META_SUFFIX.length))) warnings.push(`Verwaiste Metadaten (Dokument fehlt): ${entryRel}`);
      continue;
    }
    const ext = extname(entry).slice(1).toLowerCase();
    if (!DOC_EXTENSIONS.has(ext)) continue;

    const metaPath = entryAbs + META_SUFFIX;
    const docMeta = existsSync(metaPath) ? readJson(metaPath) : null;
    if (!docMeta) missingMeta.push(entryRel);

    node.docs.push({
      id: entryRel,
      file: entryRel,
      ext,
      title: docMeta?.title || titleFromName(entry),
      type: docMeta?.type || '',
      level: docMeta?.level || '',
      summary: docMeta?.summary || '',
      tags: Array.isArray(docMeta?.tags) ? docMeta.tags.map(String) : [],
      chapters: normalizeChapters(docMeta?.chapters, entryRel),
      pages: ext === 'pdf' ? pdfPageCount(entryAbs) : null,
      size: stat.size,
      modified: stat.mtime.toISOString().slice(0, 10),
      hasMeta: Boolean(docMeta),
    });
  }
  return node;
}

if (!existsSync(LIB)) {
  console.error(`Ordner fehlt: ${LIB}`);
  process.exit(1);
}

const root = scanDir(LIB, '');
const count = (n) => n.docs.length + n.children.reduce((s, c) => s + count(c), 0);

for (const w of warnings) console.warn(`WARNUNG  ${w}`);
if (missingMeta.length) {
  console.warn(`\n${missingMeta.length} Dokument(e) ohne Metadaten (<datei>${META_SUFFIX} fehlt):`);
  for (const m of missingMeta) console.warn(`  - library/${m}`);
}

if (CHECK_ONLY) {
  // Vorhandenes Vokabular ausgeben, damit neue Metadaten dieselben Begriffe verwenden.
  const tally = (pick) => {
    const m = new Map();
    const walk = (n) => { n.docs.forEach((d) => pick(d).forEach((v) => v && m.set(v, (m.get(v) || 0) + 1))); n.children.forEach(walk); };
    walk(root);
    return [...m].sort((a, b) => b[1] - a[1] || byName(a[0], b[0])).map(([v, c]) => `${v} (${c})`).join(', ');
  };
  console.log(`\nTypen:  ${tally((d) => [d.type])}`);
  console.log(`Stufen: ${tally((d) => [d.level])}`);
  console.log(`Tags:   ${tally((d) => d.tags)}`);
  console.log(`\n${count(root)} Dokumente gefunden, ${missingMeta.length} ohne Metadaten.`);
  process.exit(0);
}

const catalog = {
  generated: new Date().toISOString(),
  base: 'library/',
  root,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `// Automatisch erzeugt von tools/build-catalog.mjs – nicht von Hand bearbeiten.\nwindow.LIBRARY_CATALOG = ${JSON.stringify(catalog, null, 1)};\n`);
console.log(`\nKatalog geschrieben: data/catalog.js (${count(root)} Dokumente, ${root.children.length} Bereiche)`);
