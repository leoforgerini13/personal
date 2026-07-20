---
description: Reconcilia um patch (colado do dashboard) nos JSONs e regenera o dashboard.
argument-hint: (cole o JSON do "Copiar patch" a seguir)
---

Reconciliar nos arquivos-fonte o patch gerado pelo dashboard (botão "Copiar patch").

O patch é o buffer do `localStorage` serializado. Pode conter qualquer subconjunto destas chaves.
Coleções de itens usam o formato **`{ add:[], update:{id:{campos}}, remove:[ids] }`**:

```json
{
  "registros":   { "YYYY-MM-DD": ["habitoId", ...] },
  "toques":      [ { "data": "...", "projeto": "id", "texto": "..." } ],
  "prioridades": [ { "texto": "...", "feito": true|false } ],
  "projetos":    { "add": [ {schema projetos} ], "update": { "id": {campos} }, "remove": ["id"] },
  "tarefas":     { "add": [ {schema tarefas} ], "update": { "id": {campos} }, "remove": ["id"] },
  "gastos":      { "add": [ {schema gastos} ],  "update": { "id": {campos} }, "remove": ["id"] },
  "carreira":    { "add": [ {schema carreira} ],"update": { "id": {campos} }, "remove": ["id"] },
  "habitos":     { "add": [ {schema habito} ],  "update": { "id": {campos} }, "remove": ["id"] },
  "leitura":     { "set": { campos do livro }, "registros": { "YYYY-MM-DD": <páginas> } }
}
```

O patch vem em `$ARGUMENTS` ou colado logo após o comando. Se não houver patch, peça para colar e pare.

Reconciliação (o buffer é a intenção do usuário; os JSONs são a verdade a atualizar):

1. **registros** → em `data/rotina.json`, o array de cada data é **autoritativo** para aquele dia (substitui).
2. **toques** → para cada toque: acrescentar ao FIM de `data/log.json` (append-only, sem duplicar idênticos) e atualizar `ultimoToque` do projeto em `data/projetos.json` se a data for mais recente.
3. **prioridades** → efêmeras (uso diário). Não há arquivo; use como contexto, não persista.
4. Para cada coleção (`projetos`, `tarefas`, `gastos`, `carreira`, `habitos`), no arquivo correspondente:
   - **add**: acrescentar os objetos novos. Os `id` gerados pelo dashboard vêm como `new-…`/`tk-…` etc.; pode mantê-los ou trocar por um slug estável.
   - **update**: mesclar os campos no item de mesmo `id` (não apagar campos não citados). `update` em `projetos` pode conter `marcos` (array inteiro, autoritativo) e `ultimoToque`.
   - **remove**: excluir os itens cujo `id` está na lista.
   - Se um `update`/`remove` citar um `id` que não existe, avisar e pular (não criar do nada).
5b. **leitura** → em `data/leitura.json`: mesclar os campos de `set` (título, autor, capa base64, `totalPaginas`, `paginaAtual`); em `registros`, cada data é autoritativa (páginas lidas naquele dia).

Depois:

5. Rodar `node build.js`.
6. Resumir o que foi reconciliado por coleção (adicionados / atualizados / removidos, toques, hábitos).
7. Lembrar que o patch já foi aplicado — o usuário pode limpar o buffer do navegador (`localStorage`) se quiser; o próximo build parte dos JSONs.
