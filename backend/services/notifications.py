import time
import logging
import jwt
import httpx
from config import Config

logger = logging.getLogger(__name__)


class APNsService:
    """Apple Push Notification service for iPhone alerts."""

    def __init__(self):
        self.key_id = Config.APNS_KEY_ID
        self.team_id = Config.APNS_TEAM_ID
        self.bundle_id = Config.APNS_BUNDLE_ID
        self.key_path = Config.APNS_KEY_PATH
        self._token = None
        self._token_time = 0

    def _get_auth_token(self) -> str:
        """Generate or return cached JWT for APNs authentication."""
        now = time.time()
        if self._token and (now - self._token_time) < 3000:
            return self._token

        try:
            with open(self.key_path, "r") as f:
                key = f.read()
        except FileNotFoundError:
            logger.error(f"APNs key not found at {self.key_path}")
            return ""

        payload = {"iss": self.team_id, "iat": int(now)}
        self._token = jwt.encode(payload, key, algorithm="ES256",
                                 headers={"kid": self.key_id})
        self._token_time = now
        return self._token

    def send_notification(self, device_token: str, title: str, body: str,
                          data: dict | None = None) -> bool:
        """Send a push notification to an iOS device."""
        if not all([self.key_id, self.team_id, device_token]):
            logger.warning("APNs not configured, skipping notification")
            return False

        token = self._get_auth_token()
        if not token:
            return False

        url = f"https://api.push.apple.com/3/device/{device_token}"
        headers = {
            "authorization": f"bearer {token}",
            "apns-topic": self.bundle_id,
            "apns-push-type": "alert",
            "apns-priority": "10",
        }
        payload = {
            "aps": {
                "alert": {"title": title, "body": body},
                "sound": "default",
                "badge": 1,
            },
        }
        if data:
            payload["data"] = data

        try:
            with httpx.Client(http2=True) as client:
                resp = client.post(url, json=payload, headers=headers, timeout=10)
                if resp.status_code == 200:
                    logger.info(f"Push sent to {device_token[:8]}...")
                    return True
                logger.error(f"APNs error {resp.status_code}: {resp.text}")
                return False
        except Exception as e:
            logger.error(f"APNs send error: {e}")
            return False


# Singleton
apns_service = APNsService()
