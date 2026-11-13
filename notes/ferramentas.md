---
title: Ferramentas
tags: [tecnico, meta]
type: nota
---

# Ferramentas

Este vault é um site estático: `index.html`, `assets/styles.css` e `assets/app.js`. Sem build, sem framework, sem dependências.

## Rodar localmente

```bash
# a partir da raiz do repositório
python3 -m http.server 8080
# abra http://localhost:8080
```

É preciso servir por HTTP: o app busca `notes/*.md` via `fetch`, o que não funciona abrindo o arquivo direto (`file://`).

## Adicionar uma nota

1. Crie `notes/minha-ideia.md`:

```markdown
---
title: Minha Ideia
tags: [conceito]
type: nota
---

# Minha Ideia

Uma ideia, três a oito frases, com as próprias palavras.

Ligue a outra nota: [[Segundo Cérebro]].
```

2. Regenerar o índice:

```bash
npm run index        # equivale a: node scripts/build-index.mjs
```

3. Recarregar a página. A nota aparece na barra lateral e no [[Grafos de Conhecimento|grafo]].

## Convenções

| Campo | Valores | Efeito |
| --- | --- | --- |
| `title` | texto | nome exibido e alvo de `[[links]]` |
| `tags` | `[a, b]` | nuvem de tags e filtro de busca |
| `type` | `nota` ou `moc` | nó dourado no grafo, seção própria na sidebar |

## Estrutura

```
index.html            página única
assets/app.js         markdown + wikilinks + grafo
assets/styles.css     tema escuro
notes/*.md            as notas
notes/index.json      gerado por scripts/build-index.mjs
scripts/build-index.mjs
```

## Limites conhecidos

- Markdown mínimo: títulos, listas, citações, código, negrito, itálico, links.
- Sem imagens, tabelas e notas transclusas.
- O grafo recalcula o layout a cada carregamento; como o vault é pequeno, isso é instantâneo.

Para o roteiro do projeto, veja [[Projeto Renan]] e [[Mapas de Conteúdo]].
