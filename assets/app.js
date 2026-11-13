// Cérebro — segundo cérebro estático: notas em Markdown, [[wikilinks]], MOC e grafo.
const NOTES_DIR = "notes/";

const state = {
  index: [],
  bySlug: new Map(),
  byTitle: new Map(),
  notes: new Map(), // slug -> { slug, title, tags, type, html, links }
  graph: { nodes: [], edges: [], view: { scale: 1, ox: 0, oy: 0 } },
  hover: null,
  query: "",
};

/* ---------------- utilidades ---------------- */

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTitle(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve um alvo de wikilink para um slug existente (por slug ou por título). */
function resolve(target) {
  const raw = String(target).trim();
  if (!raw) return null;
  if (state.bySlug.has(raw)) return raw;
  const bySlug = slugify(raw);
  if (state.bySlug.has(bySlug)) return bySlug;
  if (state.byTitle.has(normalizeTitle(raw))) return state.byTitle.get(normalizeTitle(raw));
  return null;
}

/* ---------------- markdown ---------------- */

function inline(text, links) {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\[\[([^\][|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const name = target.trim();
    links.push(name);
    const slug = resolve(name);
    const label_ = (label || name).trim();
    return slug
      ? `<a class="wikilink" href="#/nota/${encodeURIComponent(slug)}">${label_}</a>`
      : `<span class="wikilink is-broken" title="Esta nota ainda não existe">${label_}</span>`;
  });
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, href) => {
    return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|[\s>])#([\p{L}\p{N}_-]+)/gu, (_, pre, tag) => {
    return `${pre}<a class="tag" href="#/tag/${encodeURIComponent(tag)}">#${tag}</a>`;
  });
  return out;
}

