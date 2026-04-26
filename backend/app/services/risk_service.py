def analyze_risk(entry_price: float, stop_loss: float, target_price: float,
                 capital: float, risk_percent: float, volatility: float = None) -> dict:
    if entry_price <= 0 or stop_loss <= 0 or target_price <= 0:
        raise ValueError("Prices must be positive")

    risk_per_share = abs(entry_price - stop_loss)
    reward_per_share = abs(target_price - entry_price)
    rr_ratio = round(reward_per_share / risk_per_share, 2) if risk_per_share > 0 else 0

    risk_amount = capital * (risk_percent / 100)
    position_size = int(risk_amount / risk_per_share) if risk_per_share > 0 else 0
    position_value = position_size * entry_price
    position_pct = round(position_value / capital * 100, 2)

    # Risk score 0-100 (higher = riskier)
    risk_score = 0
    if rr_ratio < 1: risk_score += 30
    elif rr_ratio < 2: risk_score += 15
    if risk_percent > 3: risk_score += 25
    elif risk_percent > 2: risk_score += 10
    if position_pct > 20: risk_score += 20
    elif position_pct > 10: risk_score += 10
    if volatility and volatility > 3: risk_score += 25
    risk_score = min(risk_score, 100)

    risk_level = "LOW" if risk_score < 30 else "MEDIUM" if risk_score < 60 else "HIGH"

    prob_loss = round(1 / (1 + rr_ratio) * 100, 2) if rr_ratio > 0 else 50.0

    warnings = []
    if rr_ratio < 1.5: warnings.append("Risk-Reward ratio is below 1.5 — consider adjusting target or stop-loss")
    if risk_percent > 2: warnings.append("Risking more than 2% of capital per trade is aggressive")
    if position_pct > 20: warnings.append("Position size exceeds 20% of capital — high concentration risk")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_reward_ratio": rr_ratio,
        "stop_loss": round(stop_loss, 2),
        "suggested_stop_loss": round(entry_price - (entry_price * 0.02), 2),
        "position_size": position_size,
        "position_value": round(position_value, 2),
        "position_pct_of_capital": position_pct,
        "probability_of_loss": prob_loss,
        "max_loss": round(position_size * risk_per_share, 2),
        "max_gain": round(position_size * reward_per_share, 2),
        "warnings": warnings,
    }
