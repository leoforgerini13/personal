---
description: Marca um hábito como feito hoje na rotina e regenera o dashboard.
argument-hint: <habito>
---

Registrar um hábito como cumprido hoje.

Argumento: `$ARGUMENTS` — id ou nome do hábito.

Passos:

1. Ler `data/rotina.json` e resolver o hábito:
   - Casar `$ARGUMENTS` contra `habitos[].id` (exato) ou `habitos[].nome` (case-insensitive, substring).
   - Se não casar, listar os hábitos disponíveis e parar.
2. Definir "hoje" no fuso `America/Sao_Paulo` (`YYYY-MM-DD`).
3. Em `data/rotina.json`, no objeto `registros`:
   - Se a chave `<hoje>` não existir, criar com `[]`.
   - Adicionar o `id` do hábito ao array de `<hoje>` se ainda não estiver lá (sem duplicar).
   - Se o usuário pedir para **desmarcar**, remover o id do array.
4. Rodar `node build.js`.
5. Responder em uma linha: hábito marcado + contagem da semana atual (segunda→domingo), ex: "Musculação: 3/4 nesta semana".

Sem streak, sem cobrança — só o registro.
