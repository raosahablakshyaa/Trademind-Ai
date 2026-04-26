from typing import List
from collections import defaultdict

STRATEGIES = ["scalping", "intraday", "swing", "positional"]

def analyze_strategies(trades: List[dict]) -> dict:
    strategy_stats = defaultdict(lambda: {"trades": 0, "wins": 0, "total_pnl": 0.0, "losses": 0})

    for trade in trades:
        strategy = trade.get("strategy", "unknown").lower()
        pnl = trade.get("pnl", 0)
        strategy_stats[strategy]["trades"] += 1
        strategy_stats[strategy]["total_pnl"] += pnl
        if pnl > 0:
            strategy_stats[strategy]["wins"] += 1
        else:
            strategy_stats[strategy]["losses"] += 1

    results = []
    for strategy, stats in strategy_stats.items():
        t = stats["trades"]
        win_rate = round(stats["wins"] / t * 100, 2) if t > 0 else 0
        avg_pnl = round(stats["total_pnl"] / t, 2) if t > 0 else 0
        results.append({
            "strategy": strategy,
            "total_trades": t,
            "win_rate": win_rate,
            "total_pnl": round(stats["total_pnl"], 2),
            "avg_pnl_per_trade": avg_pnl,
            "wins": stats["wins"],
            "losses": stats["losses"],
        })

    results.sort(key=lambda x: x["total_pnl"], reverse=True)
    best = results[0]["strategy"] if results else None

    return {
        "strategies": results,
        "best_strategy": best,
        "recommendation": f"Your best performing strategy is '{best}'. Focus more on it." if best else "Not enough data.",
    }
