import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/trading_assistant"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Market Data
    ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

    # Reddit
    REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
    REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
    REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "TradingAssistant/1.0")

    # News
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    NEWS_API_BASE_URL = "https://newsapi.org/v2"

    # APNs
    APNS_KEY_ID = os.getenv("APNS_KEY_ID", "")
    APNS_TEAM_ID = os.getenv("APNS_TEAM_ID", "")
    APNS_KEY_PATH = os.getenv("APNS_KEY_PATH", "./certs/apns_auth_key.p8")
    APNS_BUNDLE_ID = os.getenv("APNS_BUNDLE_ID", "com.tradingassistant.app")

    # Cache TTLs (seconds)
    MARKET_DATA_CACHE_TTL = 60
    SENTIMENT_CACHE_TTL = 300
    NEWS_CACHE_TTL = 600
