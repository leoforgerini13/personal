---
description: Resumo dos últimos 7 dias — o que foi tocado, os hábitos da semana e o que ficou dormente.
---

Retrospectiva sóbria dos últimos 7 dias. Não altera arquivos.

Passos:

1. Definir a janela: de (hoje − 6 dias) até hoje, fuso `America/Sao_Paulo`.
2. Ler `data/log.json` e listar os toques dentro da janela, agrupados por frente. Isso é matéria-prima de CV — descreva em linguagem de resultado, não de tarefa.
3. Ler `data/rotina.json` e reportar, por hábito, os cumprimentos da semana corrente (segunda→domingo) vs. o alvo (ex: "Musculação 3/4"). Sem cobrança por falha.
4. Ler `data/projetos.json` e listar o que ficou **dormente**: frentes com `dias = hoje - ultimoToque > cadenciaEsperada`, ordenadas por `dias / cadenciaEsperada` desc, com dias sem toque e próximo marco.
5. Fechar com uma linha só: qual é a única frente que mais pede atenção agora.

Tom: direto, sem métricas de vaidade, sem deltas percentuais. Só o que muda uma decisão.
