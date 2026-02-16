// Market Data
export interface StockQuote {
  ticker: string;
  symbol: string;
  market: "US" | "IN";
  price: number;
  change: number;
  change_percent: string;
  volume: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  timestamp: string;
}

export interface IntradayPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionsData {
  ticker: string;
  calls: OptionEntry[];
  puts: OptionEntry[];
  total_call_volume: number;
  total_put_volume: number;
}

export interface OptionEntry {
  strike: number;
  expiration: string;
  last_price: number;
  bid: number;
  ask: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
}

// Trading Ideas
export interface TradingIdea {
  id: number;
  ticker: string;
  market: "US" | "IN";
  idea_type: "buy" | "sell" | "watch" | "options";
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  notes: string | null;
  voice_transcript: string | null;
  status: "active" | "executed" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Reminders
export interface Reminder {
  id: number;
  title: string;
  description: string | null;
  reminder_time: string;
  recurrence: string | null;
  ticker: string | null;
  alert_type: "push" | "email" | "in_app";
  is_triggered: boolean;
  is_active: boolean;
  created_at: string;
}

// Sentiment
export interface SentimentData {
  ticker: string;
  source: "reddit" | "news";
  post_count?: number;
  article_count?: number;
  avg_sentiment: number;
  sentiment_label: "bullish" | "bearish" | "neutral";
  posts?: RedditPost[];
  articles?: NewsArticle[];
}

export interface RedditPost {
  subreddit: string;
  title: string;
  score: number;
  num_comments: number;
  sentiment_score: number;
  url: string;
  created_utc: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  published_at: string;
  sentiment_score: number;
}

export interface CombinedSentiment {
  ticker: string;
  combined_sentiment: number;
  sentiment_label: string;
  reddit_sentiment: number;
  news_sentiment: number;
  reddit_posts: number;
  news_articles: number;
}

// Features
export interface Feature {
  id: number;
  name: string;
  description: string;
  category: string;
  is_enabled: boolean;
  config_json: string | null;
  created_at: string;
}

// Voice
export interface VoiceParsed {
  idea_type: string;
  tickers: string[];
  notes: string;
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
}

// Market Status
export interface MarketStatus {
  US: { is_open: boolean; next_open: string | null; next_close: string | null };
  IN: { is_open: boolean; next_open: string | null; next_close: string | null };
}
