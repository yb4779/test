import { useState, useEffect } from "react";
import { tasksApi } from "../../services/api";
import type { TradingIdea, Reminder } from "../../types";

export default function TaskManager() {
  const [tab, setTab] = useState<"ideas" | "reminders">("ideas");
  const [ideas, setIdeas] = useState<TradingIdea[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);

  // Idea form state
  const [ideaForm, setIdeaForm] = useState({
    ticker: "", idea_type: "watch", market: "US",
    entry_price: "", target_price: "", stop_loss: "", notes: "",
  });

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    title: "", description: "", reminder_time: "",
    recurrence: "", ticker: "", alert_type: "push",
  });

  const fetchIdeas = () =>
    tasksApi.listIdeas("all").then((d: any) => setIdeas(d.ideas || []));
  const fetchReminders = () =>
    tasksApi.listReminders().then((d: any) => setReminders(d.reminders || []));

  useEffect(() => {
    fetchIdeas();
    fetchReminders();
  }, []);

  const createIdea = async () => {
    if (!ideaForm.ticker) return;
    await tasksApi.createIdea({
      ...ideaForm,
      entry_price: ideaForm.entry_price ? parseFloat(ideaForm.entry_price) : null,
      target_price: ideaForm.target_price ? parseFloat(ideaForm.target_price) : null,
      stop_loss: ideaForm.stop_loss ? parseFloat(ideaForm.stop_loss) : null,
    });
    setIdeaForm({ ticker: "", idea_type: "watch", market: "US", entry_price: "", target_price: "", stop_loss: "", notes: "" });
    setShowIdeaForm(false);
    fetchIdeas();
  };

  const createReminder = async () => {
    if (!reminderForm.title || !reminderForm.reminder_time) return;
    await tasksApi.createReminder({
      ...reminderForm,
      recurrence: reminderForm.recurrence || null,
      ticker: reminderForm.ticker || null,
    });
    setReminderForm({ title: "", description: "", reminder_time: "", recurrence: "", ticker: "", alert_type: "push" });
    setShowReminderForm(false);
    fetchReminders();
  };

  const deleteIdea = async (id: number) => {
    await tasksApi.deleteIdea(id);
    fetchIdeas();
  };

  const updateIdeaStatus = async (id: number, status: string) => {
    await tasksApi.updateIdea(id, { status });
    fetchIdeas();
  };

  const deleteReminder = async (id: number) => {
    await tasksApi.deleteReminder(id);
    fetchReminders();
  };

  return (
    <div>
      <div className="card-header">
        <h2>Tasks & Reminders</h2>
        <button
          className="btn btn-primary"
          onClick={() => tab === "ideas" ? setShowIdeaForm(!showIdeaForm) : setShowReminderForm(!showReminderForm)}
        >
          + New
        </button>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === "ideas" ? "active" : ""}`} onClick={() => setTab("ideas")}>
          Ideas ({ideas.length})
        </button>
        <button className={`tab-btn ${tab === "reminders" ? "active" : ""}`} onClick={() => setTab("reminders")}>
          Reminders ({reminders.length})
        </button>
      </div>

      {/* New Idea Form */}
      {tab === "ideas" && showIdeaForm && (
        <div style={{ marginBottom: 12 }}>
          <div className="form-row">
            <input className="form-input" placeholder="Ticker (e.g. AAPL)" value={ideaForm.ticker}
              onChange={(e) => setIdeaForm({ ...ideaForm, ticker: e.target.value.toUpperCase() })} />
            <select className="form-input" value={ideaForm.idea_type}
              onChange={(e) => setIdeaForm({ ...ideaForm, idea_type: e.target.value })}>
              <option value="watch">Watch</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="options">Options</option>
            </select>
            <select className="form-input" value={ideaForm.market}
              onChange={(e) => setIdeaForm({ ...ideaForm, market: e.target.value })}>
              <option value="US">US</option>
              <option value="IN">India</option>
            </select>
          </div>
          <div className="form-row">
            <input className="form-input" placeholder="Entry $" type="number" value={ideaForm.entry_price}
              onChange={(e) => setIdeaForm({ ...ideaForm, entry_price: e.target.value })} />
            <input className="form-input" placeholder="Target $" type="number" value={ideaForm.target_price}
              onChange={(e) => setIdeaForm({ ...ideaForm, target_price: e.target.value })} />
            <input className="form-input" placeholder="Stop Loss $" type="number" value={ideaForm.stop_loss}
              onChange={(e) => setIdeaForm({ ...ideaForm, stop_loss: e.target.value })} />
          </div>
          <div className="form-row">
            <input className="form-input" placeholder="Notes..." value={ideaForm.notes}
              onChange={(e) => setIdeaForm({ ...ideaForm, notes: e.target.value })} />
            <button className="btn btn-primary" onClick={createIdea}>Save</button>
          </div>
        </div>
      )}

      {/* New Reminder Form */}
      {tab === "reminders" && showReminderForm && (
        <div style={{ marginBottom: 12 }}>
          <div className="form-row">
            <input className="form-input" placeholder="Reminder title" value={reminderForm.title}
              onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} />
            <input className="form-input" type="datetime-local" value={reminderForm.reminder_time}
              onChange={(e) => setReminderForm({ ...reminderForm, reminder_time: e.target.value })} />
          </div>
          <div className="form-row">
            <input className="form-input" placeholder="Ticker (optional)" value={reminderForm.ticker}
              onChange={(e) => setReminderForm({ ...reminderForm, ticker: e.target.value.toUpperCase() })} />
            <select className="form-input" value={reminderForm.recurrence}
              onChange={(e) => setReminderForm({ ...reminderForm, recurrence: e.target.value })}>
              <option value="">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="market_open">Market Open</option>
              <option value="market_close">Market Close</option>
            </select>
            <button className="btn btn-primary" onClick={createReminder}>Save</button>
          </div>
        </div>
      )}

      {/* Ideas List */}
      {tab === "ideas" && (
        <div className="task-list">
          {ideas.map((idea) => (
            <div key={idea.id} className="task-item">
              <div>
                <span className={`tag ${idea.idea_type}`}>{idea.idea_type.toUpperCase()}</span>
                <strong>{idea.ticker}</strong> ({idea.market})
                {idea.entry_price && <span> @ ${idea.entry_price}</span>}
                {idea.target_price && <span> → ${idea.target_price}</span>}
                <div className="meta">
                  {idea.notes && <span>{idea.notes} · </span>}
                  Status: {idea.status} · {new Date(idea.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="task-actions">
                {idea.status === "active" && (
                  <button className="icon-btn" title="Mark executed"
                    onClick={() => updateIdeaStatus(idea.id, "executed")}>✓</button>
                )}
                <button className="icon-btn danger" title="Delete"
                  onClick={() => deleteIdea(idea.id)}>✕</button>
              </div>
            </div>
          ))}
          {ideas.length === 0 && <div className="loading">No trading ideas yet</div>}
        </div>
      )}

      {/* Reminders List */}
      {tab === "reminders" && (
        <div className="task-list">
          {reminders.map((r) => (
            <div key={r.id} className="task-item">
              <div>
                <strong>{r.title}</strong>
                {r.ticker && <span className="tag watch">{r.ticker}</span>}
                <div className="meta">
                  {new Date(r.reminder_time).toLocaleString()}
                  {r.recurrence && <span> · Repeats: {r.recurrence}</span>}
                  {r.is_triggered && <span> · Triggered</span>}
                </div>
              </div>
              <div className="task-actions">
                <button className="icon-btn danger" title="Delete"
                  onClick={() => deleteReminder(r.id)}>✕</button>
              </div>
            </div>
          ))}
          {reminders.length === 0 && <div className="loading">No reminders set</div>}
        </div>
      )}
    </div>
  );
}
