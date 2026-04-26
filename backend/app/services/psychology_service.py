from typing import List
from datetime import datetime, timedelta

EMOTIONS = ["fear", "greed", "revenge", "neutral", "confident", "anxious"]

def analyze_psychology(trades: List[dict]) -> dict:
    if not trades:
        return {"warnings": [], "behavior_tags": [], "score": 100, "summary": "No trades to analyze."}

    warnings = []
    behavior_tags = []
    score = 100

    # Overtrading: >5 trades in a single day
    from collections import Counter
    trade_dates = [t.get("entry_date", "")[:10] for t in trades]
    date_counts = Counter(trade_dates)
    max_daily = max(date_counts.values(), default=0)
    if max_daily > 5:
        warnings.append(f"Overtrading detected — {max_daily} trades in one day")
        behavior_tags.append("Overtrading")
        score -= 20

    # Revenge trading: loss followed immediately by another trade within 30 min
    sorted_trades = sorted(trades, key=lambda x: x.get("entry_date", ""))
    for i in range(1, len(sorted_trades)):
        prev = sorted_trades[i - 1]
        curr = sorted_trades[i]
        if prev.get("pnl", 0) < 0:
            try:
                t1 = datetime.fromisoformat(prev["exit_date"])
                t2 = datetime.fromisoformat(curr["entry_date"])
                if (t2 - t1).total_seconds() < 1800:
                    warnings.append("Revenge trading pattern detected — trade entered within 30 min of a loss")
                    behavior_tags.append("Revenge Trading")
                    score -= 25
                    break
            except Exception:
                pass

    # Emotional state analysis
    emotion_counts = Counter(t.get("emotional_state", "neutral") for t in trades)
    if emotion_counts.get("fear", 0) > len(trades) * 0.3:
        warnings.append("High frequency of fear-based trades — you may be exiting too early")
        behavior_tags.append("Fear Trading")
        score -= 15
    if emotion_counts.get("greed", 0) > len(trades) * 0.3:
        warnings.append("Greed detected — avoid chasing trades without a clear setup")
        behavior_tags.append("Greed Trading")
        score -= 15

    # Poor risk management: avg loss > 3% of capital
    losses = [t.get("pnl", 0) for t in trades if t.get("pnl", 0) < 0]
    if losses:
        avg_loss_pct = abs(sum(losses) / len(losses))
        if avg_loss_pct > 3:
            warnings.append("Average loss per trade exceeds 3% — poor risk management")
            behavior_tags.append("Poor Risk Management")
            score -= 20

    # Win rate
    wins = sum(1 for t in trades if t.get("pnl", 0) > 0)
    win_rate = round(wins / len(trades) * 100, 2)

    score = max(score, 0)
    psychology_grade = "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"

    return {
        "psychology_score": score,
        "grade": psychology_grade,
        "win_rate": win_rate,
        "total_trades": len(trades),
        "behavior_tags": list(set(behavior_tags)),
        "warnings": list(set(warnings)),
        "emotion_distribution": dict(emotion_counts),
        "summary": _generate_summary(score, behavior_tags),
    }

def _generate_summary(score: int, tags: list) -> str:
    if score >= 80:
        return "Excellent trading discipline. Keep following your strategy."
    if "Revenge Trading" in tags:
        return "You are emotionally trading after losses. Take a break and reset."
    if "Overtrading" in tags:
        return "You are overtrading. Quality over quantity — wait for high-probability setups."
    if "Fear Trading" in tags:
        return "Fear is affecting your decisions. Trust your analysis and stick to your plan."
    if "Greed Trading" in tags:
        return "Greed is pushing you into low-quality trades. Stick to your entry criteria."
    return "Room for improvement. Focus on discipline and risk management."
