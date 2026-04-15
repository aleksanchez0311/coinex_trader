@echo off
cd /d "%~dp0.."

echo ===================================================
echo   Generando favicon.ico
echo ===================================================

if not exist "app\frontend\dist\favicon.svg" (
    echo ERROR: favicon.svg no encontrado en app\frontend\dist\
    pause
    exit /b 1
)

node -e "const sharp = require('./node_modules/sharp'); sharp('./app/frontend/dist/favicon.svg').resize(256,256).png().toFile('./favicon_temp.png')"

python -c "from PIL import Image; img = Image.open('./favicon_temp.png'); img.save('./favicon.ico', format='ICO')"
del /q favicon_temp.png 2>nul

echo.
echo ===================================================
echo   Icono creado: favicon.ico (en la raiz del proyecto)
echo ===================================================