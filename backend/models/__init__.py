from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from models.trading_idea import TradingIdea
from models.reminder import Reminder
from models.user_preference import UserPreference
from models.watchlist import Watchlist
from models.feature import Feature

__all__ = ["db", "TradingIdea", "Reminder", "UserPreference", "Watchlist", "Feature"]
