from datetime import datetime, timezone
from models import db


class UserPreference(db.Model):
    __tablename__ = "user_preferences"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), nullable=False, unique=True)
    value = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=True)  # display, notifications, markets, trading
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "category": self.category,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
