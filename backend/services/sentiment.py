import re
import logging
import requests
from config import Config
from services.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

# Simple keyword-based sentiment scoring
POSITIVE_WORDS = {
    "moon", "rocket", "bull", "bullish", "long", "calls", "buy", "surge",
    "breakout", "green", "up", "high", "profit", "gain", "squeeze", "yolo",
    "diamond", "hands", "tendies", "earnings", "beat", "upgrade",
}
NEGATIVE_WORDS = {
    "bear", "bearish", "short", "puts", "sell", "dump", "crash", "red",
    "down", "low", "loss", "bag", "drill", "tank", "fade", "miss",
    "downgrade", "overvalued", "bubble", "fear",
}


def _score_text(text: str) -> float:
    """Score text sentiment from -1.0 (bearish) to 1.0 (bullish)."""
    words = set(re.findall(r"\w+", text.lower()))
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    total = pos + neg
    if total == 0:
        return 0.0
    return (pos - neg) / total


class SentimentService:
    """Service for aggregating sentiment from Reddit and News."""

    def __init__(self):
        self.reddit = None

    def _get_reddit(self):
        if self.reddit is None and Config.REDDIT_CLIENT_ID:
            try:
                import praw
                self.reddit = praw.Reddit(
                    client_id=Config.REDDIT_CLIENT_ID,
                    client_secret=Config.REDDIT_CLIENT_SECRET,
                    user_agent=Config.REDDIT_USER_AGENT,
                )
            except Exception as e:
                logger.warning(f"Could not initialize Reddit client: {e}")
        return self.reddit

    def get_reddit_sentiment(
        self, ticker: str, subreddits: list[str] | None = None, limit: int = 25
    ) -> dict:
        """Scrape Reddit for sentiment on a ticker."""
        if subreddits is None:
            subreddits = ["wallstreetbets", "stocks", "options"]

        cache_key = f"reddit_sentiment:{ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        reddit = self._get_reddit()
        posts = []
        total_score = 0.0

        if reddit:
            try:
                for sub_name in subreddits:
                    subreddit = reddit.subreddit(sub_name)
                    for post in subreddit.search(ticker, sort="new", time_filter="day", limit=limit):
                        text = f"{post.title} {post.selftext}"
                        score = _score_text(text)
                        total_score += score
                        posts.append({
                            "subreddit": sub_name,
                            "title": post.title,
                            "score": post.score,
                            "num_comments": post.num_comments,
                            "sentiment_score": round(score, 3),
                            "url": f"https://reddit.com{post.permalink}",
                            "created_utc": post.created_utc,
                        })
            except Exception as e:
                logger.error(f"Reddit fetch error for {ticker}: {e}")

        avg_score = round(total_score / len(posts), 3) if posts else 0.0
        result = {
            "ticker": ticker,
            "source": "reddit",
            "post_count": len(posts),
            "avg_sentiment": avg_score,
            "sentiment_label": _label(avg_score),
            "posts": posts[:20],
        }
        cache_set(cache_key, result, ttl=Config.SENTIMENT_CACHE_TTL)
        return result

    def get_news_sentiment(self, ticker: str, limit: int = 10) -> dict:
        """Fetch news headlines and score sentiment."""
        cache_key = f"news_sentiment:{ticker}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        articles = []
        total_score = 0.0

        if Config.NEWS_API_KEY:
            try:
                resp = requests.get(
                    f"{Config.NEWS_API_BASE_URL}/everything",
                    params={
                        "q": ticker,
                        "sortBy": "publishedAt",
                        "pageSize": limit,
                        "apiKey": Config.NEWS_API_KEY,
                    },
                    timeout=10,
                )
                resp.raise_for_status()
                data = resp.json()
                for article in data.get("articles", []):
                    text = f"{article.get('title', '')} {article.get('description', '')}"
                    score = _score_text(text)
                    total_score += score
                    articles.append({
                        "title": article.get("title"),
                        "source": article.get("source", {}).get("name"),
                        "url": article.get("url"),
                        "published_at": article.get("publishedAt"),
                        "sentiment_score": round(score, 3),
                    })
            except Exception as e:
                logger.error(f"News fetch error for {ticker}: {e}")

        avg_score = round(total_score / len(articles), 3) if articles else 0.0
        result = {
            "ticker": ticker,
            "source": "news",
            "article_count": len(articles),
            "avg_sentiment": avg_score,
            "sentiment_label": _label(avg_score),
            "articles": articles,
        }
        cache_set(cache_key, result, ttl=Config.NEWS_CACHE_TTL)
        return result

    def calculate_combined_score(self, reddit_data: dict, news_data: dict) -> dict:
        """Combine Reddit and news sentiment into a single score."""
        reddit_score = reddit_data.get("avg_sentiment", 0)
        news_score = news_data.get("avg_sentiment", 0)
        reddit_weight = 0.4
        news_weight = 0.6
        combined = round(reddit_score * reddit_weight + news_score * news_weight, 3)
        return {
            "ticker": reddit_data.get("ticker", news_data.get("ticker")),
            "combined_sentiment": combined,
            "sentiment_label": _label(combined),
            "reddit_sentiment": reddit_score,
            "news_sentiment": news_score,
            "reddit_posts": reddit_data.get("post_count", 0),
            "news_articles": news_data.get("article_count", 0),
        }

    def get_trending_tickers(self) -> list:
        """Get trending tickers from Reddit's wallstreetbets."""
        cache_key = "trending_tickers"
        cached = cache_get(cache_key)
        if cached:
            return cached

        reddit = self._get_reddit()
        if not reddit:
            return []

        ticker_counts: dict[str, int] = {}
        ticker_pattern = re.compile(r"\b([A-Z]{2,5})\b")
        common_words = {"THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL",
                        "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "HAS", "ITS",
                        "JUST", "LIKE", "BEEN", "THIS", "THAT", "WITH", "HAVE",
                        "FROM", "THEY", "WILL", "WHAT", "WHEN", "YOUR", "SAID",
                        "EACH", "SOME", "INTO", "THAN", "THEM", "VERY", "ALSO",
                        "YOLO", "IMO", "DD", "TL", "EDIT", "UPDATE", "PSA", "FYI"}
        try:
            for post in reddit.subreddit("wallstreetbets").hot(limit=50):
                matches = ticker_pattern.findall(f"{post.title} {post.selftext}")
                for m in matches:
                    if m not in common_words:
                        ticker_counts[m] = ticker_counts.get(m, 0) + 1
        except Exception as e:
            logger.error(f"Trending tickers error: {e}")
            return []

        trending = sorted(ticker_counts.items(), key=lambda x: x[1], reverse=True)[:15]
        result = [{"ticker": t, "mentions": c} for t, c in trending]
        cache_set(cache_key, result, ttl=Config.SENTIMENT_CACHE_TTL)
        return result


def _label(score: float) -> str:
    if score >= 0.3:
        return "bullish"
    if score <= -0.3:
        return "bearish"
    return "neutral"
