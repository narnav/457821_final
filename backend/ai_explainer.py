def _select_lesson(f, pnl, prob):
    """Pick an educational lesson based on the dominant feature conditions + outcome."""
    won = pnl > 0
    rsi = f.get("rsi", 50)
    vol = f.get("volatility_20d", 0)
    stress = f.get("regime_stress", 0)
    r5 = f.get("return_5d", 0)
    r20 = f.get("return_20d", 0)
    ma = f.get("ma_ratio", 1.0)

    # Weak signal near threshold
    if prob < 0.55:
        if won:
            return (
                "This was a marginal signal — the model's probability was barely above the entry threshold. "
                "Even weak signals can produce winners, but over many trades their expected value is lower. "
                "High-conviction entries (probability well above threshold) tend to have better risk-adjusted returns."
            )
        else:
            return (
                "The model's probability was close to the entry threshold, meaning conviction was low. "
                "Low-conviction entries are statistically more likely to underperform. "
                "This is why the threshold exists — it filters out noise, but marginal signals still slip through."
            )

    # Overbought RSI
    if rsi > 70:
        if won:
            return (
                "RSI was in overbought territory, yet the trade was profitable. "
                "This shows that momentum can persist longer than expected — 'overbought' doesn't mean 'sell immediately.' "
                "Strong trends often stay overbought for extended periods before reversing."
            )
        else:
            return (
                "RSI was elevated into overbought territory, and the trade lost money. "
                "When RSI is high, the risk of mean reversion increases — prices that have risen sharply "
                "are more likely to pull back. This is a classic example of why overbought signals are warnings, not guarantees."
            )

    # Oversold RSI
    if rsi < 30:
        if won:
            return (
                "RSI was in oversold territory, and the subsequent bounce made this trade profitable. "
                "Oversold conditions can present opportunities when they coincide with a bullish model signal, "
                "as the market may be due for a recovery."
            )
        else:
            return (
                "Despite oversold RSI conditions, the trade lost money. "
                "Oversold markets can continue falling — this is called 'catching a falling knife.' "
                "Oversold is a necessary but not sufficient condition for a reversal."
            )

    # High volatility
    if vol > 0.04 or stress == 1:
        if won:
            return (
                "This trade was profitable despite elevated volatility. "
                "High-volatility environments can produce outsized gains when the direction is correct, "
                "but the risk of adverse moves is also much greater. "
                "The model accepted this risk and it paid off — but this outcome is less reliable than in calm markets."
            )
        else:
            return (
                "Elevated volatility created an unfavorable environment for this trade. "
                "When volatility is high, even correct directional calls can get stopped out by large intraday swings. "
                "This is why the Conservative strategy uses a volatility filter — it avoids these noisy conditions entirely."
            )

    # Strong dual momentum
    if r5 > 0 and r20 > 0 and ma > 1.0:
        if won:
            return (
                "Multiple momentum signals aligned: both short-term and medium-term returns were positive, "
                "and price was above its moving average. When all signals agree, the probability of a successful "
                "trend-following trade increases. This kind of alignment is what the model looks for."
            )
        else:
            return (
                "Despite positive momentum across multiple timeframes and price above the moving average, "
                "the trade lost money. This shows that even when conditions look ideal, markets can reverse unexpectedly. "
                "No combination of features guarantees a profit — trading is fundamentally probabilistic."
            )

    # Negative momentum entry
    if r5 < 0:
        if won:
            return (
                "The model entered despite negative short-term momentum, and the trade worked out. "
                "Sometimes the model sees a bullish setup in the broader indicators (20-day trend, MA ratio) "
                "even when recent days have been weak. Contrarian entries can be rewarding when the bigger trend is intact."
            )
        else:
            return (
                "Negative short-term momentum was a warning sign that the model overlooked. "
                "When recent price action is declining, it often takes time for the trend to stabilize. "
                "Entering during a pullback within a larger trend carries additional risk of the pullback deepening."
            )

    # Price below moving average
    if ma < 1.0:
        if won:
            return (
                "Price was below the 20-day moving average at entry, which typically signals a weakening trend. "
                "The model still found a bullish signal, and the trade was profitable — showing that "
                "mean reversion back above the moving average can happen quickly."
            )
        else:
            return (
                "Price was below its 20-day moving average, indicating a deteriorating trend. "
                "Buying below the moving average often means fighting the prevailing direction. "
                "The best trend-following trades typically enter when price is comfortably above the moving average."
            )

    # Default fallback
    if won:
        return (
            "The market conditions were moderately favorable, and the trade ended profitably. "
            "This is the kind of trade that validates the model's approach — "
            "steady conditions with moderate conviction tend to produce consistent, if unspectacular, results."
        )
    else:
        return (
            "Market conditions appeared reasonable, but the trade still lost money. "
            "This is a reminder that trading signals are probabilistic, not guarantees. "
            "Even a well-calibrated model with a 60% win rate will lose 4 out of every 10 trades."
        )


