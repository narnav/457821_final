import yfinance as yf
import pandas as pd
import numpy as np
import ta


PREDICTION_HORIZON = 5



def load_market_data(symbol="SPY", start="2015-01-01"):
    df = yf.download(
        symbol,
        start=start,
        auto_adjust=False
    )

    # If columns are multi-index, flatten them
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.dropna(inplace=True)
    return df


def add_features(df):
    # -------------------------
    # Returns / momentum
    # -------------------------
    df["return_5d"] = df["Close"].pct_change(5)
    df["return_20d"] = df["Close"].pct_change(20)

    # -------------------------
    # Moving averages & trend
    # -------------------------
    df["ma_20"] = df["Close"].rolling(20).mean()
    df["ma_ratio"] = df["Close"] / df["ma_20"]

    # Trend slope (acceleration)
    df["trend_slope_20d"] = (
        df["ma_20"] - df["ma_20"].shift(5)
    ) / df["ma_20"].shift(5)

    # -------------------------
    # RSI (mean reversion)
    # -------------------------
    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()

    rs = avg_gain / avg_loss
    df["rsi"] = 100 - (100 / (1 + rs))

    # -------------------------
    # Volatility
    # -------------------------
    df["atr"] = df["Close"].rolling(14).std() / df["Close"]
    df["volatility_20d"] = df["Close"].pct_change().rolling(20).std()

    # -------------------------
    # Market regime (stress flag)
    # -------------------------
    vol_threshold = df["volatility_20d"].quantile(0.7)
    df["regime_stress"] = (df["volatility_20d"] > vol_threshold).astype(int)

    # -------------------------
    # Relative strength vs QQQ
    # -------------------------
    df["relative_strength_spy"] = (
        df["Close"].pct_change(20)
        - df["SPY_Close"].pct_change(20)
    )

    return df



def add_targets(df: pd.DataFrame) -> pd.DataFrame:
    # Future return
    df["future_return"] = df["Close"].shift(-PREDICTION_HORIZON) / df["Close"] - 1

    # Trend target
    df["target_trend"] = (df["future_return"] > 0).astype(int)

    # Future volatility
    df["future_volatility"] = (
        df["Close"]
        .pct_change()
        .rolling(PREDICTION_HORIZON)
        .std()
        .shift(-PREDICTION_HORIZON)
    )

    # Volatility regime
    df["target_volatility"] = pd.qcut(
        df["future_volatility"],
        q=3,
        labels=["low", "medium", "high"],
        duplicates="drop"
    )

    return df

def build_dataset(symbol="SPY"):
    """
    Build dataset for any stock symbol
    
    Args:
        symbol: Stock ticker (default: SPY)
    """
    # Load primary stock data
    primary = load_market_data(symbol)

    # Load SPY as benchmark for relative strength comparison
    if symbol.upper() == "SPY":
        df = primary.copy()
        df["SPY_Close"] = df["Close"]
    else:
        spy = load_market_data("SPY")
        df = primary.join(
            spy["Close"].rename("SPY_Close"),
            how="inner"
        )

    # Add engineered features
    df = add_features(df)

    # Add prediction targets
    df = add_targets(df)

    # Final cleanup
    df.dropna(inplace=True)

    return df



if __name__ == "__main__":
    dataset = build_dataset("SPY")
    print(dataset.head())
    print("\nDataset shape:", dataset.shape)
