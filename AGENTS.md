# CoinEx Trader - Agent Configuration

## Project Context

Cryptocurrency intraday trading platform for futures with SMC + EMA + RSI + ATR analysis, risk management, and real CoinEx trading.

## Directory Structure

```
trader/
├── app/                          # Aplicacion principal
│   ├── backend/                  # FastAPI (Python)
│   │   ├── main.py               # API endpoints
│   │   ├── engines/              # Analysis, scoring, risk engines
│   │   ├── models/              # Pydantic models
│   │   └── utils/               # CoinEx client
│   └── web/                      # React + Vite
│       ├── src/
│       │   ├── App.jsx          # Main app component
│       │   └── components/      # UI components
│       └── package.json
├── release/                      # Windows executable
│   ├── exeify.bat              # Build script
│   ├── iconify.bat             # Icon generator
│   └── exeify.cs               # Launcher source
├── CoinExTrader.exe             # Compiled executable
├── favicon.ico                  # Application icon
├── .env.example                 # Environment template
├── README.md                    # Documentation
├── specs.md                     # Technical specs
└── .gitignore                   # Git ignore
```

## Key Files

### Backend
- `app/backend/main.py` - FastAPI endpoints
- `app/backend/engines/analysis.py` - SMC analysis engine
- `app/backend/engines/risk.py` - Position sizing
- `app/backend/engines/scoring.py` - Trade quality scoring
- `app/backend/utils/exchange_clients.py` - Exchange API interactions (CoinEx, OKX)

### Frontend
- `app/web/src/App.jsx` - Main app with state management
- `app/web/src/components/MarketList.jsx` - Favorites list display
- `app/web/src/components/AnalysisBoard.jsx` - Analysis display
- `app/web/src/components/PositionsTable.jsx` - Open positions
- `app/web/src/components/Sidebar.jsx` - Navigation and Global Risk Form
- `app/web/src/components/Header.jsx` - Top header
- `app/web/src/components/SettingsView.jsx` - API Config and Favorite Markets Manager
- `app/web/src/components/StrategyView.jsx` - Strategy display
- `app/web/src/components/RiskManagementView.jsx` - Risk management view


### Launcher
- `release/exeify.bat` - Build executable script
- `release/iconify.bat` - Icon generator
- `release/exeify.cs` - C# launcher code

## Commands

```bash
# Backend
cd app/backend && python main.py

# Frontend
cd app/web && npm run dev

# Build executable (Windows)
cd release && exeify.bat

# Launcher completo (instala todo y ejecuta)
release\exeify.bat
```

## Configuration

- Credentials stored in localStorage (`trader_creds`) with priority over .env
- All operations are LIVE (no paper trading mode)
- Auto-updates on window focus (visibilitychange)

## Testing

```bash
# Backend tests (if any)
cd app/backend && pytest

# Frontend lint
cd app/web && npm run lint
```

## Known Issues

- RiskPanel component has unused isLive references
- LSP type errors in coinex_client.py (non-blocking)