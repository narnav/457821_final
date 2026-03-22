# AI Trading Tutor

> An educational platform that uses machine learning to teach stock market concepts through interactive backtesting, AI-generated trade explanations, and scroll-animated tutorials.

![Python](https://img.shields.io/badge/python-3.8+-blue)
![React](https://img.shields.io/badge/react-18.2-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055)

---

## What is This?

AI Trading Tutor is a full-stack web application that trains a **Logistic Regression model** on 9 technical indicators, runs backtests across 3 risk-profile strategies, and presents everything through a polished React dashboard. The goal isn't to beat the market — it's to **understand how ML-based trading systems work**, what features drive predictions, and why most active strategies underperform buy-and-hold.

**At a glance:**

- **Interactive Dashboard** — Equity curve charts, performance metrics, strategy comparison
- **3 Strategy Modes** — Conservative, Aggressive, and Ultra with different risk parameters
- **6 Stocks** — SPY, QQQ, TSLA, NVDA, AMD, AAPL with custom SVG icons
- **AI Trade Explanations** — Click any trade to understand why it won or lost
- **Feature Analysis** — See which indicators matter most and how they differ between winning and losing trades
- **Scroll-Animated Tutorial** — A 7-section visual walkthrough teaching ML and trading concepts with framer-motion animations
- **Buy & Hold Comparison** — Always compare your strategy against the simplest approach

---

## Features

### Interactive Dashboard

The **Overview** tab is your command center. It displays:

- A live **equity curve chart** (built with Recharts) plotting your ML strategy's returns against a Buy & Hold baseline over time
- **Performance metrics cards** showing total return, max drawdown, Sharpe ratio, win rate, and more — with colored headers (blue for strategy, green for baseline) so you can compare at a glance
- A **Buy & Hold toggle** to show or hide the benchmark line on the chart

### Stock Selector

A custom dropdown (not a native `<select>`) lets you switch between 6 stocks, each with its own **hand-drawn SVG icon**:

| Symbol | Name | Icon |
|--------|------|------|
| SPY | S&P 500 ETF | Bar chart |
| QQQ | Nasdaq 100 ETF | Circuit board |
| TSLA | Tesla | Lightning bolt |
| NVDA | NVIDIA | GPU chip |
| AMD | AMD | Diamond chip |
| AAPL | Apple | Apple |

Selecting a new stock triggers a fresh backtest with live data from Yahoo Finance.

### Strategy Selector

Three strategy modes with different risk/reward profiles:

| Strategy | Threshold | Hold Period | Vol. Limit | Cooldown |
|----------|-----------|-------------|------------|----------|
| **Conservative** | 65% | 5 days | 0.45 | 3 losses |
| **Aggressive** | 52% | 7 days | 0.65 | 3 losses |
| **Ultra** | 48% | 15 days | None | 3 losses |

Each mode changes how selective the model is about entering trades, how long it holds, and how much volatility it tolerates.

### Trade Analysis

The **Trades** tab gives you a trade-by-trade breakdown:

- A styled table with **green/red row backgrounds** showing profitable vs losing trades
- Columns: entry date, exit date, entry price, exit price, return %, P&L
- Click the **"Explain"** button on any trade to get an AI-generated explanation that covers:
  - Market conditions at entry
  - Which features were favorable or unfavorable
  - Risk factors and what could have been different
- The explanation card appears **above** the trade list for easy reading

### Feature Insights

The **Features** tab helps you understand the model:

- **Feature Importance** — A horizontal bar chart showing model coefficients, plus a styled table with green (positive) and red (negative) coefficient values, and an interpretation card explaining what the model learned
- **Feature Comparison** — Side-by-side comparison of average feature values in winning vs losing trades, with insights about which conditions favor profitable outcomes

### Scroll-Animated Tutorial

Click the **"Tutorial"** button next to the header title to launch a full-screen, 7-section educational walkthrough:

1. **Hero** — Animated candlestick chart SVG with a gradient title
2. **The 9 Features** — A 3x3 grid of feature cards that stagger in as you scroll
3. **The Model Pipeline** — Visual flow: Features -> Scaler -> Logistic Regression -> Probability
4. **Three Strategies** — Side-by-side comparison cards with icons and parameters
5. **Anatomy of a Trade** — Vertical timeline walking through signal, entry, hold, and exit
6. **Risk Management** — Cooldown mechanism and volatility filter visualizations
7. **The Big Lesson** — "Time in the market beats timing the market" with an animated bar comparison

Built with **framer-motion** for smooth scroll-triggered animations, spring physics, and staggered reveals. Includes a **scroll progress bar** at the top and a **"Skip Tutorial"** button always visible at the bottom-right.

### Learning Module

The **Education** tab provides static educational content covering:

- How logistic regression works for binary classification
- What each technical feature measures
- Strategy logic and parameter trade-offs
- Maximum drawdown and risk management concepts
- Why probabilistic thinking matters in trading

---

## Architecture

```
Browser (localhost:3000)
│
│  HTTP / JSON (Axios)
│
├── React Frontend (TypeScript + Tailwind CSS)
│   ├── App.tsx ─────────────── State management, routing
│   ├── Header.tsx ──────────── Title, tutorial button
│   ├── TabNavigation.tsx ───── Overview | Trades | Features | Education
│   ├── StockSelector.tsx ───── Custom dropdown with SVG icons
│   ├── StrategySelector.tsx ── Conservative / Aggressive / Ultra buttons
│   │
│   ├── Overview Tab
│   │   ├── OverviewTab.tsx
│   │   ├── EquityCurveChart.tsx (Recharts)
│   │   └── MetricsCard.tsx
│   │
│   ├── Trades Tab
│   │   ├── TradesTab.tsx
│   │   └── TradesList.tsx
│   │
│   ├── Features Tab
│   │   ├── FeaturesTab.tsx
│   │   ├── FeatureImportance.tsx
│   │   └── FeatureComparison.tsx
│   │
│   ├── Education Tab
│   │   └── EducationTab.tsx
│   │
│   ├── Tutorial.tsx ────────── 7-section scroll-animated overlay (framer-motion)
│   ├── Footer.tsx
│   ├── Icons.tsx ───────────── 13 reusable SVG icon components
│   └── StockIcons.tsx ──────── 6 custom stock SVG icons
│
│  REST API
│
├── FastAPI Backend (localhost:8000)
│   ├── main.py ─────────────── API endpoints, CORS, server
│   ├── dataset_builder.py ──── Downloads data from yfinance, engineers 9 features
│   ├── train_trend_model.py ── Trains Logistic Regression + StandardScaler pipeline
│   ├── backtest_strategy.py ── Runs backtests with 3 strategy configurations
│   ├── ai_explainer.py ─────── Generates rule-based trade explanations
│   └── feature_importance.py ─ Extracts model coefficients and feature analysis
│
│  Downloads Data
│
└── Yahoo Finance API (via yfinance)
```

---

## Tech Stack

### Backend
| Library | Purpose |
|---------|---------|
| **FastAPI** | Async Python web framework with auto-generated docs |
| **uvicorn** | ASGI server |
| **Pandas** | Data manipulation and feature engineering |
| **NumPy** | Numerical computations |
| **scikit-learn** | Logistic Regression model + StandardScaler |
| **yfinance** | Stock market data from Yahoo Finance |
| **ta** | Technical analysis indicators (RSI, ATR) |

### Frontend
| Library | Purpose |
|---------|---------|
| **React 18** | Component-based UI |
| **TypeScript** | Static typing for all components and API types |
| **Tailwind CSS 3.4** | Utility-first styling with custom animations |
| **Recharts** | Interactive SVG charts (equity curves, bar charts) |
| **framer-motion** | Scroll-triggered animations for the Tutorial component |
| **Axios** | HTTP client for API calls |

---

## Quick Start

### Prerequisites

- **Python 3.8+** — [Download](https://www.python.org/downloads/)
- **Node.js 16+** — [Download](https://nodejs.org/)

### Option 1: Automatic Startup

**macOS / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

This will check prerequisites, install dependencies, and start both servers.

### Option 2: Manual Startup

**Terminal 1 — Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend-ts
npm install
npm start
```

### Access the Application

| URL | What |
|-----|------|
| http://localhost:3000 | React Dashboard |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | Interactive API Documentation (Swagger) |

> **Note:** The first run downloads several years of stock data from Yahoo Finance. This is normal and may take 30-60 seconds. Subsequent runs are faster.

---

## The ML Model

### 9 Input Features

The model is trained on 9 technical indicators computed from daily price data:

| Feature | Name | What It Measures |
|---------|------|------------------|
| `return_5d` | 5-Day Momentum | Short-term price direction |
| `return_20d` | 20-Day Trend | Medium-term momentum |
| `ma_ratio` | MA Ratio | Current price vs 20-day moving average |
| `trend_slope_20d` | Trend Acceleration | How fast the trend is changing |
| `rsi` | RSI (14) | Overbought/oversold gauge (0-100) |
| `atr` | True Range | Daily volatility measure |
| `volatility_20d` | 20-Day Volatility | Rolling standard deviation of returns |
| `regime_stress` | Stress Detector | Binary flag for high-volatility periods |
| `relative_strength_spy` | Relative Strength | Performance vs SPY benchmark |

### Model Pipeline

```
Raw Price Data
  -> Feature Engineering (9 indicators)
    -> StandardScaler (normalize to zero mean, unit variance)
      -> Logistic Regression (binary: up or down)
        -> Probability Score (0-100%)
          -> Trading Signal (if probability > threshold)
```

### Training / Testing Split

- **Training data:** All data before January 1, 2020
- **Testing data:** All data after January 1, 2020
- The backtest runs on the **test set only** — the model never sees future data

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/backtest?strategy=conservative&symbol=SPY` | Run a full backtest. Returns equity curve, metrics, trades, feature comparison |
| `GET` | `/api/trades/{index}/explain` | Get AI-generated explanation for a specific trade |
| `GET` | `/api/trades/compare` | Compare average features in winning vs losing trades |
| `GET` | `/api/feature-importance` | Get model coefficients and feature rankings |
| `GET` | `/api/dataset/preview?rows=10` | Preview the raw dataset |

**Strategy options:** `conservative`, `aggressive`, `ultra`
**Symbol options:** `SPY`, `QQQ`, `TSLA`, `NVDA`, `AMD`, `AAPL`

---

## Project Structure

```
ai-trading-tutor-app/
├── backend/
│   ├── main.py                  # FastAPI server & endpoints
│   ├── dataset_builder.py       # Feature engineering from yfinance data
│   ├── train_trend_model.py     # Logistic Regression training pipeline
│   ├── backtest_strategy.py     # Backtesting engine (3 strategies)
│   ├── ai_explainer.py          # Rule-based trade explanations
│   ├── feature_importance.py    # Model coefficient analysis
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Python virtual environment
│
├── frontend-ts/
│   ├── package.json             # Node dependencies & scripts
│   ├── tailwind.config.js       # Tailwind + custom animations
│   ├── tsconfig.json            # TypeScript configuration
│   └── src/
│       ├── App.tsx              # Root component, state management
│       ├── types/
│       │   └── api.ts           # TypeScript interfaces for all API types
│       ├── constants/
│       │   └── index.ts         # API URL, stock options, strategy params
│       └── components/
│           ├── Header.tsx           # App title + Tutorial button
│           ├── Footer.tsx           # Refresh button + disclaimer
│           ├── TabNavigation.tsx    # 4-tab navigation bar
│           ├── StockSelector.tsx    # Custom dropdown with stock icons
│           ├── StrategySelector.tsx # Strategy toggle buttons
│           ├── OverviewTab.tsx      # Equity chart + metrics layout
│           ├── EquityCurveChart.tsx # Recharts line chart
│           ├── MetricsCard.tsx      # Performance metrics display
│           ├── TradesTab.tsx        # Trade table + explanation layout
│           ├── TradesList.tsx       # Styled trade rows with explain buttons
│           ├── FeaturesTab.tsx      # Feature analysis layout
│           ├── FeatureImportance.tsx # Coefficient chart + table
│           ├── FeatureComparison.tsx # Win/loss feature comparison
│           ├── EducationTab.tsx     # Static educational content
│           ├── Tutorial.tsx         # Scroll-animated 7-section tutorial
│           ├── Icons.tsx            # 13 reusable SVG icons
│           └── StockIcons.tsx       # 6 custom stock SVG icons
│
├── start.sh                     # Auto-start script (macOS/Linux)
├── start.bat                    # Auto-start script (Windows)
├── QUICKSTART.md                # Quick setup reference
└── SETUP_GUIDE.md               # Detailed setup & troubleshooting
```

---

## Troubleshooting

### Backend won't start
- Check Python version: `python3 --version` (need 3.8+)
- Make sure you activated the virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- If you see import errors with Python 3.13, try `pip install -r requirements-py313.txt`

### Frontend won't start
- Check Node version: `node --version` (need 16+)
- Make sure you're in the `frontend-ts/` directory (not `frontend/`)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Connection error in the browser
- Make sure the backend is running on port 8000 before starting the frontend
- Check CORS settings in `backend/main.py` if using a different port
- Clear browser cache and hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`)

### Slow initial load
- The first run for each stock downloads several years of price data from Yahoo Finance
- Model training and backtesting happens on each request (typically 30-60 seconds)
- Subsequent requests for the same stock/strategy combination are faster

### Tutorial not animating
- Make sure `framer-motion` is installed: check `node_modules/framer-motion`
- Try a hard refresh — animation state is tracked per-session

---

## Disclaimer

**EDUCATIONAL USE ONLY**

This platform is designed to teach market behavior and trading concepts. It is:
- NOT financial advice
- NOT a guaranteed profit system
- NOT intended for real money trading

> "The goal is not to beat the market — the goal is to understand it."

---

## License

Educational project. Please maintain the educational-only usage.
