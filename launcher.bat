@echo off
set STARTDIR=%CD%
echo ===================================================
echo   Instalacion y ejecucion del proyecto
echo ===================================================

echo [1/6] Configurando el backend...
cd /d "%STARTDIR%\app\backend"
if not exist .venv (
    echo Creando entorno virtual...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
python.exe -m pip install --upgrade pip
pip install -r requirements.txt

echo [2/6] Instalando dependencias Node.js...
cd /d "%STARTDIR%\app\frontend"
if not exist node_modules (
    echo Instalando dependencias Node.js...
    call npm install
)

cd /d "%STARTDIR%\release"
echo [3/6] Generando favicon.ico...
echo [4/6] Compilando ejecutable...
call exeify.bat

echo [5/6] Construyendo la interfaz web...
cd /d "%STARTDIR%\app\frontend"
call npm install
call npm run build

cd /d "%STARTDIR%"

echo [6/6] Iniciando servidores...
start "Backend" cmd /k "cd /d "%STARTDIR%\app\backend" && call .venv\Scripts\activate.bat && python main.py"
start "Frontend" cmd /k "cd /d "%STARTDIR%\app\frontend" && npm run dev"

echo.
echo ===================================================
echo   Listo. Ventanas abiertas:
echo   - Backend (servidor Python)
echo   - Frontend (servidor Vite)
echo ===================================================