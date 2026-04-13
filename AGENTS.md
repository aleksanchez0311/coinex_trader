# CoinEx Trader - Agent Configuration

## Project Context

Cryptocurrency intraday trading platform for futures with Smart Money Concepts (SMC) + EMA + RSI + ATR analysis, risk management, and real CoinEx trading. Features a premium dark mode UI with "Data-Heavy Minimalism" design philosophy and multiplatform support (Windows, Android, Web).

## Directory Structure

```
trader/
├── app/                          # Aplicacion principal
│   ├── backend/                  # FastAPI (Python)
│   │   ├── main.py               # API endpoints
│   │   ├── requirements.txt      # Python dependencies
│   │   ├── engines/              # Analysis, scoring, risk engines
│   │   │   ├── analysis.py      # SMC analysis + trading plan generator
│   │   │   ├── risk.py        # Position sizing
│   │   │   └── scoring.py     # Trade quality scoring
│   │   ├── models/
│   │   │   └── trading.py      # Pydantic models
│   │   └── utils/
│   │       └── exchange_clients.py  # Exchange clients (OKX market data, CoinEx trading)
│   └── web/                      # React + Vite
│       ├── src/
│       │   ├── main.jsx          # Entry point
│       │   ├── index.css         # Tailwind styles + theme
│       │   ├── App.css           # Global styles
│       │   ├── App.jsx          # Main app component
│       │   └── components/       # UI components
│       │       ├── ActionButtons.jsx     # Plan & Info buttons
│       │       ├── AnalysisBoard.jsx      # Analysis display
│       │       ├── Header.jsx            # Top header + logo
│       │       ├── MarketList.jsx        # Favorites list
│       │       ├── PositionsTable.jsx   # Open positions
│       │       ├── Sidebar.jsx          # Navigation (collapsible)
│       │       ├── SettingsView.jsx      # API Config
│       │       ├── StrategyView.jsx      # Strategy display
│       │       ├── RiskManagementView.jsx  # Risk management view
│       │       ├── RiskPanel.jsx       # Risk panel component
│       │       └── modals/           # Modal components
│       │           ├── PlanOperativoModal.jsx
│       │           ├── InfoAvanzadaModal.jsx
│       │           └── ConfirmOrderModal.jsx
│       ├── public/
│       ├── package.json
│       ├── tailwind.config.js     # Premium dark theme
│       ├── vite.config.js
│       ├── postcss.config.js
│       └── eslint.config.js
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
- `app/backend/main.py` - FastAPI endpoints (analyze, risk-management, execute-trade, balance, positions, close-position, pnl-stats, markets, top-gainers, ticker, tickers, market-status)
- `app/backend/engines/analysis.py` - SMC analysis engine + trading plan generator (swings, BOS/CHOCH, liquidity, FVG, OB, EMAs, RSI, ATR)
- `app/backend/engines/risk.py` - Position sizing (calculate_position, get_recommendations, get_trade_plan)
- `app/backend/engines/scoring.py` - Trade quality scoring (calculate_score 0-100)
- `app/backend/models/trading.py` - Pydantic models (AnalysisRequest, RiskRequest, TradeExecutionRequest)
- `app/backend/utils/exchange_clients.py` - Exchange API interactions (MarketDataClient: OKX, TradingClient: CoinEx)

### Frontend

#### Main Components
- `app/web/src/App.jsx` - Main app with state management, modals, sidebar control
- `app/web/src/components/MarketList.jsx` - Favorites list display
- `app/web/src/components/AnalysisBoard.jsx` - Analysis display (score, bias, checklist, trading plan)
- `app/web/src/components/ActionButtons.jsx` - Plan Operativo & Info Avanzada buttons
- `app/web/src/components/Sidebar.jsx` - Collapsible navigation (hidden by default)
- `app/web/src/components/Header.jsx` - Top header with logo, menu button, PnL
- `app/web/src/components/SettingsView.jsx` - API Config and Favorite Markets Manager
- `app/web/src/components/StrategyView.jsx` - Strategy display
- `app/web/src/components/RiskManagementView.jsx` - Risk management view
- `app/web/src/components/RiskPanel.jsx` - Risk panel component
- `app/web/src/components/PositionsTable.jsx` - Open positions

#### Modal Components
- `app/web/src/components/modals/PlanOperativoModal.jsx` - Trading plan modal (glassmorphism)
- `app/web/src/components/modals/InfoAvanzadaModal.jsx` - Advanced info modal
- `app/web/src/components/modals/ConfirmOrderModal.jsx` - Order confirmation modal

#### Styling
- `app/web/src/index.css` - Premium dark theme (Data-Heavy Minimalism)
- `app/web/src/App.css` - Global styles
- `app/web/tailwind.config.js` - Color palette: #0B0E11 background, #00C076 long, #CF304A short

### Launcher
- `release/exeify.bat` - Build executable script (Windows)
- `release/iconify.bat` - Icon generator
- `release/exeify.cs` - C# launcher code
- `release/apkify.bat` - Build APK script (Android)
- `release/requirements.txt` - Python dependencies for launcher

## Design System

### Color Palette (Dark Mode Premium)
| Element | Color |
|---------|-------|
| Background (Eerie Black) | `#0B0E11` |
| Surface (Gunmetal) | `#1E2329` |
| Long (Emerald Green) | `#00C076` |
| Short (Candy Apple Red) | `#CF304A` |
| Neutral/NO TRADE | `#848E9C` |
| Text Primary | `#EAECEF` |

### Typography
- **UI/Text**: Inter or Geist Sans
- **Prices/Data**: Roboto Mono or JetBrains Mono (prevents visual jitter)

### Components
- Glassmorphism: `backdrop-filter: blur(12px)` on modals
- Shadows: `0 8px 32px rgba(0,0,0,0.5)`
- Border radius: 8px (buttons), 12px (cards), 16px (modals)

## Commands

```bash
# Backend
cd app/backend && python main.py

# Frontend
cd app/web && npm run dev

# Build executable (Windows)
cd release && exeify.bat

# Build APK (Android)
cd release && apkify.bat
```

## Configuration

- Credentials stored in localStorage (`trader_creds`) with priority over .env
- All operations are LIVE (no paper trading mode)
- Auto-updates on window focus (visibilitychange)
- Sidebar hidden by default, toggled via Header menu button

## Trading Plan Features

The app generates complete trading plans including:
- **Sesgo Principal**: LONG / SHORT / NO TRADE
- **Escenarios Alternativos**: Both directions available for trading
- **Entry/SL/TP**: Calculated based on ATR and structure
- **R:R**: Risk:Reward ratio (minimum 1.5)
- **Pre-Trade Checks**: 6-point checklist (EMA trend, BOS structure, liquidity, OB/FVG, RSI zone, volume)

## Testing

```bash
# Backend tests (if any)
cd app/backend && pytest

# Frontend lint
cd app/web && npm run lint
```

## Known Issues

- None currently