// Gera notes/index.json a partir do frontmatter dos arquivos .md de notes/.
// Uso: node scripts/build-index.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dir = path.join(process.cwd(), "notes");

const files = (await readdir(dir)).filter((file) => file.endsWith(".md")).sort();

const notes = [];

for (const file of files) {
  const raw = await readFile(path.join(dir, file), "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const meta = {};

  if (match) {
    for (const line of match[1].split("\n")) {
      const split = line.indexOf(":");
      if (split < 0) continue;
      const key = line.slice(0, split).trim();
      let value = line.slice(split + 1).trim();
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      if (value !== "") meta[key] = value;
    }
  }

  notes.push({
    slug: file.replace(/\.md$/, ""),
    title: meta.title || file.replace(/\.md$/, ""),
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    type: meta.type === "moc" ? "moc" : "nota",
  });
}

await writeFile(
  path.join(dir, "index.json"),
  JSON.stringify({ notes }, null, 2) + "\n",
  "utf8"
);

console.log(`index: ${notes.length} notas`);
