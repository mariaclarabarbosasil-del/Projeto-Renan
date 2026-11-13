---
title: Wikilinks
tags: [sintaxe, estrutura]
type: nota
---

# Wikilinks

Um wikilink é uma ligação escrita no próprio texto, entre colchetes duplos: `[[Nome da Nota]]`. Em vez de guardar um caminho de arquivo, você guarda o **nome** da ideia.

## Sintaxe suportada aqui

```markdown
[[Segundo Cérebro]]              -> liga pelo título
[[Segundo Cérebro|o conceito]]   -> liga com texto alternativo
```

A resolução acontece em duas tentativas: primeiro pelo título exato (ignorando acentos e maiúsculas), depois pelo identificador da nota. Se nada bater, o link aparece em vermelho tracejado — um **link quebrado**, que funciona como convite para escrever a nota que falta.

## Por que nome e não caminho

- **Notas se movem.** O nome da ideia sobrevive à reorganização de pastas.
- **Pensamento em primeiro lugar.** Você escreve `[[Grafos de Conhecimento]]` porque é disso que está falando, não porque sabe onde o arquivo mora.
- **Descoberta.** Links quebrados revelam buracos no [[Segundo Cérebro|sistema]].

## O efeito de segunda ordem

Cada wikilink cria duas coisas: uma saída na nota atual e uma **retro-ligação** (*backlink*) na nota de destino. A seção "Ligado por" no rodapé de cada nota é montada exatamente assim.

É isso que transforma um conjunto de arquivos num [[Grafos de Conhecimento|grafo]] e permite organizar sem hierarquia — o papel dos [[Mapas de Conteúdo]].
