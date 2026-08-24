#!/usr/bin/env python3
"""Gera financas.artifact.html a partir de financas.html.

O Artifact roda sob uma CSP que bloqueia hosts externos (Google Fonts é a
única exceção), e a página é publicada sem <html>/<head>/<body> — o
hospedeiro envolve o conteúdo. Este script faz as duas adaptações:

  1. troca a tag <script src="…cdn…chart.js…"> pelo Chart.js embutido
     de vendor/chart.umd.min.js;
  2. remove doctype, <html>, <head>, <body> e as <meta> que só valem numa
     página autônoma, preservando <title> e o link do Google Fonts.

Edite sempre financas.html; rode este script para republicar o artifact.
"""
import pathlib, re, sys

raiz = pathlib.Path(__file__).parent
origem = raiz / 'financas.html'
vendor = raiz / 'vendor' / 'chart.umd.min.js'
destino = raiz / 'financas.artifact.html'

html = origem.read_text(encoding='utf-8')
chartjs = vendor.read_text(encoding='utf-8')

# 1. Chart.js embutido no lugar do CDN
tag_cdn = re.compile(r'<script src="https://cdn\.jsdelivr\.net/npm/chart\.js[^"]*"></script>')
if not tag_cdn.search(html):
    sys.exit('erro: tag do Chart.js via CDN não encontrada em financas.html')
html = tag_cdn.sub(lambda _: '<script>\n' + chartjs + '\n</script>', html, count=1)

# 2. Remove o esqueleto do documento (o hospedeiro fornece o dele)
for padrao in (r'<!DOCTYPE html>\s*', r'<html lang="pt-BR">\s*', r'</html>\s*$',
               r'<head>\s*', r'</head>\s*', r'<body>\s*', r'</body>\s*',
               r'<meta charset="UTF-8">\s*',
               r'<meta name="theme-color"[^>]*>\s*',
               r'<meta name="apple-mobile-web-app[^>]*>\s*'):
    html = re.sub(padrao, '', html)

# A meta viewport precisa sobreviver: sem ela o celular assume uma viewport
# larga e renderiza o layout de desktop. O navegador a respeita fora do <head>.
html = html.strip()
if 'name="viewport"' not in html:
    sys.exit('erro: meta viewport sumiu — o layout mobile quebraria')

destino.write_text(html + '\n', encoding='utf-8')
kb = destino.stat().st_size / 1024
print(f'{destino.name} gerado — {kb:.0f} KB')
