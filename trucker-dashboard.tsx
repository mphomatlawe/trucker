import { useState, useMemo, useCallback } from "react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface Job {
  id: string;
  contractor: string;
  route: string;
  cargo: string;
  status: "active" | "pending" | "completed" | "disputed";
  transporter: string;
  truck: string;
  value: number;
  commission: number;
  eta: string;
  progress: number;
}

interface Transporter {
  id: string;
  name: string;
  trucks: number;
  rating: number;
  status: "on-route" | "available" | "flagged";
  jobs: number;
  verified: boolean;
  joined: string;
}

interface Payment {
  id: string;
  job: string;
  amount: number;
  commission: number;
  status: "released" | "in-escrow" | "disputed";
  date: string;
  transporter: string;
}

// Style constants
const COLORS = {
  active: { bg: "#0d3d1f", color: "#22c55e", label: "ACTIVE" },
  pending: { bg: "#2d2506", color: "#eab308", label: "PENDING" },
  completed: { bg: "#0a1f3d", color: "#3b82f6", label: "COMPLETED" },
  disputed: { bg: "#3d0d0d", color: "#ef4444", label: "DISPUTED" },
  "on-route": { bg: "#0d3d1f", color: "#22c55e", label: "ON ROUTE" },
  available: { bg: "#0a1f3d", color: "#3b82f6", label: "AVAILABLE" },
  flagged: { bg: "#3d0d0d", color: "#ef4444", label: "FLAGGED" },
  released: { bg: "#0a1f3d", color: "#3b82f6", label: "RELEASED" },
  "in-escrow": { bg: "#2d2506", color: "#eab308", label: "IN ESCROW" },
} as const;

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: "⬡" },
  { id: "jobs", label: "Job Board", icon: "📋" },
  { id: "fleet", label: "Fleet", icon: "🚛" },
  { id: "transporters", label: "Transporters", icon: "👤" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "documents", label: "Documents", icon: "📁" },
];

const JOBS: Job[] = [
  { id: "JB-001", contractor: "GoldFields Mining", route: "Johannesburg → Rustenburg", cargo: "Heavy machinery", status: "active", transporter: "Lucky Mokoena", truck: "GP 12-34 XY", value: 18500, commission: 2220, eta: "14:30", progress: 65 },
  { id: "JB-002", contractor: "AgriPro Farms", route: "Pretoria → Polokwane", cargo: "Grain (24 tons)", status: "pending", transporter: "Unassigned", truck: "—", value: 9200, commission: 1104, eta: "—", progress: 0 },
  { id: "JB-003", contractor: "BuildRight Corp", route: "Durban → Cape Town", cargo: "Steel beams", status: "completed", transporter: "Sipho Dlamini", truck: "KZN 55-67 AB", value: 32000, commission: 3840, eta: "Completed", progress: 100 },
  { id: "JB-004", contractor: "Harmony Gold", route: "Welkom → Carletonville", cargo: "Mining equipment", status: "active", transporter: "Themba Nkosi", truck: "FS 88-12 CD", value: 24700, commission: 2964, eta: "16:45", progress: 48 },
  { id: "JB-005", contractor: "FreshPro Logistics", route: "Cape Town → George", cargo: "Perishables", status: "disputed", transporter: "Andre van Wyk", truck: "WC 44-21 EF", value: 7800, commission: 936, eta: "—", progress: 32 },
];

const TRANSPORTERS: Transporter[] = [
  { id: "TR-001", name: "Lucky Mokoena", trucks: 3, rating: 4.8, status: "on-route", jobs: 142, verified: true, joined: "Jan 2024" },
  { id: "TR-002", name: "Sipho Dlamini", trucks: 1, rating: 4.9, status: "available", jobs: 89, verified: true, joined: "Mar 2024" },
  { id: "TR-003", name: "Themba Nkosi", trucks: 5, rating: 4.5, status: "on-route", jobs: 210, verified: true, joined: "Oct 2023" },
  { id: "TR-004", name: "Andre van Wyk", trucks: 2, rating: 3.9, status: "flagged", jobs: 67, verified: false, joined: "Jun 2024" },
  { id: "TR-005", name: "Zanele Motha", trucks: 4, rating: 4.7, status: "available", jobs: 178, verified: true, joined: "Feb 2024" },
];

