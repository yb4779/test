import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const SERVICES = ["Trading Platform","Market Data Feed","Auth Service","Risk Engine","Order Management","Portfolio API","Compliance Engine","Reporting Service","Settlement System","FX Gateway"];
const ENVIRONMENTS = ["Production","Staging","DR","UAT","Pre-Prod"];
const TEAMS = ["Platform SRE","Trading Engineering","Market Data","Security","Infrastructure","DBA","Network","Application Support"];
const FIX_TYPES = ["Hotfix Deploy","Config Rollback","Service Restart","Traffic Reroute","Scale Up/Out","DB Patch","Code Rollback","Feature Flag Toggle","DNS Failover","Manual Override"];
const SEVERITIES = [
  { id: "P1", label: "P1 — Critical", color: "#DC2626", bg: "#FEF2F2", desc: "Full service outage" },
  { id: "P2", label: "P2 — High", color: "#EA580C", bg: "#FFF7ED", desc: "Major degradation" },
  { id: "P3", label: "P3 — Medium", color: "#D97706", bg: "#FFFBEB", desc: "Partial impact" },
  { id: "P4", label: "P4 — Low", color: "#059669", bg: "#F0FDF4", desc: "Minor issue" },
];

const STAGES = [
  { id: "create",   num: "01", label: "INC Creation",       sub: "ServiceNow",    icon: "📋", color: "#D97706" },
  { id: "notify",   num: "02", label: "Stakeholder Alert",  sub: "PagerDuty",     icon: "🔔", color: "#0369A1" },
  { id: "sre",      num: "03", label: "SRE Channel",        sub: "MS Teams",      icon: "⚡", color: "#059669" },
  { id: "rca",      num: "04", label: "Root Cause",         sub: "AI Analysis",   icon: "🔍", color: "#7C3AED" },
  { id: "fix",      num: "05", label: "Fix Implementation", sub: "Engineering",   icon: "🔧", color: "#0369A1" },
  { id: "mitigate", num: "06", label: "Mitigation",         sub: "Operations",    icon: "🛡",  color: "#059669" },
  { id: "comms",    num: "07", label: "Stakeholder Comms",  sub: "Multi-channel", icon: "📢", color: "#D97706" },
  { id: "resolve",  num: "08", label: "Resolution",         sub: "ServiceNow",    icon: "✅", color: "#059669" },
];

