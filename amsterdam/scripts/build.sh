#!/bin/sh
# Monta o site estático em _site/ (só o que o navegador precisa).
# Uso: sh scripts/build.sh   (a partir de amsterdam/ ou de qualquer lugar)
set -eu
cd "$(dirname "$0")/.."

if [ ! -f data/lugares.json ]; then
  echo "erro: falta data/lugares.json. Rode: python3 scripts/geocode.py" >&2
  exit 1
fi

rm -rf _site
mkdir -p _site/data
cp -R index.html icon.svg icon-180.png manifest.webmanifest css js vendor _site/
cp data/lugares.json _site/data/
touch _site/.nojekyll

echo "_site/ pronto ($(find _site -type f | wc -l | tr -d ' ') arquivos)"
