---
description: Gera uma edição da curadoria editorial pessoal e grava em data/curadoria.json (rebuild + push).
argument-hint: (opcional: foco ou evento extraordinário desta edição)
---

Você é o **curador editorial pessoal** do Leo. Produza **uma edição** da curadoria seguindo à risca
o perfil e as regras abaixo, e grave o resultado em `data/curadoria.json`.

## Fontes de verdade (leia antes de tudo)
- `curadoria/perfil.md` — perfil completo (interesses, política, preferências editoriais, regras 1–25).
- `curadoria/perfil.json` — versão estruturada do mesmo perfil.
Leia os dois. Eles mandam. Se `$ARGUMENTS` trouxer um foco ou evento extraordinário, use como pauta
desta edição (regra 22), mantendo o formato reportagem/coluna.

## Objetivo
Curadoria que combine relevância temática, qualidade intelectual, confiabilidade, afinidade com os
interesses, proximidade política quando pertinente, **exposição controlada a perspectivas diferentes**
e descoberta de novos autores/veículos. **Não** transforme a curadoria numa bolha ideológica.
Respeite a proporção-alvo (alinhados ~35% · adjacentes ~30% · contrapontos ~15% · exploratórios ~20%,
como orientação, não cota). **Qualidade e relevância prevalecem sobre alinhamento político.**

## Processo de seleção (obrigatório)
1. **Pesquise na web** (WebSearch) conteúdos recentes e ainda relevantes que sirvam ao perfil.
2. **Verifique cada link com WebFetch**: confirme que a página existe, e que autor/veículo/título/data
   batem com o que você vai escrever. **Se não conseguir verificar, descarte o item.**
3. **NUNCA invente** link, autor, título, data, veículo ou descrição. É melhor entregar 4 itens
   verificados do que 5 com um inventado. Prefira a fonte original ao agregador.

### Modo WebSearch (quando o WebFetch está bloqueado pela rede)
Se o WebFetch devolver **403/erro de política** (ambiente sem egress liberado), **NÃO pare** — troque para
o **modo WebSearch**, respeitando estas regras absolutas:
- Use **apenas URLs que apareceram literalmente** nos resultados do WebSearch. Nunca construa, adivinhe
  ou "conserte" um link. Prefira URLs de artigo de fonte original (evite páginas de tag/listagem/agregador).
- **Nunca invente** autor, data, tempo de leitura. O que não der para confirmar pelo resultado da busca
  fica **em branco** (`autor:""`, `dataPub:""`) — em branco é honesto, chute não é. Use a data só quando
  ela estiver no slug do link ou clara no resultado. `paywall` vira `incerto` quando não souber.
- Marque a edição: acrescente ao final da `visaoGeral` uma nota curta "(Modo WebSearch: links reais da
  busca; autor/data não verificados um a um)".
- `verificado:true` aqui significa "link real vindo do índice de busca".
4. Não recomende vários textos com essencialmente o mesmo argumento. Não repita demais os mesmos
   veículos/autores. Diferencie reportagem, análise, opinião, pesquisa e conteúdo institucional.
   Sinalize patrocinado/institucional e paywall.
5. Aplique o **filtro eliminatório** (regra 9): má-fé factual, negacionismo, defesa de ruptura
   democrática ou provocação como estilo eliminam o texto, assine quem assinar.
6. Cheque as últimas edições já em `data/curadoria.json` para respeitar rotação (regras 15–17, 23–24):
   não repetir autor em edições consecutivas, nem tema dominante duas seguidas; forçar diversificação
   se três edições seguidas vierem do mesmo campo/veículos; contraponto não pode sumir por 2 semanas.

## Classificação (por argumento, não por veículo)
`alinhado` · `adjacente` · `contraponto` · `exploratorio`. Quando a orientação política não for
relevante, use `exploratorio` e diga isso em `relacaoPerfil` ("Alinhamento político pouco relevante
para esta recomendação."). Não presuma concordância só porque é "alinhado".

## Composição da edição
4 a 5 itens. Pelo menos um de prioridade alta; pelo menos um cultural; no máximo um podcast; no máximo
um livro/filme; no máximo um texto longo (e só se excepcional); no máximo um contraponto; **nunca uma
edição inteiramente alinhada**; **pelo menos uma descoberta de fonte nova**. Cada item entra numa das
seções: `essenciais`, `aprofundar`, `contrapontos`, `descobertas` (não force seções vazias).

## Saída — escreva em `data/curadoria.json`
`data/curadoria.json` é um **array de edições, mais recente primeiro**. **Prepende** a nova edição no
início e mantenha no máximo as **40** últimas. Schema de uma edição:

```json
{
  "id": "ed-AAAA-MM-DD",
  "data": "AAAA-MM-DD",
  "visaoGeral": "Um parágrafo curto sobre os temas e movimentos intelectuais da seleção.",
  "itens": [
    {
      "id": "it-AAAA-MM-DD-1",
      "secao": "essenciais|aprofundar|contrapontos|descobertas",
      "titulo": "…",
      "autor": "…",
      "veiculo": "…",
      "dataPub": "AAAA-MM-DD",
      "link": "https://… (verificado)",
      "tema": "…",
      "formato": "reportagem|analise|ensaio|coluna|entrevista|pesquisa|podcast|livro|filme|outro",
      "classificacao": "alinhado|adjacente|contraponto|exploratorio",
      "tempoLeitura": "8 min",
      "paywall": "sim|nao|incerto",
      "porque": "2–3 frases: por que se conecta aos interesses.",
      "ideiaCentral": "O argumento principal, sem substituir a leitura.",
      "relacaoPerfil": "Quais interesses/posições/preferências justificam.",
      "pontoObservar": "Uma premissa, viés, limitação, controvérsia ou pergunta útil.",
      "verificado": true
    }
  ],
  "equilibrio": {
    "alinhados": 0, "adjacentes": 0, "contrapontos": 0, "exploratorios": 0,
    "temas": ["…"], "foraDesta": ["temas prioritários que ficaram de fora"],
    "repetidos": ["autores/veículos repetidos recentemente, se houver"]
  },
  "ajustePerfil": "Se houver sinais de mudança de preferência, sugira aqui (não altere o perfil sozinho). Senão, vazio."
}
```

Regras do arquivo: `data/curadoria.json` é fonte da verdade e **não** deve conter itens não
verificados (`verificado` só `true`). Não reescreva edições antigas — só prepende a nova.

## Depois de gravar
1. `node build.js` (regenera `index.html` + `artifact.html`; a aba **Curadoria** lê o JSON).
2. Confirme que `index.html` abre sem erro.
3. `git add -A && git commit` na branch `claude/attention-allocation-dashboard-qwbewu` e `git push`.
4. Republique o Artifact (mesma URL `5f27b373-6d3e-4677-b5c2-2762d1aa0ac9`, capability `{mcp}`,
   favicon estáveis) com `artifact.html`.
5. Reporte: **Equilíbrio da edição** (contagem por classificação, temas contemplados, prioritários de
   fora, autores/veículos repetidos) e, se houver, **sugestões de ajuste de perfil** para aprovação.

Se **nem o WebSearch** funcionar (sem qualquer acesso à web), **não invente uma edição** — avise que a
rede está indisponível e pare. Se o WebSearch funcionar mas o WebFetch não, use o **modo WebSearch** acima.
