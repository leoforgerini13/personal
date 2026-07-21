# Dashboard de alocação de atenção

Painel pessoal de uso diário. A pergunta que ele responde em 3 segundos, de manhã:
**"o que eu faço hoje, e qual frente está ficando dormente?"**

O foco **não** é gestão de tarefas — é **alocação de atenção**. O indicador central de cada
frente não é % de progresso; é **há quantos dias eu não toco nela**.

## Arquitetura

```
/
├── data/
│   ├── projetos.json    ← frentes de trabalho (com marcos)
│   ├── tarefas.json     ← tarefas (data, prioridade, status, projeto)
│   ├── rotina.json      ← hábitos + registros
│   ├── carreira.json    ← checklist Amsterdam (com dependências)
│   ├── gastos.json      ← custos da mudança (R$ e €, estimado vs. pago)
│   ├── leitura.json     ← livro atual (capa base64, progresso, páginas/dia)
│   ├── agenda.json      ← gerado a partir do Google Calendar (/hoje)
│   └── log.json         ← append-only, um objeto por toque
├── build.js             ← Node, sem dependências externas (exporta STYLE/APP/build)
├── server.js            ← app local: serve o dashboard + chat Sonnet 5 que edita os JSONs
├── package.json         ← dependência do server (@anthropic-ai/sdk); node_modules ignorado
├── index.html           ← OUTPUT local (file://), com snapshot da agenda embutido
├── artifact.html        ← OUTPUT para publicar como Artifact (agenda AO VIVO, sem snapshot)
└── .claude/commands/    ← /toque /hoje /feito /sync /semana /planejar
```

## Três modos (mesmo código-fonte)

`build.js` exporta `STYLE`+`APP`+`build()`; os três modos reaproveitam isso:

- **`index.html`** (`node build.js`) — offline via `file://`, snapshot da agenda embutido. Zero deps.
- **`artifact.html`** — publicado como Artifact da claude.ai; agenda **ao vivo** via `window.claude.mcp` (conector Google Calendar). Não embute eventos reais (privacidade).
- **`server.js`** (`npm start`) — app local que serve o dashboard por HTTP e injeta um **chat** (canto inferior direito). O chat chama o **`claude-sonnet-5`** (adaptive thinking, effort baixo) via `@anthropic-ai/sdk` num loop de tool-use; cada ferramenta (`add_tarefa`, `update_tarefa`, `registrar_toque`, `marcar_habito`, `log_paginas`, `add_gasto`, `update_gasto`, `add_frente`) edita os `data/*.json` e regenera o dashboard. Requer `ANTHROPIC_API_KEY` no ambiente (nunca no código). **A agenda não é ao vivo neste modo** (só no Artifact) — usa o snapshot; rode `/hoje`. Ver `README.md`.

## Dois outputs (mesmo código-fonte)

`build.js` gera **dois** arquivos a partir do mesmo `STYLE`+`APP`:

- **`index.html`** — documento completo para abrir em `file://`. Embute a agenda como *snapshot* offline. É o modo do brief original (sem rede).
- **`artifact.html`** — só o conteúdo (o publish envolve em `<head>`/`<body>`). Publicado como **Artifact da claude.ai** com a capability `mcp`, ele chama o conector **Google Calendar** do usuário via `window.claude.mcp` (`watchTool` do tool `list_events`) e mostra a agenda **ao vivo**. **Não embute** eventos reais do calendário (privacidade).

O runtime detecta `window.claude.mcp`: se existir (Artifact), puxa ao vivo; senão (`file://`), usa o snapshot embutido. A regra "proibido `fetch()` dos JSONs" continua valendo — os dados do painel seguem embutido inline; só a **agenda** tem caminho ao vivo, e via `window.claude.mcp`, nunca `fetch`.

**Tema claro/escuro:** tokens em `:root` + `@media (prefers-color-scheme)` + overrides `:root[data-theme=...]`; botão no rodapé da navegação, escolha persistida em `localStorage`.

