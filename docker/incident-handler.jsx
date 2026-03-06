import { useState, useRef, useEffect } from "react";

const STAGES = [
  { id: "create", label: "INC Creation", icon: "⬡", sub: "ServiceNow" },
  { id: "notify", label: "Stakeholder Alert", icon: "◈", sub: "Email / PagerDuty" },
  { id: "sre", label: "SRE Channel", icon: "◉", sub: "Teams / Slack" },
  { id: "rca", label: "Root Cause", icon: "⬢", sub: "AI Analysis" },
  { id: "fix", label: "Fix Implementation", icon: "◆", sub: "Engineering" },
  { id: "mitigate", label: "Mitigation", icon: "◇", sub: "Operations" },
  { id: "comms", label: "Stakeholder Comms", icon: "◈", sub: "Updates" },
  { id: "resolve", label: "Resolution", icon: "✦", sub: "ServiceNow" },
];

const SEVERITY = ["P1 — Critical", "P2 — High", "P3 — Medium", "P4 — Low"];

const MOCK_SERVICES = [
  "Trading Platform", "Market Data Feed", "Auth Service", "Risk Engine",
  "Order Management", "Portfolio API", "Compliance Engine", "Reporting Service"
];

const MOCK_TEAMS = [
  "Platform SRE", "Trading Engineering", "Market Data", "Security", "Infrastructure"
];

