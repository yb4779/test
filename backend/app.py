from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_migrate import Migrate

from config import Config
from models import db
from api.market import market_bp
from api.sentiment import sentiment_bp
from api.tasks import tasks_bp
from api.voice import voice_bp
from api.features import features_bp
from services.scheduler import init_scheduler

socketio = SocketIO()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*", async_mode="eventlet")

    # Blueprints
    app.register_blueprint(market_bp, url_prefix="/api/market")
    app.register_blueprint(sentiment_bp, url_prefix="/api/sentiment")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(voice_bp, url_prefix="/api/voice")
    app.register_blueprint(features_bp, url_prefix="/api/features")

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "healthy", "service": "trading-assistant-api"}

    # Create tables and start scheduler
    with app.app_context():
        db.create_all()
        init_scheduler(app)

    return app


if __name__ == "__main__":
    app = create_app()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