def explain_trade(trade):
    """Generate a structured AI explanation for a single trade."""
    f = trade["features"]
    pnl = trade["pnl"]
    prob = trade["bullish_prob"]
    entry_price = trade["entry_price"]
    exit_price = trade["exit_price"]

    sections = []

    # --- SECTION 1: Market Context ---
    ma_pos = "above" if f["ma_ratio"] > 1.0 else "below"
    rsi_val = f["rsi"]
    rsi_zone = "overbought" if rsi_val > 70 else "oversold" if rsi_val < 30 else "neutral"
    stress_flag = "active" if f.get("regime_stress", 0) == 1 else "inactive"

    context = (
        f"MARKET CONTEXT: "
        f"Price was {ma_pos} the 20-day moving average (MA ratio: {f['ma_ratio']:.3f}). "
        f"RSI was at {rsi_val:.1f} ({rsi_zone} zone). "
        f"5-day return was {f['return_5d'] * 100:+.2f}% and 20-day return was {f['return_20d'] * 100:+.2f}%. "
        f"20-day volatility was {f['volatility_20d']:.4f} "
        f"(stress detector: {stress_flag}). "
        f"Trend acceleration: {f.get('trend_slope_20d', 0) * 100:+.3f}%."
    )
    sections.append(context)

    # --- SECTION 2: Model Signal ---
    if prob >= 0.65:
        strength = "strong"
    elif prob >= 0.55:
        strength = "moderate"
    else:
        strength = "weak"

    signal = (
        f"MODEL SIGNAL: "
        f"The model assigned a {prob * 100:.1f}% bullish probability ({strength} signal). "
    )
    if f.get("relative_strength_spy", 0) > 0:
        signal += f"The stock was outperforming SPY over 20 days (relative strength: {f['relative_strength_spy'] * 100:+.2f}%)."
    else:
        signal += f"The stock was underperforming SPY over 20 days (relative strength: {f.get('relative_strength_spy', 0) * 100:+.2f}%)."
    sections.append(signal)

    # --- SECTION 3: Outcome ---
    pnl_pct = pnl * 100
    result_word = "profitably" if pnl > 0 else "at a loss"
    outcome = (
        f"OUTCOME: "
        f"Entered at ${entry_price:.2f}, exited at ${exit_price:.2f}. "
        f"The trade closed {result_word} with a return of {pnl_pct:+.2f}%."
    )
    sections.append(outcome)

    # --- SECTION 4: Lesson ---
    lesson = _select_lesson(f, pnl, prob)
    sections.append(f"LESSON: {lesson}")

    return "\n\n".join(sections)


def explain_trade_comparison(win_trade, lose_trade):
    wf = win_trade["features"]
    lf = lose_trade["features"]

    explanation = []

    explanation.append("COMPARISON OF A WINNING VS LOSING TRADE:\n")

    if wf["ma_ratio"] > lf["ma_ratio"]:
        explanation.append(
            "The winning trade entered with price further above its moving average, "
            "indicating a stronger underlying trend."
        )

    if wf["return_5d"] > lf["return_5d"]:
        explanation.append(
            "Short-term momentum was stronger in the winning trade."
        )

    if lf["rsi"] > 70:
        explanation.append(
            "The losing trade entered when RSI was high, suggesting overbought conditions."
        )

    if lf["volatility_20d"] > wf["volatility_20d"]:
        explanation.append(
            "The losing trade faced higher volatility, increasing the chance of adverse moves."
        )

    explanation.append(
        "This comparison shows that successful trades tend to occur during stable trends, "
        "while losing trades often happen when momentum is stretched or volatility is elevated."
    )

    return " ".join(explanation)


def explain_max_drawdown(peak_date, trough_date, drawdown_value, trades):
    explanation = []

    explanation.append(
        f"The maximum drawdown occurred between {peak_date.date()} and {trough_date.date()}."
    )

    explanation.append(
        f"During this period, the portfolio declined by approximately {abs(drawdown_value):.1%} from its previous peak."
    )

    losing_trades = [t for t in trades if t["pnl"] <= 0]
    winning_trades = [t for t in trades if t["pnl"] > 0]

    explanation.append(
        f"There were {len(trades)} trades during this drawdown period, "
        f"with {len(losing_trades)} losing trades and {len(winning_trades)} winning trades."
    )

    if len(losing_trades) > len(winning_trades):
        explanation.append(
            "Losses dominated this period, which caused the portfolio to steadily decline."
        )
    else:
        explanation.append(
            "Even though some trades were profitable, losses outweighed gains during this period."
        )

    explanation.append(
        "This drawdown illustrates that consecutive small losses can be more damaging than a single large loss."
    )

    explanation.append(
        "The key lesson is that drawdowns are inevitable in probabilistic systems, "
        "and strategies must be designed so users can emotionally and financially survive them."
    )

    return " ".join(explanation)
