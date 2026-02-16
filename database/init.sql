-- Trading Assistant Database Schema
-- This runs automatically on first docker-compose up

CREATE TABLE IF NOT EXISTS trading_ideas (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL DEFAULT 'US',
    idea_type VARCHAR(20) NOT NULL,
    entry_price FLOAT,
    target_price FLOAT,
    stop_loss FLOAT,
    notes TEXT,
    voice_transcript TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    reminder_time TIMESTAMP NOT NULL,
    recurrence VARCHAR(20),
    ticker VARCHAR(20),
    alert_type VARCHAR(20) DEFAULT 'push',
    is_triggered BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    category VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL DEFAULT 'US',
    price_alert_above FLOAT,
    price_alert_below FLOAT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    is_enabled BOOLEAN DEFAULT FALSE,
    config_json TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trading_ideas_ticker ON trading_ideas(ticker);
CREATE INDEX IF NOT EXISTS idx_trading_ideas_status ON trading_ideas(status);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON watchlist(ticker);

-- Seed default features
INSERT INTO features (name, description, category, is_enabled) VALUES
    ('technical_indicators', 'RSI, MACD, Bollinger Bands, Moving Averages overlay on charts', 'analysis', false),
    ('options_flow', 'Track unusual options activity and large block trades', 'data', false),
    ('earnings_calendar', 'Upcoming earnings dates and consensus estimates', 'data', false),
    ('portfolio_tracker', 'Track your positions, P&L, and portfolio allocation', 'analysis', false),
    ('price_alerts', 'Custom price alerts with push notifications', 'automation', false),
    ('backtesting', 'Test trading strategies against historical data', 'analysis', false),
    ('heatmap', 'Sector and market cap heatmap visualization', 'visualization', false),
    ('correlation_matrix', 'Cross-asset correlation analysis', 'analysis', false)
ON CONFLICT (name) DO NOTHING;
