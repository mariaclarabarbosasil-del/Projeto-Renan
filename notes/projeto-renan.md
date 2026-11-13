---
title: Projeto Renan
tags: [projeto, trabalho]
type: nota
---

# Projeto Renan

Este é o projeto que deu origem ao repositório `Projeto-Renan`. O objetivo é simples: um [[Segundo Cérebro]] navegável, com notas em Markdown, [[Wikilinks]] e um [[MOC — Mapa do Cérebro|mapa de conteúdo]] como porta de entrada.

## Estado atual

- Vault com notas atômicas em `notes/`.
- Wikilinks resolvidos por título, com retro-ligações automáticas.
- Grafo interativo em canvas (nós = notas, arestas = links).
- Zero dependências em tempo de execução: HTML, CSS e JS puros.

## Próximos passos

1. Escrever uma nota por ideia do domínio real do projeto — hoje o vault está voltado ao próprio método.
2. Criar MOCs secundários quando um tema passar de sete notas: ver [[Mapas de Conteúdo]].
3. Manter o [[Grafos de Conhecimento|grafo]] sem ilhas.

## Como contribuir

1. Adicione um arquivo `.md` em `notes/` com frontmatter (`title`, `tags`, `type`).
2. Ligue a nota nova a pelo menos outra com `[[Nome]]`.
3. Rode `npm run index` para regenerar `notes/index.json`.
4. Adicione a nota à seção correspondente do [[MOC — Mapa do Cérebro|MOC]].

O detalhe técnico de cada passo está em [[Ferramentas]].
