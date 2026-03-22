import pandas as pd
import numpy as np

from train_trend_model import train_trend_model, FEATURE_COLUMNS
from dataset_builder import build_dataset

INITIAL_CAPITAL = 10_000

# Conservative strategy settings
CONSERVATIVE_THRESHOLD = 0.65
CONSERVATIVE_HOLD_DAYS = 5
CONSERVATIVE_VOLATILITY_LIMIT = 0.45

# Aggressive strategy settings
AGGRESSIVE_THRESHOLD = 0.52
AGGRESSIVE_HOLD_DAYS = 7
AGGRESSIVE_VOLATILITY_LIMIT = 0.65

# Ultra Aggressive strategy settings - tries to beat Buy & Hold
ULTRA_THRESHOLD = 0.48
ULTRA_HOLD_DAYS = 15
ULTRA_VOLATILITY_LIMIT = 1.0  # No volatility filter

NORMAL_POSITION_SIZE = 1.0
COOLDOWN_POSITION_SIZE = 0.3


def backtest_strategy(strategy_type="conservative", symbol="SPY"):
    """
    Run backtest with conservative, aggressive, or ultra strategy.
    
    Args:
        strategy_type: "conservative", "aggressive", or "ultra"
        symbol: Stock ticker (default: SPY)
    """
    # Set parameters based on strategy type
    if strategy_type == "ultra":
        threshold = ULTRA_THRESHOLD
        hold_days = ULTRA_HOLD_DAYS
        volatility_limit = ULTRA_VOLATILITY_LIMIT
        disable_cooldown = True
    elif strategy_type == "aggressive":
        threshold = AGGRESSIVE_THRESHOLD
        hold_days = AGGRESSIVE_HOLD_DAYS
        volatility_limit = AGGRESSIVE_VOLATILITY_LIMIT
        disable_cooldown = False
    else:  # conservative (default)
        threshold = CONSERVATIVE_THRESHOLD
        hold_days = CONSERVATIVE_HOLD_DAYS
        volatility_limit = CONSERVATIVE_VOLATILITY_LIMIT
        disable_cooldown = False
    
    # Debug print to verify parameters
    print(f"\n=== RUNNING {strategy_type.upper()} STRATEGY ON {symbol} ===")
    print(f"Threshold: {threshold}")
    print(f"Hold Days: {hold_days}")
    print(f"Volatility Limit: {volatility_limit}")
    print(f"Cooldown Disabled: {disable_cooldown}\n")
    
    df = build_dataset(symbol)
    trades = []
    # Train model (trained only on past) — pass df to avoid re-downloading
    model = train_trend_model(symbol, df=df)

    # Use test period only
    test_df = df[df.index >= "2020-01-01"].copy()

    # Predict probabilities
    test_df["bullish_prob"] = model.predict_proba(
        test_df[FEATURE_COLUMNS]
    )[:, 1]

    capital = INITIAL_CAPITAL
    equity_curve = []
    position = None
    loss_streak = 0
    cooldown_until = None

    for date, row in test_df.iterrows():
        price = row["Close"]

        # Exit logic
        in_cooldown = cooldown_until is not None and date < cooldown_until

        if in_cooldown:
            position_size = COOLDOWN_POSITION_SIZE
        else:
            position_size = NORMAL_POSITION_SIZE

        if position:
            holding_days = (date - position["entry_date"]).days

            if holding_days >= hold_days:
                exit_price = price
                pnl = exit_price / position["entry_price"] - 1

                trades.append({
                    "entry_date": position["entry_date"],
                    "exit_date": date,
                    "entry_price": position["entry_price"],
                    "exit_price": exit_price,
                    "pnl": pnl,
                    "bullish_prob": position["entry_prob"],
                    "features": position["features"]
                })

                capital *= 1 + position["position_size"] * (exit_price / position["entry_price"] - 1)

                position = None

                # ----- LOSS STREAK + COOLDOWN LOGIC -----
                if pnl <= 0:
                    loss_streak += 1
                else:
                    loss_streak = 0

                if loss_streak >= 3 and not disable_cooldown:
                    cooldown_until = date + pd.Timedelta(days=30)
                    loss_streak = 0

        # Entry logic
        if (
            not position
            and row["bullish_prob"] >= threshold
            and row["volatility_20d"] < volatility_limit
        ):
            position = {
                "entry_price": price,
                "entry_date": date,
                "entry_prob": row["bullish_prob"],
                "features": row[FEATURE_COLUMNS].to_dict(),
                "position_size": position_size
            }

        if in_cooldown and date == cooldown_until - pd.Timedelta(days=1):
            print(f"Cooldown ending on {cooldown_until.date()}")
        
        equity_curve.append(capital)

    test_df["equity"] = equity_curve
    print(f"DEBUG: Number of trades = {len(trades)}")
    print(f"DEBUG: Final equity = {capital}")
    return test_df, trades

