@echo off
echo ===================================================
echo   Iniciando instalacion y ejecucion del proyecto
echo ===================================================

echo [1/4] Configurando el backend...
cd backend
if not exist .venv (
    echo Creando entorno virtual...
    python -m venv .venv
)

echo Activando entorno virtual e instalando dependencias...
call .venv\Scripts\activate.bat
python.exe -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo [2/4] Generando icono para el launcher...
cd release
call create_icon.bat
cd ..

echo [3/4] Compilando ejecutable...
cd release
call build.bat
cd ..

echo [4/4] Construyendo la interfaz web...
cd web
call npm install
call npm run build
cd ..

echo.
echo ===================================================
echo   Instalacion completada
echo   Ejecutar: release\CoinExTrader.exe
echo ===================================================
