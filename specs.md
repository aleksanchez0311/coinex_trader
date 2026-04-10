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
- nunca exponer secretos en frontend
- Validación de inputs con Pydantic

## 📦 Dependencias

### Backend
- fastapi
- uvicorn
- pandas
- numpy
- ccxt
- pydantic

### Frontend
- react
- vite
- tailwindcss
- framer-motion
- lucide-react

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