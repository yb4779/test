from datetime import datetime, timezone
import requests
from config import Config
from services.cache import cache_get, cache_set


class MarketDataService:
    """Service for fetching real-time market data from Alpha Vantage."""

    def __init__(self):
        self.api_key = Config.ALPHA_VANTAGE_API_KEY
        self.base_url = Config.ALPHA_VANTAGE_BASE_URL

    def _request(self, params: dict) -> dict | None:
        params["apikey"] = self.api_key
        try:
            resp = requests.get(self.base_url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if "Error Message" in data or "Note" in data:
                return None
            return data
        except requests.RequestException:
            return None

    def get_quote(self, ticker: str, market: str = "US") -> dict | None:
        """Get real-time quote for a ticker."""
        symbol = self._resolve_symbol(ticker, market)
        cache_key = f"quote:{symbol}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        data = self._request({
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
        })
        if not data or "Global Quote" not in data:
            return None

        quote = data["Global Quote"]
        result = {
            "ticker": ticker,
            "symbol": symbol,
            "market": market,
            "price": float(quote.get("05. price", 0)),
            "change": float(quote.get("09. change", 0)),
            "change_percent": quote.get("10. change percent", "0%"),
            "volume": int(quote.get("06. volume", 0)),
            "high": float(quote.get("03. high", 0)),
            "low": float(quote.get("04. low", 0)),
            "open": float(quote.get("02. open", 0)),
            "previous_close": float(quote.get("08. previous close", 0)),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        cache_set(cache_key, result, ttl=Config.MARKET_DATA_CACHE_TTL)
        return result

    def get_intraday(self, ticker: str, interval: str = "5min", market: str = "US") -> dict | None:
        """Get intraday time series data."""
        symbol = self._resolve_symbol(ticker, market)
        cache_key = f"intraday:{symbol}:{interval}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        data = self._request({
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval,
            "outputsize": "compact",
        })
        series_key = f"Time Series ({interval})"
        if not data or series_key not in data:
            return None

        points = []
        for timestamp, values in data[series_key].items():
            points.append({
                "timestamp": timestamp,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"]),
            })

        result = {"ticker": ticker, "symbol": symbol, "market": market,
                  "interval": interval, "data": points}
        cache_set(cache_key, result, ttl=Config.MARKET_DATA_CACHE_TTL)
        return result

    def get_options_chain(self, ticker: str) -> dict | None:
        """Get options chain data (realtime options from Alpha Vantage)."""
        cache_key = f"options:{ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        data = self._request({
            "function": "REALTIME_OPTIONS",
            "symbol": ticker,
        })
        if not data or "data" not in data:
            return None

        calls = []
        puts = []
        for option in data["data"]:
            entry = {
                "strike": float(option.get("strike", 0)),
                "expiration": option.get("expiration"),
                "last_price": float(option.get("last", 0)),
                "bid": float(option.get("bid", 0)),
                "ask": float(option.get("ask", 0)),
                "volume": int(option.get("volume", 0)),
                "open_interest": int(option.get("open_interest", 0)),
                "implied_volatility": float(option.get("implied_volatility", 0)),
            }
            if option.get("type", "").lower() == "call":
                calls.append(entry)
            else:
                puts.append(entry)

        result = {"ticker": ticker, "calls": calls, "puts": puts,
                  "total_call_volume": sum(c["volume"] for c in calls),
                  "total_put_volume": sum(p["volume"] for p in puts)}
        cache_set(cache_key, result, ttl=Config.MARKET_DATA_CACHE_TTL)
        return result

    def search(self, query: str) -> list:
        """Search for stock tickers."""
        data = self._request({
            "function": "SYMBOL_SEARCH",
            "keywords": query,
        })
        if not data or "bestMatches" not in data:
            return []
        return [
            {
                "symbol": m["1. symbol"],
                "name": m["2. name"],
                "type": m["3. type"],
                "region": m["4. region"],
            }
            for m in data["bestMatches"]
        ]

    def get_market_status(self) -> dict:
        """Get market open/close status for US and Indian markets."""
        now = datetime.now(timezone.utc)
        us_hour = (now.hour - 5) % 24  # EST approximation
        india_hour = (now.hour + 5) % 24  # IST approximation

        return {
            "US": {
                "is_open": 9 <= us_hour < 16 and now.weekday() < 5,
                "next_open": "09:30 ET" if us_hour >= 16 or now.weekday() >= 5 else None,
                "next_close": "16:00 ET" if 9 <= us_hour < 16 else None,
            },
            "IN": {
                "is_open": 9 <= india_hour < 15 and now.weekday() < 5,
                "next_open": "09:15 IST" if india_hour >= 15 or now.weekday() >= 5 else None,
                "next_close": "15:30 IST" if 9 <= india_hour < 15 else None,
            },
        }

    def _resolve_symbol(self, ticker: str, market: str) -> str:
        """Resolve ticker to the correct symbol format for the API."""
        if market == "IN":
            return f"{ticker}.BSE"
        return ticker
