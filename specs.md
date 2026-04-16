# CoinEx Trader - Especificaciones Técnicas

## 📋 Overview

Plataforma fullstack profesional para análisis y ejecución de trading intradía en criptomonedas (futuros), basada en Smart Money Concepts (SMC) con soporte multiplataforma (Windows, Android, Web).

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐   │
│  │Sidebar  │  │MarketList│  │Analysis  │  │Positions    │   │
│  │         │  │         │  │Board     │  │Table        │   │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └──────┬──────┘   │
│       └────────────┴────────────┴───────────────┘           │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  App.jsx    │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                             │ HTTP
┌───────────────────────────▼─────────────────────────────────┐
│                     BACKEND (FastAPI)                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Endpoints                           │ │
│  │  POST /analyze, /execute-trade, /risk-management       │ │
│  │  GET  /ticker, /markets, /positions, /pnl-stats         │ │
│  │  POST /balance, /positions, /close-position            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────┼──────────────────────────────┐ │
│  │                    Engines                              │ │
│  │  ┌───────────┐ ┌────────┐ ┌─────────┐ ┌─────────────┐   │ │
│  │  │Analysis   │ │Scoring │ │Risk     │ │CoinExClient│   │ │
│  │  │Engine    │ │Engine  │ │Engine   │ │(CCXT)      │   │ │
│  │  └───────────┘ └────────┘ └─────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │              Exchange Clients (CCXT)                  │   │
│  │  MarketDataClient (OKX) → OHLCV, Tickers, Funding    │   │
│  │  TradingClient (CoinEx) → Orders, Positions, Balance  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Integraciones

### CoinEx (CCXT) - Trading
- **Symbol Format**: `BTC/USDT:USDT`
- **Order Types**: Limit, Market
- **Margin Mode**: Isolated (default), Cross
- **Leverage**: 1-125x
- **Endpoint**: `fetch_positions()`, `create_order()`, `fetch_my_trades()`
- **Funciones**: create_order_with_sl_tp, set_leverage, get_balance, get_positions, close_position, get_realized_pnl

### OKX (Market Data) - Análisis
- **Datos de Mercado**: OHLCV, tickers, mercados disponibles, funding rate, liquidaciones
- **Verificación**: Cross-check de mercados con OKX
- **Timeframe**: 1h (200 velas)
- **Funciones**: get_ohlcv, get_ticker, get_derivatives_data, get_all_markets, get_top_markets

## 📊 Modelos de Datos

### Análisis (AnalysisEngine)
```python
{
  "bias": "Alcista" | "Bajista" | "Neutral",
  "rsi": float,
  "atr": float,
  "sl_data": { "sl_price", "sl_distance", "sl_pct" },
  "pre_trade_checks": {
    "tendencia_ema": bool,
    "estructura_bos": bool,
    "liquidez_presente": bool,
    "ob_fvg_presente": bool,
    "rsi_en_zona": bool,
    "volumen_ok": bool
  },
  "checks_passed": int (0-6),
  "recommendation": "ALTA|MEDIA|BAJA PROBABILIDAD"
}
```

### Scoring (ScoringEngine)
```python
{
  "total_score": int (0-100),
  "status": str,
  "confluences": [str],
  "checks_passed": int,
  "total_checks": int
}
```

### Riesgo (RiskEngine)
```python
{
  "position": {
    "position_size": float,
    "notional_value": float,
    "margin_required": float,
    "risk_amount": float,
    "tp1": float,  # 1.5R
    "tp2": float,  # 2.5R
    "tp3": float   # 4R
  },
  "plan": {
    "entry": float,
    "stop_loss": float,
    "tp1": float,
    "tp2": float,
    "tp3": float,
    "rr_ratio": float
  }
}
```

## 🎯 Flujo de Operación

1. **Selección de símbolo** → MarketList (favoritos)
2. **Análisis automático** → AnálisisEngine → AnalysisBoard (SMC + EMA + RSI + ATR)
3. **Configurar riesgo** → Capital, Riesgo%, Apalancamiento
4. **Calcular posición** → RiskEngine
5. **Confirmar orden** → Modal con entry, SL, TP, margin mode, order type
6. **Ejecutar** → CoinExClient.create_order_with_sl_tp()

## 🔒 Seguridad

- API Keys almacenadas en localStorage del navegador (trader_creds)
- Fallback a variables de entorno (.env)
- Nunca exponer secretos en frontend
- Validación de inputs con Pydantic
- CORS permitido para desarrollo

## 📦 Dependencias

### Backend
- fastapi
- uvicorn
- pandas
- numpy
- ccxt
- pydantic
- python-dotenv
- requests (para APIs externas)
- concurrent.futures (threading para análisis paralelo)
- scipy (cálculos avanzados)
- aiodns (DNS asíncrono)
- aiohttp (HTTP asíncrono)
- yarl (URL parsing)

### Frontend
- react
- vite
- tailwindcss
- framer-motion
- lucide-react
- axios
- lightweight-charts
- clsx
- tailwind-merge
- @capacitor/android (Capacitor 7)
- @capacitor/cli (CLI Capacitor)
- @capacitor/core (Core Capacitor)
- @capacitor/ios (iOS support)
- html5-qrcode (QR scanner)
- autoprefixer (CSS prefixes)
- postcss (CSS processing)

