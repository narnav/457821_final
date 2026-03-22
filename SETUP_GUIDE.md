# AI Trading Tutor - Full Stack Application

## 🎯 Overview

This is a full-stack educational stock market analysis platform that transforms your Python trading analysis scripts into an interactive web application.

**Tech Stack:**
- **Backend:** FastAPI (Python)
- **Frontend:** React
- **Charts:** Recharts
- **Data:** yfinance, pandas, scikit-learn

## 📁 Project Structure

```
ai-trading-tutor/
├── backend/
│   ├── main.py                    # FastAPI application
│   ├── dataset_builder.py         # Your original script
│   ├── train_trend_model.py       # Your original script
│   ├── backtest_strategy.py       # Your original script
│   ├── ai_explainer.py            # Your original script
│   ├── feature_importance.py      # Your original script
│   └── requirements.txt           # Python dependencies
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── EquityCurveChart.js
    │   │   ├── MetricsCard.js
    │   │   ├── TradesList.js
    │   │   ├── FeatureComparison.js
    │   │   └── FeatureImportance.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server:**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`
   
   You can view the auto-generated API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory (in a new terminal):**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```
   
   The app will open automatically at `http://localhost:3000`

## 🎨 Features

### 1. Overview Tab
- **Performance Metrics:** Total return, max drawdown, Sharpe ratio
- **Equity Curve Chart:** Visual comparison of ML strategy vs Buy & Hold
- **Trade Summary:** Win rate, number of trades, winning/losing breakdown

### 2. Trades Analysis Tab
- **Complete Trade History:** All trades with entry/exit dates, prices, and P&L
- **AI Explanations:** Click "Explain" on any trade to get detailed analysis
- **Trade Insights:** Understanding why trades won or lost

### 3. Feature Insights Tab
- **Feature Comparison:** Visual comparison of features in winning vs losing trades
- **Feature Importance:** See which features have the most impact on predictions
- **Coefficient Analysis:** Understand positive vs negative correlations

### 4. Learning Tab
- **Max Drawdown Explanation:** AI-generated explanation of the worst drawdown period
- **Key Lessons:** Educational content about trading probabilities
- **Strategy Logic:** How the backtesting strategy works
- **Project Philosophy:** Understanding the educational purpose

## 🔧 API Endpoints

The FastAPI backend exposes the following endpoints:

- `GET /` - API information
- `GET /api/backtest` - Run full backtest and get results
- `GET /api/trades/{trade_index}/explain` - Get AI explanation for specific trade
- `GET /api/trades/compare` - Compare winning vs losing trades
- `GET /api/feature-importance` - Get feature importance from model
- `GET /api/dataset/preview` - Preview the dataset

## 🎯 How It Works

### Data Flow

1. **User opens the app** → React frontend loads
2. **Frontend requests backtest** → Calls `/api/backtest`
3. **Backend runs analysis:**
   - Downloads SPY and QQQ data via yfinance
   - Builds dataset with technical features
   - Trains logistic regression model
   - Runs backtest simulation
   - Generates AI explanations
4. **Backend returns JSON** → All charts, metrics, and trades
5. **Frontend displays results** → Interactive charts and tables

### Key Modifications from Original Scripts

The original Python scripts have been wrapped in a FastAPI application that:

- **Returns JSON** instead of printing to console
- **Converts pandas DataFrames** to JSON-serializable formats
- **Handles timestamps** properly for JavaScript
- **Provides REST endpoints** for each analysis component
- **Caches results** to avoid re-running expensive computations

## 📊 Understanding the Results

### Metrics Explained

- **Total Return:** Overall profit/loss percentage from start to end
- **Max Drawdown:** Largest peak-to-trough decline (measures risk)
- **Sharpe Ratio:** Risk-adjusted returns (higher is better, >1 is good)
- **Win Rate:** Percentage of profitable trades

### Strategy Parameters (in backtest_strategy.py)

- `INITIAL_CAPITAL = 10_000` - Starting portfolio value
- `THRESHOLD = 0.65` - Minimum bullish probability to enter trade
- `HOLD_DAYS = 5` - How long to hold each position
- `NORMAL_POSITION_SIZE = 1.0` - Full position size
- `COOLDOWN_POSITION_SIZE = 0.3` - Reduced size after 3 losses

## 🛠️ Customization

### Modify Strategy Parameters

Edit `backend/backtest_strategy.py` to change:
- Entry threshold
- Holding period
- Position sizing
- Volatility filters

### Change Stock Symbol

Edit `backend/dataset_builder.py` and `train_trend_model.py`:
```python
# Change from SPY to any other ticker
dataset = build_dataset("AAPL")  # Example: Apple stock
```

### Adjust Training Period

In `train_trend_model.py`:
```python
# Change the train/test split date
train_df = df[df.index < "2020-01-01"]  # Training data
test_df = df[df.index >= "2020-01-01"]   # Test data
```

## 🔍 Development Tips

### Backend Development

- FastAPI provides automatic interactive API docs at `/docs`
- Use `uvicorn main:app --reload` for hot-reloading during development
- Check terminal for detailed error messages

### Frontend Development

- React dev server auto-reloads on file changes
- Open browser console (F12) for debugging
- Check Network tab to see API calls and responses

### Common Issues

**CORS Errors:**
- Make sure backend is running on port 8000
- Check that CORS middleware is configured correctly in `main.py`

**Data Loading Issues:**
- yfinance sometimes has rate limits or temporary outages
- The first run downloads data and may take 30-60 seconds
- Check your internet connection

**Module Import Errors:**
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Activate your virtual environment if using one

## 📈 Next Steps

### Suggested Enhancements

1. **Add More Strategies:**
   - Create multiple strategy variants
   - Compare them side-by-side

2. **Parameter Optimization:**
   - Add UI controls to adjust parameters
   - Real-time strategy testing

3. **More Visualizations:**
   - Drawdown chart
   - Trade distribution histogram
   - Feature correlation heatmap

4. **User Accounts:**
   - Save custom strategies
   - Track learning progress
   - Share strategies with others

5. **Paper Trading:**
   - Live data integration
   - Simulated trading mode
   - Performance tracking over time

## ⚠️ Important Disclaimers

**This is an EDUCATIONAL platform:**
- NOT financial advice
- NOT a trading bot
- NOT guaranteed to make money
- NEVER use with real money without proper understanding

**The goal is to UNDERSTAND markets, not beat them.**

## 📝 License

Educational use only. See your original project license.

## 🤝 Support

For issues or questions:
1. Check the browser console for errors
2. Check the backend terminal for error messages
3. Review the FastAPI docs at `http://localhost:8000/docs`
4. Ensure all dependencies are properly installed

---

**Built with ❤️ for learning and understanding financial markets**
