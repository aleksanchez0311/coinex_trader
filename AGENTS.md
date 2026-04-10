# CoinEx Trader - Agent Configuration

## Project Context

Cryptocurrency intraday trading platform for futures with SMC + EMA + RSI + ATR analysis, risk management, and real CoinEx trading.

## Directory Structure

```
trader/
├── backend/                    # FastAPI (Python)
│   ├── main.py                 # API endpoints
│   ├── engines/               # Analysis, scoring, risk engines
│   ├── utils/                 # CoinEx client
│   └── .env                   # API credentials
├── web/                       # React + Vite
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   └── components/        # UI components
│   └── .env                   # Vite config
├── README.md                  # Documentation
├── specs.md                   # Technical specs
└── .gitignore                # Git ignore
```

## Key Files

### Backend
- `backend/main.py` - FastAPI endpoints
- `backend/engines/analysis.py` - SMC analysis engine
- `backend/engines/risk.py` - Position sizing
- `backend/engines/scoring.py` - Trade quality scoring
- `backend/utils/coinex_client.py` - CoinEx API integration

### Frontend
- `web/src/App.jsx` - Main app with state management
- `web/src/components/MarketList.jsx` - Favorites, risk form, open trade
- `web/src/components/AnalysisBoard.jsx` - Analysis display
- `web/src/components/PositionsTable.jsx` - Open positions
- `web/src/components/Sidebar.jsx` - Navigation

## Commands

```bash
# Backend
cd backend && python main.py

# Frontend
cd web && npm run dev
```

## Configuration

- Credentials stored in localStorage (`trader_creds`) with priority over .env
- All operations are LIVE (no paper trading mode)
- Auto-updates on window focus (visibilitychange)

## Testing

```bash
# Backend tests (if any)
cd backend && pytest

# Frontend lint
cd web && npm run lint
```

## Known Issues

- RiskPanel component has unused isLive references
- LSP type errors in coinex_client.py (non-blocking)