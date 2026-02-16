import re
from flask import Blueprint, jsonify, request
from models import db
from models.trading_idea import TradingIdea

voice_bp = Blueprint("voice", __name__)

# Simple keyword-based intent parser for voice transcripts
TICKER_PATTERN = re.compile(r"\b([A-Z]{1,5})\b")
ACTION_KEYWORDS = {
    "buy": ["buy", "long", "call", "bullish", "accumulate"],
    "sell": ["sell", "short", "put", "bearish", "dump", "exit"],
    "watch": ["watch", "monitor", "track", "keep an eye"],
    "options": ["option", "options", "call", "put", "strike", "expiry"],
}


def parse_voice_intent(transcript: str) -> dict:
    """Parse a voice transcript into a structured trading idea."""
    lower = transcript.lower()

    # Detect action
    idea_type = "watch"
    for action, keywords in ACTION_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            idea_type = action
            break

    # Extract tickers (uppercase words 1-5 chars that look like tickers)
    tickers = TICKER_PATTERN.findall(transcript)
    # Filter common English words
    common_words = {"I", "A", "THE", "AND", "OR", "BUT", "FOR", "AT", "TO", "IN", "ON", "IS", "IT", "IF"}
    tickers = [t for t in tickers if t not in common_words and len(t) >= 2]

    # Extract price mentions
    price_pattern = re.compile(r"\$?([\d]+\.?\d*)")
    prices = [float(p) for p in price_pattern.findall(transcript)]

    result = {
        "idea_type": idea_type,
        "tickers": tickers[:5],  # max 5 tickers
        "notes": transcript,
        "voice_transcript": transcript,
    }

    if len(prices) >= 1:
        result["entry_price"] = prices[0]
    if len(prices) >= 2:
        result["target_price"] = prices[1]
    if len(prices) >= 3:
        result["stop_loss"] = prices[2]

    return result


@voice_bp.route("/process", methods=["POST"])
def process_voice():
    """Process a voice transcript and create trading ideas."""
    data = request.get_json()
    transcript = data.get("transcript", "")
    if not transcript:
        return jsonify({"error": "transcript is required"}), 400

    parsed = parse_voice_intent(transcript)

    # Create trading ideas for each detected ticker
    created_ideas = []
    for ticker in parsed.get("tickers", []):
        idea = TradingIdea(
            ticker=ticker,
            market=data.get("market", "US"),
            idea_type=parsed["idea_type"],
            entry_price=parsed.get("entry_price"),
            target_price=parsed.get("target_price"),
            stop_loss=parsed.get("stop_loss"),
            notes=parsed.get("notes"),
            voice_transcript=transcript,
        )
        db.session.add(idea)
        created_ideas.append(idea)

    db.session.commit()

    return jsonify({
        "parsed": parsed,
        "ideas_created": [i.to_dict() for i in created_ideas],
    })


@voice_bp.route("/parse", methods=["POST"])
def parse_only():
    """Parse a voice transcript without saving (preview mode)."""
    data = request.get_json()
    transcript = data.get("transcript", "")
    if not transcript:
        return jsonify({"error": "transcript is required"}), 400
    return jsonify(parse_voice_intent(transcript))
