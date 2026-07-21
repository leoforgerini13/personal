# Dashboard de alocação de atenção

Painel pessoal com três modos de uso, gerados do mesmo código (`build.js` → `STYLE` + `APP`):

| Modo | Arquivo | Agenda | Chat com Claude |
|---|---|---|---|
| **Local (offline)** | `index.html` | snapshot embutido | — |
| **Artifact (claude.ai)** | `artifact.html` | **ao vivo** via conector Google Calendar | — |
| **App local com chat** | `server.js` | snapshot (rode `/hoje` p/ atualizar) | **Sonnet 5**, edita por linguagem natural |

Os dados moram em `data/*.json` (fonte da verdade). Veja `CLAUDE.md` para arquitetura, schemas e regras.

## 1. Modo local (offline)

```bash
node build.js
# abra index.html no navegador (file://)
```

## 2. Artifact ao vivo (claude.ai)

`build.js` também gera `artifact.html`. Publicado como Artifact da claude.ai com a capability `mcp`,
ele puxa a agenda ao vivo do seu Google Calendar. (Publicação é feita pelo Claude Code.)

## 3. App local com chat (Sonnet 5)

Um servidor Node serve o dashboard e adiciona um **chat** que conversa com o Sonnet 5 e **edita os
JSONs por linguagem natural** (adicionar/atualizar tarefas, registrar toques, marcar hábitos, logar
páginas de leitura, lançar gastos, criar frentes). Requer sua chave da API Anthropic.

```bash
npm install                          # instala @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-...  # sua chave
npm start                            # ou: node server.js
# abra http://localhost:4178
```

No canto inferior direito, clique **"Chat · Sonnet 5"** e escreva, por exemplo:

- "marquei musculação e holandês hoje"
- "li 20 páginas"
- "conclui os slides do Dr. Bingo"
- "adiciona tarefa: revisar o deck do Banco Atlântico, quarta, prioridade alta"
- "paguei 6000 reais na passagem"

O chat aplica a mudança nos `data/*.json`, regenera o dashboard e recarrega a página.

**Notas do modo app local:**
- A **agenda não é ao vivo** aqui (o acesso ao Google Calendar só existe no Artifact da claude.ai).
  Ela usa o último snapshot de `agenda.json`; rode `/hoje` no Claude Code para atualizar.
- O modelo é `claude-sonnet-5` (adaptive thinking, effort baixo). Troque em `server.js` (`MODEL`).
- Nada de chave no código — o servidor lê `ANTHROPIC_API_KEY` do ambiente.
- `node_modules/` e `package-lock.json` não são versionados.