function renderMarkdown(source) {
  const links = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      i += 1;
      const buffer = [];
      while (i < lines.length && !/^```/.test(lines[i])) buffer.push(lines[i++]);
      i += 1;
      out.push(
        `<pre><code${lang ? ` data-lang="${esc(lang)}"` : ""}>${esc(buffer.join("\n"))}</code></pre>`
      );
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    let match;
    if ((match = line.match(/^(#{1,6})\s+(.*)$/))) {
      const level = match[1].length;
      out.push(`<h${level}>${inline(match[2], links)}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push("<hr />");
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buffer = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buffer.push(lines[i++].replace(/^>\s?/, ""));
      }
      out.push(`<blockquote>${inline(buffer.join(" "), links)}</blockquote>`);
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*([-*+]|\d+\.)\s+/, ""));
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((item) => `<li>${inline(item, links)}</li>`).join("")}</${tag}>`);
      continue;
    }

    const buffer = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|>\s?)/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i])
    ) {
      buffer.push(lines[i++]);
    }
    if (!buffer.length) buffer.push(lines[i++]);
    out.push(`<p>${inline(buffer.join(" "), links)}</p>`);
  }

  return { html: out.join("\n"), links };
}

function stripFrontmatter(raw) {
  const match = raw.match(/^---\n[\s\S]*?\n---\n?/);
  return match ? raw.slice(match[0].length) : raw;
}

/* ---------------- carregamento ---------------- */

async function load() {
  const indexResponse = await fetch(`${NOTES_DIR}index.json`, { cache: "no-store" });
  if (!indexResponse.ok) throw new Error("notes/index.json não encontrado — rode `npm run index`.");
  const data = await indexResponse.json();

  state.index = (data.notes || []).slice().sort((a, b) => {
    if (a.type === b.type) return a.title.localeCompare(b.title, "pt-BR");
    return a.type === "moc" ? -1 : 1;
  });

  for (const note of state.index) {
    state.bySlug.set(note.slug, note);
    state.byTitle.set(normalizeTitle(note.title), note.slug);
  }

  await Promise.all(
    state.index.map(async (note) => {
      const response = await fetch(`${NOTES_DIR}${note.slug}.md`, { cache: "no-store" });
      const raw = response.ok ? await response.text() : "";
      const parsed = renderMarkdown(stripFrontmatter(raw));
      state.notes.set(note.slug, {
        ...note,
        html: parsed.html,
        links: [...new Set(parsed.links)],
      });
    })
  );

  buildGraph();
}

function buildGraph() {
  const nodes = state.index.map((note) => ({
    slug: note.slug,
    title: note.title,
    type: note.type,
    degree: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  }));
  const byNode = new Map(nodes.map((node) => [node.slug, node]));

  const edges = [];
  const seen = new Set();
  for (const note of state.notes.values()) {
    for (const target of note.links) {
      const slug = resolve(target);
      if (!slug || slug === note.slug) continue;
      const key = [note.slug, slug].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: note.slug, b: slug });
      byNode.get(note.slug).degree += 1;
      byNode.get(slug).degree += 1;
    }
  }

  const radius = Math.min(260, 90 + nodes.length * 14);
  nodes.forEach((node, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;
  });

  state.graph = { nodes, edges, byNode, view: { scale: 1, ox: 0, oy: 0 } };
}

/* ---------------- sidebar ---------------- */

function filteredNotes() {
  const query = normalizeTitle(state.query);
  if (!query) return state.index;
  return state.index.filter((note) => {
    if (normalizeTitle(note.title).includes(query)) return true;
    if (note.slug.includes(query)) return true;
    if ((note.tags || []).some((tag) => normalizeTitle(tag).includes(query))) return true;
    const body = state.notes.get(note.slug);
    return body ? body.html.toLowerCase().includes(query) : false;
  });
}

function renderSidebar(currentSlug) {
  const notes = filteredNotes();
  const mocs = notes.filter((note) => note.type === "moc");
  const regular = notes.filter((note) => note.type !== "moc");

  const item = (note) => `
    <li>
      <a href="#/nota/${encodeURIComponent(note.slug)}"
         data-type="${note.type}"
         class="${note.slug === currentSlug ? "is-current" : ""}">
        <span class="dot" aria-hidden="true"></span>
        <span>${esc(note.title)}</span>
      </a>
    </li>`;

  document.getElementById("list-moc").innerHTML =
    mocs.map(item).join("") || `<li><span class="none">—</span></li>`;
  document.getElementById("list-notes").innerHTML =
    regular.map(item).join("") || `<li><span class="none">nenhuma nota</span></li>`;

  const tagCounts = new Map();
  for (const note of state.index) {
    for (const tag of note.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
  document.getElementById("list-tags").innerHTML = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([tag, count]) => `<a class="tag" href="#/tag/${encodeURIComponent(tag)}">#${esc(tag)} ${count}</a>`)
    .join("");

  const linkCount = state.graph.edges.length;
  document.getElementById("stats").textContent =
    `${state.index.length} notas · ${linkCount} ligações`;
}

/* ---------------- views ---------------- */

function linkList(slugs, emptyText) {
  if (!slugs.length) return `<p class="none">${emptyText}</p>`;
  return `<ul class="link-list">${slugs
    .map((slug) => {
      const note = state.bySlug.get(slug);
      if (!note) return "";
      return `<li><a href="#/nota/${encodeURIComponent(slug)}">${esc(note.title)}</a></li>`;
    })
    .join("")}</ul>`;
}

function renderNote(slug, main) {
  const note = state.notes.get(slug);
  if (!note) {
    main.innerHTML = `<div class="empty">
      A nota <code>${esc(slug)}</code> ainda não existe.
      <a href="#/nota/inicio">Voltar ao início</a>.
    </div>`;
    return;
  }

  const outgoing = [...new Set(note.links.map(resolve).filter(Boolean))].filter((s) => s !== slug);
  const backlinks = [...state.notes.values()]
    .filter((other) => other.slug !== slug && other.links.map(resolve).includes(slug))
    .map((other) => other.slug)
    .sort();

  document.title = `${note.title} — Cérebro`;

  main.innerHTML = `
    <article class="note ${note.type === "moc" ? "is-moc" : ""}">
      <p class="note-kind">${note.type === "moc" ? "Mapa de conteúdo" : "Nota"}</p>
      <h1>${esc(note.title)}</h1>
      <div class="note-tags">
        ${(note.tags || []).map((tag) => `<a class="tag" href="#/tag/${encodeURIComponent(tag)}">#${esc(tag)}</a>`).join("")}
      </div>
      <div class="prose">${note.html}</div>
      <footer class="note-foot">
        <section>
          <h2>Liga para (${outgoing.length})</h2>
          ${linkList(outgoing, "Nenhum wikilink de saída.")}
        </section>
        <section>
          <h2>Ligado por (${backlinks.length})</h2>
          ${linkList(backlinks, "Nenhuma nota aponta para cá ainda.")}
        </section>
      </footer>
    </article>`;
}

function renderTag(tag, main) {
  const query = normalizeTitle(tag);
  const matches = state.index.filter((note) =>
    (note.tags || []).some((item) => normalizeTitle(item) === query)
  );
  document.title = `#${tag} — Cérebro`;
  main.innerHTML = `
    <div class="note">
      <p class="note-kind">Tag</p>
      <h1>#${esc(tag)}</h1>
      <p style="color:var(--muted)">${matches.length} nota(s) marcada(s).</p>
      <div class="index-grid">
        ${matches
          .map(
            (note) =>
              `<a class="index-card" href="#/nota/${encodeURIComponent(note.slug)}">${esc(note.title)}<small>${(note.tags || []).map((t) => "#" + t).join(" ")}</small></a>`
          )
          .join("")}
      </div>
    </div>`;
}

