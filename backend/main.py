from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
from datetime import datetime
import json

# Import your existing modules
import sys
sys.path.append('..')
from dataset_builder import build_dataset, load_market_data
from train_trend_model import train_trend_model, FEATURE_COLUMNS
from backtest_strategy import (
    backtest_strategy,
    calculate_total_return,
    calculate_max_drawdown,
    calculate_sharpe_ratio,
    split_trades,
    average_features,
    find_max_drawdown_period,
    trades_during_period
)
from ai_explainer import explain_trade, explain_trade_comparison, explain_max_drawdown

app = FastAPI(title="AI Trading Tutor API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache for model and results
_cached_model = None
_cached_backtest_results = None
_price_cache = {}  # Cache for price data keyed by symbol


class BacktestResponse(BaseModel):
    equity_curve: List[Dict[str, Any]]
    metrics: Dict[str, float]
    trades: List[Dict[str, Any]]
    winning_trades: int
    losing_trades: int
    feature_comparison: Dict[str, Dict[str, float]]
    max_drawdown_explanation: str
    buy_hold_metrics: Dict[str, float]
    strategy_type: str


class TradeExplanation(BaseModel):
    trade: Dict[str, Any]
    explanation: str


class FeatureImportanceResponse(BaseModel):
    features: List[Dict[str, float]]


def serialize_timestamp(ts):
    """Convert pandas Timestamp to ISO string"""
    if pd.isna(ts):
        return None
    return ts.isoformat()


def prepare_trade_for_json(trade):
    """Convert trade dictionary to JSON-serializable format"""
    return {
        "entry_date": serialize_timestamp(trade["entry_date"]),
        "exit_date": serialize_timestamp(trade["exit_date"]),
        "entry_price": float(trade["entry_price"]),
        "exit_price": float(trade["exit_price"]),
        "pnl": float(trade["pnl"]),
        "bullish_prob": float(trade["bullish_prob"]),
        "features": {k: float(v) for k, v in trade["features"].items()}
    }


@app.get("/")
def read_root():
    return {
        "message": "AI Trading Tutor API",
        "version": "1.0.0",
        "disclaimer": "This is for educational purposes only. Not financial advice."
    }


@app.get("/api/backtest")
def get_backtest_results(strategy: str = "conservative", symbol: str = "SPY"):
    """Run backtest and return all results as JSON"""
    
    # DEBUG PRINTS
    print("\n" + "="*60)
    print(f"🔍 API ENDPOINT CALLED")
    print(f"📊 Symbol: {symbol}")
    print(f"📊 Strategy: {strategy}")
    print("="*60 + "\n")
    
    try:
        # Run backtest with specified strategy and symbol
        print(f"🚀 Calling backtest_strategy(strategy_type='{strategy}', symbol='{symbol}')")
        results, trades = backtest_strategy(strategy_type=strategy, symbol=symbol)
        equity = results["equity"]
        
        print(f"\n✅ Backtest completed!")
        print(f"   - Number of trades: {len(trades)}")
        print(f"   - Final equity: ${equity.iloc[-1]:.2f}\n")
        
        # Calculate metrics
        total_return = calculate_total_return(equity)
        max_drawdown = calculate_max_drawdown(equity)
        sharpe = calculate_sharpe_ratio(equity)
        
        # Buy & Hold comparison
        buy_hold = (results["Close"] / results["Close"].iloc[0]) * 10_000
        buy_hold_return = calculate_total_return(buy_hold)
        buy_hold_dd = calculate_max_drawdown(buy_hold)
        buy_hold_sharpe = calculate_sharpe_ratio(buy_hold)
        
        # Prepare equity curve data
        equity_curve = []
        for date, value in equity.items():
            equity_curve.append({
                "date": serialize_timestamp(date),
                "equity": float(value),
                "buy_hold": float(buy_hold.loc[date])
            })
        
        # Split winning/losing trades
        winning, losing = split_trades(trades)
        
        # Average features
        win_avg = average_features(winning) if winning else {}
        lose_avg = average_features(losing) if losing else {}
        
        feature_comparison = {}
        for key in win_avg:
            feature_comparison[key] = {
                "winning": float(win_avg[key]),
                "losing": float(lose_avg[key]) if key in lose_avg else 0.0
            }
        
        # Max drawdown explanation
        peak, trough, dd_value = find_max_drawdown_period(equity)
        dd_trades = trades_during_period(trades, peak, trough)
        max_dd_explanation = explain_max_drawdown(peak, trough, dd_value, dd_trades)
        
        # Prepare trades for JSON
        json_trades = [prepare_trade_for_json(t) for t in trades]
        
        response = {
            "equity_curve": equity_curve,
            "metrics": {
                "total_return": float(total_return),
                "max_drawdown": float(max_drawdown),
                "sharpe_ratio": float(sharpe),
                "num_trades": len(trades)
            },
            "trades": json_trades,
            "winning_trades": len(winning),
            "losing_trades": len(losing),
            "feature_comparison": feature_comparison,
            "max_drawdown_explanation": max_dd_explanation,
            "buy_hold_metrics": {
                "total_return": float(buy_hold_return),
                "max_drawdown": float(buy_hold_dd),
                "sharpe_ratio": float(buy_hold_sharpe)
            },
            "strategy_type": strategy,
            "symbol": symbol
        }
        
        return response
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")
    

@app.get("/api/trades/{trade_index}/explain")
def explain_specific_trade(trade_index: int, strategy: str = "conservative", symbol: str = "SPY"):
    """Get AI explanation for a specific trade"""
    try:
        results, trades = backtest_strategy(strategy_type=strategy, symbol=symbol)
        
        if trade_index < 0 or trade_index >= len(trades):
            raise HTTPException(status_code=404, detail="Trade not found")
        
        trade = trades[trade_index]
        explanation = explain_trade(trade)
        
        return {
            "trade": prepare_trade_for_json(trade),
            "explanation": explanation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


@app.get("/api/trades/compare")
def compare_trades():
    """Compare a winning trade vs a losing trade"""
    try:
        results, trades = backtest_strategy(strategy_type="conservative")
        winning, losing = split_trades(trades)
        
        if not winning or not losing:
            raise HTTPException(status_code=404, detail="Not enough trades to compare")
        
        comparison = explain_trade_comparison(winning[0], losing[0])
        
        return {
            "winning_trade": prepare_trade_for_json(winning[0]),
            "losing_trade": prepare_trade_for_json(losing[0]),
            "comparison": comparison
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@app.get("/api/feature-importance")
def get_feature_importance():
    """Get feature importance from the trained model"""
    try:
        model = train_trend_model()
        clf = model.named_steps["clf"]
        coefficients = clf.coef_[0]
        
        features = []
        for i, feature_name in enumerate(FEATURE_COLUMNS):
            features.append({
                "name": feature_name,
                "coefficient": float(coefficients[i]),
                "abs_importance": float(abs(coefficients[i]))
            })
        
        # Sort by absolute importance
        features.sort(key=lambda x: x["abs_importance"], reverse=True)
        
        return {"features": features}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature importance calculation failed: {str(e)}")


@app.get("/api/dataset/preview")
def get_dataset_preview(rows: int = 10):
    """Get a preview of the dataset"""
    try:
        df = build_dataset()
        
        # Get last N rows
        preview_df = df.tail(rows)
        
        data = []
        for date, row in preview_df.iterrows():
            data.append({
                "date": serialize_timestamp(date),
                "close": float(row["Close"]),
                "return_5d": float(row["return_5d"]) if not pd.isna(row["return_5d"]) else None,
                "return_20d": float(row["return_20d"]) if not pd.isna(row["return_20d"]) else None,
                "ma_ratio": float(row["ma_ratio"]) if not pd.isna(row["ma_ratio"]) else None,
                "rsi": float(row["rsi"]) if not pd.isna(row["rsi"]) else None,
                "volatility_20d": float(row["volatility_20d"]) if not pd.isna(row["volatility_20d"]) else None,
            })
        
        return {
            "data": data,
            "total_rows": len(df),
            "date_range": {
                "start": serialize_timestamp(df.index[0]),
                "end": serialize_timestamp(df.index[-1])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset preview failed: {str(e)}")


@app.get("/api/price-data")
def get_price_data(symbol: str = "SPY", start: str = "", end: str = ""):
    """Get daily close prices for a date range (used for trade charts)"""
    try:
        # Use cache to avoid re-downloading on every explain click
        if symbol not in _price_cache:
            _price_cache[symbol] = load_market_data(symbol)

        df = _price_cache[symbol].copy()

        if start:
            df = df[df.index >= start]
        if end:
            df = df[df.index <= end]

        prices = []
        for date, row in df.iterrows():
            prices.append({
                "date": serialize_timestamp(date).split("T")[0],
                "close": float(row["Close"])
            })

        return {"prices": prices, "symbol": symbol}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price data failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
