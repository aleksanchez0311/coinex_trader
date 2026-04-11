# CoinEx Trader - Especificaciones Técnicas

## 📋 Overview

Plataforma fullstack para análisis y ejecución de trading intradía en criptomonedas (futuros), basada en Smart Money Concepts (SMC).

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
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────┼──────────────────────────────┐ │
│  │                    Engines                              │ │
│  │  ┌───────────┐ ┌────────┐ ┌─────────┐ ┌─────────────┐   │ │
│  │  │Analysis   │ │Scoring │ │Risk     │ │CoinExClient│   │ │
│  │  │Engine    │ │Engine  │ │Engine   │ │(CCXT)      │   │ │
│  │  └───────────┘ └────────┘ └─────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Integraciones

### CoinEx (CCXT)
- **Symbol Format**: `BTC/USDT:USDT`
- **Order Types**: Limit, Market
- **Margin Mode**: Isolated (default), Cross
- **Leverage**: 1-125x
- **Endpoint**: `fetch_positions()`, `create_order()`, `fetch_my_trades()`

### OKX (Market Data)
- **Datos de Mercado**: OHLCV, tickers, mercados disponibles
- **Verificación**: Cross-check de mercados con CoinEx
- **Timeframe**: 1h (200 velas)

### Datos de Mercado
- OHLCV: 200 velas timeframe 1h
- Ticker: Precio actual + cambio 24h

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
  "confluences": [str]
}
```

### Riesgo (RiskEngine)
```python
{
  "position": {
    "position_size": float,
    "notional_value": float,
    "margin_required": float,
    "risk_amount": float
  },
  "plan": {
    "tp1": float,  # 1.5R
    "tp2": float,  # 2.5R
    "tp3": float   # 4R
  }
}
```

## 🎯 Flujo de Operación

1. **Selección de símbolo** → MarketList
2. **Análisis automático** → AnálisisEngine → AnalysisBoard
3. **Configurar riesgo** → Capital, Riesgo%, Apalancamiento
4. **Calcular posición** → RiskEngine
5. **Confirmar orden** → Modal con entry, SL, TP, margin mode
6. **Ejecutar** → CoinExClient.create_order_with_sl_tp()

## 🔒 Seguridad

- API Keys almacenadas en localStorage del navegador
- Fallback a variables de entorno (.env)
- Nunca exponer secretos en frontend
- Validación de inputs con Pydantic

## 📦 Dependencias

### Backend
- fastapi
- uvicorn
- pandas
- numpy
- ccxt
- pydantic
- python-dotenv
- scipy
- cairosvg
- pillow

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

### Launcher (Windows)
- exeify.bat (build script)
- iconify.bat (icon generator)
- exeify.cs (C# source)
- .NET Framework 4.x (build runtime)

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

## 🔄 Actualizaciones

Todas las actualizaciones de datos se ejecutan cuando la app gana foco (visibilitychange event):
- PnL stats
- Análisis de mercado
- Precios de favoritos
- Posiciones abiertas
- Balance

## ⚠️ Limitaciones

- Modo Paper no implementado (todo es LIVE)
- Solo futuros perpetuos CoinEx
- Sin soporte para órdenes OCO
- Sin trailing stop
- Solo Windows (.exe launcher)