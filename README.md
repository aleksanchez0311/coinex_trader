# CoinEx Trader - Intraday Trading Platform

Plataforma fullstack profesional para análisis y ejecución de trading intradía en criptomonedas (futuros), basada en **Smart MoneyConcepts (SMC)** + EMA + RSI + ATR.

## 🚀 Características

- **Análisis SMC Automatizado**: BOS, CHOCH, FVG, Order Blocks, Zonas de Liquidez
- **Checklist ORO**: Validación de 6 puntos antes de operar (tendencia EMA, estructura BOS, liquidez, OB/FVG, RSI en zona, volumen)
- **Sistema de Scoring**: Evaluación de setups 0-100 basada en confluencias técnicas
- **Motor de Riesgo**: Cálculo automático de posición, margen, SL (basado en ATR) y TP (R:R 1.5+)
- **Integración CoinEx**: Órdenes Limit/Market, SL/TP automáticos, modo aislado
- **Diseño Premium**: UI oscura y responsiva (React + Tailwind + Framer Motion)
- **Actualización por Foco**: Datos se actualizan automáticamente cuando la app gana foco

## 📋 Requisitos del Sistema

- Python 3.9+ (backend)
- Node.js 18+ (frontend)
- Navegador moderno con soporte localStorage

## 📁 Estructura del Proyecto

```
trader/
├── app/                          # Aplicación
│   ├── backend/                  # FastAPI (Python)
│   │   ├── main.py               # Endpoints API
│   │   ├── engines/
│   │   │   ├── analysis.py       # Motor de análisis SMC
│   │   │   ├── scoring.py        # Scoring de setups
│   │   │   └── risk.py           # Gestión de riesgo
│   │   ├── models/
│   │   │   └── trading.py        # Modelos Pydantic
│   │   └── utils/
│   │       └── coinex_client.py  # Cliente CoinEx (CCXT)
│   └── web/                      # React + Vite
│       ├── src/
│       │   ├── components/       # Componentes UI
│       │   ├── App.jsx           # Componente principal
│       │   └── index.css         # Estilos Tailwind
│       ├── package.json
│       └── tailwind.config.js
├── release/                      # Launcher Windows
│   ├── build.bat                 # Script de compilación
│   ├── create_icon.bat           # Generador de icono
│   └── launcher.cs               # Código fuente
├── CoinExTrader.exe              # Ejecutable compilado
├── favicon.ico                   # Icono de la aplicación
├── .env.example                  # Variables de entorno ejemplo
├── AGENTS.md                     # Configuración de agentes IA
├── specs.md                      # Especificaciones técnicas
└── README.md                     # Este archivo
```

## 🛠️ Instalación

### Backend

```bash
cd app/backend
pip install -r requirements.txt
python main.py
```

El servidor correrá en `http://localhost:8000`

### Frontend

```bash
cd app/web
npm install
npm run dev
```

La aplicación estará en `http://localhost:5173`

## ⚙️ Configuración

### Variables de Entorno (Backend)

Crear archivo `.env` en carpeta `backend/`:

```env
COINEX_API_KEY=tu_api_key
COINEX_SECRET=tu_api_secret
```

### Credenciales en la App

Las credenciales configuradas en la página de **Configuración** tienen prioridad sobre las variables de entorno. Se almacenan en `localStorage` del navegador.

- **Actualizar desde LocalStorage**: Botón para recargar credenciales guardadas previamente
- **Guardar Credenciales**: Guarda las credenciales actualizadas en localStorage
- **Borrar Credenciales**: Elimina las credenciales guardadas

## 🎯 Flujo de Operación

1. **Seleccionar símbolo** de la lista de favoritos
2. **Análisis automático** del par (estructura SMC, indicadores)
3. **Configurar riesgo**: capital, % riesgo, apalancamiento
4. **Calcular posición** → obtener tamaño y niveles
5. **Abrir operación** → modal de confirmación con todos los parámetros
6. **Confirmar** → ejecutar orden real en CoinEx

## 📊 Checks Pre-Trade (Checklist ORO)

1. ✓ Tendencia EMA alineada
2. ✓ Estructura BOS confirmada
3. ✓ Zonas de liquidez identificadas
4. ✓ OB/FVG válido detectado
5. ✓ RSI en zona correcta (40-60)
6. ✓ Volumen confirmado

**Si falta 1 → NO OPERAR**

## 🧠 Metodología

La estrategia combina:

- **SMC**: Detección de liquidez institucional, FVG, Order Blocks
- **EMA 20/50/200**: Dirección de tendencia
- **RSI**: Timing de entrada (40-60)
- **ATR**: Stop Loss basado en volatilidad
- **Volumen**: Validación de movimientos

## 📈 Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/analyze` | POST | Análisis completo del símbolo |
| `/risk-management` | POST | Cálculo de posición y riesgo |
| `/execute-trade` | POST | Crear orden con SL/TP |
| `/pnl-stats` | POST | Obtener PnL acumulado |
| `/ticker/{symbol}` | GET | Precio actual de símbolo |
| `/markets` | GET | Lista de mercados disponibles |
| `/positions` | GET | Posiciones abiertas |

## 🖥️ Ejecutable Windows (Launcher)

El launcher descarga el proyecto desde GitHub, instala dependencias y ejecuta automáticamente.

### Compilar el ejecutable

```cmd
cd release
build.bat
```

Genera `CoinExTrader.exe` + `favicon.ico`

### Requisitos previos

1. **.NET Framework 4.x** (incluido en Windows 10/11)
2. **Git** instalado
3. **Python** instalado
4. **Node.js** instalado

### Uso

1. Ejecutar `CoinExTrader.exe`
2. Primera vez: Descarga el proyecto desde GitHub a `%LOCALAPPDATA%\CoinExTrader`
3. Instala dependencias (backend + frontend)
4. Inicia servidores y abre navegador en `http://localhost:4173`
5. Icono en System Tray → "Abrir en el Navegador" o "Apagar y Salir"

### Actualizar proyecto

Hacer click derecho en el icono del tray → "Recargar Proyecto" (hace git pull)

### Uso del Launcher

1. Ejecutar `CoinExTrader.exe`
2. Ver ventana de carga mientras se inicializan los servidores
3. Se abre automáticamente el navegador en `http://localhost:4173`
4. El icono queda en el área de notificaciones (System Tray)
5. **Click derecho** → "Abrir en el Navegador" o "Apagar y Salir"

### Características

- **Silencioso**: No muestra ventana de terminal
- **Control de procesos**: Inicia y termina Python y Node.js correctamente
- **Prevención de duplicados**: Si ya está corriendo, solo abre el navegador
- **Icono personalizado**: Usa el icono del proyecto

## ⚠️ Disclaimer

Esta herramienta es experimental. El trading de futuros conlleva un riesgo significativo. Úsese bajo su propia responsabilidad.