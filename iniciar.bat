@echo off
setlocal EnableExtensions
title Open Design - Servidor Local
cd /d "%~dp0"

set "WEB_PORT=17573"
set "DAEMON_PORT=17456"

echo.
echo ============================================
echo   Open Design - iniciando servidor local
echo ============================================
echo.
echo   Web:    http://127.0.0.1:%WEB_PORT%
echo   Daemon: http://127.0.0.1:%DAEMON_PORT%
echo.
echo   O navegador abre sozinho quando o servidor responder.
echo   Para parar, feche esta janela ou pressione Ctrl+C.
echo.

REM 1) Encerra qualquer instancia anterior rastreada (idempotente)
call pnpm tools-dev stop >nul 2>&1

REM 2) Libera as portas caso um processo zumbi de uma execucao anterior
REM    tenha ficado preso (causa do "web did not expose status in time")
call :freeport %DAEMON_PORT%
call :freeport %WEB_PORT%

REM 3) Abre o navegador assim que a web responder (sem chute de tempo fixo)
start "" /b powershell -NoProfile -WindowStyle Hidden -Command ^
  "$u='http://127.0.0.1:%WEB_PORT%'; for($i=0;$i -lt 120;$i++){ try{ if((Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $u).StatusCode -eq 200){ Start-Process $u; break } }catch{}; Start-Sleep 1 }"

REM 4) Sobe daemon + web em primeiro plano
call pnpm tools-dev run web --daemon-port %DAEMON_PORT% --web-port %WEB_PORT%

if errorlevel 1 (
  echo.
  echo [retry] A primeira tentativa falhou ^(cold start lento no disco E:^).
  echo         Limpando portas e tentando mais uma vez...
  echo.
  call pnpm tools-dev stop >nul 2>&1
  call :freeport %DAEMON_PORT%
  call :freeport %WEB_PORT%
  call pnpm tools-dev run web --daemon-port %DAEMON_PORT% --web-port %WEB_PORT%
)

echo.
echo Servidor encerrado.
pause
exit /b

:freeport
REM Mata apenas o PID que estiver ESCUTANDO na porta %1 (nao toca em outros node).
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%~1 " ^| findstr "LISTENING"') do (
  if not "%%P"=="0" taskkill /f /pid %%P >nul 2>&1
)
exit /b
