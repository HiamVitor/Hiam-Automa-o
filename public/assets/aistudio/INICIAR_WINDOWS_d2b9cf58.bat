@echo off
title FluxoPessoal - Servidor Local
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado! Abrindo ABRIR_DIRETO.html diretamente...
  start "" "ABRIR_DIRETO.html"
  exit /b 0
)
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
echo Iniciando FluxoPessoal em http://localhost:3000 ...
start "" "http://localhost:3000"
call npm run dev
