#!/usr/bin/env python3
"""Gera financas.artifact.html a partir de financas.html.

O Artifact roda sob uma CSP que bloqueia hosts externos (Google Fonts é a
única exceção), e a página é publicada sem <html>/<head>/<body> — o
hospedeiro envolve o conteúdo. Este script:

  1. embute o Chart.js de vendor/ no lugar da tag de CDN;
  2. remove doctype, <html>, <head>, <body> e as <meta> que só valem numa
     página autônoma, preservando <title>, a meta viewport e o Google Fonts;
  3. duplica o markup estático num <template id="app-shell">, que a página
     usa para se regenerar ao salvar (ler o DOM vivo não serve: ele carrega
     estado de sessão e os scripts injetados pelo hospedeiro);
  4. embute os dados em <script id="app-dados">.

IMPORTANTE — a página publicada grava os dados do usuário dentro dela mesma.
Republicar sem passar --dados sobrescreveria esses dados pelos iniciais. Para
preservá-los, extraia o bloco app-dados do artifact ao vivo e passe:

    python3 build-artifact.py --dados dados-ao-vivo.json

Edite sempre financas.html; rode este script para republicar o artifact.
"""
import argparse, json, pathlib, re, sys

raiz = pathlib.Path(__file__).parent
origem = raiz / 'financas.html'
vendor = raiz / 'vendor' / 'chart.umd.min.js'
destino = raiz / 'financas.artifact.html'

ap = argparse.ArgumentParser()
ap.add_argument('--dados', help='JSON a embutir; sem isso, usa os dados iniciais do app')
args = ap.parse_args()

html = origem.read_text(encoding='utf-8')
chartjs = vendor.read_text(encoding='utf-8')

# 1. Chart.js embutido no lugar do CDN
tag_cdn = re.compile(r'<script id="app-vendor" src="https://cdn\.jsdelivr\.net/npm/chart\.js[^"]*"></script>')
if not tag_cdn.search(html):
    sys.exit('erro: tag do Chart.js via CDN não encontrada em financas.html')
html = tag_cdn.sub(lambda _: '<script id="app-vendor">\n' + chartjs + '\n</script>', html, count=1)

# 2. Esqueleto do documento fora (o hospedeiro fornece o dele)
for padrao in (r'<!DOCTYPE html>\s*', r'<html lang="pt-BR">\s*', r'</html>\s*$',
               r'<head>\s*', r'</head>\s*', r'<body>\s*', r'</body>\s*',
               r'<meta charset="UTF-8">\s*',
               r'<meta name="theme-color"[^>]*>\s*',
               r'<meta name="apple-mobile-web-app[^>]*>\s*'):
    html = re.sub(padrao, '', html)

html = html.strip()
if 'name="viewport"' not in html:
    sys.exit('erro: meta viewport sumiu — o layout mobile quebraria')

# 3. Cópia do markup estático para a página conseguir se regenerar.
#    Vai entre o fim do markup e o <script id="app-vendor">, e é gerada daqui
#    para nunca divergir do markup de verdade.
# O markup estático vai de #toast até o script da app — o Chart.js fica antes
# dele, no topo, então não serve de limite.
ini = html.index('<div id="toast"></div>')
fim = html.index('<script id="app-js">')
if ini >= fim:
    sys.exit('erro: não achei o markup estático entre #toast e #app-js')
esqueleto = html[ini:fim].strip()
if '<template' in esqueleto or '</script' in esqueleto:
    sys.exit('erro: o markup estático não pode conter <template> nem </script')
for marcador in ('id="tab-inicio"', 'id="tab-mensal"', 'id="tab-analise"', 'id="modal"', 'class="sb-nav"'):
    if marcador not in esqueleto:
        sys.exit(f'erro: o esqueleto ficou incompleto — falta {marcador}')
html = html[:fim] + '<template id="app-shell">' + esqueleto + '</template>\n\n' + html[fim:]

# 4. Dados embutidos
if args.dados:
    dados = json.loads(pathlib.Path(args.dados).read_text(encoding='utf-8'))
    if not isinstance(dados, dict):
        sys.exit('erro: --dados precisa ser um objeto JSON')
    bruto = json.dumps(dados, ensure_ascii=False, separators=(',', ':'))
    origem_dados = f'{args.dados} ({len(dados.get("transacoes", []))} lançamentos)'
else:
    # Marcador: modo artifact ligado, mas ainda sem dados gravados — a página
    # parte do seed() e grava de verdade no primeiro salvamento.
    bruto = '{"__semDados":true}'
    origem_dados = 'dados iniciais do app'
bruto = bruto.replace('</', r'<\/')
html = html.replace('<script id="app-dados" type="application/json">null</script>',
                    f'<script id="app-dados" type="application/json">{bruto}</script>', 1)

destino.write_text(html + '\n', encoding='utf-8')
print(f'{destino.name} gerado — {destino.stat().st_size/1024:.0f} KB · dados: {origem_dados}')
