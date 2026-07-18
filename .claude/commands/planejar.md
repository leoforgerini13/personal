---
description: Recebe em linguagem livre o que preciso fazer na semana e organiza em tarefas estruturadas.
argument-hint: (cole/descreva o que precisa fazer nesta semana)
---

Transformar um despejo de texto livre (o que o usuário precisa fazer) em **tarefas estruturadas** em `data/tarefas.json`.

O texto vem em `$ARGUMENTS` ou logo após o comando. Se não houver texto, peça para mandar e pare.

Para cada item identificado no texto, criar uma tarefa com o schema de `tarefas.json`:
```json
{ "id": "tk-...", "projeto": "<id ou vazio>", "titulo": "<a ação, curta e no infinitivo>",
  "descricao": "<detalhe se houver, senão vazio>", "data": "YYYY-MM-DD",
  "prioridade": "alta|media|baixa", "status": "a_fazer", "criadaEm": "<hoje>" }
```

Regras de interpretação:

1. **Projeto**: casar menções a clientes/frentes contra `data/projetos.json` (id ou nome, case-insensitive). Se não der pra inferir com segurança, deixar `projeto: ""` — não chutar.
2. **Data**: resolver expressões relativas no fuso `America/Sao_Paulo` ("segunda", "amanhã", "até quarta", "dia 24"). Sem data clara → `data: ""` (aparece em "Sem data" na aba Semana).
3. **Prioridade**: inferir de urgência/linguagem ("urgente", "prioridade" → alta; padrão → media; "quando der" → baixa). Na dúvida, `media`.
4. **Título**: a ação, curto. **Descrição**: só o que agrega; não repetir o título.
5. **id**: gerar únicos (`tk-` + slug curto ou timestamp).
6. Não apagar nem sobrescrever tarefas existentes — **acrescentar** ao array.

Depois:

7. Mostrar ao usuário a lista interpretada (título · projeto · data · prioridade) e **confirmar** antes de gravar, se houver ambiguidade relevante. Se estiver tudo claro, gravar direto.
8. Rodar `node build.js`.
9. Resumir: quantas tarefas criadas, e se alguma ficou sem projeto/data para ele ajustar no dashboard.
