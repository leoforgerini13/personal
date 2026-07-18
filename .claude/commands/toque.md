---
description: Registra um toque numa frente — adiciona ao log, atualiza ultimoToque e regenera o dashboard.
argument-hint: <projeto> "<texto do que foi feito>"
---

Registrar um toque na frente de trabalho indicada.

Argumentos: `$ARGUMENTS` — o primeiro token é o **id ou nome** do projeto; o resto (entre aspas) é o texto do toque.

Passos:

1. Ler `data/projetos.json` e resolver o projeto:
   - Casar `$ARGUMENTS` contra `id` (match exato) ou contra `nome` (case-insensitive, aceita substring).
   - Se nenhum casar, listar os `id`/`nome` disponíveis e parar (não inventar projeto).
   - Se mais de um casar, mostrar os candidatos e pedir desambiguação.
2. Definir a data do toque como **hoje** no fuso `America/Sao_Paulo` (formato `YYYY-MM-DD`).
3. Acrescentar ao FIM de `data/log.json` (arquivo append-only) um objeto:
   `{ "data": "<hoje>", "projeto": "<id>", "texto": "<texto>" }`
   — nunca reescrever ou reordenar entradas existentes.
4. Atualizar `ultimoToque` desse projeto em `data/projetos.json` para `<hoje>` (só se for mais recente que o valor atual).
5. Rodar `node build.js`.
6. Responder em uma linha: frente tocada, novo "dias sem toque" (= 0) e se alguma OUTRA frente estourou a cadência.

Regra: os JSONs são a fonte da verdade; não edite `index.html` à mão.