Ao republicar o Artifact (mesma URL), rode `node build.js` e reenvie `artifact.html` com o mesmo `file_path` nesta conversa, mantendo `capabilities` e `favicon` estáveis.

## Módulos (7 itens de navegação, um nível só)

1. **Hoje** — data por extenso, 3 prioridades manuais, tarefas de hoje, compromissos do dia.
2. **Tarefas** — segmentada em **Semana** (tarefas por dia), **Gantt** (barras da semana por projeto) e **Board** (colunas A fazer / Fazendo / Feito, com **arrastar** entre colunas). A segmentação é filtro dentro da view, **não** sub-abas na navegação.
3. **Frentes** — cartões de projetos **ativos** (nome, cliente, período, próximo marco). Sem indicador de "dias sem toque". Ordenados por próximo marco.
4. **Timeline** — visão **macro**: barra início → previsão de fim por projeto, marcos como diamantes + gestor de marcos editável.
5. **Rotina** — **widget de leitura** no topo (capa, barra de progresso, logger de páginas/dia) + **calendário mensal** navegável de hábitos (cada dia marca os hábitos por inicial, clicável; legenda com contagem do mês + meta semanal). Hábitos editáveis (adicionar/editar meta/excluir).
6. **Amsterdam** — checklist **por clusters** (Documentação & Legal, Trabalho & Carreira, Moradia & Mudança, Financeiro & Seguros), com dependências, + **gastos da mudança** (R$ e €).
7. **Log** — timeline reversa, agrupada por semana, filtrável por frente.

Tudo é editável/adicionável no próprio dashboard (botão "+ …" em cada view, editar/excluir por item), gravando no buffer → "Copiar patch" → `/sync`.

## Regras duras (não desviar)

1. **Os JSONs em `data/` são a fonte da verdade.** `index.html` é output descartável —
   sempre regenerável do zero com `node build.js`. Nunca edite `index.html` à mão.
2. **`index.html` é aberto via `file://`.** Por isso `build.js` embute os dados como um
   `<script>window.__DATA__ = …</script>` inline. **Proibido `fetch()`** dos JSONs (morre em CORS).
3. **Zero framework, zero build step além do `node build.js`, zero CDN.** HTML + CSS + JS
   vanilla, tudo self-contained num arquivo só. Fontes: system font stack (nada de CDN).
4. **A página não escreve em disco.** Interações (marcar hábito, riscar prioridade, editar
   frente, ciclar item de Amsterdam) gravam num buffer em `localStorage` e acendem um botão
   discreto **"Copiar patch"** que joga um JSON no clipboard. O usuário cola no Claude Code
   e roda `/sync` para reconciliar nos arquivos.
5. **Proibido re-render por `innerHTML` da view inteira.** Perde scroll, foco e animação.
   Atualizações são pontuais no nó afetado (o `el()` helper e updates dirigidos cuidam disso).
   Exceção tolerada: caminho de "Desfazer" e mudanças que alteram ordenação/dependências
   podem reconstruir só a section afetada via `createElement` (nunca via `innerHTML` de string).
6. **Nada de `alert()` / `confirm()` para feedback.** Use o toast com "Desfazer".
   (`prompt()` é usado só para captar o texto de um toque — aceitável.)

## Direção visual (manter)

- Fundo quase-preto **quente** (`--bg:#15120f`), cards um tom acima, cantos bem arredondados,
  muito respiro. Minimalista com tipografia forte.
- **Um único acento de alta saturação** (`--accent:#ff6a3d`). O acento **aponta, não decora**:
  em cada view, no máximo **um** elemento o recebe. Todo o resto vive em escala de cinza.
  - Timeline → o marco próximo (próximo marco não-feito com data ≥ hoje).
  - Rotina → a célula de hoje quando cumprida.
  - Amsterdam → o próximo item desbloqueado e não-feito (as barras de gasto ficam em cinza).
  - Hoje / Frentes / Timeline (gestor) / Log → sem acento.
  - Exceção deliberada (pedido do usuário): em **Tarefas**, a prioridade `alta` recebe um pequeno *dot* do acento — é sinal de leitura, mantido discreto (só o ponto, nunca a linha inteira).