/* ---------------- grafo ---------------- */

let graphFrame = null;
let graphCleanup = null;

function stopGraph() {
  if (graphFrame) cancelAnimationFrame(graphFrame);
  graphFrame = null;
  if (graphCleanup) graphCleanup();
  graphCleanup = null;
}

function renderGraphView(main) {
  document.title = "Grafo — Cérebro";
  main.innerHTML = `
    <div class="graph-view">
      <div class="graph-head">
        <h1>Grafo de conhecimento</h1>
        <p>${state.graph.nodes.length} notas · ${state.graph.edges.length} ligações. Clique em um nó para abrir a nota.</p>
      </div>
      <div class="graph-canvas-wrap">
        <canvas id="graph"></canvas>
        <div class="legend">
          <span><i style="background:var(--moc)"></i>MOC</span>
          <span><i style="background:var(--accent)"></i>nota</span>
        </div>
      </div>
    </div>`;

  const canvas = main.querySelector("#graph");
  const ctx = canvas.getContext("2d");
  const { nodes, edges, byNode } = state.graph;
  const pointers = { x: 0, y: 0, over: null };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const radiusOf = (node) => 6 + Math.min(node.degree, 10) * 1.6;

  function step() {
    const cx = 0;
    const cy = 0;

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy) || 0.01;
        const min = 86 + radiusOf(a) + radiusOf(b);
        if (dist < min) {
          const force = ((min - dist) / dist) * 0.06;
          dx *= force;
          dy *= force;
          a.x -= dx;
          a.y -= dy;
          b.x += dx;
          b.y += dy;
        }
      }
      a.vx += (cx - a.x) * 0.0022;
      a.vy += (cy - a.y) * 0.0022;
    }

    for (const edge of edges) {
      const a = byNode.get(edge.a);
      const b = byNode.get(edge.b);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const rest = 128;
      const force = (dist - rest) * 0.006;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    for (const node of nodes) {
      node.vx *= 0.86;
      node.vy *= 0.86;
      node.x += node.vx;
      node.y += node.vy;
    }
  }

  function toWorld(px, py) {
    const { scale, ox, oy } = state.graph.view;
    return { x: (px - ox) / scale, y: (py - oy) / scale };
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    step();

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      const r = radiusOf(node) + 34;
      minX = Math.min(minX, node.x - r);
      maxX = Math.max(maxX, node.x + r);
      minY = Math.min(minY, node.y - r);
      maxY = Math.max(maxY, node.y + r);
    }
    if (!Number.isFinite(minX)) {
      minX = -1; maxX = 1; minY = -1; maxY = 1;
    }
    const pad = 24;
    const scale = Math.min(
      (width - pad * 2) / Math.max(maxX - minX, 1),
      (height - pad * 2) / Math.max(maxY - minY, 1)
    );
    const ox = width / 2 - ((minX + maxX) / 2) * scale;
    const oy = height / 2 - ((minY + maxY) / 2) * scale;
    state.graph.view = { scale, ox, oy };

    ctx.clearRect(0, 0, width, height);

    const world = toWorld(pointers.x, pointers.y);
    let hovered = null;
    for (const node of nodes) {
      if (Math.hypot(node.x - world.x, node.y - world.y) < radiusOf(node) + 8) hovered = node;
    }
    state.hover = hovered ? hovered.slug : null;

    const neighbors = new Set();
    if (hovered) {
      neighbors.add(hovered.slug);
      for (const edge of edges) {
        if (edge.a === hovered.slug) neighbors.add(edge.b);
        if (edge.b === hovered.slug) neighbors.add(edge.a);
      }
    }

    for (const edge of edges) {
      const a = byNode.get(edge.a);
      const b = byNode.get(edge.b);
      if (!a || !b) continue;
      const active = hovered && (edge.a === hovered.slug || edge.b === hovered.slug);
      const dim = hovered && !active;
      ctx.beginPath();
      ctx.moveTo(a.x * scale + ox, a.y * scale + oy);
      ctx.lineTo(b.x * scale + ox, b.y * scale + oy);
      ctx.lineWidth = active ? 1.8 : 1;
      ctx.strokeStyle = active
        ? "rgba(139,124,246,0.75)"
        : dim
          ? "rgba(140,155,180,0.10)"
          : "rgba(140,155,180,0.26)";
      ctx.stroke();
    }

    for (const node of nodes) {
      const x = node.x * scale + ox;
      const y = node.y * scale + oy;
      const r = radiusOf(node) * Math.min(Math.max(scale, 0.6), 1.5);
      const isMoc = node.type === "moc";
      const isHover = hovered && hovered.slug === node.slug;
      const dim = hovered && !neighbors.has(node.slug);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isMoc ? "rgba(242,177,52,0.92)" : "rgba(139,124,246,0.88)";
      ctx.globalAlpha = dim ? 0.28 : 1;
      ctx.fill();
      ctx.lineWidth = isHover ? 2.4 : 1;
      ctx.strokeStyle = isHover ? "#ffffff" : "rgba(11,13,18,0.85)";
      ctx.stroke();
      ctx.globalAlpha = dim ? 0.35 : 1;

      ctx.font = `${isMoc ? 600 : 500} ${isHover ? 13.5 : 12}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHover ? "#ffffff" : isMoc ? "#f6d79a" : "rgba(214,222,235,0.9)";
      ctx.fillText(node.title, x, y + r + 7);
      ctx.globalAlpha = 1;
    }

    graphFrame = requestAnimationFrame(draw);
  }

  const onMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointers.x = event.clientX - rect.left;
    pointers.y = event.clientY - rect.top;
  };

  const onClick = () => {
    if (state.hover) location.hash = `#/nota/${encodeURIComponent(state.hover)}`;
  };

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", () => {
    pointers.x = -9999;
    pointers.y = -9999;
  });
  canvas.addEventListener("click", onClick);

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  draw();

  graphCleanup = () => {
    observer.disconnect();
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("click", onClick);
  };
}

