from datetime import datetime
from flask import Blueprint, jsonify, request
from models import db
from models.trading_idea import TradingIdea
from models.reminder import Reminder

tasks_bp = Blueprint("tasks", __name__)


# --- Trading Ideas ---

@tasks_bp.route("/ideas", methods=["GET"])
def list_ideas():
    """List all trading ideas."""
    status = request.args.get("status", "active")
    market = request.args.get("market")
    query = TradingIdea.query
    if status != "all":
        query = query.filter_by(status=status)
    if market:
        query = query.filter_by(market=market)
    ideas = query.order_by(TradingIdea.created_at.desc()).all()
    return jsonify({"ideas": [i.to_dict() for i in ideas]})


@tasks_bp.route("/ideas", methods=["POST"])
def create_idea():
    """Create a new trading idea."""
    data = request.get_json()
    if not data or not data.get("ticker"):
        return jsonify({"error": "ticker is required"}), 400

    idea = TradingIdea(
        ticker=data["ticker"].upper(),
        market=data.get("market", "US"),
        idea_type=data.get("idea_type", "watch"),
        entry_price=data.get("entry_price"),
        target_price=data.get("target_price"),
        stop_loss=data.get("stop_loss"),
        notes=data.get("notes"),
        voice_transcript=data.get("voice_transcript"),
    )
    db.session.add(idea)
    db.session.commit()
    return jsonify(idea.to_dict()), 201


@tasks_bp.route("/ideas/<int:idea_id>", methods=["PUT"])
def update_idea(idea_id):
    """Update a trading idea."""
    idea = db.session.get(TradingIdea, idea_id)
    if not idea:
        return jsonify({"error": "Idea not found"}), 404

    data = request.get_json()
    for field in ["ticker", "market", "idea_type", "entry_price", "target_price",
                   "stop_loss", "notes", "status"]:
        if field in data:
            setattr(idea, field, data[field])

    db.session.commit()
    return jsonify(idea.to_dict())


@tasks_bp.route("/ideas/<int:idea_id>", methods=["DELETE"])
def delete_idea(idea_id):
    """Delete a trading idea."""
    idea = db.session.get(TradingIdea, idea_id)
    if not idea:
        return jsonify({"error": "Idea not found"}), 404
    db.session.delete(idea)
    db.session.commit()
    return jsonify({"message": "Idea deleted"})


# --- Reminders ---

@tasks_bp.route("/reminders", methods=["GET"])
def list_reminders():
    """List all active reminders."""
    active_only = request.args.get("active_only", "true") == "true"
    query = Reminder.query
    if active_only:
        query = query.filter_by(is_active=True)
    reminders = query.order_by(Reminder.reminder_time.asc()).all()
    return jsonify({"reminders": [r.to_dict() for r in reminders]})


@tasks_bp.route("/reminders", methods=["POST"])
def create_reminder():
    """Create a new reminder."""
    data = request.get_json()
    if not data or not data.get("title") or not data.get("reminder_time"):
        return jsonify({"error": "title and reminder_time are required"}), 400

    reminder = Reminder(
        title=data["title"],
        description=data.get("description"),
        reminder_time=datetime.fromisoformat(data["reminder_time"]),
        recurrence=data.get("recurrence"),
        ticker=data.get("ticker"),
        alert_type=data.get("alert_type", "push"),
    )
    db.session.add(reminder)
    db.session.commit()
    return jsonify(reminder.to_dict()), 201


@tasks_bp.route("/reminders/<int:reminder_id>", methods=["PUT"])
def update_reminder(reminder_id):
    """Update a reminder."""
    reminder = db.session.get(Reminder, reminder_id)
    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404

    data = request.get_json()
    for field in ["title", "description", "recurrence", "ticker", "alert_type", "is_active"]:
        if field in data:
            setattr(reminder, field, data[field])
    if "reminder_time" in data:
        reminder.reminder_time = datetime.fromisoformat(data["reminder_time"])

    db.session.commit()
    return jsonify(reminder.to_dict())


@tasks_bp.route("/reminders/<int:reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    """Delete a reminder."""
    reminder = db.session.get(Reminder, reminder_id)
    if not reminder:
        return jsonify({"error": "Reminder not found"}), 404
    db.session.delete(reminder)
    db.session.commit()
    return jsonify({"message": "Reminder deleted"})
