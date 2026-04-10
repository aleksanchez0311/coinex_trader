@echo off
echo Generando favicon.ico desde SVG...
cd /d "%~dp0"

:: Usar sharp (Node.js) para convertir SVG a PNG
node -e "const sharp = require('..\\node_modules\\sharp'); sharp('..\\web\\public\\favicon.svg').resize(256,256).png().toFile('favicon_temp.png')"

:: Convertir PNG a ICO usando Python/Pillow
python -c "from PIL import Image; img = Image.open('favicon_temp.png'); img.save('favicon.ico', format='ICO')"
del favicon_temp.png 2>nul

echo.
echo Listo: favicon.ico creado