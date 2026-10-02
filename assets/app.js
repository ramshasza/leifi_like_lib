/* Lernbibliothek – Vanilla JS, ohne Abhängigkeiten, läuft auch über file://.
 * Daten: window.LIBRARY_CATALOG aus data/catalog.js (erzeugt von tools/build-catalog.mjs).
 * Fortschritt: localStorage des Browsers (Export/Import als JSON über „Mein Fortschritt“).
 */
(() => {
  'use strict';

  const catalog = window.LIBRARY_CATALOG;
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  const searchInput = document.getElementById('search-input');

  if (!catalog || !catalog.root) {
    main.innerHTML = `<div class="empty-state"><h1>Kein Katalog gefunden</h1>
      <p>Die Datei <code>data/catalog.js</code> fehlt. Erzeuge sie mit</p><pre>node tools/build-catalog.mjs</pre></div>`;
    return;
  }

  // ---------------------------------------------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------------------------------------------

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
  const enc = encodeURIComponent;

  // Vergleichsform für die Suche: klein, Umlaute ausgeschrieben, Akzente entfernt.
  const norm = (s) => String(s ?? '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const PALETTE = ['#1f6fd1', '#c98a00', '#7b3fe4', '#d9480f', '#2b8a3e', '#0b7285', '#c2255c'];
  const fileUrl = (d) => catalog.base + d.file.split('/').map(enc).join('/');
  const docHref = (d, ch) => `#/d/${enc(d.id)}${ch != null ? `?ch=${ch}` : ''}`;
  const catHref = (c) => `#/c/${enc(c.id)}`;
  const tagHref = (t) => `#/suche?tag=${enc(t)}`;

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  }

  const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
  function ago(ts) {
    const min = Math.round((ts - Date.now()) / 60000);
    if (min > -60) return rtf.format(min, 'minute');
    if (min > -60 * 24) return rtf.format(Math.round(min / 60), 'hour');
    return rtf.format(Math.round(min / 60 / 24), 'day');
  }

  // ---------------------------------------------------------------------------
  // Katalog indizieren
  // ---------------------------------------------------------------------------

  const root = catalog.root;
  const cats = new Map();
  const docs = new Map();
  const tagIndex = new Map(); // norm(tag) -> { label, count }

  // Reihenfolge innerhalb eines Themas wie bei LEIFI: erst Grundwissen, dann Versuche, dann Übungen.
  const TYPE_ORDER = ['grundwissen', 'versuch', 'arbeitsblatt', 'aufgaben'];
  const typeRank = (d) => { const i = TYPE_ORDER.indexOf(norm(d.type)); return i < 0 ? TYPE_ORDER.length : i; };

  (function index(node, parent, area) {
    node.parent = parent;
    node.area = area;
    node.docs.sort((a, b) => typeRank(a) - typeRank(b));
    cats.set(node.id, node);
    for (const d of node.docs) {
      d.cat = node;
      d.area = area || node;
      docs.set(d.id, d);
      for (const t of d.tags) {
        const key = norm(t);
        const entry = tagIndex.get(key) || { label: t, count: 0 };
        entry.count++;
        tagIndex.set(key, entry);
      }
    }
    node.children.forEach((c) => index(c, node, area || c));
    node.allDocs = [...node.docs, ...node.children.flatMap((c) => c.allDocs)];
  })(root, null, null);

  root.children.forEach((a, i) => { a.color = a.color || PALETTE[i % PALETTE.length]; });
  const colorOf = (node) => (node.area || node).color || PALETTE[0];

  // Kategorienpfad ohne die Wurzel, z. B. [Mechanik, Kinematik]
  function trail(node) {
    const out = [];
    for (let n = node; n && n !== root; n = n.parent) out.unshift(n);
    return out;
  }

  for (const d of docs.values()) {
    const path = trail(d.cat).map((c) => c.title);
    d.fields = [
      [d.title, 10], ...d.tags.map((t) => [t, 8]), [d.type, 4], [d.level, 2],
      ...path.map((t) => [t, 3]), [d.summary, 2], [d.file, 1],
    ].map(([text, weight]) => ({ n: norm(text), weight }));
    d.chapterFields = d.chapters.map((ch) => ({ title: norm(ch.title), keywords: norm(ch.keywords.join(' | ')) }));
  }

  // ---------------------------------------------------------------------------
  // Lernfortschritt (localStorage)
  // ---------------------------------------------------------------------------

  const STORE_KEY = 'lernbibliothek.progress.v1';
  let progress = { docs: {} };
  try { progress = JSON.parse(localStorage.getItem(STORE_KEY)) || progress; } catch { /* privates Fenster o. Ä. */ }
  if (!progress.docs) progress = { docs: {} };

  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch { /* nur im Speicher */ }
  }

  const entry = (d) => (progress.docs[d.id] ||= { done: [] });
  const units = (d) => d.chapters.length || 1; // Dokument ohne Kapitel = 1 Einheit
  const doneSet = (d) => new Set((progress.docs[d.id]?.done || []).filter((i) => i < units(d)));
  const doneUnits = (d) => doneSet(d).size;
  const isDone = (d) => doneUnits(d) === units(d);

  function ratio(list) {
    let total = 0; let done = 0;
    for (const d of list) { total += units(d); done += doneUnits(d); }
    return { total, done, value: total ? done / total : 0 };
  }

  function toggleChapter(d, i) {
    const set = doneSet(d);
    set.has(i) ? set.delete(i) : set.add(i);
    entry(d).done = [...set].sort((a, b) => a - b);
    saveProgress();
  }

  function toggleDoc(d) {
    entry(d).done = isDone(d) ? [] : Array.from({ length: units(d) }, (_, i) => i);
    saveProgress();
  }

  function markOpened(d) {
    entry(d).opened = Date.now();
    saveProgress();
  }

  // ---------------------------------------------------------------------------
  // Suche
  // ---------------------------------------------------------------------------

  const tokenize = (q) => norm(q).split(/[\s,;]+/).filter((t) => t.length >= 2);
  const startsWord = (text, tok) => new RegExp(`(^|[^a-z0-9])${reEscape(tok)}`).test(text);

  function search(query, { tag, type } = {}) {
    const tokens = tokenize(query);
    const results = [];
    for (const d of docs.values()) {
      if (tag && !d.tags.some((t) => norm(t) === norm(tag))) continue;
      if (type && norm(d.type) !== norm(type)) continue;

      let score = 0;
      let matchesAll = true;
      for (const tok of tokens) {
        let best = 0;
        for (const f of d.fields) {
          if (f.n.includes(tok)) best = Math.max(best, f.weight * (startsWord(f.n, tok) ? 1.5 : 1));
        }
        for (const cf of d.chapterFields) {
          if (cf.title.includes(tok)) best = Math.max(best, 6);
          if (cf.keywords.includes(tok)) best = Math.max(best, 5);
        }
        if (!best) { matchesAll = false; break; }
        score += best;
      }
      if (!matchesAll) continue;

      const chapterHits = tokens.length
        ? d.chapters.map((ch, i) => i).filter((i) => tokens.some((t) => d.chapterFields[i].title.includes(t) || d.chapterFields[i].keywords.includes(t)))
        : [];
      results.push({ d, score, chapterHits });
    }
    return results.sort((a, b) => b.score - a.score || a.d.title.localeCompare(b.d.title, 'de'));
  }

  // Hervorhebung im Originaltext (inkl. „waerme“ -> „Wärme“).
  function tokenPattern(tok) {
    const alt = { ae: '(?:ae|ä)', oe: '(?:oe|ö)', ue: '(?:ue|ü)', ss: '(?:ss|ß)' };
    let p = '';
    for (let i = 0; i < tok.length; i++) {
      const two = tok.slice(i, i + 2);
      if (alt[two]) { p += alt[two]; i++; } else p += reEscape(tok[i]);
    }
    return p;
  }

  function hl(text, tokens) {
    const s = String(text ?? '');
    if (!tokens?.length) return esc(s);
    const re = new RegExp(tokens.map(tokenPattern).join('|'), 'gi');
    let out = '';
    let last = 0;
    for (const m of s.matchAll(re)) {
      out += `${esc(s.slice(last, m.index))}<mark>${esc(m[0])}</mark>`;
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }

  // ---------------------------------------------------------------------------
  // Bausteine
  // ---------------------------------------------------------------------------

  const typeClass = (type) => `t-${norm(type).replace(/[^a-z]/g, '') || 'none'}`;
  const typeBadge = (type) => (type ? `<span class="badge ${typeClass(type)}">${esc(type)}</span>` : '');

  function bar(r, { label = true } = {}) {
    const pct = Math.round(r.value * 100);
    return `<div class="progress" title="${r.done} von ${r.total} Kapiteln behandelt">
      <div class="bar"><span style="width:${pct}%"></span></div>${label ? `<span class="bar-label">${pct} %</span>` : ''}</div>`;
  }

  function breadcrumb(node, extra) {
    const items = [`<a href="#/">Übersicht</a>`, ...trail(node).map((c) => `<a href="${catHref(c)}">${esc(c.title)}</a>`)];
    if (extra) items.push(`<span aria-current="page">${esc(extra)}</span>`);
    return `<nav class="breadcrumb" aria-label="Pfad">${items.join('<span class="sep">›</span>')}</nav>`;
  }

  function tagChips(list, tokens) {
    if (!list.length) return '';
    return `<div class="tags">${list.map((t) => `<a class="tag" href="${tagHref(t)}">#${hl(t, tokens)}</a>`).join('')}</div>`;
  }

  function docCard(d, { tokens = [], chapterHits = [], showPath = false } = {}) {
    const done = doneUnits(d);
    const total = units(d);
    const state = done === 0 ? '' : done === total ? ' is-done' : ' is-partial';
    const hits = chapterHits.length
      ? `<ul class="chapter-hits">${chapterHits.map((i) => {
        const ch = d.chapters[i];
        return `<li><a href="${docHref(d, i)}">Kap. ${i + 1}: ${hl(ch.title, tokens)}${ch.page ? ` <span class="muted">· S. ${ch.page}</span>` : ''}</a></li>`;
      }).join('')}</ul>`
      : '';
    return `<article class="doc-card${state}" style="--accent:${colorOf(d.cat)}">
      <div class="doc-card-top">
        ${typeBadge(d.type)}
        ${d.hasMeta ? '' : '<span class="badge badge-warn">ohne Metadaten</span>'}
        <span class="file-ext">${esc(d.ext.toUpperCase())}${d.pages ? ` · ${d.pages} S.` : ''}</span>
      </div>
      ${showPath ? `<div class="doc-path">${trail(d.cat).map((c) => esc(c.title)).join(' › ')}</div>` : ''}
      <h3><a class="stretched" href="${docHref(d)}">${hl(d.title, tokens)}</a></h3>
      ${d.summary ? `<p class="doc-summary">${hl(d.summary, tokens)}</p>` : ''}
      ${hits}
      ${tagChips(d.tags, tokens)}
      <div class="doc-card-foot">
        <div class="progress"><div class="bar"><span style="width:${Math.round((done / total) * 100)}%"></span></div></div>
        <span class="muted small">${d.chapters.length ? `${done}/${total} Kapitel` : (done ? 'behandelt' : 'offen')}</span>
        <button class="check-btn" data-action="toggle-doc" data-id="${esc(d.id)}"
          title="${isDone(d) ? 'Markierung entfernen' : 'Als behandelt markieren'}" aria-pressed="${isDone(d)}">✓</button>
      </div>
    </article>`;
  }

  function tagCloud(limit = 40) {
    const tags = [...tagIndex.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'de')).slice(0, limit);
    if (!tags.length) return '<p class="muted">Noch keine Schlagwörter vorhanden.</p>';
    const max = tags[0].count;
    return `<div class="tag-cloud">${tags.sort((a, b) => a.label.localeCompare(b.label, 'de')).map((t) =>
      `<a class="tag" style="--w:${(0.85 + (t.count / max) * 0.5).toFixed(2)}" href="${tagHref(t.label)}">#${esc(t.label)} <span class="muted">${t.count}</span></a>`).join('')}</div>`;
  }

  // ---------------------------------------------------------------------------
  // Seitenleiste
  // ---------------------------------------------------------------------------

  const openAreas = new Set();

  function renderSidebar(activeId = null) {
    const item = (node) => {
      const r = ratio(node.allDocs);
      const active = node.id === activeId ? ' active' : '';
      const kids = node.children.length ? `<ul>${node.children.map(item).join('')}</ul>` : '';
      return `<li><a class="nav-item${active}" href="${catHref(node)}"><span>${esc(node.title)}</span>
        <span class="nav-pct${r.value === 1 ? ' complete' : ''}">${Math.round(r.value * 100)} %</span></a>${kids}</li>`;
    };
    const activeArea = activeId != null ? cats.get(activeId)?.area : null;
    sidebar.innerHTML = `
      <div class="sidebar-title">Bereiche</div>
      ${root.children.map((a) => {
        const open = a === activeArea || openAreas.has(a.id);
        const r = ratio(a.allDocs);
        return `<details class="nav-area" data-area="${esc(a.id)}" style="--accent:${a.color}" ${open ? 'open' : ''}>
          <summary><span class="nav-dot"></span><a href="${catHref(a)}" class="${a.id === activeId ? 'active' : ''}">${esc(a.icon)} ${esc(a.title)}</a>
          <span class="nav-pct${r.value === 1 ? ' complete' : ''}">${Math.round(r.value * 100)} %</span></summary>
          <ul>${a.children.map(item).join('')}</ul>
        </details>`;
      }).join('')}
      <div class="sidebar-foot muted small">Katalog vom ${new Date(catalog.generated).toLocaleDateString('de-DE')} · ${docs.size} Dokumente</div>`;
  }

  sidebar.addEventListener('toggle', (e) => {
    const el = e.target.closest('details[data-area]');
    if (el) el.open ? openAreas.add(el.dataset.area) : openAreas.delete(el.dataset.area);
  }, true);

  // ---------------------------------------------------------------------------
  // Ansichten
  // ---------------------------------------------------------------------------

  function viewHome() {
    const all = [...docs.values()];
    const chapters = all.reduce((s, d) => s + d.chapters.length, 0);
    const recent = all.filter((d) => progress.docs[d.id]?.opened)
      .sort((a, b) => progress.docs[b.id].opened - progress.docs[a.id].opened).slice(0, 6);

    const tiles = root.children.map((a) => `
      <article class="area-tile" style="--accent:${a.color}">
        <a class="area-head" href="${catHref(a)}"><span class="area-icon">${esc(a.icon || a.title[0])}</span><h2>${esc(a.title)}</h2></a>
        ${a.description ? `<p>${esc(a.description)}</p>` : ''}
        <ul class="topic-list">${a.children.map((c) => `<li><a href="${catHref(c)}">${esc(c.title)}</a><span class="muted small">${c.allDocs.length}</span></li>`).join('')}</ul>
        ${bar(ratio(a.allDocs))}
      </article>`).join('');

    const loose = root.docs.length
      ? `<section class="block"><h2>Weitere Dokumente</h2><div class="card-grid">${root.docs.map((d) => docCard(d)).join('')}</div></section>` : '';

    return `
      <section class="hero">
        <h1>Lernbibliothek</h1>
        <p>${docs.size} Dokumente mit ${chapters} Kapiteln in ${root.children.length} Bereichen – nach Themen sortiert, durchsuchbar und mit deinem Lernfortschritt.</p>
        <div class="hero-progress">${bar(ratio(all))}<a href="#/fortschritt" class="small">Fortschritt ansehen →</a></div>
      </section>
      <section class="area-grid">${tiles}</section>
      ${loose}
      <div class="home-columns">
        <section class="block">
          <h2>Zuletzt geöffnet</h2>
          ${recent.length ? `<ul class="link-list">${recent.map((d) => `<li style="--accent:${colorOf(d.cat)}">
            <a href="${docHref(d)}">${esc(d.title)}</a><span class="muted small">${esc(d.area.title)} · ${ago(progress.docs[d.id].opened)}</span></li>`).join('')}</ul>`
            : '<p class="muted">Noch nichts geöffnet. Wähle einen Bereich oder nutze die Suche.</p>'}
        </section>
        <section class="block">
          <h2>Schlagwörter</h2>
          ${tagCloud()}
        </section>
      </div>`;
  }

  function viewCategory(node, params) {
    const type = params.get('typ') || '';
    const openOnly = params.get('offen') === '1';
    const keep = (d) => (!type || norm(d.type) === norm(type)) && (!openOnly || !isDone(d));
    const setParam = (key, val) => {
      const p = new URLSearchParams(params);
      val ? p.set(key, val) : p.delete(key);
      const qs = p.toString();
      return `${catHref(node)}${qs ? `?${qs}` : ''}`;
    };

    const typeCounts = new Map();
    for (const d of node.allDocs) if (d.type) typeCounts.set(d.type, (typeCounts.get(d.type) || 0) + 1);

    const section = (n, depth) => {
      const list = n.docs.filter(keep);
      const sub = n.children.map((c) => section(c, depth + 1)).join('');
      if (!list.length && !sub) return '';
      const h = `h${Math.min(depth + 1, 4)}`;
      const head = n === node ? '' : `<header class="topic-head">
        <${h}><a href="${catHref(n)}">${esc(n.title)}</a></${h}>${bar(ratio(n.allDocs))}</header>
        ${n.description ? `<p class="muted">${esc(n.description)}</p>` : ''}`;
      return `<section class="topic depth-${depth}">${head}
        ${list.length ? `<div class="card-grid">${list.map((d) => docCard(d)).join('')}</div>` : ''}${sub}</section>`;
    };
    const body = section(node, 1);

    return `
      ${breadcrumb(node.parent, node.title)}
      <header class="cat-header" style="--accent:${colorOf(node)}">
        <div class="cat-title">${node.icon ? `<span class="area-icon">${esc(node.icon)}</span>` : ''}<h1>${esc(node.title)}</h1></div>
        ${node.description ? `<p>${esc(node.description)}</p>` : ''}
        <div class="cat-stats"><span>${node.allDocs.length} Dokumente</span><span>${node.children.length} Unterthemen</span>${bar(ratio(node.allDocs))}</div>
      </header>
      <div class="filters" role="toolbar" aria-label="Filter">
        <a class="chip${!type ? ' active' : ''}" href="${setParam('typ', '')}">Alle <span>${node.allDocs.length}</span></a>
        ${[...typeCounts].map(([t, n]) => `<a class="chip ${typeClass(t)}${norm(t) === norm(type) ? ' active' : ''}" href="${setParam('typ', t)}">${esc(t)} <span>${n}</span></a>`).join('')}
        <a class="chip chip-toggle${openOnly ? ' active' : ''}" href="${setParam('offen', openOnly ? '' : '1')}">${openOnly ? '☑' : '☐'} Nur offene</a>
      </div>
      ${body || '<div class="empty-state"><p>Keine Dokumente für diesen Filter.</p></div>'}`;
  }

  function viewDoc(d) {
    return `
      ${breadcrumb(d.cat, d.title)}
      <header class="doc-head" style="--accent:${colorOf(d.cat)}">
        <div class="doc-card-top">${typeBadge(d.type)}${d.level ? `<span class="badge t-none">${esc(d.level)}</span>` : ''}</div>
        <h1>${esc(d.title)}</h1>
        ${d.summary ? `<p class="lead">${esc(d.summary)}</p>` : ''}
        ${tagChips(d.tags)}
        <p class="muted small">${esc(d.ext.toUpperCase())}${d.pages ? ` · ${d.pages} Seiten` : ''} · ${formatSize(d.size)} · Stand ${esc(d.modified)} · <code>${esc(d.file)}</code></p>
        ${d.hasMeta ? '' : `<div class="notice">Für dieses Dokument gibt es noch keine Metadaten (Zusammenfassung, Tags, Kapitel).
          Bitte den KI-Agenten, die Bibliothek zu katalogisieren – siehe <code>AGENTS.md</code>.</div>`}
      </header>
      <div class="doc-body">
        <aside class="toc" id="toc"></aside>
        <section class="viewer" id="viewer" aria-label="Dokumentansicht"></section>
      </div>`;
  }

  function renderToc(d, activeIdx) {
    const toc = document.getElementById('toc');
    if (!toc) return;
    const set = doneSet(d);
    const list = d.chapters.length
      ? `<ol class="chapter-list">${d.chapters.map((ch, i) => `
          <li class="chapter${set.has(i) ? ' done' : ''}${i === activeIdx ? ' active' : ''}">
            <label class="chk" title="Als behandelt markieren"><input type="checkbox" data-action="toggle-ch" data-i="${i}" ${set.has(i) ? 'checked' : ''}><span></span></label>
            <button class="chapter-link" data-action="goto-ch" data-i="${i}">
              <span class="ch-title">${i + 1}. ${esc(ch.title)}</span>
              ${ch.page ? `<span class="ch-page">S. ${ch.page}</span>` : ''}
              ${ch.keywords.length ? `<span class="ch-kw">${ch.keywords.map(esc).join(' · ')}</span>` : ''}
            </button>
          </li>`).join('')}</ol>`
      : '<p class="muted small">Keine Kapitel hinterlegt.</p>';
    toc.innerHTML = `
      <div class="toc-head"><h2>Kapitel</h2>${bar(ratio([d]))}</div>
      ${list}
      <div class="toc-actions">
        <button class="btn${isDone(d) ? '' : ' btn-primary'}" data-action="toggle-doc" data-id="${esc(d.id)}">${isDone(d) ? 'Markierung entfernen' : '✓ Alles als behandelt markieren'}</button>
        <a class="btn" href="${fileUrl(d)}" target="_blank" rel="noopener">In neuem Tab öffnen ↗</a>
      </div>`;
  }

  function mountViewer(d, chIdx) {
    const viewer = document.getElementById('viewer');
    if (!viewer) return;
    const ch = chIdx != null ? d.chapters[chIdx] : null;
    let src = fileUrl(d);
    if (ch?.page && d.ext === 'pdf') src += `#page=${ch.page}`;
    else if (ch?.anchor) src += `#${enc(ch.anchor)}`;

    if (['pdf', 'html', 'htm', 'txt', 'svg'].includes(d.ext)) {
      viewer.innerHTML = `<iframe title="${esc(d.title)}" src="${esc(src)}"></iframe>`;
      if (ch?.anchor) keepPageScroll(viewer.firstElementChild, ch.anchor);
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(d.ext)) {
      viewer.innerHTML = `<img src="${esc(src)}" alt="${esc(d.title)}">`;
    } else if (['mp4', 'webm'].includes(d.ext)) {
      viewer.innerHTML = `<video src="${esc(src)}" controls></video>`;
    } else if (d.ext === 'mp3') {
      viewer.innerHTML = `<audio src="${esc(src)}" controls></audio>`;
    } else {
      viewer.innerHTML = `<div class="empty-state"><p>Dateien vom Typ <strong>${esc(d.ext.toUpperCase())}</strong> kann der Browser nicht direkt anzeigen.</p>
        <a class="btn btn-primary" href="${esc(src)}" download>Datei öffnen / herunterladen</a></div>`;
    }
  }

  // Ein Anker-Sprung im iframe scrollt sonst auch die äußere Seite mit.
  function keepPageScroll(iframe, anchor) {
    const y = window.scrollY;
    iframe.addEventListener('load', () => {
      try { // gleiche Herkunft (http://localhost): nur das iframe scrollen
        const win = iframe.contentWindow;
        const target = win.document.getElementById(anchor);
        if (target) win.scrollTo(0, target.getBoundingClientRect().top + win.scrollY);
      } catch { /* file:// – Zugriff gesperrt, Fragment-Sprung des Browsers greift */ }
      const until = performance.now() + 600;
      (function hold() {
        if (window.scrollY !== y) window.scrollTo(0, y);
        if (performance.now() < until) requestAnimationFrame(hold);
      })();
    });
  }

  function viewSearch(params) {
    const q = params.get('q') || '';
    const tag = params.get('tag') || '';
    const type = params.get('typ') || '';
    const tokens = tokenize(q);

    if (!tokens.length && !tag) {
      return `<h1>Suche</h1>
        <p class="muted">Gib oben einen Begriff ein – gesucht wird in Titeln, Zusammenfassungen, Schlagwörtern, Kapiteln und Kapitel-Stichworten.
        Mehrere Begriffe werden UND-verknüpft. Umlaute kannst du auch als ae/oe/ue schreiben.</p>
        <section class="block"><h2>Schlagwörter</h2>${tagCloud(100)}</section>`;
    }

    const unfiltered = search(q, { tag });
    const results = type ? unfiltered.filter((r) => norm(r.d.type) === norm(type)) : unfiltered;
    const typeCounts = new Map();
    for (const r of unfiltered) if (r.d.type) typeCounts.set(r.d.type, (typeCounts.get(r.d.type) || 0) + 1);
    const link = (changes) => {
      const p = new URLSearchParams(params);
      for (const [k, v] of Object.entries(changes)) v ? p.set(k, v) : p.delete(k);
      return `#/suche?${p}`;
    };
    const chapterCount = results.reduce((s, r) => s + r.chapterHits.length, 0);

    return `
      <h1>${tag && !q ? `Schlagwort #${esc(tag)}` : 'Suchergebnisse'}</h1>
      <p class="muted">${results.length} Dokument${results.length === 1 ? '' : 'e'}${chapterCount ? ` · ${chapterCount} passende Kapitel` : ''}
        ${q ? ` für „${esc(q)}“` : ''}
        ${tag && q ? `<a class="chip active" href="${link({ tag: '' })}" title="Schlagwort-Filter entfernen">#${esc(tag)} ✕</a>` : ''}</p>
      ${typeCounts.size > 1 || type ? `<div class="filters">
        <a class="chip${!type ? ' active' : ''}" href="${link({ typ: '' })}">Alle <span>${unfiltered.length}</span></a>
        ${[...typeCounts].map(([t, n]) => `<a class="chip ${typeClass(t)}${norm(t) === norm(type) ? ' active' : ''}" href="${link({ typ: t })}">${esc(t)} <span>${n}</span></a>`).join('')}
      </div>` : ''}
      ${results.length
        ? `<div class="card-grid">${results.map((r) => docCard(r.d, { tokens, chapterHits: r.chapterHits, showPath: true })).join('')}</div>`
        : `<div class="empty-state"><p>Nichts gefunden. Versuch es mit einem anderen Begriff oder einem Schlagwort:</p>${tagCloud(20)}</div>`}`;
  }

  function viewProgress() {
    const all = [...docs.values()];
    const finished = all.filter(isDone);
    const started = all.filter((d) => doneUnits(d) > 0 && !isDone(d));
    const row = (n, depth) => `<li class="depth-${depth}"><a href="${catHref(n)}">${esc(n.title)}</a>${bar(ratio(n.allDocs))}</li>
      ${n.children.map((c) => row(c, depth + 1)).join('')}`;
    const docList = (list, empty) => (list.length
      ? `<ul class="link-list">${list.map((d) => `<li style="--accent:${colorOf(d.cat)}"><a href="${docHref(d)}">${esc(d.title)}</a>
          <span class="muted small">${trail(d.cat).map((c) => esc(c.title)).join(' › ')} · ${doneUnits(d)}/${units(d)}</span></li>`).join('')}</ul>`
      : `<p class="muted">${empty}</p>`);

    return `
      <h1>Mein Fortschritt</h1>
      <div class="stat-row">
        <div class="stat"><strong>${Math.round(ratio(all).value * 100)} %</strong><span>aller Kapitel behandelt</span></div>
        <div class="stat"><strong>${finished.length}</strong><span>von ${all.length} Dokumenten abgeschlossen</span></div>
        <div class="stat"><strong>${started.length}</strong><span>Dokumente angefangen</span></div>
      </div>
      <div class="progress-areas">${root.children.map((a) => `
        <section class="block area-progress" style="--accent:${a.color}">
          <h2><a href="${catHref(a)}">${esc(a.icon)} ${esc(a.title)}</a></h2>${bar(ratio(a.allDocs))}
          <ul class="progress-tree">${a.children.map((c) => row(c, 1)).join('')}</ul>
        </section>`).join('')}
      </div>
      <div class="home-columns">
        <section class="block"><h2>Angefangen</h2>${docList(started, 'Keine angefangenen Dokumente.')}</section>
        <section class="block"><h2>Abgeschlossen</h2>${docList(finished, 'Noch nichts abgeschlossen.')}</section>
      </div>
      <section class="block">
        <h2>Sichern &amp; übertragen</h2>
        <p class="muted small">Der Fortschritt wird nur in diesem Browser gespeichert. Exportiere ihn als Datei, um ihn zu sichern oder auf ein anderes Gerät zu übertragen.</p>
        <div class="btn-row">
          <button class="btn" data-action="export">Fortschritt exportieren</button>
          <label class="btn">Fortschritt importieren<input type="file" accept="application/json,.json" data-action="import" hidden></label>
          <button class="btn btn-danger" data-action="reset">Zurücksetzen</button>
        </div>
      </section>`;
  }

  function viewNotFound(what) {
    return `<div class="empty-state"><h1>Nicht gefunden</h1><p>${esc(what)} existiert nicht (mehr) im Katalog.</p><a class="btn" href="#/">Zur Übersicht</a></div>`;
  }

  // ---------------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------------

  let current = { view: '', doc: null };

  function parseHash() {
    const [path, qs] = (location.hash.slice(1) || '/').split('?');
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(qs || '') };
  }

  function render({ scroll = true } = {}) {
    const { parts, params } = parseHash();
    const view = parts[0] || '';
    let activeCat = null;
    current = { view, doc: null };

    if (view === 'c' && cats.has(parts[1])) {
      const node = cats.get(parts[1]);
      activeCat = node.id;
      main.innerHTML = viewCategory(node, params);
      document.title = `${node.title} – Lernbibliothek`;
    } else if (view === 'd' && docs.has(parts[1])) {
      const d = docs.get(parts[1]);
      const ch = params.has('ch') ? Number(params.get('ch')) : null;
      activeCat = d.cat.id;
      current.doc = d;
      main.innerHTML = viewDoc(d);
      renderToc(d, ch);
      mountViewer(d, ch);
      if (scroll) markOpened(d);
      document.title = `${d.title} – Lernbibliothek`;
    } else if (view === 'suche') {
      main.innerHTML = viewSearch(params);
      if (document.activeElement !== searchInput) searchInput.value = params.get('q') || '';
      document.title = 'Suche – Lernbibliothek';
    } else if (view === 'fortschritt') {
      main.innerHTML = viewProgress();
      document.title = 'Mein Fortschritt – Lernbibliothek';
    } else if (!view) {
      main.innerHTML = viewHome();
      document.title = 'Lernbibliothek';
    } else {
      main.innerHTML = viewNotFound(parts[1] || parts[0]);
    }

    if (view !== 'suche' && document.activeElement !== searchInput) searchInput.value = '';
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === (view || 'home')));
    renderSidebar(activeCat);
    document.body.classList.remove('nav-open');
    if (scroll) window.scrollTo(0, 0);
  }

  // Nach einer Fortschrittsänderung: Dokumentansicht nur teilweise neu zeichnen (Viewer bleibt geladen).
  function refresh() {
    if (current.view === 'd' && current.doc) {
      const ch = parseHash().params.get('ch');
      renderToc(current.doc, ch != null ? Number(ch) : null);
      renderSidebar(current.doc.cat.id);
    } else {
      render({ scroll: false });
    }
  }

  window.addEventListener('hashchange', () => render());

  // ---------------------------------------------------------------------------
  // Interaktion
  // ---------------------------------------------------------------------------

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'toggle-nav') {
      document.body.classList.toggle('nav-open');
    } else if (action === 'toggle-doc') {
      e.preventDefault();
      const d = docs.get(el.dataset.id);
      if (d) { toggleDoc(d); refresh(); }
    } else if (action === 'goto-ch' && current.doc) {
      const i = Number(el.dataset.i);
      history.replaceState(null, '', docHref(current.doc, i));
      renderToc(current.doc, i);
      mountViewer(current.doc, i);
    } else if (action === 'export') {
      const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `lernfortschritt-${new Date().toISOString().slice(0, 10)}.json`,
      });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } else if (action === 'reset') {
      if (confirm('Gesamten Lernfortschritt in diesem Browser löschen?')) {
        progress = { docs: {} };
        saveProgress();
        refresh();
      }
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.action === 'toggle-ch' && current.doc) {
      toggleChapter(current.doc, Number(el.dataset.i));
      refresh();
    } else if (el.dataset.action === 'import' && el.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || typeof data.docs !== 'object') throw new Error('Unbekanntes Format');
          progress = data;
          saveProgress();
          refresh();
        } catch (err) {
          alert(`Import fehlgeschlagen: ${err.message}`);
        }
      };
      reader.readAsText(el.files[0]);
    }
  });

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value.trim();
      const { parts, params } = parseHash();
      if (parts[0] === 'suche') {
        q ? params.set('q', q) : params.delete('q');
        location.replace(`#/suche?${params}`);
      } else if (q) {
        location.hash = `#/suche?q=${enc(q)}`;
      }
    }, 150);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchInput.value = ''; searchInput.blur(); }
    if (e.key === 'Enter') { main.querySelector('.doc-card a.stretched')?.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName || '');
    if (e.key === '/' && !typing) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
  });

  render();
})();
