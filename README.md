# CoinEx Trader - Intraday Trading Platform

Plataforma fullstack profesional para análisis y ejecución de trading intradía en criptomonedas (futuros), basada en **Smart Money Concepts (SMC)** + EMA + RSI + ATR con soporte multiplataforma.

## 🚀 Características

### Análisis Técnico
- **Análisis SMC Automatizado**: Detección de swings, BOS/CHOCH, liquidez, FVG, Order Blocks
- **Indicadores Técnicos**: EMA 20/50/200, RSI (14), ATR (14) para confirmación de tendencia
- **Checklist ORO**: Validación de 6 puntos pre-trade (tendencia EMA, estructura BOS, liquidez, OB/FVG, RSI en zona, volumen)
- **Sistema de Scoring**: Evaluación de setups 0-100 basada en confluencias técnicas
- **Trading Plan Generator**: Plan completo con sesgo principal, escenarios alternativos, entry/SL/TP, R:R

### Gestión de Riesgo
- **Motor de Riesgo**: Cálculo automático de posición, margen, SL (basado en ATR) y TP (R:R 1.5+)
- **Position Sizing**: Basado en capital, % riesgo y apalancamiento configurables
- **Múltiples TP**: TP1 (1.5R), TP2 (2.5R), TP3 (4R) para gestión parcial

### Integraciones
- **CoinEx Trading**: Ejecución real de órdenes Limit/Market con SL/TP automáticos
- **OKX Market Data**: Datos de mercado OHLCV, tickers, funding rate
- **Modo Aislado**: Gestión de riesgo por posición

### UI/UX Premium
- **Diseño Dark Mode**: Tema oscuro premium con paleta #0B0E11 (Eerie Black)
- **Glassmorphism**: Modales con efecto blur y transparencia
- **Responsive**: Adaptable a desktop y móvil
- **Actualización por Foco**: Datos se actualizan automáticamente cuando la app gana foco

### Multiplataforma
- **Windows**: Ejecutable nativo (.exe) con launcher C#
- **Android**: APK nativo con Capacitor
- **Web**: Aplicación web progresiva (PWA)

## 📋 Requisitos del Sistema

- Python 3.9+ (backend)
- Node.js 18+ (frontend)
- Navegador moderno con soporte localStorage

## 📁 Estructura del Proyecto

```
trader/
├── app/                          # Aplicación principal
│   ├── backend/                  # FastAPI (Python)
│   │   ├── main.py               # Endpoints API
│   │   ├── requirements.txt      # Dependencias Python
│   │   ├── engines/              # Motores de análisis
│   │   │   ├── analysis.py       # Análisis SMC + trading plan
│   │   │   ├── risk.py           # Gestión de riesgo
│   │   │   └── scoring.py       # Scoring de calidad de trade
│   │   ├── models/
│   │   │   └── trading.py        # Modelos Pydantic
│   │   └── utils/
│   │       └── exchange_clients.py # Clientes exchange (OKX market data, CoinEx trading)
│   └── frontend/                 # React + Vite
│       ├── src/
│       │   ├── main.jsx          # Entry point
│       │   ├── index.css         # Estilos Tailwind + tema
│       │   ├── App.css           # Estilos globales
│       │   ├── App.jsx           # App principal con estado
│       │   ├── components/       # Componentes UI
│       │   │   ├── ActionButtons.jsx     # Botones Plan & Info
│       │   │   ├── AnalysisBoard.jsx      # Display análisis
│       │   │   ├── Header.jsx            # Header + logo + PnL
│       │   │   ├── MarketList.jsx        # Lista favoritos
│       │   │   ├── PositionsTable.jsx   # Posiciones abiertas
│       │   │   ├── Sidebar.jsx          # Navegación (colapsable)
│       │   │   ├── SettingsView.jsx      # Config API y favoritos
│       │   │   ├── StrategyView.jsx      # Display estrategia
│       │   │   ├── RiskManagementView.jsx  # Vista gestión riesgo
│       │   │   ├── RiskPanel.jsx         # Panel riesgo avanzado
│       │   │   └── modals/           # Componentes modales
│       │   │       ├── PlanOperativoModal.jsx
│       │   │       ├── InfoAvanzadaModal.jsx
│       │   │       └── ConfirmOrderModal.jsx
│       │   ├── assets/          # Recursos (SVG, imágenes)
│       │   └── config/          # Configuración app
│       ├── public/
│       │   └── index.html       # HTML template
│       ├── android/             # Proyecto Android (Capacitor)
│       ├── capacitor.config.json # Config Capacitor
│       ├── package.json
│       ├── tailwind.config.js   # Tema dark premium
│       ├── vite.config.js
│       ├── postcss.config.js
│       └── eslint.config.js
├── release/                      # Builds multiplataforma
│   ├── exeify.bat              # Script compilación Windows
│   ├── iconify.bat             # Generador de icono
│   ├── exeify.cs               # Código fuente C# launcher
│   ├── apkify.bat              # Script compilación Android
│   ├── add_camera.ps1          # Script permisos cámara Android
│   ├── requirements.txt        # Dependencias launcher
│   ├── CoinEx Trader-release.apk # APK Android firmado
│   └── edge-function/          # Funciones edge (futuro)
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

Dependencias:
- fastapi
- uvicorn
- pandas
- numpy
- ccxt
- pydantic
- python-dotenv
- scipy
- aiodns
- aiohttp
- yarl
- requests

### Frontend

```bash
cd app/frontend
npm install
npm run dev
```

La aplicación estará en `http://localhost:5173`

