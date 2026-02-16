from flask import Blueprint, jsonify, request
from services.market_data import MarketDataService

market_bp = Blueprint("market", __name__)
market_service = MarketDataService()


@market_bp.route("/quote/<ticker>")
def get_quote(ticker):
    """Get real-time quote for a stock."""
    market = request.args.get("market", "US")
    data = market_service.get_quote(ticker, market)
    if data is None:
        return jsonify({"error": f"Could not fetch quote for {ticker}"}), 404
    return jsonify(data)


@market_bp.route("/intraday/<ticker>")
def get_intraday(ticker):
    """Get intraday price data."""
    interval = request.args.get("interval", "5min")
    market = request.args.get("market", "US")
    data = market_service.get_intraday(ticker, interval, market)
    if data is None:
        return jsonify({"error": f"Could not fetch intraday data for {ticker}"}), 404
    return jsonify(data)


@market_bp.route("/options/<ticker>")
def get_options(ticker):
    """Get options chain data for a stock."""
    data = market_service.get_options_chain(ticker)
    if data is None:
        return jsonify({"error": f"Could not fetch options data for {ticker}"}), 404
    return jsonify(data)


@market_bp.route("/search")
def search_stocks():
    """Search for stocks by keyword."""
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    results = market_service.search(query)
    return jsonify({"results": results})


@market_bp.route("/market-status")
def market_status():
    """Get current market status for US and Indian markets."""
    return jsonify(market_service.get_market_status())