/* ---------------- roteamento ---------------- */

function render() {
  stopGraph();
  const main = document.getElementById("main");
  const hash = location.hash.replace(/^#\/?/, "");
  const [kind, arg] = hash.split("/");

  let currentSlug = null;
  let activeView = "nota";

  if (kind === "grafo") {
    activeView = "grafo";
    renderGraphView(main);
  } else if (kind === "tag" && arg) {
    renderTag(decodeURIComponent(arg), main);
  } else {
    const slug = kind === "nota" && arg ? decodeURIComponent(arg) : "inicio";
    currentSlug = state.bySlug.has(slug) ? slug : "inicio";
    renderNote(currentSlug, main);
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === activeView);
  });
  renderSidebar(currentSlug);
}

function bindSearch() {
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    state.query = input.value;
    const hash = location.hash.replace(/^#\/?/, "").split("/");
    renderSidebar(hash[0] === "nota" ? decodeURIComponent(hash[1] || "") : null);
  });
}

async function start() {
  try {
    await load();
  } catch (error) {
    document.getElementById("main").innerHTML = `<div class="empty">
      Não foi possível carregar as notas: ${esc(error.message)}
    </div>`;
    return;
  }
  bindSearch();
  window.addEventListener("hashchange", render);
  if (!location.hash) location.replace("#/nota/inicio");
  render();
}

start();