Dependencias:
- react
- vite
- tailwindcss
- framer-motion
- lucide-react
- axios
- lightweight-charts
- clsx
- tailwind-merge
- @capacitor/android
- @capacitor/cli
- @capacitor/core
- @capacitor/ios
- html5-qrcode
- autoprefixer
- postcss

## ⚙️ Configuración

### Variables de Entorno (Backend)

Crear archivo `.env` en carpeta `backend/`:

```env
COINEX_API_KEY=tu_api_key
COINEX_SECRET=tu_api_secret
```

### Credenciales en la App

Las credenciales configuradas en la página de **Configuración** tienen prioridad sobre las variables de entorno. Se almacenan en `localStorage` del navegador, en la misma sección donde se organizan los **Mercados Favoritos**.

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
- **EMA 20/70/200**: Dirección de tendencia
- **RSI**: Timing de entrada (40-60)
- **ATR**: Stop Loss basado en volatilidad
- **Volumen**: Validación de movimientos

## 📈 Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Estado de la API |
| `/analyze` | POST | Análisis completo del símbolo (SMC + indicadores) |
| `/risk-management` | POST | Cálculo de posición y riesgo |
| `/execute-trade` | POST | Crear orden con SL/TP |
| `/balance` | POST | Obtener balance de cuenta swap |
| `/positions` | POST | Obtener posiciones abiertas |
| `/close-position` | POST | Cerrar una posición |
| `/pnl-stats` | POST | Obtener PnL acumulado (realizado + no realizado) |
| `/markets` | GET | Lista de mercados disponibles (futuros) |
| `/top-gainers` | GET | Ranking de activos por crecimiento 24h |
| `/ticker/{symbol}` | GET | Precio actual y cambio 24h de un símbolo |
| `/tickers` | POST | Precio de múltiples símbolos (batch) |
| `/market-status` | GET | Estado de conexión y pares activos |

## ð¦ Android APK (Capacitor)

### Compilar APK

```cmd
cd release
apkify.bat --default
```

O para firmar APK existente:
```cmd
cd release
apkify.bat --sign-only
```

### Requisitos previos

1. **Java 22+** (Eclipse Adoptium JDK)
2. **Android SDK** (API Level 35+)
3. **Node.js 18+**
4. **Gradle 8.10.2+**

### Configuración

El script `apkify.bat` configura automáticamente:
- **Capacitor 7**: Framework para apps nativas
- **Android Studio**: Build y debugging
- **Keystore**: Firma digital del APK (keystore auto-generado)
- **Package ID**: `cu.limitlesscode.coinextraderandroid`
- **Permisos**: Cámara (para QR code scanning)
- **Build Tools**: Android SDK Build Tools 35.0.0

### Características Android

- **Nativo**: Performance nativa con WebView
- **Offline**: Funciona sin conexión (datos cacheados)
- **Notificaciones**: Alertas de trading push
- **Responsive**: UI adaptada a móviles
- **QR Scanner**: Integración con html5-qrcode para escanear API keys
- **Capacitor 7**: Última versión del framework híbrido
- **Java 22**: Compilación con JDK más reciente
- **Target SDK 35**: Compatible con Android 14+

## ðª Componentes UI

### Componentes Principales
- **App.jsx**: Estado global, modales, control de sidebar
- **MarketList.jsx**: Lista de mercados favoritos con precios en tiempo real
- **AnalysisBoard.jsx**: Display de análisis técnico y scoring
- **PositionsTable.jsx**: Tabla de posiciones abiertas con PnL
- **RiskPanel.jsx**: Panel avanzado de gestión de riesgo
- **SettingsView.jsx**: Configuración de API y mercados favoritos

### Componentes Modales
- **PlanOperativoModal.jsx**: Modal glassmorphism con plan completo (sesgo, escenarios, entry/SL/TP, R:R)
- **InfoAvanzadaModal.jsx**: Modal técnico con análisis SMC, indicadores, niveles clave
- **ConfirmOrderModal.jsx**: Modal confirmación con cálculo margen, riesgo, modo orden

### Sistema de Diseño

#### Paleta de Colores (Dark Mode Premium)
| Elemento | Color |
|----------|-------|
| Background (Eerie Black) | `#0B0E11` |
| Surface (Gunmetal) | `#1E2329` |
| Long (Emerald Green) | `#00C076` |
| Short (Candy Apple Red) | `#CF304A` |
| Neutral/NO TRADE | `#848E9C` |
| Text Primary | `#EAECEF` |

#### Tipografía
- **UI/Text**: Inter o Geist Sans
- **Prices/Data**: Roboto Mono o JetBrains Mono (previene jitter visual)

## ⚠️ Disclaimer

Esta herramienta es experimental. El trading de futuros conlleva un riesgo significativo. Úsese bajo su propia responsabilidad.