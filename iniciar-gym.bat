@echo off
title Iniciar Casita Gym (Servicio Fuera y Dentro de Casa)
chcp 65001 > nul
cls
echo ====================================================================
echo             🏋️ CASITA GYM & MARBELLA FIT · MODO FUERA DE CASA
echo ====================================================================
echo.
echo [1/3] Comprobando servidor Gym (puerto 3001)...
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
    echo   [OK] El servidor ya está escuchando en el puerto 3001.
) else (
    echo   [!] Iniciando backend Node.js en segundo plano...
    start "Casita Gym Backend" /b cmd /c "node server.js"
    timeout /t 3 /nobreak > nul
)

echo.
echo [2/3] Comprobando conexión a Internet y túnel seguro para fuera de casa...
echo.
echo   🌐 Dominio público: https://lubricate-deserve-landmark.ngrok-free.dev
echo   📲 Descarga APK directo: https://lubricate-deserve-landmark.ngrok-free.dev/CasitaGym.apk
echo.
echo   [!] Iniciando túnel Ngrok hacia el puerto 3001...
echo.
echo --------------------------------------------------------------------
echo  MANTÉN ESTA VENTANA ABIERTA MIENTRAS ENTRENÁIS FUERA DE CASA.
echo  Cualquiera de los dos (Ismael o Sandra) podrá usar la app y el APK
echo  con datos móviles (4G/5G) o WiFi del gimnasio.
echo --------------------------------------------------------------------
echo.

if exist "C:\ngrok\ngrok.exe" (
    C:\ngrok\ngrok.exe http --domain=lubricate-deserve-landmark.ngrok-free.dev 3001
) else (
    echo [ERROR] No se encontró ngrok.exe en C:\ngrok\ngrok.exe
    pause
)
