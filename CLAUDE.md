# Dashboard de alocação de atenção

Painel pessoal de uso diário. A pergunta que ele responde em 3 segundos, de manhã:
**"o que eu faço hoje, e qual frente está ficando dormente?"**

O foco **não** é gestão de tarefas — é **alocação de atenção**. O indicador central de cada
frente não é % de progresso; é **há quantos dias eu não toco nela**.

## Arquitetura

```
/
├── data/
│   ├── projetos.json    ← frentes de trabalho
│   ├── rotina.json      ← hábitos + registros
│   ├── carreira.json    ← checklist Amsterdam (com dependências)
│   ├── agenda.json      ← gerado a partir do Google Calendar (/hoje)
│   └── log.json         ← append-only, um objeto por toque
├── build.js             ← Node, sem dependências externas
├── index.html           ← OUTPUT gerado (NÃO editar à mão)
└── .claude/commands/    ← /toque /hoje /feito /sync /semana
```

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
  - Frentes → a frente mais dormente (só se estourou a cadência).
  - Rotina → a célula de hoje quando cumprida.
  - Amsterdam → o próximo item desbloqueado e não-feito.
  - Hoje / Log → sem acento.
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
  "proximoMarco": { "titulo": "…", "data": "YYYY-MM-DD" },
  "cadenciaEsperada": 3, "ultimoToque": "YYYY-MM-DD", "notas": "…" }
```
`status: "arquivado"` some do dashboard.

**rotina.json**:
```json
{ "habitos": [ { "id": "musculacao", "nome": "Musculação", "meta": { "tipo": "semanal", "alvo": 4 } } ],
  "registros": { "YYYY-MM-DD": ["musculacao", "usp"] } }
```

**carreira.json** — array de (checklist com dependências):
```json
{ "id": "autorizacao-eu", "titulo": "Autorização de trabalho na UE",
  "estado": "nao_iniciado|em_andamento|feito", "bloqueia": ["aplicacoes"], "nota": "" }
```
Um item está **bloqueado** se algum item que o cita em `bloqueia` não estiver `feito`.

**agenda.json** — array de (só o que interessa): `{ "inicio", "fim", "titulo", "diaInteiro" }`.
`inicio`/`fim` em ISO com offset. Gerado por `/hoje` a partir do Google Calendar pessoal.

**log.json** — **append-only**, um objeto por toque: `{ "data", "projeto", "texto" }`.
Nunca reescrever/reordenar entradas existentes.

## Formato do patch (buffer do localStorage → /sync)

Qualquer subconjunto de:
```json
{
  "registros":   { "YYYY-MM-DD": ["habitoId"] },
  "toques":      [ { "data": "...", "projeto": "id", "texto": "..." } ],
  "projetos":    { "id": { "nome": "...", "cadenciaEsperada": 3, "proximoMarco": {...}, "notas": "..." } },
  "carreira":    { "id": { "estado": "...", "nota": "..." } },
  "prioridades": [ { "texto": "...", "feito": false } ]
}
```
`registros[data]` é autoritativo para aquele dia. `toques` viram entradas de `log.json` +
atualização de `ultimoToque`. `prioridades` são efêmeras (não têm arquivo). Ver `/sync`.

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
- `/sync` — reconcilia um patch colado nos JSONs, rebuild.
- `/semana` — resumo do log dos últimos 7 dias + o que ficou dormente (não altera arquivos).

## Ao editar

- Mudou um schema? Atualize os dados de exemplo, o `build.js` e este arquivo juntos.
- Sempre rode `node build.js` depois de mexer em `data/` e confirme que `index.html` abre em
  `file://` sem erro de console.
- Frentes/hábitos reais são do usuário — **não invente dados; pergunte** (ou deixe placeholders
  claramente marcados `[modelo]` para ele editar no dashboard).
