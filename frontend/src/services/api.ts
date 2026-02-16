const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Market
export const marketApi = {
  getQuote: (ticker: string, market = "US") =>
    request(`/market/quote/${ticker}?market=${market}`),
  getIntraday: (ticker: string, interval = "5min", market = "US") =>
    request(`/market/intraday/${ticker}?interval=${interval}&market=${market}`),
  getOptions: (ticker: string) => request(`/market/options/${ticker}`),
  search: (q: string) => request(`/market/search?q=${q}`),
  getMarketStatus: () => request(`/market/market-status`),
};

// Sentiment
export const sentimentApi = {
  getReddit: (ticker: string) => request(`/sentiment/reddit/${ticker}`),
  getNews: (ticker: string) => request(`/sentiment/news/${ticker}`),
  getCombined: (ticker: string) => request(`/sentiment/combined/${ticker}`),
  getTrending: () => request(`/sentiment/trending`),
};

// Tasks & Reminders
export const tasksApi = {
  listIdeas: (status = "active") => request(`/tasks/ideas?status=${status}`),
  createIdea: (data: Record<string, unknown>) =>
    request(`/tasks/ideas`, { method: "POST", body: JSON.stringify(data) }),
  updateIdea: (id: number, data: Record<string, unknown>) =>
    request(`/tasks/ideas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteIdea: (id: number) =>
    request(`/tasks/ideas/${id}`, { method: "DELETE" }),

  listReminders: () => request(`/tasks/reminders`),
  createReminder: (data: Record<string, unknown>) =>
    request(`/tasks/reminders`, { method: "POST", body: JSON.stringify(data) }),
  updateReminder: (id: number, data: Record<string, unknown>) =>
    request(`/tasks/reminders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReminder: (id: number) =>
    request(`/tasks/reminders/${id}`, { method: "DELETE" }),
};

// Voice
export const voiceApi = {
  process: (transcript: string, market = "US") =>
    request(`/voice/process`, {
      method: "POST",
      body: JSON.stringify({ transcript, market }),
    }),
  parseOnly: (transcript: string) =>
    request(`/voice/parse`, {
      method: "POST",
      body: JSON.stringify({ transcript }),
    }),
};

// Features
export const featuresApi = {
  list: () => request(`/features/`),
  toggle: (id: number) =>
    request(`/features/${id}/toggle`, { method: "POST" }),
  add: (data: Record<string, unknown>) =>
    request(`/features/`, { method: "POST", body: JSON.stringify(data) }),
};
