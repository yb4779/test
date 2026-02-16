import { useState, useEffect } from "react";
import VoiceInput from "./components/VoiceInput/VoiceInput";
import TradingDashboard from "./components/TradingDashboard/TradingDashboard";
import TaskManager from "./components/TaskManager/TaskManager";
import SentimentFeed from "./components/SentimentFeed/SentimentFeed";
import ExpandableFeatures from "./components/ExpandableFeatures/ExpandableFeatures";
import { marketApi } from "./services/api";
import type { MarketStatus } from "./types";

export default function App() {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [activeTicker, setActiveTicker] = useState("AAPL");

  useEffect(() => {
    marketApi.getMarketStatus().then((data) => setMarketStatus(data as MarketStatus));
    const interval = setInterval(() => {
      marketApi.getMarketStatus().then((data) => setMarketStatus(data as MarketStatus));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Trading Assistant</h1>
        <div className="market-indicators">
          <div className="market-dot">
            <span className={`dot ${marketStatus?.US.is_open ? "open" : "closed"}`} />
            US {marketStatus?.US.is_open ? "Open" : "Closed"}
          </div>
          <div className="market-dot">
            <span className={`dot ${marketStatus?.IN.is_open ? "open" : "closed"}`} />
            IN {marketStatus?.IN.is_open ? "Open" : "Closed"}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="voice-section card">
          <VoiceInput onTickerDetected={setActiveTicker} />
        </div>

        <div className="dashboard-section card">
          <TradingDashboard activeTicker={activeTicker} onTickerChange={setActiveTicker} />
        </div>

        <div className="tasks-section card">
          <TaskManager />
        </div>

        <div className="sentiment-section card">
          <SentimentFeed ticker={activeTicker} />
        </div>

        <div className="features-section card">
          <ExpandableFeatures />
        </div>
      </main>
    </div>
  );
}