# Rest of the file stays the same...
def calculate_total_return(equity_series):
    return equity_series.iloc[-1] / equity_series.iloc[0] - 1


def calculate_drawdown(equity_series):
    running_max = equity_series.cummax()
    drawdown = (equity_series - running_max) / running_max
    return drawdown


def calculate_max_drawdown(equity_series):
    drawdown = calculate_drawdown(equity_series)
    return drawdown.min()


def calculate_sharpe_ratio(equity_series, risk_free_rate=0.0):
    daily_returns = equity_series.pct_change().dropna()
    excess_returns = daily_returns - risk_free_rate / 252
    return np.sqrt(252) * excess_returns.mean() / excess_returns.std()


def split_trades(trades):
    winning = [t for t in trades if t["pnl"] > 0]
    losing = [t for t in trades if t["pnl"] <= 0]
    return winning, losing


def average_features(trades):
    if not trades:
        return {}

    df = pd.DataFrame([t["features"] for t in trades])
    return df.mean().to_dict()

def find_max_drawdown_period(equity):
    drawdown = calculate_drawdown(equity)

    trough_date = drawdown.idxmin()
    peak_date = equity.loc[:trough_date].idxmax()

    return peak_date, trough_date, drawdown.loc[trough_date]

def trades_during_period(trades, start_date, end_date):
    return [
        t for t in trades
        if start_date <= t["entry_date"] <= end_date
    ]


if __name__ == "__main__":
    import matplotlib.pyplot as plt

    ######## Back-test Strategy ########################

    results, trades = backtest_strategy()
    equity = results["equity"]

    

    buy_hold = (results["Close"] / results["Close"].iloc[0]) * 10_000
    print("Buy & Hold Total Return:",
        calculate_total_return(buy_hold))
    print("Buy & Hold Max Drawdown:",
        calculate_max_drawdown(buy_hold))
    print("Buy & Hold Sharpe:",
        calculate_sharpe_ratio(buy_hold))
    
    ######## Winning Vs Losing trades ##################

    winning, losing = split_trades(trades)

    print(f"\nWinning trades: {len(winning)}")
    print(f"Losing trades: {len(losing)}")

    win_avg = average_features(winning)
    lose_avg = average_features(losing)

    print("\n--- AVERAGE FEATURES AT ENTRY ---")
    for key in win_avg:
        print(
            f"{key:15} | "
            f"WIN: {win_avg[key]:.3f} | "
            f"LOSS: {lose_avg[key]:.3f}"
        )


    ####### DrawDown calculation ################################

    total_return = calculate_total_return(equity)
    max_drawdown = calculate_max_drawdown(equity)
    sharpe = calculate_sharpe_ratio(equity)

    print(f"Total Return: {total_return:.2%}")
    print(f"Max Drawdown: {max_drawdown:.2%}")
    print(f"Sharpe Ratio: {sharpe:.2f}")
    
    drawdown = calculate_drawdown(equity)

    ######### Graphs #####################################

    plt.figure(figsize=(12, 6))
    plt.plot(results.index, equity, label="ML Strategy")
    plt.title("Equity Curve – ML Strategy")
    plt.xlabel("Date")
    plt.ylabel("Portfolio Value ($)")
    plt.legend()
    plt.grid(True)

    plt.figure(figsize=(12, 4))
    plt.plot(results.index, drawdown, color="red")
    plt.title("Drawdown")
    plt.xlabel("Date")
    plt.ylabel("Drawdown")
    plt.grid(True)


    ######### AI-Explainer ###############################

    from ai_explainer import explain_trade, explain_trade_comparison, explain_max_drawdown

    
    # Max DrawDown
    peak, trough, dd_value = find_max_drawdown_period(equity)
    dd_trades = trades_during_period(trades, peak, trough)

    print("\n--- MAX DRAWDOWN EXPLANATION ---\n")
    print(explain_max_drawdown(peak, trough, dd_value, dd_trades))




    # Win or Loss
    if winning and losing:
        print("\n--- WINNING vs LOSING TRADE COMPARISON ---\n")
        print(explain_trade_comparison(winning[0], losing[0]))



    # General Explanation
    
    print("\n--- AI EXPLANATIONS (first 3 trades) ---\n")

    for trade in trades[:3]:
        print(f"Entry: {trade['entry_date']} | Exit: {trade['exit_date']}")
        print(f"PnL: {trade['pnl']:.2%} | Bullish prob: {trade['bullish_prob']:.2f}")
        print("AI Explanation:")
        print(explain_trade(trade))
        print("=" * 80)

    plt.show()
    plt.show()