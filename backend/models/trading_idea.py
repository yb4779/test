from datetime import datetime, timezone
from models import db


class TradingIdea(db.Model):
    __tablename__ = "trading_ideas"

    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(20), nullable=False, index=True)
    market = db.Column(db.String(10), nullable=False, default="US")  # US or IN
    idea_type = db.Column(db.String(20), nullable=False)  # buy, sell, watch, options
    entry_price = db.Column(db.Float, nullable=True)
    target_price = db.Column(db.Float, nullable=True)
    stop_loss = db.Column(db.Float, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    voice_transcript = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default="active")  # active, executed, expired, cancelled
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "ticker": self.ticker,
            "market": self.market,
            "idea_type": self.idea_type,
            "entry_price": self.entry_price,
            "target_price": self.target_price,
            "stop_loss": self.stop_loss,
            "notes": self.notes,
            "voice_transcript": self.voice_transcript,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
