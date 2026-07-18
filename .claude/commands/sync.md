---
description: Reconcilia um patch (colado do dashboard) nos JSONs e regenera o dashboard.
argument-hint: (cole o JSON do "Copiar patch" a seguir)
---

Reconciliar nos arquivos-fonte o patch gerado pelo dashboard (botão "Copiar patch").

O patch é o buffer do `localStorage` serializado. Ele pode conter qualquer subconjunto destas chaves:

```json
{
  "registros":   { "YYYY-MM-DD": ["habitoId", ...] },
  "toques":      [ { "data": "...", "projeto": "id", "texto": "..." } ],
  "projetos":    { "projetoId": { "nome": "...", "cliente": "...", "cadenciaEsperada": N, "proximoMarco": {"titulo":"...","data":"..."}, "notas": "..." } },
  "carreira":    { "itemId": { "estado": "nao_iniciado|em_andamento|feito", "nota": "..." } },
  "prioridades": [ { "texto": "...", "feito": true|false } ]
}
```

O patch vem em `$ARGUMENTS` ou colado logo após o comando. Se não houver patch, peça para colar e pare.

Reconciliação (o buffer é a intenção do usuário; os JSONs são a verdade a atualizar):

1. **registros** → em `data/rotina.json`, para cada data, o array do patch é **autoritativo** para aquela data (substitui o valor daquele dia; ele já reflete marcações e desmarcações feitas no dashboard).
2. **toques** → para cada toque: acrescentar ao FIM de `data/log.json` (append-only, sem duplicar entradas idênticas já presentes) e atualizar `ultimoToque` do projeto correspondente em `data/projetos.json` se a data for mais recente.
3. **projetos** → mesclar campo a campo no projeto de mesmo `id` em `data/projetos.json`. Não apagar campos não citados. Se um id não existir e claramente for uma frente nova, confirmar com o usuário antes de criar.
4. **carreira** → mesclar `estado`/`nota` no item de mesmo `id` em `data/carreira.json`.
5. **prioridades** → efêmeras (uso diário). Não há arquivo para elas; use como contexto se relevante, mas não persista.

Depois:

6. Rodar `node build.js`.
7. Resumir o que foi reconciliado (quantos toques, quais hábitos, quais frentes/itens alterados).
8. Lembrar o usuário de **limpar o buffer** no navegador se quiser (o patch já foi aplicado): ele pode limpar o `localStorage` da página ou simplesmente ignorar — o próximo build parte dos JSONs.
