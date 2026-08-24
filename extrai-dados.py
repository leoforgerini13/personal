#!/usr/bin/env python3
"""Extrai o bloco app-dados de uma cópia do artifact publicado.

A página publicada grava os dados do usuário dentro dela mesma. Antes de
republicar daqui, é preciso resgatá-los — senão a republicação devolve o app
aos dados iniciais e apaga tudo que o usuário lançou.

Fluxo para editar o artifact preservando os dados:

    1. Artifact action:"read"  -> salva o HTML ao vivo num arquivo
    2. python3 extrai-dados.py <esse-arquivo> > dados.json
    3. (edite financas.html)
    4. python3 build-artifact.py --dados dados.json
    5. Artifact publish

Se o artifact ainda estiver com os dados iniciais, o script avisa e devolve
código 2 — aí pode republicar sem --dados sem perder nada.
"""
import json, pathlib, re, sys

if len(sys.argv) != 2:
    sys.exit('uso: extrai-dados.py <artifact-ao-vivo.html>')

html = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
m = re.search(r'<script id="app-dados" type="application/json">(.*?)</script>', html, re.S)
if not m:
    sys.exit('erro: bloco app-dados não encontrado — o artifact é de uma versão anterior?')

bruto = m.group(1).replace(r'<\/', '</')
try:
    dados = json.loads(bruto)
except json.JSONDecodeError as e:
    sys.exit(f'erro: app-dados não é JSON válido ({e})')

if not isinstance(dados, dict):
    sys.exit('erro: app-dados não é um objeto')

if dados.get('__semDados'):
    print('o artifact ainda está com os dados iniciais — republique sem --dados',
          file=sys.stderr)
    sys.exit(2)

resumo = ' · '.join(f'{len(dados.get(k, []))} {k}'
                    for k in ('transacoes', 'fixas', 'parceladas', 'savings', 'monthly_summary'))
print(f'extraído: {resumo}', file=sys.stderr)
json.dump(dados, sys.stdout, ensure_ascii=False)