const PAYMENTS: Payment[] = [
  { id: "PAY-001", job: "JB-003", amount: 32000, commission: 3840, status: "released", date: "19 May 2026", transporter: "Sipho Dlamini" },
  { id: "PAY-002", job: "JB-001", amount: 18500, commission: 2220, status: "in-escrow", date: "20 May 2026", transporter: "Lucky Mokoena" },
  { id: "PAY-003", job: "JB-004", amount: 24700, commission: 2964, status: "in-escrow", date: "20 May 2026", transporter: "Themba Nkosi" },
  { id: "PAY-004", job: "JB-005", amount: 7800, commission: 936, status: "disputed", date: "18 May 2026", transporter: "Andre van Wyk" },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const statusStyle = (status: string) => {
  return COLORS[status as keyof typeof COLORS] || { bg: "#1a1a1a", color: "#aaa", label: status.toUpperCase() };
};

// ============================================================================
// SHARED STYLES
// ============================================================================

const SHARED_STYLES = {
  baseCard: {
    background: "#0f0f0f",
    border: "1px solid #1f1f1f",
    borderRadius: 2,
    padding: "16px 20px",
  },
  sectionLabel: {
    color: "#666",
    fontSize: 11,
    letterSpacing: 3,
    fontFamily: "'Courier New', monospace",
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 32,
    margin: 0,
    fontFamily: "'Bebas Neue', Impact, sans-serif",
    letterSpacing: 2,
  },
  monospaceSmall: {
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
  },
} as const;

// ============================================================================
// COMPONENTS
// ============================================================================

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: "#0f0f0f",
      border: `1px solid ${accent || "#2a2a2a"}`,
      borderLeft: `4px solid ${accent || "#f97316"}`,
      borderRadius: 2,
      padding: "20px 24px",
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ ...SHARED_STYLES.sectionLabel, marginBottom: 8 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: 1 }}>{value}</div>
      {sub && <div style={{ color: accent || "#f97316", fontSize: 11, marginTop: 4, ...SHARED_STYLES.monospaceSmall }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const s = statusStyle(status);
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: "3px 8px",
      borderRadius: 2,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1.5,
      fontFamily: "'Courier New', monospace",
      border: `1px solid ${s.color}33`,
      whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

function ProgressBar({ pct, color = "#f97316" }: { pct: number; color?: string }) {
  return (
    <div style={{ background: "#1a1a1a", borderRadius: 1, height: 4, width: "100%", overflow: "hidden" }}>
      <div style={{ 
        width: `${Math.min(pct, 100)}%`, 
        height: "100%", 
        background: pct === 100 ? "#3b82f6" : pct === 0 ? "#333" : color, 
        transition: "width 0.6s ease" 
      }} />
    </div>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={SHARED_STYLES.sectionLabel}>{label}</div>
      <h2 style={SHARED_STYLES.sectionTitle}>{title}</h2>
    </div>
  );
}

// ============================================================================
// PAGE COMPONENTS
// ============================================================================

function Overview() {
  // Memoize calculations for performance
  const stats = useMemo(() => ({
    totalRevenue: PAYMENTS.filter(p => p.status === "released").reduce((a, p) => a + p.commission, 0),
    escrow: PAYMENTS.filter(p => p.status === "in-escrow").reduce((a, p) => a + p.amount, 0),
    activeJobs: JOBS.filter(j => j.status === "active").length,
    availableTransporters: TRANSPORTERS.filter(t => t.status === "available").length,
  }), []);

  const alerts = useMemo(() => [
    { color: "#ef4444", msg: "JB-005 payment disputed — Andre van Wyk", time: "2h ago" },
    { color: "#eab308", msg: "TR-004 vehicle inspection expired", time: "1d ago" },
    { color: "#3b82f6", msg: "JB-003 payment released successfully", time: "3h ago" },
    { color: "#22c55e", msg: "New transporter TR-006 registered", time: "5h ago" },
    { color: "#eab308", msg: "JB-002 awaiting transporter assignment", time: "6h ago" },
  ], []);

  return (
    <div>
      <SectionHeader label="// PLATFORM OVERVIEW" title="COMMAND CENTER" />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard label="Commission Earned" value={`R ${stats.totalRevenue.toLocaleString()}`} sub="↑ 18% this month" accent="#22c55e" />
        <StatCard label="Funds in Escrow" value={`R ${stats.escrow.toLocaleString()}`} sub="2 jobs in transit" accent="#eab308" />
        <StatCard label="Active Jobs" value={stats.activeJobs} sub="Live on platform" accent="#f97316" />
        <StatCard label="Available Trucks" value={stats.availableTransporters} sub="Ready to dispatch" accent="#3b82f6" />
        <StatCard label="Total Transporters" value={TRANSPORTERS.length} sub="4 verified" accent="#a855f7" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Live Jobs */}
        <div style={{ ...SHARED_STYLES.baseCard, border: "1px solid #2a2a2a" }}>
          <div style={SHARED_STYLES.sectionLabel}>// LIVE JOBS</div>
          {JOBS.filter(j => j.status === "active").map(job => (
            <div key={job.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: "#f97316", fontSize: 12, ...SHARED_STYLES.monospaceSmall }}>{job.id}</span>
                <span style={{ color: "#22c55e", fontSize: 11, ...SHARED_STYLES.monospaceSmall }}>ETA {job.eta}</span>
              </div>
              <div style={{ color: "#fff", fontSize: 13, marginBottom: 4 }}>{job.route}</div>
              <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>{job.transporter} · {job.truck}</div>
              <ProgressBar pct={job.progress} />
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div style={{ ...SHARED_STYLES.baseCard, border: "1px solid #2a2a2a" }}>
          <div style={SHARED_STYLES.sectionLabel}>// ALERTS & FLAGS</div>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ color: "#ccc", fontSize: 12 }}>{a.msg}</div>
                <div style={{ color: "#555", fontSize: 10, ...SHARED_STYLES.monospaceSmall, marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JobBoard() {
  const [filter, setFilter] = useState<string>("all");
  const filters = ["all", "active", "pending", "completed", "disputed"];
  
  const filtered = useMemo(() => 
    filter === "all" ? JOBS : JOBS.filter(j => j.status === filter),
    [filter]
  );

  return (
    <div>
      <SectionHeader label="// JOB MANAGEMENT" title="JOB BOARD" />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {filters.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            style={{
              padding: "6px 16px",
              background: filter === f ? "#f97316" : "transparent",
              color: filter === f ? "#000" : "#666",
              border: `1px solid ${filter === f ? "#f97316" : "#2a2a2a"}`,
              borderRadius: 2,
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            {f}
          </button>
        ))}
        <button style={{
          marginLeft: "auto", padding: "6px 20px", background: "#f97316", color: "#000",
          border: "none", borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700,
          letterSpacing: 1, fontFamily: "'Courier New', monospace",
          transition: "all 0.15s",
        }}>+ POST JOB</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(job => (
          <div key={job.id} style={{ ...SHARED_STYLES.baseCard }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ color: "#f97316", fontFamily: "'Courier New', monospace", fontSize: 12, minWidth: 72 }}>{job.id}</span>
              <Badge status={job.status} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{job.route}</div>
                <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{job.cargo} · {job.contractor}</div>
              </div>
              <div style={{ minWidth: 140 }}>
                <div style={{ color: "#aaa", fontSize: 12 }}>{job.transporter}</div>
                <div style={{ color: "#555", fontSize: 11 }}>{job.truck}</div>
              </div>
              <div style={{ textAlign: "right", minWidth: 100 }}>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>R {job.value.toLocaleString()}</div>
                <div style={{ color: "#22c55e", fontSize: 11 }}>+R {job.commission.toLocaleString()} comm.</div>
              </div>
              <div style={{ minWidth: 80, textAlign: "right" }}>
                <div style={{ color: "#eab308", fontSize: 12, fontFamily: "'Courier New', monospace" }}>{job.eta}</div>
                <div style={{ marginTop: 6 }}><ProgressBar pct={job.progress} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Fleet() {
  const mapBlips = useMemo(() => [
    { x: "30%", y: "40%", label: "JB-001", color: "#22c55e" },
    { x: "65%", y: "60%", label: "JB-004", color: "#22c55e" },
    { x: "80%", y: "30%", label: "JB-005", color: "#ef4444" },
  ], []);

  const trucks = useMemo(() => [
    { reg: "GP 12-34 XY", owner: "Lucky Mokoena", type: "34-ton side tipper", status: "on-route", job: "JB-001", inspection: "Valid" },
    { reg: "KZN 55-67 AB", owner: "Sipho Dlamini", type: "Cargo van", status: "available", job: "—", inspection: "Valid" },
    { reg: "FS 88-12 CD", owner: "Themba Nkosi", type: "Flatbed", status: "on-route", job: "JB-004", inspection: "Valid" },
    { reg: "WC 44-21 EF", owner: "Andre van Wyk", type: "Refrigerated", status: "flagged", job: "JB-005", inspection: "Expired" },
    { reg: "GP 77-99 GH", owner: "Zanele Motha", type: "Moving truck", status: "available", job: "—", inspection: "Valid" },
  ], []);

  return (
    <div>
      <SectionHeader label="// VEHICLE MANAGEMENT" title="FLEET TRACKER" />

      {/* Map placeholder */}
      <div style={{
        background: "#0a0a0a",
        border: "1px solid #1f1f1f",
        borderRadius: 2,
        height: 260,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {mapBlips.map(blip => (
          <div key={blip.label} style={{ position: "absolute", left: blip.x, top: blip.y, transform: "translate(-50%,-50%)" }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%", background: blip.color,
              boxShadow: `0 0 0 4px ${blip.color}33, 0 0 0 8px ${blip.color}11`,
              animation: "pulse 2s infinite",
            }} />
            <div style={{ color: blip.color, fontSize: 10, fontFamily: "'Courier New', monospace", marginTop: 6, whiteSpace: "nowrap" }}>{blip.label}</div>
          </div>
        ))}
        <div style={{ position: "relative", color: "#333", fontSize: 12, fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>
          LIVE MAP · CTRACK INTEGRATION ACTIVE
        </div>
      </div>

      {/* Truck Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {trucks.map(truck => (
          <div key={truck.reg} style={{ 
            ...SHARED_STYLES.baseCard, 
            border: `1px solid ${truck.status === "flagged" ? "#3d0d0d" : "#1f1f1f"}` 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ color: "#f97316", fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 700 }}>{truck.reg}</div>
                <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{truck.type}</div>
              </div>
              <Badge status={truck.status} />
            </div>
            <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8 }}>{truck.owner}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#555", fontSize: 11, fontFamily: "'Courier New', monospace" }}>Job: {truck.job}</span>
              <span style={{ color: truck.inspection === "Expired" ? "#ef4444" : "#22c55e", fontSize: 11, fontFamily: "'Courier New', monospace" }}>
                {truck.inspection === "Expired" ? "⚠ EXPIRED" : "✓ INSPECTED"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Transporters() {
  const handleViewProfile = useCallback((name: string) => {
    console.log("Viewing profile for:", name);
    // Add navigation logic here
  }, []);

  return (
    <div>
      <SectionHeader label="// TRANSPORTER REGISTRY" title="TRANSPORTERS" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TRANSPORTERS.map(t => (
          <div key={t.id} style={{ ...SHARED_STYLES.baseCard, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: `linear-gradient(135deg, #1a1a1a, #2a2a2a)`,
              border: `2px solid ${t.verified ? "#f97316" : "#333"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
            }}>{t.name[0]}</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                {t.verified && <span style={{ color: "#f97316", fontSize: 10, fontFamily: "'Courier New', monospace" }}>✓ VERIFIED</span>}
              </div>
              <div style={{ color: "#555", fontSize: 11, fontFamily: "'Courier New', monospace", marginTop: 2 }}>{t.id} · Joined {t.joined}</div>
            </div>
            <Badge status={t.status} />
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ color: "#eab308", fontSize: 18, fontWeight: 700 }}>{"★".repeat(Math.round(t.rating))}</div>
              <div style={{ color: "#666", fontSize: 11 }}>{t.rating}/5.0</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{t.trucks}</div>
              <div style={{ color: "#666", fontSize: 11 }}>Trucks</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{t.jobs}</div>
              <div style={{ color: "#666", fontSize: 11 }}>Jobs Done</div>
            </div>
            <button 
              onClick={() => handleViewProfile(t.name)}
              style={{ 
                padding: "6px 16px", background: "transparent", color: "#f97316", border: "1px solid #f97316", 
                borderRadius: 2, cursor: "pointer", fontSize: 11, letterSpacing: 1, fontFamily: "'Courier New', monospace",
                transition: "all 0.15s",
              }}>
              VIEW PROFILE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Payments() {
  const stats = useMemo(() => ({
    totalCommission: PAYMENTS.reduce((a, p) => a + p.commission, 0),
    released: PAYMENTS.filter(p => p.status === "released").reduce((a, p) => a + p.commission, 0),
    escrow: PAYMENTS.filter(p => p.status === "in-escrow").reduce((a, p) => a + p.amount, 0),
    disputed: PAYMENTS.filter(p => p.status === "disputed").reduce((a, p) => a + p.commission, 0),
  }), []);

  return (
    <div>
      <SectionHeader label="// FINANCIAL OVERVIEW" title="PAYMENTS" />

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total Commission" value={`R ${stats.totalCommission.toLocaleString()}`} sub="All time" accent="#22c55e" />
        <StatCard label="Released" value={`R ${stats.released.toLocaleString()}`} sub="Cleared to bank" accent="#3b82f6" />
        <StatCard label="In Escrow" value={`R ${stats.escrow.toLocaleString()}`} sub="Pending delivery" accent="#eab308" />
        <StatCard label="Disputed" value={`R ${stats.disputed.toLocaleString()}`} sub="Needs resolution" accent="#ef4444" />
      </div>

      <div style={{ background: "#0f0f0f", border: "1px solid #1f1f1f", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 120px 120px 100px 100px", gap: 0, padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
          {["REF", "JOB", "TRANSPORTER", "AMOUNT", "COMMISSION", "DATE", "STATUS"].map(h => (
            <div key={h} style={{ color: "#444", fontSize: 10, letterSpacing: 2, fontFamily: "'Courier New', monospace" }}>{h}</div>
          ))}
        </div>
        {PAYMENTS.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 120px 120px 100px 100px", gap: 0, padding: "14px 20px", borderBottom: i < PAYMENTS.length - 1 ? "1px solid #111" : "none", alignItems: "center" }}>
            <span style={{ color: "#f97316", fontSize: 11, fontFamily: "'Courier New', monospace" }}>{p.id}</span>
            <span style={{ color: "#666", fontSize: 11, fontFamily: "'Courier New', monospace" }}>{p.job}</span>
            <span style={{ color: "#ccc", fontSize: 13 }}>{p.transporter}</span>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>R {p.amount.toLocaleString()}</span>
            <span style={{ color: "#22c55e", fontSize: 13 }}>R {p.commission.toLocaleString()}</span>
            <span style={{ color: "#555", fontSize: 11, fontFamily: "'Courier New', monospace" }}>{p.date}</span>
            <Badge status={p.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Documents() {
  const docs = useMemo(() => [
    { name: "Lucky Mokoena — Driver License", type: "PDF", status: "verified", date: "12 Jan 2026", size: "1.2 MB" },
    { name: "GP 12-34 XY — Roadworthy Certificate", type: "PDF", status: "verified", date: "3 Mar 2026", size: "845 KB" },
    { name: "Andre van Wyk — Vehicle Inspection", type: "PDF", status: "expired", date: "14 Nov 2025", size: "2.1 MB" },
    { name: "Themba Nkosi — PrDP License", type: "PDF", status: "verified", date: "29 Apr 2026", size: "990 KB" },
    { name: "JB-005 — Dispute Evidence", type: "IMG", status: "pending", date: "18 May 2026", size: "3.4 MB" },
    { name: "GoldFields Mining — Contract JB-001", type: "PDF", status: "signed", date: "20 May 2026", size: "512 KB" },
  ], []);

  const statusMap = useMemo(() => ({ 
    verified: "#22c55e", 
    expired: "#ef4444", 
    pending: "#eab308", 
    signed: "#3b82f6" 
  }), []);

  return (
    <div>
      <SectionHeader label="// DOCUMENT VAULT" title="DOCUMENTS" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {docs.map((doc, i) => (
          <div key={i} style={{ ...SHARED_STYLES.baseCard, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 48, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: "#f97316", fontSize: 11, fontWeight: 700, fontFamily: "'Courier New', monospace", flexShrink: 0 }}>
              {doc.type}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ color: "#ccc", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
              <div style={{ color: "#444", fontSize: 10, fontFamily: "'Courier New', monospace", marginTop: 4 }}>{doc.date} · {doc.size}</div>
              <div style={{ color: statusMap[doc.status as keyof typeof statusMap], fontSize: 10, letterSpacing: 1, fontFamily: "'Courier New', monospace", marginTop: 4, textTransform: "uppercase" }}>
                {doc.status === "expired" ? "⚠ " : "✓ "}{doc.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function TruckerDashboard() {
  const [active, setActive] = useState("overview");

  const pages = useMemo(() => ({ 
    overview: Overview, 
    jobs: JobBoard, 
    fleet: Fleet, 
    transporters: Transporters, 
    payments: Payments, 
    documents: Documents 
  }), []);

  const Page = pages[active as keyof typeof pages];

  const handleNavClick = useCallback((id: string) => {
    setActive(id);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #0a0a0a; } 
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
        @keyframes pulse { 
          0%,100% { box-shadow: 0 0 0 4px #22c55e33, 0 0 0 8px #22c55e11; } 
          50% { box-shadow: 0 0 0 8px #22c55e22, 0 0 0 16px #22c55e08; } 
        }
        button { font-family: inherit; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#050505", borderRight: "1px solid #141414", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid #141414" }}>
          <div style={{ color: "#f97316", fontSize: 26, fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: 3 }}>TRUCKER</div>
          <div style={{ color: "#333", fontSize: 10, letterSpacing: 2, fontFamily: "'Courier New', monospace", marginTop: 2 }}>ADMIN CONSOLE v1.0</div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => (
            <button 
              key={item.id} 
              onClick={() => handleNavClick(item.id)} 
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 20px",
                background: active === item.id ? "#0f0f0f" : "transparent",
                borderLeft: active === item.id ? "3px solid #f97316" : "3px solid transparent",
                color: active === item.id ? "#fff" : "#444",
                border: "none",
                cursor: "pointer", textAlign: "left", fontSize: 13,
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ letterSpacing: 0.5 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #141414" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: 14 }}>
              A
            </div>
            <div>
              <div style={{ color: "#ccc", fontSize: 12 }}>Admin</div>
              <div style={{ color: "#444", fontSize: 10, fontFamily: "'Courier New', monospace" }}>Fleet Manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ padding: "16px 32px", borderBottom: "1px solid #141414", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#050505", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ color: "#333", fontSize: 11, fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>
            WED 20 MAY 2026 · 08:04 · 8°C JOHANNESBURG
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ color: "#22c55e", fontSize: 11, fontFamily: "'Courier New', monospace" }}>PLATFORM ONLINE</span>
            <div style={{ width: 1, height: 16, background: "#1a1a1a", margin: "0 8px" }} />
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
              <span style={{ fontSize: 12 }}>🔔</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "32px", flex: 1, overflow: "auto" }}>
          <Page />
        </div>
      </div>
    </div>
  );
}
