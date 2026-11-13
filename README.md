# Cérebro — segundo cérebro com wikilinks, MOC e grafo

Vault de notas em Markdown com `[[wikilinks]]` resolvidos por título, retro-ligações automáticas, um **MOC** (mapa de conteúdo) como porta de entrada e um **grafo de conhecimento** interativo.

Sem framework, sem build, sem dependências.

## Rodar

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

Precisa ser servido por HTTP (o app usa `fetch` para ler `notes/*.md`).

## Adicionar uma nota

1. Crie `notes/minha-ideia.md`:

```markdown
---
title: Minha Ideia
tags: [conceito]
type: nota
---

# Minha Ideia

Uma ideia só, com as próprias palavras.

Ligue a outra nota: [[Segundo Cérebro]].
```

2. Regenerar o índice:

```bash
npm run index
```

3. Recarregue a página. A nota entra na barra lateral, no grafo e nas retro-ligações das notas que ela cita.

## Wikilinks

```markdown
[[Segundo Cérebro]]              -> pelo título
[[Segundo Cérebro|o conceito]]   -> com texto alternativo
```

Alvos inexistentes aparecem como link quebrado (tracejado vermelho) — um convite para escrever a nota.

## Estrutura

```
index.html                 página única
assets/app.js              markdown, wikilinks, backlinks, grafo
assets/styles.css          tema escuro
notes/*.md                 as notas
notes/index.json           gerado por scripts/build-index.mjs
scripts/build-index.mjs    lê o frontmatter e escreve o índice
```

## Frontmatter

| Campo | Valores | Efeito |
| --- | --- | --- |
| `title` | texto | nome exibido; alvo de `[[links]]` |
| `tags` | `[a, b]` | nuvem de tags e filtro de busca |
| `type` | `nota` \| `moc` | nó dourado no grafo e seção própria na sidebar |

## Comece por

- [`notes/inicio.md`](notes/inicio.md) — boas-vindas e convenções
- [`notes/moc.md`](notes/moc.md) — MOC: Mapa do Cérebro
