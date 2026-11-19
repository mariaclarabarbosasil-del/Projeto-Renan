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

## Cofre para Obsidian

### Segundo cérebro

Cofre em Markdown com wikilinks, mapas de conteúdo (MOCs), projetos, áreas, conhecimento e revisões.

## Começar

Abra a pasta `Segundo Cerebro` como cofre no Obsidian e acesse `00 - Inicio/Inicio.md`.

No GitHub, comece por [Início](Segundo%20Cerebro/00%20-%20Inicio/Inicio.md) ou [MOC Geral](Segundo%20Cerebro/00%20-%20Inicio/MOC%20Geral.md).

Os wikilinks `[[Nota]]` foram preparados para um aplicativo compatível, como o Obsidian. No GitHub, eles aparecem como texto. O MOC Geral inclui um diagrama Mermaid das conexões principais.

## Conteúdo

- 21 notas em português.
- Caixa de entrada para capturas.
- MOCs de projetos, áreas, conhecimento e revisões.
- Exemplos iniciais e cinco modelos de notas.
- Roteiro para revisão semanal.

Não há plugins externos obrigatórios. As rotinas são manuais.
