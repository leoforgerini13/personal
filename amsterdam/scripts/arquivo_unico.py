#!/usr/bin/env python3
"""Monta o site inteiro num único arquivo HTML: mapa-amsterdam.html.

Serve para abrir com dois cliques, sem servidor (o site normal usa módulos
JavaScript, que o navegador não carrega direto do disco). Embute estilos,
fontes, Leaflet, o código (empacotado com esbuild) e os dados.

Dados: usa data/lugares.json se existir; senão, monta a partir de
data/lugares.csv, sem coordenadas (o mapa fica sem pins até rodar a Fase 1).

Uso:  python3 scripts/arquivo_unico.py      (requer Node, para o esbuild via npx)
"""

import base64
import csv
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(ROOT, "mapa-amsterdam.html")
ESBUILD = "esbuild@0.24.2"


def ler(caminho, modo="r"):
    with open(os.path.join(ROOT, caminho), modo, **({} if "b" in modo else {"encoding": "utf-8"})) as f:
        return f.read()


def dados():
    if os.path.exists(os.path.join(ROOT, "data", "lugares.json")):
        return json.loads(ler("data/lugares.json")), True
    lugares = []
    with open(os.path.join(ROOT, "data", "lugares.csv"), encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            lugares.append({
                "id": r["id"], "nome": r["nome"], "bairro": r["bairro"], "tema": r["tema"],
                "preco": r["preco"], "descricao": r["descricao"],
                "cidade": "Amstelveen" if "amstelveen" in r["endereco_busca"].lower() else "Amsterdam",
                "lat": None, "lng": None, "geo": "pendente",
            })
    return {"gerado_em": None, "fonte": "lugares.csv (sem coordenadas)", "lugares": lugares}, False


def css_com_fontes(css, base):
    """Troca url(...woff2) por data: URI, resolvendo o caminho relativo a `base`."""
    def trocar(m):
        caminho = os.path.normpath(os.path.join(base, m.group(1)))
        b64 = base64.b64encode(ler(caminho, "rb")).decode()
        return f'url("data:font/woff2;base64,{b64}")'
    return re.sub(r'url\("([^"]+\.woff2)"\)', trocar, css)


def empacotar_js():
    cmd = ["npx", "--yes", ESBUILD, "js/main.js", "--bundle", "--format=iife", "--minify", "--target=es2020", "--charset=utf8"]
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"esbuild falhou:\n{r.stderr}")
    return r.stdout


def seguro_em_script(texto):
    return texto.replace("</script", "<\\/script").replace("<!--", "<\\!--")


def main():
    html = ler("index.html")
    json_dados, com_coord = dados()

    estilos = "\n".join([
        ler("vendor/leaflet/leaflet.css"),
        ler("vendor/leaflet.markercluster/MarkerCluster.css"),
        css_com_fontes(ler("css/app.css"), "css"),
    ])
    icone = "data:image/svg+xml;base64," + base64.b64encode(ler("icon.svg", "rb")).decode()

    # cabeçalho: sem preload, manifest e ícone da tela inicial (não funcionam em file://)
    html = re.sub(r'\s*<link rel="preload"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="(apple-touch-icon|manifest)"[^>]*>', "", html)
    html = html.replace('href="icon.svg"', f'href="{icone}"')
    html = re.sub(r'\s*<link rel="stylesheet" href="[^"]+">', "", html)
    html = html.replace("</head>", f"<style>\n{estilos}\n</style>\n</head>", 1)

    scripts = (
        f"<script>{seguro_em_script(ler('vendor/leaflet/leaflet.js'))}</script>\n"
        f"<script>{seguro_em_script(ler('vendor/leaflet.markercluster/leaflet.markercluster.js'))}</script>\n"
        f"<script>window.LUGARES_EMBUTIDOS = {seguro_em_script(json.dumps(json_dados, ensure_ascii=False))};</script>\n"
        f"<script>{seguro_em_script(empacotar_js())}</script>"
    )
    html, n = re.subn(r'\s*<script src="vendor/leaflet/leaflet.js"></script>\s*'
                      r'<script src="vendor/leaflet.markercluster/leaflet.markercluster.js"></script>\s*'
                      r'<script type="module" src="js/main.js"></script>', lambda _: "\n" + scripts, html)
    if n != 1:
        sys.exit("não achei os <script> esperados no index.html")

    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write(html)
    tam = os.path.getsize(SAIDA) / 1024
    print(f"{os.path.relpath(SAIDA, ROOT)} ({tam:.0f} KB, {len(json_dados['lugares'])} lugares, "
          f"{'com' if com_coord else 'sem'} coordenadas)")


if __name__ == "__main__":
    main()
