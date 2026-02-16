from flask import Blueprint, jsonify, request
from services.sentiment import SentimentService

sentiment_bp = Blueprint("sentiment", __name__)
sentiment_service = SentimentService()


@sentiment_bp.route("/reddit/<ticker>")
def get_reddit_sentiment(ticker):
    """Get Reddit sentiment for a stock ticker."""
    subreddits = request.args.get("subreddits", "wallstreetbets,stocks,options")
    limit = request.args.get("limit", 25, type=int)
    data = sentiment_service.get_reddit_sentiment(ticker, subreddits.split(","), limit)
    return jsonify(data)


@sentiment_bp.route("/news/<ticker>")
def get_news_sentiment(ticker):
    """Get news headlines and sentiment for a ticker."""
    limit = request.args.get("limit", 10, type=int)
    data = sentiment_service.get_news_sentiment(ticker, limit)
    return jsonify(data)


@sentiment_bp.route("/combined/<ticker>")
def get_combined_sentiment(ticker):
    """Get combined sentiment score from Reddit + news."""
    reddit_data = sentiment_service.get_reddit_sentiment(ticker)
    news_data = sentiment_service.get_news_sentiment(ticker)
    combined = sentiment_service.calculate_combined_score(reddit_data, news_data)
    return jsonify(combined)


@sentiment_bp.route("/trending")
def get_trending():
    """Get currently trending tickers on Reddit."""
    data = sentiment_service.get_trending_tickers()
    return jsonify({"trending": data})
