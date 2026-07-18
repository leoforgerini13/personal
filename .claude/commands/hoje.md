---
description: Puxa a agenda de hoje do Google Calendar, regrava agenda.json, regenera o dashboard e reporta o que está dormente.
---

Atualizar a agenda do dia e o painel de atenção.

Passos:

1. Descobrir "hoje" no fuso `America/Sao_Paulo` (`YYYY-MM-DD`).
2. Via MCP do Google Calendar, listar os eventos da **agenda pessoal** (`lforgerini@gmail.com`) para hoje.
   - Use `mcp__Google_Calendar__list_events` com `calendarId: lforgerini@gmail.com`, `startTime` = hoje 00:00-03:00, `endTime` = hoje 23:59-03:00, `orderBy: startTime`, `timeZone: America/Sao_Paulo`.
   - Se as ferramentas do Calendar não estiverem carregadas, buscar com `ToolSearch` antes.
3. Reescrever `data/agenda.json` mantendo **apenas** os campos do schema, um objeto por evento:
   `{ "inicio", "fim", "titulo", "diaInteiro" }`
   - `inicio`/`fim`: ISO com offset (ex: `2026-07-17T14:00:00-03:00`). Para eventos de dia inteiro, use a data e marque `diaInteiro: true`.
   - `titulo`: limpo e curto. Sem descrição, sem participantes, sem links.
   - Opcional: você pode manter na agenda os próximos dias já conhecidos; o dashboard filtra o dia corrente sozinho. Se preferir, regrave só o dia de hoje.
4. Rodar `node build.js`.
5. Ler `data/projetos.json`, calcular para cada frente `dias = hoje - ultimoToque` e comparar com `cadenciaEsperada`. Reportar, em tom sóbrio:
   - Compromissos de hoje (horário + título).
   - Frentes que **estouraram a cadência** (`dias > cadenciaEsperada`), ordenadas por urgência (`dias / cadenciaEsperada` desc), com o número de dias sem toque.
