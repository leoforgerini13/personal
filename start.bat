@echo off
REM Windows: de dois cliques neste arquivo para abrir o app local (dashboard + chat Sonnet 5).
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org e rode de novo.
  pause
  exit /b 1
)

if not exist node_modules\@anthropic-ai (
  echo Instalando dependencias ^(uma vez so^)...
  call npm install
)

if "%ANTHROPIC_API_KEY%"=="" (
  set /p ANTHROPIC_API_KEY=Cole sua chave da API Anthropic (sk-ant-...) e aperte Enter:
)

start "" http://localhost:4178
echo Servidor rodando. Deixe esta janela aberta; feche-a para parar o app.
node server.js
