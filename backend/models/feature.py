from datetime import datetime, timezone
from models import db


class Feature(db.Model):
    __tablename__ = "features"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=True)  # analysis, data, automation, visualization
    is_enabled = db.Column(db.Boolean, default=False)
    config_json = db.Column(db.Text, nullable=True)  # JSON config for the feature
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "is_enabled": self.is_enabled,
            "config_json": self.config_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