- Hierarquia por **contraste de escala tipográfica**, não por bordas/sombras/caixas aninhadas.
  Número grande em peso alto; label minúsculo em caixa alta com tracking aberto.
- **Proibido**: imagem/render/ilustração/gradiente-arte; visualização orgânica/blob; métrica de
  vaidade ou delta "+X% vs. semana passada". **Card sem dado real não existe** — se não há dado,
  o card não é criado.

## Temperatura das frentes

Para cada frente: `dias = hoje − ultimoToque`, `ratio = dias / cadenciaEsperada`.
- `ratio ≤ 1` → **neutro** (dentro da cadência).
- `1 < ratio ≤ 2` → **âmbar discreto** (1× acima).
- `ratio > 2` → **destaque** (2× acima).

`cadenciaEsperada` = de quantos em quantos dias a frente **deveria** receber atenção. É o que
define o alerta — não uma régua fixa. Frentes são ordenadas por `ratio` desc (urgência), não por nome.

## Schemas

**projetos.json** — array de:
```json
{ "id": "banco-atlantico", "nome": "Banco Atlântico", "cliente": "Marcas com Sal",
  "tipo": "agencia|freela|pessoal", "status": "ativo|arquivado",
  "cadenciaEsperada": 3, "ultimoToque": "YYYY-MM-DD",
  "inicio": "YYYY-MM-DD", "previsaoFim": "YYYY-MM-DD", "notas": "…",
  "marcos": [ { "id": "…", "titulo": "…", "data": "YYYY-MM-DD", "feito": false } ] }
```
`status: "arquivado"` some do dashboard. O **próximo marco** é derivado: o `marcos[]` não-feito
de menor `data`. `inicio`/`previsaoFim` alimentam a Timeline macro. (Schema antigo com
`proximoMarco` ainda é aceito, mas prefira `marcos[]`.)

**tarefas.json** — array de:
```json
{ "id": "tk-1", "projeto": "banco-atlantico", "titulo": "<a ação>", "descricao": "…",
  "data": "YYYY-MM-DD", "dataFim": "YYYY-MM-DD", "prioridade": "alta|media|baixa",
  "status": "a_fazer|fazendo|feito", "criadaEm": "YYYY-MM-DD" }
```
`projeto`, `data` e `dataFim` podem ser vazios; `dataFim` (prazo) desenha a barra no Gantt semanal.
Alimentada também por `/planejar`.

**gastos.json** — array de (custos da mudança, duas moedas):
```json
{ "id": "gt-1", "item": "…", "categoria": "…",
  "estimadoBRL": 0, "estimadoEUR": 0, "pagoBRL": 0, "pagoEUR": 0, "nota": "…" }
```
Os totais e as barras (pago vs. estimado, por moeda) são calculados no build/runtime.

**leitura.json** — livro em leitura (objeto único):
```json
{ "titulo": "Kitchen Confidential", "autor": "Anthony Bourdain", "subtitulo": "…",
  "capa": "<data URI base64 ou vazio>", "totalPaginas": 385, "paginaAtual": 0,
  "registros": { "YYYY-MM-DD": 23 } }
```
`capa` é embutida em base64 (nada de URL externa). `registros[data]` = páginas lidas naquele dia.
Barra de progresso = `paginaAtual / totalPaginas`.

**rotina.json**:
```json
{ "habitos": [ { "id": "musculacao", "nome": "Musculação", "meta": { "tipo": "semanal", "alvo": 4 } } ],
  "registros": { "YYYY-MM-DD": ["musculacao", "usp"] } }
```

