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
- CORS permitido para cualquier origen (desarrollo)

## 🧠 Metodología de Análisis

### SMC (Smart Money Concepts)
- **Swings**: Detección de HH, HL, LH, LL
- **BOS/CHOCH**: Break of Structure, Change of Character
- **Liquidez**: Equal highs, equal lows, stop clusters
- **FVG**: Fair Value Gaps (brechas de valor razonable)
- **OB**: Order Blocks (bloques de órdenes institucionales)

### Indicadores Técnicos
- **EMA 20/50/200**: Dirección de tendencia (EMA stack)
- **RSI (14)**: Timing de entrada (zona 40-60)
- **ATR (14)**: Stop Loss basado en volatilidad (1.5x ATR)

### Pre-Trade Checklist (6 puntos)
1. ✓ Tendencia EMA alineada (EMA20 > EMA50 > EMA200 para LONG)
2. ✓ Estructura BOS confirmada
3. ✓ Zonas de liquidez identificadas
4. ✓ OB/FVG válido detectado
5. ✓ RSI en zona correcta (40-60)
6. ✓ Volumen confirmado

**Si pasan < 5 → NO OPERAR**

### Scoring
- **ALTA PROBABILIDAD**: score ≥ 70 AND checks ≥ 5
- **MEDIA PROBABILIDAD**: score ≥ 50 AND checks ≥ 4
- **BAJA PROBABILIDAD**: score < 50