# Finanças — como editar

`financas.html` é a fonte. `financas.artifact.html` é gerado, nunca editado à mão.

## O detalhe que importa

A página publicada **grava os dados do usuário dentro dela mesma**, no bloco
`<script id="app-dados">`. Cada vez que ele lança um gasto, a página republica
o artifact com os dados novos.

Isso significa que **republicar daqui sem resgatar esses dados apaga tudo que
ele lançou**. O fluxo abaixo existe para isso não acontecer.

## Fluxo de edição

```
1. Artifact action:"read" url:<url>        # salva o HTML ao vivo num arquivo
2. python3 extrai-dados.py <arquivo> > dados.json
   #   código 2 = artifact ainda nos dados iniciais, siga sem --dados
3. edite financas.html
4. python3 build-artifact.py --dados dados.json
5. Artifact publish (mesmo file_path, mantém a URL)
```

## Onde os dados moram

| Contexto | Fonte | Como salva |
|---|---|---|
| Artifact publicado | `<script id="app-dados">` | `artifact.publish()`, com debounce de 3s |
| Artifact só-leitura | `<script id="app-dados">` | não salva; avisa na interface |
| `financas.html` solto | `localStorage` | direto, sem rede |

O `localStorage` continua sendo escrito no modo artifact, como rede de
segurança: se um publish falhar, **⚙️ Dados → Recuperar dados guardados neste
navegador** traz de volta.

## Cuidados

- Publicar recarrega a página. Por isso o salvamento é adiado 3s e espera o
  usuário sair do campo — mas no máximo 4 vezes, senão nada seria salvo com o
  foco parado numa célula.
- O `<template id="app-shell">` é gerado pelo build a partir do markup real,
  para os dois nunca divergirem. A página se regenera a partir dele, nunca do
  DOM vivo (que carrega estado de sessão e scripts do hospedeiro).
- `capabilities` é declaração de conjunto completo: ao republicar declarando
  qualquer uma, declare `{"artifact": {}, "downloads": true}` — o que ficar de
  fora é revogado.
