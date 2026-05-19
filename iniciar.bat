@echo off
title Open Design - Servidor Local
cd /d "%~dp0"

echo.
echo ============================================
echo   Open Design - iniciando servidor local
echo ============================================
echo.
echo   Web:    http://127.0.0.1:17573
echo   Daemon: http://127.0.0.1:17456
echo.
echo   Aguarde alguns segundos - o navegador abrira sozinho.
echo   Para parar, feche esta janela ou pressione Ctrl+C.
echo.

REM Encerra qualquer instancia anterior (idempotente)
call pnpm tools-dev stop >nul 2>&1

REM Abre o navegador apos 10s em paralelo
start "" /b cmd /c "timeout /t 10 /nobreak >nul && start http://127.0.0.1:17573"

REM Sobe daemon + web em primeiro plano
call pnpm tools-dev run web --daemon-port 17456 --web-port 17573

echo.
echo Servidor encerrado.
pause
