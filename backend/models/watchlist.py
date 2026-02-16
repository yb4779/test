from datetime import datetime, timezone
from models import db


class Watchlist(db.Model):
    __tablename__ = "watchlist"

    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(20), nullable=False, index=True)
    market = db.Column(db.String(10), nullable=False, default="US")
    price_alert_above = db.Column(db.Float, nullable=True)
    price_alert_below = db.Column(db.Float, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "ticker": self.ticker,
            "market": self.market,
            "price_alert_above": self.price_alert_above,
            "price_alert_below": self.price_alert_below,
            "notes": self.notes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