function callClaude(systemPrompt, userPrompt) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })
    .then((r) => r.json())
    .then((d) => d.content?.[0]?.text || "");
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #080b10;
    --surface: #0d1218;
    --panel: #111820;
    --border: #1e2d3d;
    --border-bright: #2a4060;
    --amber: #f59e0b;
    --amber-dim: #92600a;
    --red: #ef4444;
    --green: #22c55e;
    --blue: #38bdf8;
    --text: #c8d8e8;
    --text-dim: #5a7a9a;
    --mono: 'Share Tech Mono', monospace;
    --display: 'Barlow Condensed', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--mono); }

  .app {
    min-height: 100vh;
    background: var(--bg);
    background-image: 
      radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(56,189,248,0.04) 0%, transparent 50%);
  }

  .header {
    border-bottom: 1px solid var(--border);
    padding: 16px 32px;
    display: flex;
    align-items: center;
    gap: 24px;
    background: rgba(13,18,24,0.9);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-badge {
    font-family: var(--display);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--amber);
    border: 1px solid var(--amber-dim);
    padding: 3px 10px;
    text-transform: uppercase;
  }

  .header-title {
    font-family: var(--display);
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
    color: #fff;
    text-transform: uppercase;
  }

  .header-sub {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-left: auto;
    text-transform: uppercase;
  }

  .live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse 1.5s ease-in-out infinite;
    display: inline-block;
    margin-right: 8px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* Pipeline */
  .pipeline {
    padding: 24px 32px 0;
    display: flex;
    align-items: stretch;
    gap: 0;
    overflow-x: auto;
  }

  .stage-block {
    flex: 1;
    min-width: 100px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
  }

  .stage-block::after {
    content: '▶';
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--border-bright);
    font-size: 12px;
    z-index: 2;
  }

  .stage-block:last-child::after { display: none; }

  .stage-inner {
    border: 1px solid var(--border);
    border-right: none;
    padding: 14px 12px;
    height: 100%;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .stage-block:first-child .stage-inner { border-left: 1px solid var(--border); }

  .stage-block.active .stage-inner {
    border-color: var(--amber);
    background: rgba(245,158,11,0.05);
  }

  .stage-block.done .stage-inner {
    border-color: var(--green);
    background: rgba(34,197,94,0.04);
  }

  .stage-block.active .stage-inner::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--amber);
    box-shadow: 0 0 12px var(--amber);
  }

  .stage-icon {
    font-size: 16px;
    color: var(--text-dim);
    display: block;
    margin-bottom: 6px;
  }

  .stage-block.active .stage-icon { color: var(--amber); }
  .stage-block.done .stage-icon { color: var(--green); }

  .stage-num {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 2px;
    margin-bottom: 2px;
    text-transform: uppercase;
  }

  .stage-name {
    font-family: var(--display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--text);
    text-transform: uppercase;
    line-height: 1.2;
  }

  .stage-block.active .stage-name { color: #fff; }

  .stage-service {
    font-size: 9px;
    color: var(--text-dim);
    letter-spacing: 1px;
    margin-top: 4px;
    text-transform: uppercase;
  }

  /* Main area */
  .main {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 0;
    min-height: calc(100vh - 160px);
  }

  .content-area {
    padding: 24px 32px;
    border-right: 1px solid var(--border);
  }

  .sidebar {
    padding: 24px;
    background: var(--surface);
  }

  /* Form */
  .card {
    border: 1px solid var(--border);
    background: var(--panel);
    padding: 24px;
    margin-bottom: 16px;
  }

  .card-header {
    font-family: var(--display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--amber);
    text-transform: uppercase;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .field { margin-bottom: 16px; }

  .label {
    display: block;
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .input, .select, .textarea {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.2s;
  }

  .input:focus, .select:focus, .textarea:focus {
    border-color: var(--amber);
  }

  .select { cursor: pointer; }

  .textarea { min-height: 90px; resize: vertical; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .btn {
    font-family: var(--display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 12px 24px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary {
    background: var(--amber);
    color: #000;
  }

  .btn-primary:hover { background: #fbbf24; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: transparent;
    color: var(--amber);
    border: 1px solid var(--amber-dim);
  }

  .btn-ghost:hover { border-color: var(--amber); background: rgba(245,158,11,0.08); }

  .btn-success {
    background: var(--green);
    color: #000;
  }

  /* AI Output */
  .ai-output {
    border: 1px solid var(--border-bright);
    background: rgba(56,189,248,0.03);
    padding: 16px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--text);
    white-space: pre-wrap;
    position: relative;
    margin-top: 12px;
  }

  .ai-output::before {
    content: '◈ AI ANALYSIS';
    position: absolute;
    top: -9px;
    left: 12px;
    background: var(--panel);
    padding: 0 8px;
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--blue);
  }

  .loading-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--amber), var(--blue), var(--amber));
    background-size: 200% 100%;
    animation: slide 1.5s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes slide {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Timeline */
  .timeline { }

  .tl-item {
    display: flex;
    gap: 12px;
    padding-bottom: 16px;
    position: relative;
  }

  .tl-item::before {
    content: '';
    position: absolute;
    left: 14px;
    top: 28px;
    bottom: 0;
    width: 1px;
    background: var(--border);
  }

  .tl-item:last-child::before { display: none; }

  .tl-dot {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-bright);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
    background: var(--panel);
    position: relative;
    z-index: 1;
  }

  .tl-dot.done { border-color: var(--green); color: var(--green); }
  .tl-dot.active { border-color: var(--amber); color: var(--amber); }

  .tl-content { flex: 1; }

  .tl-title {
    font-family: var(--display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--text);
    margin-bottom: 2px;
  }

  .tl-meta {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
  }

  .tl-detail {
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 4px;
    line-height: 1.5;
  }

  /* Status pills */
  .pill {
    display: inline-block;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 2px 8px;
    font-family: var(--display);
    font-weight: 700;
  }

  .pill-red { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
  .pill-amber { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }
  .pill-green { background: rgba(34,197,94,0.15); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
  .pill-blue { background: rgba(56,189,248,0.15); color: var(--blue); border: 1px solid rgba(56,189,248,0.3); }

  .inc-id {
    font-family: var(--display);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 3px;
    color: var(--amber);
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 11px;
  }

  .stat-row:last-child { border-bottom: none; }
  .stat-key { color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; font-size: 10px; }
  .stat-val { color: var(--text); text-align: right; }

  .progress-steps {
    display: flex;
    gap: 4px;
    margin: 16px 0;
  }

  .progress-step {
    height: 3px;
    flex: 1;
    background: var(--border);
    transition: background 0.3s;
  }

  .progress-step.done { background: var(--green); }
  .progress-step.active { background: var(--amber); }

  .checklist { list-style: none; }
  .checklist li {
    font-size: 11px;
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-dim);
  }
  .checklist li.done { color: var(--text); }
  .checklist li.done::before { content: '✓'; color: var(--green); }
  .checklist li:not(.done)::before { content: '○'; color: var(--border-bright); }

  .actions-row {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .section-label {
    font-family: var(--display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .ticker {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .tag {
    font-size: 10px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 1px;
    font-family: var(--display);
    font-weight: 600;
  }
  .tag.sel { border-color: var(--amber); color: var(--amber); background: rgba(245,158,11,0.08); }
  
  .snow-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.2);
    padding: 6px 12px;
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--blue);
    margin-bottom: 12px;
  }
`;

export default function IncidentHandler() {
  const [stage, setStage] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState({});
  const [incident, setIncident] = useState({
    title: "",
    service: "",
    severity: "P1 — Critical",
    description: "",
    affected: [],
    teams: [],
    assignee: "",
    environment: "Production",
  });
  const [incidentId] = useState(`INC${Math.floor(Math.random() * 9000 + 1000)}`);
  const [timeline, setTimeline] = useState([]);
  const [startTime] = useState(new Date());

  const elapsed = () => {
    const s = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const addTimeline = (title, detail, status = "done") => {
    setTimeline(prev => [...prev, { title, detail, status, time: new Date().toLocaleTimeString() }]);
  };

  const runAI = async (stageId, prompt, system) => {
    setLoading(true);
    try {
      const result = await callClaude(system, prompt);
      setAiOutput(prev => ({ ...prev, [stageId]: result }));
    } catch {
      setAiOutput(prev => ({ ...prev, [stageId]: "⚠ API connection required. Configure your Anthropic API key to enable AI assistance." }));
    }
    setLoading(false);
  };

  const advance = (label, detail) => {
    setCompletedStages(prev => [...prev, stage]);
    addTimeline(label, detail);
    setStage(prev => prev + 1);
  };

  const incContext = `Incident ${incidentId}: ${incident.title || "Untitled"} | Service: ${incident.service || "Unknown"} | Severity: ${incident.severity} | Env: ${incident.environment} | Description: ${incident.description || "No description"}`;

  // Stage renderers
  const stageContent = {
    // STAGE 0 — Create
    0: (
      <div>
        <div className="snow-badge">⬡ SERVICENOW INTEGRATION — NEW INCIDENT</div>
        <div className="card">
          <div className="card-header">◈ Incident Details</div>
          <div className="field">
            <label className="label">Incident Title *</label>
            <input className="input" placeholder="Brief description of the incident..." value={incident.title}
              onChange={e => setIncident(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Affected Service *</label>
              <select className="select" value={incident.service} onChange={e => setIncident(p => ({ ...p, service: e.target.value }))}>
                <option value="">Select service...</option>
                {MOCK_SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Severity</label>
              <select className="select" value={incident.severity} onChange={e => setIncident(p => ({ ...p, severity: e.target.value }))}>
                {SEVERITY.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Environment</label>
              <select className="select" value={incident.environment} onChange={e => setIncident(p => ({ ...p, environment: e.target.value }))}>
                {["Production", "Staging", "DR", "UAT"].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Assignee</label>
              <input className="input" placeholder="Engineer name..." value={incident.assignee}
                onChange={e => setIncident(p => ({ ...p, assignee: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label className="label">Incident Description</label>
            <textarea className="textarea" placeholder="Detailed description, symptoms, impact..." value={incident.description}
              onChange={e => setIncident(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Affected Teams</label>
            <div className="tag-row">
              {MOCK_TEAMS.map(t => (
                <span key={t} className={`tag ${incident.teams.includes(t) ? "sel" : ""}`}
                  onClick={() => setIncident(p => ({ ...p, teams: p.teams.includes(t) ? p.teams.filter(x => x !== t) : [...p.teams, t] }))}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("create",
            `Generate a concise, professional ServiceNow incident summary for:\n${incContext}\nInclude: impact assessment, urgency score, suggested assignment group, and initial response checklist. Format clearly with sections.`,
            "You are an expert SRE incident coordinator. Generate structured, actionable incident documentation."
          )}>⬡ AI DRAFT SUMMARY</button>
          <button className="btn btn-primary"
            disabled={!incident.title || !incident.service}
            onClick={() => advance("INC Created in ServiceNow", `${incidentId} | ${incident.severity} | ${incident.service}`)}>
            CREATE INCIDENT →
          </button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.create && <div className="ai-output">{aiOutput.create}</div>}
      </div>
    ),

    // STAGE 1 — Notify Stakeholders
    1: (
      <div>
        <div className="card">
          <div className="card-header">◈ Stakeholder Notification</div>
          <div className="stat-row"><span className="stat-key">Incident</span><span className="stat-val">{incidentId}</span></div>
          <div className="stat-row"><span className="stat-key">Severity</span><span className="stat-val"><span className="pill pill-red">{incident.severity}</span></span></div>
          <div className="stat-row"><span className="stat-key">Service</span><span className="stat-val">{incident.service}</span></div>
          <div className="stat-row"><span className="stat-key">Channels</span><span className="stat-val">Email · PagerDuty · SMS</span></div>

          <div style={{ marginTop: 16 }}>
            <div className="section-label">Notification Checklist</div>
            <ul className="checklist">
              {["Executive Leadership (CTO / CIO)", "Business Stakeholders", "Product Owners", "Customer Success", "On-call SRE Lead", "Change Advisory Board"].map((item, i) => (
                <li key={item} className={completedStages.includes(1) || i < 2 ? "done" : ""}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("notify",
            `Draft a concise stakeholder notification for:\n${incContext}\nCreate: 1) Executive summary (3 lines max), 2) Business impact statement, 3) Initial ETR estimate, 4) Next update time. Keep it professional and factual.`,
            "You are a senior incident manager at a financial services firm. Draft clear, calm stakeholder communications."
          )}>◈ DRAFT NOTIFICATION</button>
          <button className="btn btn-primary" onClick={() => advance("Stakeholders Notified", "Email + PagerDuty alerts dispatched")}>
            SEND NOTIFICATIONS →
          </button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.notify && <div className="ai-output">{aiOutput.notify}</div>}
      </div>
    ),

    // STAGE 2 — SRE Channel
    2: (
      <div>
        <div className="card">
          <div className="card-header">◉ SRE Leads Channel Update</div>
          <div className="stat-row"><span className="stat-key">Channel</span><span className="stat-val">#sre-leads-incidents</span></div>
          <div className="stat-row"><span className="stat-key">Bridge</span><span className="stat-val">War Room Active</span></div>
          <div className="stat-row"><span className="stat-key">IC Assigned</span><span className="stat-val">{incident.assignee || "Pending"}</span></div>

          <div style={{ marginTop: 16 }}>
            <div className="section-label">Teams / Slack Message Preview</div>
            <div style={{ background: "#0a0f1a", border: "1px solid #1e3a5f", padding: 16, fontSize: 12, lineHeight: 1.8 }}>
              <span style={{ color: "#f59e0b" }}>🚨 [{incident.severity}] INCIDENT DECLARED</span><br />
              <span style={{ color: "#94a3b8" }}>INC:</span> <strong>{incidentId}</strong><br />
              <span style={{ color: "#94a3b8" }}>Service:</span> {incident.service || "—"}<br />
              <span style={{ color: "#94a3b8" }}>IC:</span> {incident.assignee || "Unassigned"}<br />
              <span style={{ color: "#94a3b8" }}>Bridge:</span> <span style={{ color: "#38bdf8" }}>teams.link/war-room-{incidentId.toLowerCase()}</span><br />
              <span style={{ color: "#94a3b8" }}>Status:</span> <span style={{ color: "#ef4444" }}>INVESTIGATING</span>
            </div>
          </div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("sre",
            `Write a detailed SRE war room message for ${incContext}.\nInclude: severity context, investigation focus areas, initial hypothesis, roles needed (IC, Comms Lead, Tech Lead), and first 15-minute action plan.`,
            "You are a veteran SRE lead. Write technical, actionable war room communications."
          )}>◉ AI WAR ROOM BRIEF</button>
          <button className="btn btn-primary" onClick={() => advance("SRE Channel Updated", "War room opened · Teams bridge active")}>
            POST TO CHANNEL →
          </button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.sre && <div className="ai-output">{aiOutput.sre}</div>}
      </div>
    ),

    // STAGE 3 — RCA
    3: (
      <div>
        <div className="card">
          <div className="card-header">⬢ Root Cause Analysis — AI Assisted</div>
          <div className="field">
            <label className="label">Observed Symptoms / Signals</label>
            <textarea className="textarea" placeholder="Error messages, metrics anomalies, log patterns, alerts triggered..." style={{ minHeight: 80 }}
              onChange={e => setIncident(p => ({ ...p, symptoms: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Recent Changes (deploys, config, infra)</label>
            <textarea className="textarea" placeholder="Any recent changes, deployments, config updates, infra changes..." style={{ minHeight: 70 }}
              onChange={e => setIncident(p => ({ ...p, changes: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Affected Metrics</label>
            <div className="tag-row">
              {["Latency Spike", "Error Rate ↑", "CPU High", "Memory Pressure", "Disk Full", "Network Packet Loss", "DB Connections", "Pod Crashloop"].map(m => (
                <span key={m} className={`tag ${(incident.metrics || []).includes(m) ? "sel" : ""}`}
                  onClick={() => setIncident(p => ({ ...p, metrics: (p.metrics || []).includes(m) ? (p.metrics || []).filter(x => x !== m) : [...(p.metrics || []), m] }))}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("rca",
            `Perform a structured root cause analysis for:\n${incContext}\nSymptoms: ${incident.symptoms || "not specified"}\nRecent Changes: ${incident.changes || "none"}\nMetrics: ${(incident.metrics || []).join(", ") || "none"}\n\nProvide: 1) Most likely root cause, 2) Contributing factors, 3) Evidence to validate hypothesis, 4) Diagnostic commands/queries to run, 5) Timeline reconstruction.`,
            "You are a principal SRE with deep expertise in distributed systems, Kubernetes, and financial trading platforms. Provide rigorous, evidence-based root cause analysis."
          )}>⬢ RUN AI RCA</button>
          <button className="btn btn-primary" onClick={() => advance("Root Cause Identified", aiOutput.rca ? "AI analysis complete" : "Manual RCA documented")}>
            CONFIRM RCA →
          </button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.rca && <div className="ai-output">{aiOutput.rca}</div>}
      </div>
    ),

    // STAGE 4 — Fix Implementation
    4: (
      <div>
        <div className="card">
          <div className="card-header">◆ Fix Implementation</div>
          <div className="field">
            <label className="label">Fix Approach</label>
            <div className="tag-row" style={{ marginBottom: 12 }}>
              {["Hotfix Deploy", "Config Rollback", "Service Restart", "Traffic Reroute", "Scale Up", "DB Patch", "Code Rollback", "Feature Flag"].map(f => (
                <span key={f} className={`tag ${(incident.fixType || []).includes(f) ? "sel" : ""}`}
                  onClick={() => setIncident(p => ({ ...p, fixType: (p.fixType || []).includes(f) ? (p.fixType || []).filter(x => x !== f) : [...(p.fixType || []), f] }))}>
                  {f}
                </span>
              ))}
            </div>
            <textarea className="textarea" placeholder="Describe the fix implementation plan..." style={{ minHeight: 80 }}
              onChange={e => setIncident(p => ({ ...p, fixPlan: e.target.value }))} />
          </div>
          <div className="stat-row"><span className="stat-key">Change Risk</span><span className="stat-val"><span className="pill pill-amber">EMERGENCY CHG</span></span></div>
          <div className="stat-row"><span className="stat-key">Approval Required</span><span className="stat-val">CAB Emergency Override</span></div>
          <div className="stat-row"><span className="stat-key">Rollback Plan</span><span className="stat-val">Required before proceeding</span></div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("fix",
            `For incident ${incContext}\nRCA: ${aiOutput.rca || "see incident details"}\nFix approach: ${(incident.fixType || []).join(", ")}\n\nGenerate: 1) Step-by-step fix runbook, 2) Risk assessment, 3) Rollback procedure, 4) Validation steps to confirm fix, 5) Estimated time to implement.`,
            "You are a senior platform engineer. Generate safe, tested fix procedures with clear rollback steps."
          )}>◆ GENERATE RUNBOOK</button>
          <button className="btn btn-primary" onClick={() => advance("Fix Implemented", `${(incident.fixType || ["Manual fix"]).join(" + ")}`)}>
            MARK FIX APPLIED →
          </button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.fix && <div className="ai-output">{aiOutput.fix}</div>}
      </div>
    ),

    // STAGE 5 — Mitigation
    5: (
      <div>
        <div className="card">
          <div className="card-header">◇ Incident Mitigation</div>
          <div style={{ marginBottom: 16 }}>
            <div className="section-label">Mitigation Verification</div>
            <ul className="checklist">
              {[
                "Error rates returning to baseline",
                "Latency within SLA thresholds",
                "All services healthy in monitoring",
                "No cascading failures detected",
                "Customer-facing functionality restored",
                "Data integrity verified",
                "Security posture confirmed"
              ].map((item, i) => (
                <li key={item} className={i < 3 ? "done" : ""}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="stat-row"><span className="stat-key">MTTR (so far)</span><span className="stat-val" style={{ color: "var(--amber)" }}>{elapsed()}</span></div>
          <div className="stat-row"><span className="stat-key">Status</span><span className="stat-val"><span className="pill pill-amber">MITIGATING</span></span></div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("mitigate",
            `Incident ${incidentId} is in mitigation phase. Context: ${incContext}\nFix applied: ${(incident.fixType || []).join(", ")}\n\nProvide: 1) Mitigation verification checklist with specific metrics to check, 2) Monitoring queries to run, 3) Traffic validation steps, 4) Criteria to declare mitigation complete, 5) Any lingering risks to watch.`,
            "You are an SRE operations lead. Provide thorough mitigation verification guidance."
          )}>◇ VERIFY MITIGATION</button>
          <button className="btn btn-success" onClick={() => advance("Incident Mitigated", "Service restored · Monitoring nominal")}>
            CONFIRM MITIGATED →
          </button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.mitigate && <div className="ai-output">{aiOutput.mitigate}</div>}
      </div>
    ),

    // STAGE 6 — Stakeholder Comms
    6: (
      <div>
        <div className="card">
          <div className="card-header">◈ Stakeholder Communication</div>
          <div className="stat-row"><span className="stat-key">Status Page</span><span className="stat-val"><span className="pill pill-green">UPDATING</span></span></div>
          <div className="stat-row"><span className="stat-key">Customer Portal</span><span className="stat-val">Incident Update Posted</span></div>
          <div className="stat-row"><span className="stat-key">Exec Brief</span><span className="stat-val">Pending Draft</span></div>

          <div style={{ marginTop: 16 }}>
            <div className="section-label">Communication Templates</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Executive Briefing", "Customer-facing Update", "Status Page", "Internal All-hands", "Regulatory Notice"].map(t => (
                <span key={t} className="tag" onClick={() => runAI("comms",
                  `Write a ${t} communication for incident ${incidentId}.\n${incContext}\nFix: ${(incident.fixType || []).join(", ")}\nStatus: MITIGATED\n\nThe communication should be appropriate for the audience and include: current status, what happened (brief), business impact, resolution steps taken, next steps.`,
                  "You are a communications expert for a financial institution. Write clear, appropriate communications for different audiences."
                )}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.comms && <div className="ai-output">{aiOutput.comms}</div>}

        <div className="actions-row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => advance("Stakeholders Communicated", "All channels updated · Status page live")}>
            COMMS COMPLETE →
          </button>
        </div>
      </div>
    ),

    // STAGE 7 — Resolution
    7: (
      <div>
        <div className="card">
          <div className="card-header">✦ Incident Resolution</div>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div className="inc-id">{incidentId}</div>
            <div style={{ marginTop: 8 }}><span className="pill pill-green">RESOLVED</span></div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 12, letterSpacing: 1 }}>
              TOTAL INCIDENT DURATION: <span style={{ color: "var(--amber)" }}>{elapsed()}</span>
            </div>
          </div>

          <div className="stat-row"><span className="stat-key">Service</span><span className="stat-val">{incident.service}</span></div>
          <div className="stat-row"><span className="stat-key">Severity</span><span className="stat-val">{incident.severity}</span></div>
          <div className="stat-row"><span className="stat-key">Root Cause</span><span className="stat-val">AI Identified + Confirmed</span></div>
          <div className="stat-row"><span className="stat-key">Fix Type</span><span className="stat-val">{(incident.fixType || ["Manual"]).join(", ")}</span></div>
          <div className="stat-row"><span className="stat-key">ServiceNow Status</span><span className="stat-val"><span className="pill pill-green">CLOSED</span></span></div>
        </div>

        <div className="actions-row">
          <button className="btn btn-ghost" onClick={() => runAI("resolve",
            `Generate a complete Post-Incident Review (PIR) / Post-Mortem document for:\n${incContext}\nRCA: ${aiOutput.rca || "documented separately"}\nFix: ${(incident.fixType || []).join(", ")}\n\nInclude: Executive summary, Timeline, Root cause, Impact analysis, What went well, What needs improvement, Action items with owners, SLO impact, Preventive measures.`,
            "You are an experienced SRE manager. Write a comprehensive, blameless post-mortem following best practices."
          )}>✦ GENERATE PIR / POST-MORTEM</button>
        </div>
        {loading && <div className="loading-bar" style={{ marginTop: 12 }} />}
        {aiOutput.resolve && <div className="ai-output">{aiOutput.resolve}</div>}

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-success" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}>
            ✦ CLOSE INCIDENT IN SERVICENOW
          </button>
        </div>
      </div>
    ),
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-badge">GS SRE</div>
          <div className="header-title">Incident Command</div>
          <div style={{ marginLeft: 16 }}>
            {completedStages.length > 0 && (
              <span className="pill pill-amber">{incidentId}</span>
            )}
          </div>
          <div className="header-sub">
            <span className="live-dot" />
            {completedStages.length === 0 ? "STANDBY" : stage === 8 ? "RESOLVED" : "INCIDENT ACTIVE"}
            &nbsp;·&nbsp;{new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Pipeline */}
        <div className="pipeline">
          {STAGES.map((s, i) => (
            <div key={s.id} className={`stage-block ${i === stage ? "active" : ""} ${completedStages.includes(i) ? "done" : ""}`}
              onClick={() => completedStages.includes(i) && setStage(i)}>
              <div className="stage-inner">
                <span className="stage-icon">{completedStages.includes(i) ? "✓" : s.icon}</span>
                <div className="stage-num">0{i + 1}</div>
                <div className="stage-name">{s.label}</div>
                <div className="stage-service">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ padding: "12px 32px 0" }}>
          <div className="progress-steps">
            {STAGES.map((_, i) => (
              <div key={i} className={`progress-step ${completedStages.includes(i) ? "done" : i === stage ? "active" : ""}`} />
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="content-area">
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span className="pill pill-amber">{STAGES[stage]?.label}</span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: 2 }}>
                STEP {stage + 1} OF {STAGES.length}
              </span>
              {loading && <span className="ticker">▌ AI PROCESSING...</span>}
            </div>
            {stageContent[stage] || (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
                <div className="inc-id">RESOLVED</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>All stages complete · {incidentId} closed</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="section-label">Incident Timeline</div>
            {timeline.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: 1 }}>
                Awaiting first action...
              </div>
            ) : (
              <div className="timeline">
                {timeline.map((t, i) => (
                  <div className="tl-item" key={i}>
                    <div className={`tl-dot ${t.status}`}>✓</div>
                    <div className="tl-content">
                      <div className="tl-title">{t.title}</div>
                      <div className="tl-meta">{t.time}</div>
                      {t.detail && <div className="tl-detail">{t.detail}</div>}
                    </div>
                  </div>
                ))}
                {stage < STAGES.length && (
                  <div className="tl-item">
                    <div className="tl-dot active">◉</div>
                    <div className="tl-content">
                      <div className="tl-title" style={{ color: "var(--amber)" }}>{STAGES[stage].label}</div>
                      <div className="tl-meta">In progress</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {incident.severity && (
              <div style={{ marginTop: 24 }}>
                <div className="section-label">Incident Info</div>
                <div className="stat-row"><span className="stat-key">ID</span><span className="stat-val" style={{ color: "var(--amber)" }}>{incidentId}</span></div>
                {incident.severity && <div className="stat-row"><span className="stat-key">Severity</span><span className="stat-val"><span className="pill pill-red">{incident.severity.split("—")[0].trim()}</span></span></div>}
                {incident.service && <div className="stat-row"><span className="stat-key">Service</span><span className="stat-val">{incident.service}</span></div>}
                {incident.environment && <div className="stat-row"><span className="stat-key">Env</span><span className="stat-val">{incident.environment}</span></div>}
                <div className="stat-row"><span className="stat-key">Elapsed</span><span className="stat-val" style={{ color: completedStages.length > 0 ? "var(--amber)" : "var(--text-dim)" }}>{elapsed()}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