function genIncId() { return `INC${Math.floor(Math.random() * 90000 + 10000)}`; }
function timeNow() { return new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); }
function elapsed(start) {
  const s = Math.floor((Date.now() - start) / 1000);
  const m = Math.floor(s / 60), sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

async function callClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "Unable to generate response.";
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function Tag({ children, color = "#D97706", bg = "#FFFBEB", small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 7px" : "3px 10px",
      background: bg, color, border: `1px solid ${color}30`,
      borderRadius: 4, fontSize: small ? 10 : 11, fontWeight: 700,
      letterSpacing: "0.06em", fontFamily: "'DM Mono', monospace",
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Spinner() {
  return (
    <span style={{ display:"inline-block", width:14, height:14, border:"2px solid #E2E8F0", borderTopColor:"#D97706", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
  );
}

function AIBox({ content, loading, label = "AI ANALYSIS" }) {
  if (!loading && !content) return null;
  return (
    <div style={{
      marginTop: 14, background: "#F8FAFC", border: "1px solid #CBD5E1",
      borderLeft: "3px solid #7C3AED", borderRadius: 6, padding: "14px 16px",
      position: "relative",
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#7C3AED", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>◈ {label}</div>
      {loading
        ? <div style={{ display:"flex", alignItems:"center", gap:8, color:"#94A3B8", fontSize:13 }}><Spinner /> Generating analysis…</div>
        : <pre style={{ fontSize: 12, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-wrap", fontFamily: "'DM Mono', monospace", margin:0 }}>{content}</pre>
      }
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 5 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, style }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"9px 12px", border:"1px solid #E2E8F0", borderRadius:6, fontSize:13, color:"#1E293B", background:"#FAFAFA", outline:"none", fontFamily:"'DM Sans', sans-serif", boxSizing:"border-box", ...style }}
      onFocus={e => e.target.style.borderColor="#D97706"}
      onBlur={e => e.target.style.borderColor="#E2E8F0"}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width:"100%", padding:"9px 12px", border:"1px solid #E2E8F0", borderRadius:6, fontSize:13, color:"#1E293B", background:"#FAFAFA", outline:"none", fontFamily:"'DM Sans', sans-serif", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }}
      onFocus={e => e.target.style.borderColor="#D97706"}
      onBlur={e => e.target.style.borderColor="#E2E8F0"}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", padding:"9px 12px", border:"1px solid #E2E8F0", borderRadius:6, fontSize:13, color: value ? "#1E293B" : "#94A3B8", background:"#FAFAFA", outline:"none", fontFamily:"'DM Sans', sans-serif", cursor:"pointer", boxSizing:"border-box" }}
      onFocus={e => e.target.style.borderColor="#D97706"}
      onBlur={e => e.target.style.borderColor="#E2E8F0"}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function MultiTag({ options, selected, onToggle, color }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {options.map(opt => {
        const sel = selected.includes(opt);
        return (
          <button key={opt} onClick={() => onToggle(opt)}
            style={{ padding:"5px 11px", border:`1px solid ${sel ? color : "#E2E8F0"}`, borderRadius:20, fontSize:12, fontWeight: sel ? 700 : 400, color: sel ? color : "#64748B", background: sel ? `${color}10` : "#F8FAFC", cursor:"pointer", transition:"all 0.15s", fontFamily:"'DM Sans', sans-serif" }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, small, icon }) {
  const variants = {
    primary: { bg:"#D97706", color:"#fff", border:"#D97706" },
    secondary: { bg:"#fff", color:"#D97706", border:"#D97706" },
    ghost: { bg:"#F1F5F9", color:"#475569", border:"#E2E8F0" },
    success: { bg:"#059669", color:"#fff", border:"#059669" },
    danger: { bg:"#DC2626", color:"#fff", border:"#DC2626" },
    purple: { bg:"#7C3AED", color:"#fff", border:"#7C3AED" },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:6, padding: small ? "6px 12px" : "9px 18px", background: disabled ? "#F1F5F9" : v.bg, color: disabled ? "#94A3B8" : v.color, border:`1px solid ${disabled ? "#E2E8F0" : v.border}`, borderRadius:6, fontSize: small ? 11 : 12, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'DM Mono', monospace", cursor: disabled ? "not-allowed" : "pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
}

function CheckItem({ label, done, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}>
      <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${done ? "#059669" : "#CBD5E1"}`, background: done ? "#059669" : "white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
        {done && <span style={{ color:"white", fontSize:11, lineHeight:1 }}>✓</span>}
      </div>
      <span style={{ fontSize:13, color: done ? "#1E293B" : "#64748B", textDecoration: done ? "none" : "none", fontFamily:"'DM Sans', sans-serif", lineHeight:1.4 }}>{label}</span>
    </div>
  );
}

// ─── STAGE CONTENT ──────────────────────────────────────────────────────────
function Stage01({ inc, setInc, onAI, aiOut, aiLoading, onAdvance }) {
  const sev = SEVERITIES.find(s => s.id === inc.severity) || SEVERITIES[0];
  const canAdvance = inc.title && inc.service && inc.severity;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div style={{ gridColumn:"1/-1" }}>
          <FieldLabel>Incident Title *</FieldLabel>
          <Input value={inc.title} onChange={v => setInc(p=>({...p,title:v}))} placeholder="Brief description — what is broken?" />
        </div>
        <div>
          <FieldLabel>Affected Service *</FieldLabel>
          <Select value={inc.service} onChange={v => setInc(p=>({...p,service:v}))} options={SERVICES} placeholder="Select service…" />
        </div>
        <div>
          <FieldLabel>Environment</FieldLabel>
          <Select value={inc.environment} onChange={v => setInc(p=>({...p,environment:v}))} options={ENVIRONMENTS} />
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <FieldLabel>Severity *</FieldLabel>
        <div style={{ display:"flex", gap:8 }}>
          {SEVERITIES.map(s => (
            <button key={s.id} onClick={() => setInc(p=>({...p,severity:s.id}))}
              style={{ flex:1, padding:"10px 8px", border:`2px solid ${inc.severity===s.id ? s.color : "#E2E8F0"}`, borderRadius:8, background: inc.severity===s.id ? s.bg : "#FAFAFA", cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ fontSize:13, fontWeight:700, color:s.color, fontFamily:"'DM Mono', monospace" }}>{s.id}</div>
              <div style={{ fontSize:10, color:"#64748B", marginTop:2, fontFamily:"'DM Sans', sans-serif" }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div>
          <FieldLabel>Incident Commander</FieldLabel>
          <Input value={inc.ic} onChange={v => setInc(p=>({...p,ic:v}))} placeholder="Name / handle…" />
        </div>
        <div>
          <FieldLabel>Reported By</FieldLabel>
          <Input value={inc.reporter} onChange={v => setInc(p=>({...p,reporter:v}))} placeholder="Name / system…" />
        </div>
      </div>
      <div style={{ marginBottom:12 }}>
        <FieldLabel>Description & Symptoms</FieldLabel>
        <Textarea value={inc.description} onChange={v => setInc(p=>({...p,description:v}))} placeholder="Describe the incident, symptoms observed, user impact…" rows={4} />
      </div>
      <div style={{ marginBottom:16 }}>
        <FieldLabel>Affected Teams</FieldLabel>
        <MultiTag options={TEAMS} selected={inc.teams} onToggle={t => setInc(p=>({...p,teams:p.teams.includes(t)?p.teams.filter(x=>x!==t):[...p.teams,t]}))} color="#D97706" />
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn variant="purple" icon="◈" onClick={() => onAI("create",
          `You are an expert SRE incident coordinator. Generate a concise professional ServiceNow incident summary.\n\nIncident: ${inc.title||"Untitled"}\nService: ${inc.service||"Unknown"}\nSeverity: ${inc.severity}\nEnvironment: ${inc.environment}\nDescription: ${inc.description||"Not provided"}\n\nProvide:\n1. Structured INC summary (2-3 sentences)\n2. Business impact statement\n3. Urgency score (1-5) with rationale\n4. Recommended assignment group\n5. Initial response checklist (5 items)`
        )}>AI Draft Summary</Btn>
        <Btn onClick={onAdvance} disabled={!canAdvance} icon="→">Create Incident</Btn>
      </div>
      <AIBox content={aiOut.create} loading={aiLoading === "create"} label="AI — INC DRAFT" />
    </div>
  );
}

function Stage02({ inc, onAI, aiOut, aiLoading, onAdvance }) {
  const [checks, setChecks] = useState([false,false,false,false,false,false]);
  const labels = ["Executive Leadership (CTO/CIO)","Business Stakeholders","Product Owners","On-call SRE Lead","Customer Success Team","Change Advisory Board"];
  const toggle = i => setChecks(c => c.map((v,j) => j===i?!v:v));
  return (
    <div>
      <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"12px 16px", marginBottom:16, display:"flex", gap:12, alignItems:"flex-start" }}>
        <span style={{ fontSize:20 }}>🔔</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#C2410C", fontFamily:"'DM Sans', sans-serif" }}>Incident declared — notifications required</div>
          <div style={{ fontSize:12, color:"#9A3412", marginTop:2, fontFamily:"'DM Sans', sans-serif" }}>{inc.title} · {inc.severity} · {inc.service}</div>
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <FieldLabel>Notification Checklist</FieldLabel>
        <div style={{ background:"#FAFAFA", border:"1px solid #E2E8F0", borderRadius:8, padding:"4px 14px" }}>
          {labels.map((l,i) => <CheckItem key={l} label={l} done={checks[i]} onToggle={() => toggle(i)} />)}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#0369A1", fontFamily:"'DM Mono', monospace", marginBottom:6 }}>CHANNELS</div>
          {["Email (exec list)","PagerDuty on-call","SMS via Twilio","MS Teams #incidents"].map(c => (
            <div key={c} style={{ fontSize:12, color:"#334155", padding:"3px 0", fontFamily:"'DM Sans', sans-serif" }}>✦ {c}</div>
          ))}
        </div>
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#059669", fontFamily:"'DM Mono', monospace", marginBottom:6 }}>SLA TARGETS</div>
          {[["P1 notify","< 5 min"],["P2 notify","< 15 min"],["Initial ETR","< 30 min"],["First update","< 1 hr"]].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#334155", padding:"3px 0", fontFamily:"'DM Sans', sans-serif" }}><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn variant="purple" icon="◈" onClick={() => onAI("notify",
          `You are a senior incident manager at a financial institution. Draft a stakeholder notification.\n\nIncident: ${inc.title||"Untitled"} | ${inc.incId}\nService: ${inc.service} | Severity: ${inc.severity} | Environment: ${inc.environment}\n\nWrite:\n1. Executive summary (3 lines max, plain language)\n2. Business impact statement\n3. Current status\n4. Initial ETR estimate\n5. Next update time\n6. Incident commander contact`
        )}>Draft Notification</Btn>
        <Btn onClick={onAdvance} icon="→">Send Notifications</Btn>
      </div>
      <AIBox content={aiOut.notify} loading={aiLoading === "notify"} label="AI — STAKEHOLDER NOTIFICATION DRAFT" />
    </div>
  );
}

function Stage03({ inc, onAI, aiOut, aiLoading, onAdvance }) {
  const bridgeUrl = `https://teams.microsoft.com/war-room-${inc.incId?.toLowerCase()}`;
  return (
    <div>
      <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#059669", fontFamily:"'DM Mono', monospace", marginBottom:8 }}>WAR ROOM BRIDGE — ACTIVE</div>
        <div style={{ fontSize:13, color:"#0369A1", fontFamily:"'DM Mono', monospace" }}>{bridgeUrl}</div>
      </div>
      <div style={{ background:"#0F172A", borderRadius:8, padding:"16px 18px", marginBottom:16, border:"1px solid #1E293B" }}>
        <div style={{ fontSize:10, color:"#F59E0B", fontFamily:"'DM Mono', monospace", marginBottom:10, letterSpacing:"0.1em" }}>📢 #sre-leads-incidents  —  PREVIEW</div>
        <div style={{ fontSize:12, lineHeight:1.8, fontFamily:"'DM Mono', monospace", color:"#94A3B8" }}>
          <span style={{ color:"#EF4444" }}>🚨 [{inc.severity}] INCIDENT DECLARED</span><br/>
          <span style={{ color:"#64748B" }}>INC:</span> <span style={{ color:"#F59E0B" }}>{inc.incId}</span><br/>
          <span style={{ color:"#64748B" }}>Service:</span> <span style={{ color:"#E2E8F0" }}>{inc.service || "—"}</span><br/>
          <span style={{ color:"#64748B" }}>IC:</span> <span style={{ color:"#E2E8F0" }}>{inc.ic || "Unassigned"}</span><br/>
          <span style={{ color:"#64748B" }}>Bridge:</span> <span style={{ color:"#38BDF8" }}>{bridgeUrl}</span><br/>
          <span style={{ color:"#64748B" }}>Status:</span> <span style={{ color:"#EF4444" }}>INVESTIGATING</span>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[["Incident Commander",inc.ic||"—","#D97706"],["Comms Lead","—","#0369A1"],["Tech Lead","—","#7C3AED"]].map(([role,name,color]) => (
          <div key={role} style={{ background:"#FAFAFA", border:`1px solid ${color}30`, borderRadius:8, padding:"10px 12px", borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:10, fontWeight:700, color, fontFamily:"'DM Mono', monospace", marginBottom:4 }}>{role.toUpperCase()}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1E293B", fontFamily:"'DM Sans', sans-serif" }}>{name}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn variant="purple" icon="◈" onClick={() => onAI("sre",
          `You are a veteran SRE lead. Write a war room brief for the SRE leads channel.\n\nIncident: ${inc.title} | ${inc.incId}\nService: ${inc.service} | Severity: ${inc.severity}\nDescription: ${inc.description||"Not provided"}\n\nInclude:\n1. Situation summary (2 lines)\n2. Initial hypotheses (3 bullet points)\n3. Immediate investigation areas\n4. Roles needed and first 15-minute action plan\n5. Any known blast radius`
        )}>AI War Room Brief</Btn>
        <Btn onClick={onAdvance} icon="→">Post to Channel</Btn>
      </div>
      <AIBox content={aiOut.sre} loading={aiLoading === "sre"} label="AI — WAR ROOM BRIEF" />
    </div>
  );
}

function Stage04({ inc, setInc, onAI, aiOut, aiLoading, onAdvance }) {
  const METRIC_TAGS = ["Latency Spike","Error Rate ↑","CPU High","Memory Pressure","Disk Full","Network Loss","DB Connections","Pod Crashloop","Timeouts","Queue Backup"];
  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <FieldLabel>Observed Symptoms & Error Messages</FieldLabel>
        <Textarea value={inc.symptoms} onChange={v => setInc(p=>({...p,symptoms:v}))} placeholder="Error messages, log patterns, alerts triggered, what users are seeing…" rows={3} />
      </div>
      <div style={{ marginBottom:12 }}>
        <FieldLabel>Recent Changes (deployments, config, infra)</FieldLabel>
        <Textarea value={inc.recentChanges} onChange={v => setInc(p=>({...p,recentChanges:v}))} placeholder="Any deploys, config changes, infra modifications in last 24–48 hrs…" rows={2} />
      </div>
      <div style={{ marginBottom:16 }}>
        <FieldLabel>Metric Signals</FieldLabel>
        <MultiTag options={METRIC_TAGS} selected={inc.metrics||[]} onToggle={t => setInc(p=>({...p,metrics:(p.metrics||[]).includes(t)?(p.metrics||[]).filter(x=>x!==t):[...(p.metrics||[]),t]}))} color="#7C3AED" />
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:4 }}>
        <Btn variant="purple" icon="◈" onClick={() => onAI("rca",
          `You are a principal SRE with deep expertise in distributed systems and financial trading platforms. Perform a structured root cause analysis.\n\nIncident: ${inc.title} | ${inc.incId}\nService: ${inc.service} | Severity: ${inc.severity}\nSymptoms: ${inc.symptoms||"Not specified"}\nRecent Changes: ${inc.recentChanges||"None reported"}\nMetric Signals: ${(inc.metrics||[]).join(", ")||"None selected"}\n\nProvide:\n1. Most likely root cause (be specific)\n2. Contributing factors (2–3)\n3. Evidence needed to confirm hypothesis\n4. Diagnostic commands/queries to run\n5. Estimated timeline of events\n6. Services at risk of cascading failure`
        )}>Run AI RCA</Btn>
        <Btn onClick={onAdvance} icon="→">Confirm Root Cause</Btn>
      </div>
      <AIBox content={aiOut.rca} loading={aiLoading === "rca"} label="AI — ROOT CAUSE ANALYSIS" />
    </div>
  );
}

function Stage05({ inc, setInc, onAI, aiOut, aiLoading, onAdvance }) {
  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <FieldLabel>Fix Type</FieldLabel>
        <MultiTag options={FIX_TYPES} selected={inc.fixTypes||[]} onToggle={t => setInc(p=>({...p,fixTypes:(p.fixTypes||[]).includes(t)?(p.fixTypes||[]).filter(x=>x!==t):[...(p.fixTypes||[]),t]}))} color="#0369A1" />
      </div>
      <div style={{ marginBottom:12 }}>
        <FieldLabel>Fix Description</FieldLabel>
        <Textarea value={inc.fixPlan} onChange={v => setInc(p=>({...p,fixPlan:v}))} placeholder="Describe the fix approach, steps, and who is executing…" rows={3} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"Change Type", value:"Emergency CHG", color:"#DC2626", bg:"#FEF2F2" },
          { label:"CAB Approval", value:"Override Required", color:"#D97706", bg:"#FFFBEB" },
          { label:"Rollback Plan", value: inc.fixPlan ? "Documented" : "Required", color: inc.fixPlan ? "#059669" : "#DC2626", bg: inc.fixPlan ? "#F0FDF4" : "#FEF2F2" },
        ].map(item => (
          <div key={item.label} style={{ background:item.bg, border:`1px solid ${item.color}30`, borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#64748B", fontFamily:"'DM Mono', monospace", marginBottom:3 }}>{item.label.toUpperCase()}</div>
            <div style={{ fontSize:12, fontWeight:700, color:item.color, fontFamily:"'DM Sans', sans-serif" }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn variant="purple" icon="◈" onClick={() => onAI("fix",
          `You are a senior platform engineer. Generate a safe, detailed fix runbook.\n\nIncident: ${inc.title} | ${inc.incId}\nService: ${inc.service} | RCA: ${aiOut.rca||"See incident details"}\nFix approach: ${(inc.fixTypes||[]).join(", ")||"Not specified"}\nFix description: ${inc.fixPlan||"Not specified"}\n\nGenerate:\n1. Step-by-step fix runbook (numbered, specific commands/actions)\n2. Risk assessment (what could go wrong)\n3. Rollback procedure (step by step)\n4. Validation steps to confirm the fix worked\n5. Estimated time to implement`
        )}>Generate Runbook</Btn>
        <Btn onClick={onAdvance} disabled={!(inc.fixTypes||[]).length} icon="→">Mark Fix Applied</Btn>
      </div>
      <AIBox content={aiOut.fix} loading={aiLoading === "fix"} label="AI — FIX RUNBOOK" />
    </div>
  );
}

function Stage06({ inc, onAI, aiOut, aiLoading, onAdvance, startTime }) {
  const [checks, setChecks] = useState([false,false,false,false,false,false,false]);
  const items = ["Error rates returning to baseline","Latency within SLA thresholds","All services healthy in monitoring","No cascading failures detected","Customer-facing functionality restored","Data integrity verified","Security posture confirmed"];
  const doneCount = checks.filter(Boolean).length;
  const pct = Math.round((doneCount / items.length) * 100);
  return (
    <div>
      <div style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#64748B", fontFamily:"'DM Mono', monospace" }}>MITIGATION PROGRESS</span>
          <span style={{ fontSize:14, fontWeight:700, color: pct===100 ? "#059669" : "#D97706", fontFamily:"'DM Mono', monospace" }}>{pct}%</span>
        </div>
        <div style={{ height:6, background:"#E2E8F0", borderRadius:3 }}>
          <div style={{ height:"100%", width:`${pct}%`, background: pct===100 ? "#059669" : "#D97706", borderRadius:3, transition:"width 0.3s" }} />
        </div>
      </div>
      <div style={{ marginBottom:16 }}>
        <FieldLabel>Verification Checklist</FieldLabel>
        <div style={{ background:"#FAFAFA", border:"1px solid #E2E8F0", borderRadius:8, padding:"4px 14px" }}>
          {items.map((l,i) => <CheckItem key={l} label={l} done={checks[i]} onToggle={() => setChecks(c=>c.map((v,j)=>j===i?!v:v))} />)}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"12px" }}>
          <div style={{ fontSize:10, color:"#92400E", fontFamily:"'DM Mono', monospace", marginBottom:4 }}>ELAPSED MTTR</div>
          <div style={{ fontSize:24, fontWeight:700, color:"#D97706", fontFamily:"'DM Mono', monospace" }}>{elapsed(startTime)}</div>
        </div>
        <div style={{ background: pct===100 ? "#F0FDF4" : "#F8FAFC", border:`1px solid ${pct===100?"#BBF7D0":"#E2E8F0"}`, borderRadius:8, padding:"12px" }}>
          <div style={{ fontSize:10, color:"#64748B", fontFamily:"'DM Mono', monospace", marginBottom:4 }}>CHECKS COMPLETE</div>
          <div style={{ fontSize:24, fontWeight:700, color: pct===100 ? "#059669" : "#94A3B8", fontFamily:"'DM Mono', monospace" }}>{doneCount}/{items.length}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn variant="purple" icon="◈" onClick={() => onAI("mitigate",
          `You are an SRE operations lead verifying incident mitigation.\n\nIncident: ${inc.title} | ${inc.incId}\nFix applied: ${(inc.fixTypes||[]).join(", ")}\nService: ${inc.service}\n\nProvide:\n1. Mitigation verification checklist with specific metric thresholds\n2. Key monitoring queries to run (Prometheus/Datadog style)\n3. Traffic validation steps\n4. Criteria to officially declare mitigation complete\n5. Risks to monitor over next 2 hours`
        )}>Verify Mitigation</Btn>
        <Btn variant="success" onClick={onAdvance} icon="✓">Confirm Mitigated</Btn>
      </div>
      <AIBox content={aiOut.mitigate} loading={aiLoading === "mitigate"} label="AI — MITIGATION VERIFICATION" />
    </div>
  );
}

function Stage07({ inc, onAI, aiOut, aiLoading, onAdvance }) {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const templates = [
    { id:"exec", label:"Executive Brief", icon:"👔", desc:"CTO/CIO level" },
    { id:"customer", label:"Customer Update", icon:"👥", desc:"External comms" },
    { id:"status", label:"Status Page", icon:"📊", desc:"Public status" },
    { id:"allhands", label:"All-Hands Update", icon:"📣", desc:"Internal broadcast" },
    { id:"regulatory", label:"Regulatory Notice", icon:"⚖️", desc:"Compliance team" },
  ];
  const prompts = {
    exec: `Write a concise executive briefing for CTO/CIO for incident ${inc.incId}.\nService: ${inc.service} | Severity: ${inc.severity} | Status: MITIGATED\nFix: ${(inc.fixTypes||[]).join(", ")}\n\nInclude: What happened, business impact, what was done, current status, next steps. Tone: calm, factual, confident. Max 150 words.`,
    customer: `Write a customer-facing incident update for ${inc.incId}.\nService: ${inc.service} | Status: RESOLVED\n\nWrite in plain language, no technical jargon. Include: what was affected, what we did, current status, apology. Max 100 words.`,
    status: `Write a status page update for ${inc.incId}.\nService: ${inc.service} | Status: MONITORING\n\nFormat as a status page post: title, short description, timeline of key events, current status. Clear and factual.`,
    allhands: `Write an internal all-hands update for ${inc.incId}.\nService: ${inc.service} | Severity: ${inc.severity}\nIC: ${inc.ic||"SRE Team"}\n\nInclude: what happened, how we responded, current status, lessons preview, kudos to team. Tone: honest, team-focused.`,
    regulatory: `Write a regulatory/compliance notification for incident ${inc.incId}.\nService: ${inc.service} | Severity: ${inc.severity}\nDuration: ${inc.startTime ? elapsed(inc.startTime) : "TBD"}\n\nFormal tone. Include: incident description, data impact assessment, regulatory implications, remediation actions taken, preventive measures.`,
  };
  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <FieldLabel>Select Communication Template</FieldLabel>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {templates.map(t => (
            <button key={t.id} onClick={() => { setActiveTemplate(t.id); onAI("comms_"+t.id, prompts[t.id]); }}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 14px", border:`2px solid ${activeTemplate===t.id?"#D97706":"#E2E8F0"}`, borderRadius:8, background: activeTemplate===t.id ? "#FFFBEB" : "#FAFAFA", cursor:"pointer", transition:"all 0.15s", minWidth:100 }}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color: activeTemplate===t.id ? "#D97706" : "#475569", fontFamily:"'DM Mono', monospace" }}>{t.label}</span>
              <span style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Sans', sans-serif" }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[["Status Page","Updated ✓","#059669","#F0FDF4"],["Customer Portal","Update Posted ✓","#0369A1","#F0F9FF"],["Exec Brief", activeTemplate === "exec" ? "Generated" : "Pending", activeTemplate === "exec" ? "#059669" : "#D97706", activeTemplate === "exec" ? "#F0FDF4" : "#FFFBEB"]].map(([k,v,c,bg]) => (
          <div key={k} style={{ background:bg, border:`1px solid ${c}30`, borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#64748B", fontFamily:"'DM Mono', monospace", marginBottom:3 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize:12, fontWeight:700, color:c, fontFamily:"'DM Sans', sans-serif" }}>{v}</div>
          </div>
        ))}
      </div>
      {activeTemplate && <AIBox content={aiOut["comms_"+activeTemplate]} loading={aiLoading === "comms_"+activeTemplate} label={`AI — ${templates.find(t=>t.id===activeTemplate)?.label?.toUpperCase()} DRAFT`} />}
      <div style={{ marginTop:16 }}>
        <Btn onClick={onAdvance} icon="→">Comms Complete</Btn>
      </div>
    </div>
  );
}

function Stage08({ inc, onAI, aiOut, aiLoading, startTime }) {
  return (
    <div>
      <div style={{ textAlign:"center", padding:"20px 0 24px", borderBottom:"1px solid #E2E8F0", marginBottom:20 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
        <div style={{ fontSize:28, fontWeight:800, color:"#059669", fontFamily:"'DM Mono', monospace", letterSpacing:"0.04em" }}>{inc.incId}</div>
        <div style={{ marginTop:8 }}><Tag color="#059669" bg="#F0FDF4">RESOLVED</Tag></div>
        <div style={{ fontSize:12, color:"#64748B", marginTop:10, fontFamily:"'DM Sans', sans-serif" }}>
          Total incident duration: <strong style={{ color:"#D97706" }}>{elapsed(startTime)}</strong>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          ["Service",inc.service||"—"],["Severity",inc.severity],
          ["Root Cause","AI Identified + Confirmed"],["Fix Applied",(inc.fixTypes||["Manual"]).join(", ")],
          ["IC",inc.ic||"—"],["Environment",inc.environment],
        ].map(([k,v]) => (
          <div key={k} style={{ background:"#F8FAFC", borderRadius:6, padding:"10px 14px", border:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Mono', monospace", marginBottom:3 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1E293B", fontFamily:"'DM Sans', sans-serif" }}>{v}</div>
          </div>
        ))}
      </div>
      <Btn variant="purple" icon="◈" onClick={() => onAI("pir",
        `You are an experienced SRE manager. Write a comprehensive blameless Post-Incident Review (PIR) / Post-Mortem.\n\nIncident: ${inc.title||"Untitled"} | ${inc.incId}\nService: ${inc.service} | Severity: ${inc.severity}\nEnvironment: ${inc.environment}\nIC: ${inc.ic||"Unknown"}\nDuration: ${elapsed(startTime)}\nDescription: ${inc.description||"Not provided"}\nSymptoms: ${inc.symptoms||"Not provided"}\nRecent Changes: ${inc.recentChanges||"None"}\nFix Applied: ${(inc.fixTypes||[]).join(", ")||"Not specified"}\n\nPIR Structure:\n1. Executive Summary (3 lines)\n2. Timeline of events\n3. Root cause\n4. Impact analysis\n5. What went well\n6. What needs improvement\n7. Action items with owners and deadlines\n8. SLO impact\n9. Preventive measures`
      )}>Generate PIR / Post-Mortem</Btn>
      <AIBox content={aiOut.pir} loading={aiLoading === "pir"} label="AI — POST-INCIDENT REVIEW" />
      <div style={{ marginTop:16, padding:"12px 16px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:13, color:"#065F46", fontFamily:"'DM Sans', sans-serif", fontWeight:600 }}>Close incident in ServiceNow</span>
        <Btn variant="success" small>Close {inc.incId}</Btn>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function IncidentManager() {
  const [stageIdx, setStageIdx] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiOut, setAiOut] = useState({});
  const [startTime] = useState(Date.now());
  const [elapsedStr, setElapsedStr] = useState("0s");
  const [timeline, setTimeline] = useState([]);
  const [incId] = useState(genIncId);
  const [inc, setInc] = useState({
    incId: genIncId(), title:"", service:"", severity:"P1", environment:"Production",
    ic:"", reporter:"", description:"", teams:[], symptoms:"", recentChanges:"",
    metrics:[], fixTypes:[], fixPlan:"",
  });

  useEffect(() => {
    const t = setInterval(() => setElapsedStr(elapsed(startTime)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const handleAI = useCallback(async (key, prompt) => {
    setAiLoading(key);
    const system = "You are an expert SRE and incident manager at a major financial institution. Be concise, specific, and actionable.";
    try {
      const result = await callClaude(system, prompt);
      setAiOut(p => ({...p, [key]: result}));
    } catch {
      setAiOut(p => ({...p, [key]: "⚠ API connection required. Please configure your Anthropic API key."}));
    }
    setAiLoading(null);
  }, []);

  const advance = useCallback(() => {
    const stage = STAGES[stageIdx];
    setCompleted(p => [...p, stageIdx]);
    setTimeline(p => [...p, { stage: stage.label, time: timeNow(), icon: stage.icon }]);
    if (stageIdx < STAGES.length - 1) setStageIdx(p => p + 1);
  }, [stageIdx]);

  const currentStage = STAGES[stageIdx];
  const sevInfo = SEVERITIES.find(s => s.id === inc.severity) || SEVERITIES[0];

  const stageProps = { inc, setInc, onAI: handleAI, aiOut, aiLoading, onAdvance: advance, startTime };

  const stageComponents = {
    create:   <Stage01 {...stageProps} />,
    notify:   <Stage02 {...stageProps} />,
    sre:      <Stage03 {...stageProps} />,
    rca:      <Stage04 {...stageProps} />,
    fix:      <Stage05 {...stageProps} />,
    mitigate: <Stage06 {...stageProps} />,
    comms:    <Stage07 {...stageProps} />,
    resolve:  <Stage08 {...stageProps} />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F1F5F9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius:3px; }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#F1F5F9", display:"flex", flexDirection:"column" }}>

        {/* ── TOP BAR ── */}
        <div style={{ background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"0 24px", height:56, display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, background:"#D97706", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:"#0F172A", fontFamily:"'DM Mono', monospace", letterSpacing:"0.04em" }}>INCIDENT COMMAND</div>
              <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Mono', monospace", letterSpacing:"0.06em" }}>SRE PLATFORM · GOLDMAN SACHS</div>
            </div>
          </div>
          <div style={{ width:1, height:28, background:"#E2E8F0", marginLeft:4 }} />
          {inc.title && <Tag color={sevInfo.color} bg={sevInfo.bg}>{inc.severity}</Tag>}
          {inc.title && <span style={{ fontSize:13, color:"#475569", fontFamily:"'DM Sans', sans-serif", fontWeight:600 }}>{inc.title}</span>}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:16 }}>
            {completed.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background: stageIdx === STAGES.length-1 && completed.includes(STAGES.length-1) ? "#059669" : "#EF4444", boxShadow:`0 0 6px ${stageIdx === STAGES.length-1 ? "#059669" : "#EF4444"}`, animation:"pulse 1.5s ease-in-out infinite" }} />
                <span style={{ fontSize:11, fontWeight:700, fontFamily:"'DM Mono', monospace", color:"#475569" }}>
                  {stageIdx === STAGES.length-1 ? "RESOLVED" : "ACTIVE"}
                </span>
              </div>
            )}
            <div style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:"#64748B" }}>⏱ {elapsedStr}</div>
            {inc.incId && <Tag small color="#0369A1" bg="#F0F9FF">{inc.incId}</Tag>}
          </div>
        </div>

        {/* ── PIPELINE STRIP ── */}
        <div style={{ background:"#fff", borderBottom:"1px solid #E2E8F0", padding:"0 24px", overflowX:"auto" }}>
          <div style={{ display:"flex", minWidth:"max-content" }}>
            {STAGES.map((s, i) => {
              const isDone = completed.includes(i);
              const isActive = i === stageIdx;
              return (
                <button key={s.id} onClick={() => (isDone || isActive) && setStageIdx(i)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", border:"none", background:"none", cursor: isDone ? "pointer" : "default", position:"relative", borderBottom:`3px solid ${isActive ? s.color : "transparent"}`, transition:"all 0.2s", whiteSpace:"nowrap" }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background: isDone ? "#F0FDF4" : isActive ? s.color : "#F1F5F9", border:`2px solid ${isDone ? "#059669" : isActive ? s.color : "#E2E8F0"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color: isDone ? "#059669" : isActive ? "#fff" : "#94A3B8", fontWeight:700, fontFamily:"'DM Mono', monospace", flexShrink:0 }}>
                    {isDone ? "✓" : s.num}
                  </div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:11, fontWeight:700, color: isActive ? s.color : isDone ? "#059669" : "#64748B", fontFamily:"'DM Mono', monospace" }}>{s.label}</div>
                    <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Sans', sans-serif" }}>{s.sub}</div>
                  </div>
                  {i < STAGES.length-1 && <span style={{ marginLeft:8, color:"#CBD5E1", fontSize:12 }}>›</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", gap:0, maxWidth:1280, width:"100%", margin:"0 auto", padding:"20px 24px", gap:20 }}>

          {/* Left — Stage Content */}
          <div>
            {/* Stage Header */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"20px 24px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:`${currentStage.color}15`, border:`2px solid ${currentStage.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                  {currentStage.icon}
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:currentStage.color, fontFamily:"'DM Mono', monospace", letterSpacing:"0.1em" }}>STAGE {currentStage.num}</span>
                    <Tag color={currentStage.color} bg={`${currentStage.color}12`} small>{currentStage.sub}</Tag>
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#0F172A", fontFamily:"'DM Mono', monospace" }}>{currentStage.label}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Mono', monospace", marginBottom:2 }}>STEP {stageIdx+1} OF {STAGES.length}</div>
                <div style={{ height:4, width:120, background:"#F1F5F9", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${((stageIdx+1)/STAGES.length)*100}%`, background:currentStage.color, borderRadius:2, transition:"width 0.4s" }} />
                </div>
              </div>
            </div>

            {/* Stage Body */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"24px", animation:"fadeIn 0.3s ease" }}>
              {stageComponents[currentStage.id]}
            </div>
          </div>

          {/* Right — Sidebar */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Incident Summary */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"18px", overflow:"hidden" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", fontFamily:"'DM Mono', monospace", letterSpacing:"0.1em", marginBottom:14 }}>INCIDENT SUMMARY</div>
              {inc.title ? (
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#D97706", fontFamily:"'DM Mono', monospace", marginBottom:4 }}>{inc.incId}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1E293B", marginBottom:10, lineHeight:1.4, fontFamily:"'DM Sans', sans-serif" }}>{inc.title}</div>
                  <Tag color={sevInfo.color} bg={sevInfo.bg}>{inc.severity} — {sevInfo.desc}</Tag>
                  <div style={{ marginTop:14 }}>
                    {[
                      ["Service", inc.service],
                      ["Env", inc.environment],
                      ["IC", inc.ic || "Unassigned"],
                      ["Teams", inc.teams.length ? inc.teams.slice(0,2).join(", ")+(inc.teams.length>2?` +${inc.teams.length-2}`:"") : "—"],
                      ["Elapsed", elapsedStr],
                    ].map(([k,v]) => v && (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F8FAFC" }}>
                        <span style={{ fontSize:11, color:"#94A3B8", fontFamily:"'DM Mono', monospace" }}>{k}</span>
                        <span style={{ fontSize:11, fontWeight:600, color:"#334155", fontFamily:"'DM Sans', sans-serif", textAlign:"right", maxWidth:"60%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"20px 0", color:"#CBD5E1" }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                  <div style={{ fontSize:12, fontFamily:"'DM Sans', sans-serif" }}>Fill in incident details to begin</div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"18px", flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", fontFamily:"'DM Mono', monospace", letterSpacing:"0.1em", marginBottom:14 }}>ACTIVITY TIMELINE</div>
              {timeline.length === 0 ? (
                <div style={{ textAlign:"center", padding:"20px 0", color:"#CBD5E1" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>⏱</div>
                  <div style={{ fontSize:12, fontFamily:"'DM Sans', sans-serif" }}>No activity yet</div>
                </div>
              ) : (
                <div>
                  {timeline.map((t, i) => (
                    <div key={i} style={{ display:"flex", gap:10, paddingBottom:14, position:"relative" }}>
                      {i < timeline.length-1 && <div style={{ position:"absolute", left:13, top:28, bottom:0, width:1, background:"#E2E8F0" }} />}
                      <div style={{ width:26, height:26, borderRadius:"50%", background:"#F0FDF4", border:"2px solid #BBF7D0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>{t.icon}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:"#1E293B", fontFamily:"'DM Sans', sans-serif" }}>{t.stage}</div>
                        <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Mono', monospace", marginTop:2 }}>{t.time}</div>
                      </div>
                    </div>
                  ))}
                  {stageIdx < STAGES.length && (
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", background:currentStage.color+"15", border:`2px solid ${currentStage.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>{currentStage.icon}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:currentStage.color, fontFamily:"'DM Sans', sans-serif" }}>{currentStage.label}</div>
                        <div style={{ fontSize:10, color:"#94A3B8", fontFamily:"'DM Mono', monospace" }}>In progress…</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"18px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", fontFamily:"'DM Mono', monospace", letterSpacing:"0.1em", marginBottom:12 }}>QUICK ACTIONS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { label:"Bridge Room", icon:"🔗", color:"#0369A1" },
                  { label:"Runbook Library", icon:"📚", color:"#7C3AED" },
                  { label:"Monitoring Dashboard", icon:"📊", color:"#059669" },
                  { label:"Escalation Matrix", icon:"📞", color:"#D97706" },
                ].map(a => (
                  <button key={a.label} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", border:"1px solid #E2E8F0", borderRadius:6, background:"#FAFAFA", cursor:"pointer", width:"100%", transition:"background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background="#F1F5F9"} onMouseLeave={e => e.currentTarget.style.background="#FAFAFA"}>
                    <span style={{ fontSize:14 }}>{a.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:"#475569", fontFamily:"'DM Sans', sans-serif" }}>{a.label}</span>
                    <span style={{ marginLeft:"auto", fontSize:12, color:"#CBD5E1" }}>›</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
