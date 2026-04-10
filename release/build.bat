@echo off
cd /d "%~dp0"

echo ===================================================
echo   Construyendo CoinEx Trader
echo ===================================================

echo [1/2] Generando icono...
call create_icon.bat

echo.
echo [2/2] Compilando ejecutable...
C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe /target:winexe /out:CoinExTrader.exe /win32icon:favicon.ico launcher.cs

if errorlevel 1 (
    echo Error en la compilacion
) else (
    echo.
    echo ===================================================
    echo   Build completado: CoinExTrader.exe
    echo ===================================================
)