### Launcher (Windows)
- exeify.bat (build script)
- iconify.bat (icon generator)
- exeify.cs (C# source)
- .NET Framework 4.x (build runtime)

### APK Build (Android)
- apkify.bat (build script)
- add_camera.ps1 (camera permissions)
- Java 22+ (compilation)
- Android SDK 35+ (target)
- Gradle 8.10.2+ (build system)
- Capacitor 7 (hybrid framework)

## 🖥️ Launcher Windows

### Compilación
```cmd
cd release
exeify.bat
```
Genera `CoinExTrader.exe` + `favicon.ico`

### Flujo del Launcher
1. Se ejecuta desde el directorio donde está el exe
2. Si no existe proyecto: `git clone` desde GitHub
3. Instala dependencias (pip + npm install + npm run build)
4. Inicia backend (Python) y frontend (npm run dev)
5. Abre navegador en localhost:5173
6. Minimiza a System Tray
7. Click derecho → "Recargar Proyecto" (git pull + reinstall)

## ðª Componentes UI Detallados

### Componentes Principales
- **App.jsx**: Estado global, manejo de modales, control sidebar
- **MarketList.jsx**: Lista favoritos, precios tiempo real, gestión de mercados
- **AnalysisBoard.jsx**: Display análisis técnico, scoring, checklist
- **PositionsTable.jsx**: Posiciones abiertas, PnL, acciones rápidas
- **RiskPanel.jsx**: Panel avanzado gestión riesgo, cálculos en tiempo real
- **SettingsView.jsx**: Config API, mercados favoritos, preferencias
- **Header.jsx**: Logo, menu toggle, PnL display, estado conexión
- **Sidebar.jsx**: Navegación colapsable (oculta por defecto)
- **ActionButtons.jsx**: Botones Plan Operativo e Info Avanzada
- **StrategyView.jsx**: Display estrategia y parámetros técnicos
- **RiskManagementView.jsx**: Vista completa de gestión de riesgo

### Componentes Modales
- **PlanOperativoModal.jsx**: Modal glassmorphism con plan trading completo
  - Sesgo principal (LONG/SHORT/NO TRADE)
  - Escenarios alternativos
  - Entry/SL/TP con R:R calculado
  - Checklist pre-trade validado
- **InfoAvanzadaModal.jsx**: Modal con información técnica detallada
  - Análisis SMC completo
  - Indicadores técnicos
  - Niveles clave
  - Volumen y liquidez
- **ConfirmOrderModal.jsx**: Modal confirmación orden
  - Parámetros orden completa
  - Cálculo margen y riesgo
  - Modo orden (Limit/Market)
  - Confirmación ejecución

### Sistema de Estilos
- **Tailwind CSS**: Framework de estilos
- **Framer Motion**: Animaciones y transiciones
- **Lucide React**: Iconos modernos
- **Glassmorphism**: Efectos blur y transparencia
- **Dark Theme**: Paleta #0B0E11 (Eerie Black) premium

## ð¡ Estado y Gestión de Datos

### Estado Global (App.jsx)
- **selectedSymbol**: Símbolo seleccionado actualmente
- **analysis**: Datos de análisis técnico
- **positions**: Posiciones abiertas
- **riskConfig**: Configuración de riesgo
- **showSidebar**: Control de sidebar
- **modals**: Estado de modales abiertos

### LocalStorage
- **trader_creds**: Credenciales API encriptadas
- **favorites**: Mercados favoritos
- **riskSettings**: Configuración persistente de riesgo
- **uiPreferences**: Preferencias de interfaz

### Actualización Automática
- **visibilitychange**: Evento browser focus
- **Interval updates**: Actualizaciones periódicas
- **WebSocket**: Conexión tiempo real (futuro)

## ð¡ Actualizaciones y Limitaciones

### Limitaciones Actuales
- **Modo Paper**: No implementado (todo es LIVE)
- **Mercados**: Solo futuros perpetuos CoinEx
- **Órdenes**: Sin soporte OCO, sin trailing stop
- **Multiplataforma**: Launcher solo Windows, APK solo Android
- **Offline**: Funcionalidad limitada sin conexión
- **iOS**: No disponible (solo Android)
- **Linux/macOS**: Launcher solo Windows

### Mejoras Implementadas
- **Capacitor 7**: Actualización a última versión
- **QR Scanner**: Integración html5-qrcode para API keys
- **Android SDK 35**: Soporte para Android 14+
- **Java 22**: Compilación con JDK más reciente
- **Build Tools 35.0.0**: Herramientas de build actualizadas
- **Header UI**: Widget balance y PnL centrados en navbar
- **Backend Fixes**: Lazy loading para MarketDataClient y corrección de UnboundLocalError
- **Vercel Deploy**: Configuración completa para producción
- **CORS Production**: Configurado para dominios Vercel

### Estado Actual del Deploy
- **Frontend Vercel**: ✅ https://coinex-trader.vercel.app
- **Backend Vercel**: ✅ https://coinex-trader-backend.vercel.app
- **Windows Exe**: ✅ CoinExTrader.exe
- **Android APK**: ✅ CoinEx Trader-release.apk

### Bugs Recientes Solucionados
- **Backend Initialization**: MarketDataClient lazy loading
- **Analysis Engine**: UnboundLocalError en support/resistance
- **CORS Production**: Dominios Vercel configurados
- **Frontend Connection**: Variables de entorno corregidas

### Mejoras Planeadas
- **Paper Trading**: Modo simulación
- **Más Exchanges**: Binance, Bybit integración
- **Órdenes Avanzadas**: OCO, trailing stop, conditional
- **iOS App**: Capacitor iOS
- **Desktop App**: Electron cross-platform
- **WebSocket**: Streaming tiempo real
- **Edge Functions**: Funciones serverless (edge-function/)