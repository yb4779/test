import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_reminders(app):
    """Check for due reminders and trigger notifications."""
    with app.app_context():
        from models import db
        from models.reminder import Reminder
        from services.notifications import apns_service

        now = datetime.now(timezone.utc)
        window = now + timedelta(minutes=1)

        due_reminders = Reminder.query.filter(
            Reminder.is_active.is_(True),
            Reminder.is_triggered.is_(False),
            Reminder.reminder_time <= window,
        ).all()

        for reminder in due_reminders:
            logger.info(f"Triggering reminder: {reminder.title}")

            # Mark as triggered
            reminder.is_triggered = True

            # Handle recurrence
            if reminder.recurrence:
                next_time = _calculate_next(reminder.reminder_time, reminder.recurrence)
                if next_time:
                    new_reminder = Reminder(
                        title=reminder.title,
                        description=reminder.description,
                        reminder_time=next_time,
                        recurrence=reminder.recurrence,
                        ticker=reminder.ticker,
                        alert_type=reminder.alert_type,
                    )
                    db.session.add(new_reminder)

        db.session.commit()


def _calculate_next(current_time: datetime, recurrence: str) -> datetime | None:
    """Calculate the next occurrence of a recurring reminder."""
    deltas = {
        "daily": timedelta(days=1),
        "weekly": timedelta(weeks=1),
        "hourly": timedelta(hours=1),
    }
    if recurrence in deltas:
        return current_time + deltas[recurrence]

    if recurrence == "market_open":
        # Next weekday at 9:30 ET (14:30 UTC)
        next_day = current_time + timedelta(days=1)
        while next_day.weekday() >= 5:
            next_day += timedelta(days=1)
        return next_day.replace(hour=14, minute=30, second=0, microsecond=0)

    if recurrence == "market_close":
        # Next weekday at 16:00 ET (21:00 UTC)
        next_day = current_time + timedelta(days=1)
        while next_day.weekday() >= 5:
            next_day += timedelta(days=1)
        return next_day.replace(hour=21, minute=0, second=0, microsecond=0)

    return None


def init_scheduler(app):
    """Initialize the background scheduler for reminder checking."""
    if not scheduler.running:
        scheduler.add_job(
            check_reminders,
            trigger=IntervalTrigger(seconds=30),
            args=[app],
            id="check_reminders",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Reminder scheduler started")
