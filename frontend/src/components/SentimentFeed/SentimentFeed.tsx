import { useState, useEffect } from "react";
import { sentimentApi } from "../../services/api";
import type { SentimentData, CombinedSentiment } from "../../types";

interface Props {
  ticker: string;
}

export default function SentimentFeed({ ticker }: Props) {
  const [tab, setTab] = useState<"combined" | "reddit" | "news" | "trending">("combined");
  const [combined, setCombined] = useState<CombinedSentiment | null>(null);
  const [reddit, setReddit] = useState<SentimentData | null>(null);
  const [news, setNews] = useState<SentimentData | null>(null);
  const [trending, setTrending] = useState<{ ticker: string; mentions: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);

    if (tab === "combined") {
      sentimentApi.getCombined(ticker)
        .then((d) => setCombined(d as CombinedSentiment))
        .catch(() => setCombined(null))
        .finally(() => setLoading(false));
    } else if (tab === "reddit") {
      sentimentApi.getReddit(ticker)
        .then((d) => setReddit(d as SentimentData))
        .catch(() => setReddit(null))
        .finally(() => setLoading(false));
    } else if (tab === "news") {
      sentimentApi.getNews(ticker)
        .then((d) => setNews(d as SentimentData))
        .catch(() => setNews(null))
        .finally(() => setLoading(false));
    } else if (tab === "trending") {
      sentimentApi.getTrending()
        .then((d: any) => setTrending(d.trending || []))
        .catch(() => setTrending([]))
        .finally(() => setLoading(false));
    }
  }, [ticker, tab]);

  const sentimentColor = (score: number) =>
    score >= 0.3 ? "bullish" : score <= -0.3 ? "bearish" : "neutral";

  const sentimentPercent = (score: number) => Math.round((score + 1) * 50);

  return (
    <div>
      <div className="card-header">
        <h2>Sentiment — {ticker}</h2>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === "combined" ? "active" : ""}`} onClick={() => setTab("combined")}>
          Combined
        </button>
        <button className={`tab-btn ${tab === "reddit" ? "active" : ""}`} onClick={() => setTab("reddit")}>
          Reddit
        </button>
        <button className={`tab-btn ${tab === "news" ? "active" : ""}`} onClick={() => setTab("news")}>
          News
        </button>
        <button className={`tab-btn ${tab === "trending" ? "active" : ""}`} onClick={() => setTab("trending")}>
          Trending
        </button>
      </div>

      {loading && <div className="loading">Analyzing sentiment...</div>}

      {/* Combined */}
      {!loading && tab === "combined" && combined && (
        <div>
          <div className="sentiment-bar">
            <span style={{ fontSize: 13 }}>Bearish</span>
            <div className="sentiment-meter">
              <div
                className={`fill ${sentimentColor(combined.combined_sentiment)}`}
                style={{ width: `${sentimentPercent(combined.combined_sentiment)}%` }}
              />
            </div>
            <span style={{ fontSize: 13 }}>Bullish</span>
          </div>
          <div style={{ textAlign: "center", fontSize: 28, fontWeight: 700, margin: "12px 0" }}>
            {combined.combined_sentiment > 0 ? "+" : ""}
            {combined.combined_sentiment.toFixed(3)}
          </div>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span className={`tag ${sentimentColor(combined.combined_sentiment)}`}>
              {combined.sentiment_label.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", fontSize: 13 }}>
            <div>
              <div style={{ color: "var(--text-secondary)" }}>Reddit</div>
              <div>{combined.reddit_sentiment.toFixed(3)} ({combined.reddit_posts} posts)</div>
            </div>
            <div>
              <div style={{ color: "var(--text-secondary)" }}>News</div>
              <div>{combined.news_sentiment.toFixed(3)} ({combined.news_articles} articles)</div>
            </div>
          </div>
        </div>
      )}

      {/* Reddit posts */}
      {!loading && tab === "reddit" && reddit && (
        <div>
          <div className="sentiment-bar">
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Avg: {reddit.avg_sentiment.toFixed(3)} · {reddit.post_count} posts
            </span>
          </div>
          <div className="sentiment-list">
            {reddit.posts?.map((p, i) => (
              <div key={i} className="sentiment-item">
                <div>{p.title}</div>
                <div className="source">
                  r/{p.subreddit} · Score: {p.score} · {p.num_comments} comments ·
                  Sentiment: <span style={{
                    color: p.sentiment_score >= 0.3 ? "var(--green)" :
                      p.sentiment_score <= -0.3 ? "var(--red)" : "var(--yellow)"
                  }}>{p.sentiment_score.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {(!reddit.posts || reddit.posts.length === 0) && (
              <div className="loading">No Reddit posts found</div>
            )}
          </div>
        </div>
      )}

      {/* News articles */}
      {!loading && tab === "news" && news && (
        <div>
          <div className="sentiment-bar">
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Avg: {news.avg_sentiment.toFixed(3)} · {news.article_count} articles
            </span>
          </div>
          <div className="sentiment-list">
            {news.articles?.map((a, i) => (
              <div key={i} className="sentiment-item">
                <div>
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                    {a.title}
                  </a>
                </div>
                <div className="source">
                  {a.source} · {new Date(a.published_at).toLocaleDateString()} ·
                  Sentiment: <span style={{
                    color: a.sentiment_score >= 0.3 ? "var(--green)" :
                      a.sentiment_score <= -0.3 ? "var(--red)" : "var(--yellow)"
                  }}>{a.sentiment_score.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {(!news.articles || news.articles.length === 0) && (
              <div className="loading">No news articles found</div>
            )}
          </div>
        </div>
      )}

      {/* Trending tickers */}
      {!loading && tab === "trending" && (
        <div className="sentiment-list">
          {trending.map((t, i) => (
            <div key={i} className="sentiment-item" style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{t.ticker}</strong>
              <span style={{ color: "var(--text-secondary)" }}>{t.mentions} mentions</span>
            </div>
          ))}
          {trending.length === 0 && <div className="loading">No trending data available</div>}
        </div>
      )}
    </div>
  );
}
