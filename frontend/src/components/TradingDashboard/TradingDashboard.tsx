import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { marketApi } from "../../services/api";
import type { StockQuote, IntradayPoint, OptionsData } from "../../types";

interface Props {
  activeTicker: string;
  onTickerChange: (ticker: string) => void;
}

const WATCHLIST = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "RELIANCE.BSE", "TCS.BSE"];

export default function TradingDashboard({ activeTicker, onTickerChange }: Props) {
  const [tab, setTab] = useState<"quotes" | "chart" | "options">("quotes");
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [intraday, setIntraday] = useState<IntradayPoint[]>([]);
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [market, setMarket] = useState<"US" | "IN">("US");

  // Fetch quotes for watchlist
  const fetchQuotes = useCallback(async () => {
    const tickers = market === "US"
      ? WATCHLIST.filter((t) => !t.includes(".BSE"))
      : WATCHLIST.filter((t) => t.includes(".BSE"));

    for (const ticker of tickers) {
      try {
        const q = (await marketApi.getQuote(ticker, market)) as StockQuote;
        setQuotes((prev) => ({ ...prev, [ticker]: q }));
      } catch {
        /* skip failed quotes */
      }
    }
  }, [market]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Fetch chart data when active ticker or tab changes
  useEffect(() => {
    if (tab === "chart" && activeTicker) {
      marketApi.getIntraday(activeTicker, "5min", market).then((data: any) => {
        setIntraday(data?.data || []);
      }).catch(() => setIntraday([]));
    }
  }, [tab, activeTicker, market]);

  // Fetch options data
  useEffect(() => {
    if (tab === "options" && activeTicker) {
      marketApi.getOptions(activeTicker).then((data) => {
        setOptions(data as OptionsData);
      }).catch(() => setOptions(null));
    }
  }, [tab, activeTicker]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    onTickerChange(searchQuery.toUpperCase());
    setSearchQuery("");
  };

  const activeQuotes = Object.values(quotes).filter((q) =>
    market === "US" ? !q.symbol?.includes(".BSE") : q.symbol?.includes(".BSE")
  );

  return (
    <div>
      <div className="card-header">
        <h2>Trading Dashboard</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`tab-btn ${market === "US" ? "active" : ""}`}
            onClick={() => setMarket("US")}
          >
            US
          </button>
          <button
            className={`tab-btn ${market === "IN" ? "active" : ""}`}
            onClick={() => setMarket("IN")}
          >
            India
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="form-row">
        <input
          className="form-input"
          placeholder="Search ticker..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>Go</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === "quotes" ? "active" : ""}`} onClick={() => setTab("quotes")}>
          Quotes
        </button>
        <button className={`tab-btn ${tab === "chart" ? "active" : ""}`} onClick={() => setTab("chart")}>
          Chart
        </button>
        <button className={`tab-btn ${tab === "options" ? "active" : ""}`} onClick={() => setTab("options")}>
          Options
        </button>
      </div>

      {/* Quotes Grid */}
      {tab === "quotes" && (
        <div className="quote-grid">
          {activeQuotes.map((q) => (
            <div
              key={q.ticker}
              className="quote-item"
              style={{ cursor: "pointer" }}
              onClick={() => onTickerChange(q.ticker)}
            >
              <div className="ticker">{q.ticker}</div>
              <div className="price">${q.price.toFixed(2)}</div>
              <div className={`change ${q.change >= 0 ? "positive" : "negative"}`}>
                {q.change >= 0 ? "+" : ""}
                {q.change.toFixed(2)} ({q.change_percent})
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Vol: {(q.volume / 1e6).toFixed(1)}M
              </div>
            </div>
          ))}
          {activeQuotes.length === 0 && (
            <div className="loading">Loading quotes...</div>
          )}
        </div>
      )}

      {/* Intraday Chart */}
      {tab === "chart" && (
        <div>
          <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>
            {activeTicker} — Intraday
          </div>
          {intraday.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...intraday].reverse()}>
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.split(" ")[1]?.slice(0, 5) || v}
                />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="var(--accent)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="loading">No chart data available</div>
          )}
        </div>
      )}

      {/* Options Chain */}
      {tab === "options" && (
        <div>
          <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>
            {activeTicker} Options Chain
          </div>
          {options ? (
            <>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                Call Vol: {options.total_call_volume.toLocaleString()} |
                Put Vol: {options.total_put_volume.toLocaleString()} |
                P/C Ratio: {options.total_call_volume > 0
                  ? (options.total_put_volume / options.total_call_volume).toFixed(2)
                  : "N/A"}
              </div>
              <table className="options-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Strike</th>
                    <th>Exp</th>
                    <th>Last</th>
                    <th>IV</th>
                    <th>Vol</th>
                    <th>OI</th>
                  </tr>
                </thead>
                <tbody>
                  {options.calls.slice(0, 5).map((c, i) => (
                    <tr key={`c-${i}`}>
                      <td style={{ color: "var(--green)" }}>CALL</td>
                      <td>${c.strike}</td>
                      <td>{c.expiration}</td>
                      <td>${c.last_price.toFixed(2)}</td>
                      <td>{(c.implied_volatility * 100).toFixed(1)}%</td>
                      <td>{c.volume.toLocaleString()}</td>
                      <td>{c.open_interest.toLocaleString()}</td>
                    </tr>
                  ))}
                  {options.puts.slice(0, 5).map((p, i) => (
                    <tr key={`p-${i}`}>
                      <td style={{ color: "var(--red)" }}>PUT</td>
                      <td>${p.strike}</td>
                      <td>{p.expiration}</td>
                      <td>${p.last_price.toFixed(2)}</td>
                      <td>{(p.implied_volatility * 100).toFixed(1)}%</td>
                      <td>{p.volume.toLocaleString()}</td>
                      <td>{p.open_interest.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="loading">No options data available</div>
          )}
        </div>
      )}
    </div>
  );
}
