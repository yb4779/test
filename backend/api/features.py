from flask import Blueprint, jsonify, request
from models import db
from models.feature import Feature

features_bp = Blueprint("features", __name__)

# Default features available in the expandable panel
DEFAULT_FEATURES = [
    {
        "name": "technical_indicators",
        "description": "RSI, MACD, Bollinger Bands, Moving Averages overlay on charts",
        "category": "analysis",
    },
    {
        "name": "options_flow",
        "description": "Track unusual options activity and large block trades",
        "category": "data",
    },
    {
        "name": "earnings_calendar",
        "description": "Upcoming earnings dates and consensus estimates",
        "category": "data",
    },
    {
        "name": "portfolio_tracker",
        "description": "Track your positions, P&L, and portfolio allocation",
        "category": "analysis",
    },
    {
        "name": "price_alerts",
        "description": "Custom price alerts with push notifications",
        "category": "automation",
    },
    {
        "name": "backtesting",
        "description": "Test trading strategies against historical data",
        "category": "analysis",
    },
    {
        "name": "heatmap",
        "description": "Sector and market cap heatmap visualization",
        "category": "visualization",
    },
    {
        "name": "correlation_matrix",
        "description": "Cross-asset correlation analysis",
        "category": "analysis",
    },
]


@features_bp.route("/", methods=["GET"])
def list_features():
    """List all available features and their status."""
    features = Feature.query.order_by(Feature.category, Feature.name).all()
    if not features:
        # Seed defaults on first access
        for feat in DEFAULT_FEATURES:
            f = Feature(name=feat["name"], description=feat["description"], category=feat["category"])
            db.session.add(f)
        db.session.commit()
        features = Feature.query.order_by(Feature.category, Feature.name).all()
    return jsonify({"features": [f.to_dict() for f in features]})


@features_bp.route("/<int:feature_id>/toggle", methods=["POST"])
def toggle_feature(feature_id):
    """Enable or disable a feature."""
    feature = db.session.get(Feature, feature_id)
    if not feature:
        return jsonify({"error": "Feature not found"}), 404
    feature.is_enabled = not feature.is_enabled
    db.session.commit()
    return jsonify(feature.to_dict())


@features_bp.route("/", methods=["POST"])
def add_feature():
    """Add a new custom feature."""
    data = request.get_json()
    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    existing = Feature.query.filter_by(name=data["name"]).first()
    if existing:
        return jsonify({"error": "Feature already exists"}), 409

    feature = Feature(
        name=data["name"],
        description=data.get("description", ""),
        category=data.get("category", "custom"),
        is_enabled=data.get("is_enabled", False),
        config_json=data.get("config_json"),
    )
    db.session.add(feature)
    db.session.commit()
    return jsonify(feature.to_dict()), 201
