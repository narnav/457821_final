import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from dataset_builder import build_dataset


FEATURE_COLUMNS = [
    "return_5d",
    "return_20d",
    "ma_ratio",
    "trend_slope_20d",
    "rsi",
    "atr",
    "volatility_20d",
    "regime_stress",
    "relative_strength_spy",
]


TARGET_COLUMN = "target_trend"


def train_trend_model(symbol="SPY", df=None):
    """
    Train trend prediction model for any stock

    Args:
        symbol: Stock ticker (default: SPY)
        df: Pre-built dataset (optional, avoids redundant yfinance downloads)
    """
    if df is None:
        df = build_dataset(symbol)

    # Time-based split
    train_df = df[df.index < "2020-01-01"]
    test_df = df[df.index >= "2020-01-01"]

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]

    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN]

    # Pipeline = scaling + model
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000))
    ])

    model.fit(X_train, y_train)

    # Predictions
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs > 0.5).astype(int)

    print(f"\n=== MODEL TRAINING FOR {symbol} ===")
    print("ROC AUC:", roc_auc_score(y_test, probs))
    print(classification_report(y_test, preds))

    return model


if __name__ == "__main__":
    train_trend_model()