**carreira.json** — array de (checklist com dependências, agrupado por cluster):
```json
{ "id": "autorizacao-eu", "categoria": "documentacao|carreira|moradia|financeiro",
  "titulo": "Autorização de trabalho na UE",
  "estado": "nao_iniciado|em_andamento|feito", "bloqueia": ["aplicacoes"], "nota": "" }
```
`categoria` define o cluster na aba Amsterdam. Um item está **bloqueado** se algum item que o
cita em `bloqueia` não estiver `feito`.

**agenda.json** — array de (só o que interessa): `{ "inicio", "fim", "titulo", "diaInteiro" }`.
`inicio`/`fim` em ISO com offset. Gerado por `/hoje` a partir do Google Calendar pessoal.

**log.json** — **append-only**, um objeto por toque: `{ "data", "projeto", "texto" }`.
Nunca reescrever/reordenar entradas existentes.

## Formato do patch (buffer do localStorage → /sync)

Qualquer subconjunto do abaixo. Coleções de itens usam o formato
**`{ add:[], update:{id:{campos}}, remove:[ids] }`**:
```json
{
  "registros":   { "YYYY-MM-DD": ["habitoId"] },
  "toques":      [ { "data": "...", "projeto": "id", "texto": "..." } ],
  "prioridades": [ { "texto": "...", "feito": false } ],
  "projetos":    { "add": [ {…} ], "update": { "id": { "nome": "...", "cadenciaEsperada": 3, "marcos": [...], "ultimoToque": "..." } }, "remove": ["id"] },
  "tarefas":     { "add": [ {…} ], "update": { "id": {…} }, "remove": ["id"] },
  "gastos":      { "add": [ {…} ], "update": { "id": {…} }, "remove": ["id"] },
  "carreira":    { "add": [ {…} ], "update": { "id": { "estado": "...", "nota": "..." } }, "remove": ["id"] },
  "habitos":     { "add": [ {…} ], "update": { "id": {…} }, "remove": ["id"] },
  "leitura":     { "set": { "paginaAtual": 23, "totalPaginas": 385, "capa": "…" }, "registros": { "YYYY-MM-DD": 23 } }
}
```
`registros[data]` é autoritativo para aquele dia. `toques` viram entradas de `log.json` +
atualização de `ultimoToque`. `prioridades` são efêmeras (não têm arquivo). Em `projetos.update`,
`marcos` é o array inteiro (autoritativo). Ver `/sync`.

## Fluxo de trabalho

1. De manhã: abrir `index.html`, ler o módulo **Hoje**.
2. Durante o dia: marcar hábitos / editar frentes / riscar prioridades no dashboard → clicar
   **"Copiar patch"**.
3. No Claude Code: `/sync` (colar o patch), ou usar `/toque`, `/feito`, `/hoje` diretamente.
4. Qualquer comando termina rodando `node build.js` para regenerar `index.html`.

## Comandos

- `/toque <projeto> "<texto>"` — registra toque no log, atualiza `ultimoToque`, rebuild.
- `/hoje` — puxa o Google Calendar do dia, regrava `agenda.json`, rebuild, reporta o que estourou a cadência.
- `/feito <habito>` — registra o hábito hoje, rebuild.
- `/planejar <texto livre>` — transforma o que preciso fazer na semana em tarefas estruturadas em `tarefas.json`, rebuild.
- `/sync` — reconcilia um patch colado nos JSONs, rebuild.
- `/semana` — resumo do log dos últimos 7 dias + o que ficou dormente (não altera arquivos).

## Ao editar

- Mudou um schema? Atualize os dados de exemplo, o `build.js` e este arquivo juntos.
- Sempre rode `node build.js` depois de mexer em `data/` e confirme que `index.html` abre em
  `file://` sem erro de console.
- Frentes/hábitos reais são do usuário — **não invente dados; pergunte** (ou deixe placeholders
  claramente marcados `[modelo]` para ele editar no dashboard).
