from datetime import datetime, timezone
from models import db


class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    reminder_time = db.Column(db.DateTime, nullable=False, index=True)
    recurrence = db.Column(db.String(20), nullable=True)  # daily, weekly, market_open, market_close
    ticker = db.Column(db.String(20), nullable=True)  # optional: link to a stock
    alert_type = db.Column(db.String(20), default="push")  # push, email, in_app
    is_triggered = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "reminder_time": self.reminder_time.isoformat() if self.reminder_time else None,
            "recurrence": self.recurrence,
            "ticker": self.ticker,
            "alert_type": self.alert_type,
            "is_triggered": self.is_triggered,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
