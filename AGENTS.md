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
│   └── frontend/                 # React + Vite
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
│       │   └── index.html       # HTML template
│       ├── android/             # Proyecto Android (Capacitor)
│       ├── capacitor.config.json # Config Capacitor
│       ├── package.json
│       ├── tailwind.config.js     # Premium dark theme
│       ├── vite.config.js
│       ├── postcss.config.js
│       └── eslint.config.js
├── release/                      # Builds multiplataforma
│   ├── exeify.bat              # Build script Windows
│   ├── iconify.bat             # Icon generator
│   ├── exeify.cs               # Launcher C# source
│   ├── apkify.bat              # Build APK script Android
│   ├── add_camera.ps1          # Camera permissions script
│   ├── requirements.txt        # Python dependencies launcher
│   ├── CoinEx Trader-release.apk # APK Android firmado
│   └── edge-function/          # Edge functions (futuro)
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
- `app/frontend/src/App.jsx` - Main app with state management, modals, sidebar control
- `app/frontend/src/components/MarketList.jsx` - Favorites list display
- `app/frontend/src/components/AnalysisBoard.jsx` - Analysis display (score, bias, checklist, trading plan)
- `app/frontend/src/components/ActionButtons.jsx` - Plan Operativo & Info Avanzada buttons
- `app/frontend/src/components/Sidebar.jsx` - Collapsible navigation (hidden by default)
- `app/frontend/src/components/Header.jsx` - Top header with logo, menu button, PnL
- `app/frontend/src/components/SettingsView.jsx` - API Config and Favorite Markets Manager
- `app/frontend/src/components/StrategyView.jsx` - Strategy display
- `app/frontend/src/components/RiskManagementView.jsx` - Risk management view
- `app/frontend/src/components/RiskPanel.jsx` - Risk panel component
- `app/frontend/src/components/PositionsTable.jsx` - Open positions

#### Modal Components
- `app/frontend/src/components/modals/PlanOperativoModal.jsx` - Trading plan modal (glassmorphism)
- `app/frontend/src/components/modals/InfoAvanzadaModal.jsx` - Advanced info modal
- `app/frontend/src/components/modals/ConfirmOrderModal.jsx` - Order confirmation modal

#### Styling
- `app/frontend/src/index.css` - Premium dark theme (Data-Heavy Minimalism)
- `app/frontend/src/App.css` - Global styles
- `app/frontend/tailwind.config.js` - Color palette: #0B0E11 background, #00C076 long, #CF304A short

### Launcher Windows
- `release/exeify.bat` - Build executable script (Windows)
- `release/iconify.bat` - Icon generator
- `release/exeify.cs` - C# launcher code
- `release/requirements.txt` - Python dependencies for launcher

### APK Build Android
- `release/apkify.bat` - Build APK script Android
- `release/add_camera.ps1` - Camera permissions script
- Java 22+ compilation
- Android SDK 35+ target
- Capacitor 7 framework
- Gradle 8.10.2+ build system

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
cd app/frontend && npm run dev

# Build executable (Windows)
cd release && exeify.bat

# Build APK (Android)
cd release && apkify.bat --default

# Sign APK existente
cd release && apkify.bat --sign-only
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
cd app/frontend && npm run lint
```

## Dependencies

### Backend (requirements.txt)
- fastapi, uvicorn, pandas, numpy, ccxt, pydantic
- python-dotenv, scipy, aiodns, aiohttp, yarl, requests

### Frontend (package.json)
- React 19.2.4, Vite 8.0.4, TailwindCSS 4.2.2
- Capacitor 7.0.0 (android, cli, core, ios)
- html5-qrcode 2.3.8, lightweight-charts 5.1.0
- framer-motion 12.38.0, lucide-react 1.8.0
- axios, clsx, tailwind-merge, autoprefixer, postcss

### Build Tools
- Java 22+ (Android compilation)
- Android SDK 35+ (target)
- Gradle 8.10.2+ (build system)
- .NET Framework 4.x (Windows launcher)

## Recent Updates

- **Capacitor 7**: Updated to latest version
- **QR Scanner**: html5-qrcode integration for API keys
- **Android SDK 35**: Support for Android 14+
- **Java 22**: Latest JDK compilation
- **Build Tools 35.0.0**: Updated Android build tools
- **Multiple APKs**: Release and aligned APKs generated

## Known Issues

- Paper trading mode not implemented (LIVE only)
- Windows launcher only (no Linux/macOS support)
- iOS app not available (Android only)
- No OCO or trailing stop orders
- CORS allowed for any origin (development only)
- Limited offline functionality