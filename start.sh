#!/usr/bin/env bash
# Lançador do app local (dashboard + chat Sonnet 5).
# macOS/Linux: rode `./start.sh` no terminal, ou dê dois cliques em start.command (macOS).
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale em https://nodejs.org e rode de novo."
  exit 1
fi

if [ ! -d node_modules/@anthropic-ai ]; then
  echo "Instalando dependências (uma vez só)…"
  npm install
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "Cole sua chave da API Anthropic (começa com sk-ant-...) e aperte Enter:"
  read -r ANTHROPIC_API_KEY
  export ANTHROPIC_API_KEY
fi

# abre o navegador quando o servidor estiver de pé
(
  sleep 1.5
  if command -v open >/dev/null 2>&1; then open http://localhost:4178
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:4178
  else echo "Abra manualmente: http://localhost:4178"; fi
) &

echo "Servidor rodando. Deixe esta janela aberta; feche-a para parar o app."
node server.js
