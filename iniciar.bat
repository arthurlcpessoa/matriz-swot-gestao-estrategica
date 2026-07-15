@echo off
title Matriz SWOT

echo ==========================================
echo         MATRIZ SWOT
echo ==========================================
echo.

set "PATH=C:\Users\arthurleite\Desktop\node-v22.23.1-win-x64\node-v22.23.1-win-x64;%PATH%"

echo Node:
node -v

echo.
echo NPM:
npm.cmd -v

echo.

if not exist node_modules (
    echo Instalando dependencias...
    call npm.cmd install
    echo.
)

echo Iniciando servidor...
echo.

start http://localhost:3000

call npm.cmd run dev

pause