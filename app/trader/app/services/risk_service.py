def calculate_position(capital, risk_percent, entry, sl, leverage):

    risk_amount = capital * (risk_percent / 100)
    distance = abs(entry - sl)

    position_size = (risk_amount * leverage) / distance

    return {
        "risk_amount": risk_amount,
        "position_size": position_size,
        "loss_if_sl": risk_amount
    }