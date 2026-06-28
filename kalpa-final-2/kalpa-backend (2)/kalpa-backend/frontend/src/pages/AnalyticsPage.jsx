import {
  Activity, AlertTriangle, Building2, Calendar,
  ChevronLeft, ChevronRight, Download, MapPin,
  Search, ShieldCheck, Wrench, X, Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getApiErrorMessage, searchProducts } from '../api/api';

const PAGE = 30;

const STATUS_COLORS = {
  operational:       '#27ae60',
  faulty:            '#e05252',
  under_maintenance: '#d97706',
  decommissioned:    '#6b8079',
};

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ── Animated count-up ─────────────────────────────────────── */
function AnimatedNumber({ to, decimals = 0, duration = 1100 }) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (to === 0) { setCurrent(0); return; }
    const t0 = performance.now();
    const run = now => {
      const p = Math.min((now - t0) / duration, 1);
      const v = (1 - Math.pow(1 - p, 3)) * to;
      setCurrent(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v));
      if (p < 1) rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration, decimals]);
  return decimals > 0 ? current.toFixed(decimals) : current.toLocaleString();
}

/* ── Tooltip primitives ────────────────────────────────────── */
const TipBox = ({ children }) => (
  <div style={{
    background: 'var(--overlay)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '14px 18px',
    boxShadow: '0 12px 40px rgba(0,0,0,.15)', minWidth: 180, pointerEvents: 'none',
  }}>{children}</div>
);
const TipRow = ({ label, val, color, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
    <span style={{ color: 'var(--text-2)' }}>{label}</span>
    <span style={{ color, fontWeight: bold ? 700 : 600 }}>{val}</span>
  </div>
);

function LocationTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TipBox>
      <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 10, fontSize: 13 }}>{d.name}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
        <TipRow label="Total"         val={d.value}        color="var(--text)" bold />
        <TipRow label="Operational"   val={d.operational}  color="#27ae60" />
        {d.faulty > 0        && <TipRow label="Faulty"          val={d.faulty}        color="var(--danger)" />}
        {d.maintenance > 0   && <TipRow label="Maintenance"     val={d.maintenance}   color="var(--warn)" />}
        {d.decommissioned > 0 && <TipRow label="Decommissioned" val={d.decommissioned} color="var(--text-3)" />}
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 10 }}>Click to explore →</p>
    </TipBox>
  );
}

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TipBox>
      <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 12, textTransform: 'capitalize', marginBottom: 6 }}>
        {d.name.replace(/_/g, ' ')}
      </p>
      <p style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{d.value}</p>
      <p style={{ color: 'var(--text-3)', fontSize: 10, marginTop: 6 }}>Click to view →</p>
    </TipBox>
  );
}

function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <TipBox>
      <p style={{ color: 'var(--text-3)', fontSize: 10, marginBottom: 4 }}>Manufactured</p>
      <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>{d.name}</p>
      <p style={{ color: 'var(--purple)', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{d.value} assets</p>
    </TipBox>
  );
}

/* ── KPI Card ──────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color, Icon, trend, onClick }) {
  const str    = String(value).replace(/,/g, '');
  const match  = str.match(/^([\d.]+)(.*)$/);
  const num    = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : '';
  const decs   = num != null && !Number.isInteger(num) ? 1 : 0;

  return (
    <div
      className="kpi-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p className="label" style={{ marginBottom: 14 }}>{label}</p>
          <p className="count-up" style={{ fontSize: '2.2rem', fontWeight: 300, color: color || 'var(--text)', lineHeight: 1 }}>
            {num != null ? <><AnimatedNumber to={num} decimals={decs} />{suffix}</> : value}
          </p>
          {sub && <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>{sub}</p>}
        </div>
        {Icon && (
          <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ padding: 10, background: 'var(--bg-subtle)', color: color || 'var(--accent)' }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {trend != null && (
        <div style={{ marginTop: 16, height: 4, borderRadius: 2, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(100, Math.max(0, trend))}%`,
            background: color || 'var(--accent)', borderRadius: 2, transition: 'width 1s ease-out 0.4s',
          }} />
        </div>
      )}
      {onClick && (
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.02em' }}>
          Click to explore →
        </p>
      )}
    </div>
  );
}

/* ── Insight Card ──────────────────────────────────────────── */
function InsightCard({ Icon, color, title, desc }) {
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hi)'; e.currentTarget.style.borderColor = 'var(--border-hi)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div className="flex gap-3">
        <div className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ padding: 8, background: 'var(--surface)', color: color || 'var(--accent)', border: '1px solid var(--border)' }}>
          {Icon && <Icon size={16} />}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text)', lineHeight: '1.3' }}>{title}</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Section Header ────────────────────────────────────────── */
function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

/* ── Shared panel primitives ───────────────────────────────── */
function SmartSummary({ text }) {
  return (
    <div style={{
      background: 'var(--accent-dim)', borderLeft: '3px solid var(--accent)',
      borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: 20,
    }}>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: '1.55' }}>{text}</p>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 22, fontWeight: 300, color: color || 'var(--text)', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, textTransform: 'capitalize' }}>{label}</p>
    </div>
  );
}

function AssetRow({ p, onClose }) {
  const color = STATUS_COLORS[p.status] || 'var(--text-3)';
  return (
    <Link to={`/product/${p.product_id}`} onClick={onClose} style={{ textDecoration: 'none', display: 'block', marginBottom: 6 }}>
      <div
        className="card p-3"
        style={{ cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hi)'; e.currentTarget.style.borderColor = 'var(--border-hi)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{p.product_id}</p>
            <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 2 }}>
              {p.product_type} · {p.location || 'Unknown'} · {p.manufacture_year || 'N/A'}
            </p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px',
            borderRadius: 999, flexShrink: 0,
            background: `${color}22`, color,
          }}>
            {p.status?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({ page, total, onPage }) {
  const pages = Math.ceil(total / PAGE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)', marginTop: 8 }}>
      <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Page {page} of {pages}</p>
      <button className="btn btn-ghost" style={{ padding: '4px 10px' }} disabled={page === pages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

const MINI_TIP = { contentStyle: { background: 'var(--overlay)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 } };

/* ── Fleet Health Panel ────────────────────────────────────── */
function FleetHealthContent({ products, stats }) {
  const decommissioned = useMemo(() => products.filter(p => p.status === 'decommissioned').length, [products]);

  const locHealth = useMemo(() =>
    stats.locationData
      .map(d => ({
        name: d.name,
        total: d.value,
        operational: d.operational,
        pct: Math.round((d.operational / d.value) * 100),
      }))
      .sort((a, b) => b.pct - a.pct),
    [stats.locationData]
  );

  const topSites = locHealth.slice(0, 3);
  const lowSites = locHealth.filter(s => s.pct < 85).slice(-3).reverse();

  const summary = `${stats.operational.toLocaleString()} of ${stats.total.toLocaleString()} assets (${stats.operationalPct}%) remain operational across ${stats.locationData.length} locations.${stats.faulty > 0 ? ` ${stats.faulty} assets require immediate attention.` : ' No faulty assets detected.'}`;

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SmartSummary text={summary} />

      <div>
        <p className="label" style={{ marginBottom: 12 }}>Status Breakdown</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatBadge label="Operational"      value={stats.operational}     color="#27ae60" />
          <StatBadge label="Under Maintenance" value={stats.underMaintenance} color="var(--warn)" />
          <StatBadge label="Faulty"           value={stats.faulty}           color="var(--danger)" />
          <StatBadge label="Decommissioned"   value={decommissioned}         color="var(--text-3)" />
        </div>
      </div>

      {locHealth.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Health by Location</p>
          <ResponsiveContainer width="100%" height={Math.min(locHealth.length * 30 + 20, 260)}>
            <BarChart data={locHealth} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--text-3)" tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} width={76} />
              <Tooltip {...MINI_TIP} formatter={v => [`${v}%`, 'Operational']} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} animationDuration={800}>
                {locHealth.map((entry, i) => (
                  <Cell key={i} fill={entry.pct >= 80 ? '#27ae60' : entry.pct >= 60 ? 'var(--warn)' : 'var(--danger)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {topSites.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Top Performing Sites</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topSites.map(s => (
              <div key={s.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8,
                borderLeft: '3px solid #27ae60',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.total} assets</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#27ae60' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowSites.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Sites Needing Attention</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lowSites.map(s => (
              <div key={s.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8,
                borderLeft: '3px solid var(--danger)',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.total} assets</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Total Assets Panel ────────────────────────────────────── */
function TotalAssetsContent({ products, stats, onClose }) {
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLoc, setFilterLoc]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]           = useState(1);

  const types = useMemo(() => [...new Set(products.map(p => p.product_type).filter(Boolean))].sort(), [products]);
  const locs  = useMemo(() => [...new Set(products.map(p => p.location).filter(Boolean))].sort(), [products]);

  const filtered = useMemo(() => {
    let r = products;
    if (filterType)   r = r.filter(p => p.product_type === filterType);
    if (filterLoc)    r = r.filter(p => p.location === filterLoc);
    if (filterStatus) r = r.filter(p => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(p =>
        p.product_id?.toLowerCase().includes(q) ||
        p.product_type?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [products, search, filterType, filterLoc, filterStatus]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const reset = fn => { fn(); setPage(1); };

  const summary = `${stats.total.toLocaleString()} assets across ${stats.locationData.length} locations and ${types.length} product types.`;

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SmartSummary text={summary} />

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="field" style={{ paddingLeft: 32 }} placeholder="Search ID, type, location…"
            value={search} onChange={e => reset(() => setSearch(e.target.value))} />
        </div>
        <button className="btn btn-ghost" style={{ padding: '0 12px', fontSize: 12, gap: 4, whiteSpace: 'nowrap' }}
          onClick={() => exportCSV(filtered.map(p => ({ id: p.product_id, type: p.product_type, location: p.location, year: p.manufacture_year, status: p.status })), 'assets.csv')}>
          <Download size={14} /> CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <select className="field" value={filterType} onChange={e => reset(() => setFilterType(e.target.value))}>
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="field" value={filterLoc} onChange={e => reset(() => setFilterLoc(e.target.value))}>
          <option value="">All Locations</option>
          {locs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="field" value={filterStatus} onChange={e => reset(() => setFilterStatus(e.target.value))}>
          <option value="">All Status</option>
          {['operational', 'faulty', 'under_maintenance', 'decommissioned'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} assets</p>

      {paged.length === 0
        ? <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
        : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
      }
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  );
}

/* ── Fault Rate Panel ──────────────────────────────────────── */
function FaultRateContent({ products, stats, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const faultyProducts = useMemo(() => products.filter(p => p.status === 'faulty'), [products]);

  const faultByLocation = useMemo(() => {
    const map = {};
    faultyProducts.forEach(p => { const loc = p.location || 'Unknown'; map[loc] = (map[loc] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [faultyProducts]);

  const faultByType = useMemo(() => {
    const map = {};
    faultyProducts.forEach(p => { const t = p.product_type || 'Unknown'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [faultyProducts]);

  const filtered = useMemo(() => {
    if (!search) return faultyProducts;
    const q = search.toLowerCase();
    return faultyProducts.filter(p =>
      p.product_id?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q)
    );
  }, [faultyProducts, search]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const topLoc = faultByLocation[0];
  const summary = `${stats.faulty} faulty assets detected (${stats.faultRate}% of fleet).${topLoc ? ` ${topLoc.name} has the highest concentration with ${topLoc.value} fault${topLoc.value !== 1 ? 's' : ''}.` : ''}`;

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SmartSummary text={summary} />

      {faultByLocation.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Faults by Location</p>
          <ResponsiveContainer width="100%" height={Math.min(faultByLocation.length * 32 + 20, 260)}>
            <BarChart data={faultByLocation} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} width={76} />
              <Tooltip {...MINI_TIP} />
              <Bar dataKey="value" fill="var(--danger)" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {faultByType.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 12 }}>Faults by Product Type</p>
          <ResponsiveContainer width="100%" height={Math.min(faultByType.length * 32 + 20, 220)}>
            <BarChart data={faultByType} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} width={76} />
              <Tooltip {...MINI_TIP} />
              <Bar dataKey="value" fill="var(--warn)" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p className="label">Faulty Assets</p>
          <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 12, gap: 4 }}
            onClick={() => exportCSV(faultyProducts.map(p => ({ id: p.product_id, type: p.product_type, location: p.location, year: p.manufacture_year })), 'faulty-assets.csv')}>
            <Download size={13} /> CSV
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="field" style={{ paddingLeft: 32 }} placeholder="Filter faulty assets…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{filtered.length} assets</p>
        {paged.length === 0
          ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
          : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
        }
        <Pagination page={page} total={filtered.length} onPage={setPage} />
      </div>
    </div>
  );
}

/* ── Maintenance Panel ─────────────────────────────────────── */
function MaintenanceContent({ products, stats, onClose }) {
  const [search, setSearch] = useState('');
  const [tab, setTab]       = useState('overdue');
  const [page, setPage]     = useState(1);

  const overdue  = useMemo(() => products.filter(p => p.tags?.includes('maintenance_overdue')), [products]);
  const dueSoon  = useMemo(() => products.filter(p => p.tags?.includes('maintenance_due') && !p.tags?.includes('maintenance_overdue')), [products]);

  const activeList = tab === 'overdue' ? overdue : dueSoon;
  const filtered = useMemo(() => {
    if (!search) return activeList;
    const q = search.toLowerCase();
    return activeList.filter(p =>
      p.product_id?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q)
    );
  }, [activeList, search]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const summary = `${stats.maintenanceDue} assets require maintenance. ${overdue.length} are overdue, ${dueSoon.length} are due soon.`;

  const TABS = [
    { id: 'overdue', label: `Overdue (${overdue.length})`,   color: 'var(--danger)' },
    { id: 'soon',    label: `Due Soon (${dueSoon.length})`,  color: 'var(--warn)' },
  ];

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SmartSummary text={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatBadge label="Overdue"   value={overdue.length}  color="var(--danger)" />
        <StatBadge label="Due Soon"  value={dueSoon.length}  color="var(--warn)" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); setPage(1); setSearch(''); }}
            style={{
              flex: 1, padding: '7px 10px', fontSize: 12, fontWeight: 600,
              borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
              background: tab === t.id ? `${t.color}22` : 'transparent',
              color: tab === t.id ? t.color : 'var(--text-2)',
              transition: 'all 0.15s',
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="field" style={{ paddingLeft: 32 }} placeholder="Filter assets…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} assets</p>
      {paged.length === 0
        ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
        : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
      }
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  );
}

/* ── Warranty Panel ────────────────────────────────────────── */
function WarrantyContent({ products, stats, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const warrantyAssets = useMemo(() => products.filter(p => p.tags?.includes('warranty_expiring_soon')), [products]);
  const filtered = useMemo(() => {
    if (!search) return warrantyAssets;
    const q = search.toLowerCase();
    return warrantyAssets.filter(p =>
      p.product_id?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q)
    );
  }, [warrantyAssets, search]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const summary = stats.warrantyExpiring > 0
    ? `${stats.warrantyExpiring} warranties expiring within the next 30 days. Review and renew coverage to avoid gaps.`
    : 'No warranties expiring within the next 30 days.';

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SmartSummary text={summary} />

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="field" style={{ paddingLeft: 32 }} placeholder="Filter by ID, type, location…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-ghost" style={{ padding: '0 12px', fontSize: 12, gap: 4, whiteSpace: 'nowrap' }}
          onClick={() => exportCSV(warrantyAssets.map(p => ({ id: p.product_id, type: p.product_type, location: p.location, year: p.manufacture_year, status: p.status })), 'warranty-expiring.csv')}>
          <Download size={14} /> CSV
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} assets</p>
      {filtered.length === 0
        ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
        : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
      }
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  );
}

/* ── Asset Age Panel ───────────────────────────────────────── */
function AssetAgeContent({ products, stats, onClose }) {
  const thisYear = new Date().getFullYear();

  const ageData = useMemo(() => {
    const b = { '0–2 yrs': 0, '3–5 yrs': 0, '6–8 yrs': 0, '9–12 yrs': 0, '13+ yrs': 0 };
    products.forEach(p => {
      const age = thisYear - (p.manufacture_year || thisYear);
      if      (age <= 2)  b['0–2 yrs']++;
      else if (age <= 5)  b['3–5 yrs']++;
      else if (age <= 8)  b['6–8 yrs']++;
      else if (age <= 12) b['9–12 yrs']++;
      else                b['13+ yrs']++;
    });
    return Object.entries(b).map(([name, value]) => ({ name, value }));
  }, [products, thisYear]);

  const oldest = useMemo(() =>
    [...products].sort((a, b) => (a.manufacture_year || 9999) - (b.manufacture_year || 9999)).slice(0, 10),
    [products]
  );
  const replacementCount = useMemo(() => products.filter(p => thisYear - (p.manufacture_year || thisYear) > 10).length, [products, thisYear]);

  const summary = `Average asset age is ${stats.avgAge} years. ${replacementCount} asset${replacementCount !== 1 ? 's' : ''} ${replacementCount !== 1 ? 'are' : 'is'} over 10 years old and may be candidates for replacement.`;

  const ageColors = { '0–2 yrs': '#27ae60', '3–5 yrs': '#27ae60', '6–8 yrs': 'var(--purple)', '9–12 yrs': 'var(--warn)', '13+ yrs': 'var(--danger)' };

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SmartSummary text={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatBadge label="Avg Age"             value={`${stats.avgAge}y`}     color="var(--purple)" />
        <StatBadge label="Replacement Candidates" value={replacementCount}    color="var(--warn)" />
      </div>

      <div>
        <p className="label" style={{ marginBottom: 12 }}>Age Distribution</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ageData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} />
            <Tooltip {...MINI_TIP} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800}>
              {ageData.map((entry, i) => (
                <Cell key={i} fill={ageColors[entry.name] || 'var(--purple)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="label" style={{ marginBottom: 10 }}>Oldest Assets</p>
        {oldest.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)}
      </div>
    </div>
  );
}

/* ── Location Panel ────────────────────────────────────────── */
function LocationContent({ products, panel, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const locAssets = useMemo(() => products.filter(p => (p.location || 'Unknown') === panel.value), [products, panel.value]);

  const counts = useMemo(() => {
    const c = { operational: 0, faulty: 0, under_maintenance: 0, decommissioned: 0 };
    locAssets.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, [locAssets]);

  const typeBreakdown = useMemo(() => {
    const map = {};
    locAssets.forEach(p => { const t = p.product_type || 'Unknown'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [locAssets]);

  const filtered = useMemo(() => {
    if (!search) return locAssets;
    const q = search.toLowerCase();
    return locAssets.filter(p =>
      p.product_id?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    );
  }, [locAssets, search]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const opPct = locAssets.length ? Math.round((counts.operational / locAssets.length) * 100) : 0;
  const summary = `${locAssets.length} assets at ${panel.value}. ${opPct}% operational, ${counts.faulty} faulty, ${counts.under_maintenance} under maintenance.`;

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SmartSummary text={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatBadge label="Operational"      value={counts.operational}     color="#27ae60" />
        <StatBadge label="Faulty"           value={counts.faulty}          color="var(--danger)" />
        <StatBadge label="Maintenance"      value={counts.under_maintenance} color="var(--warn)" />
        <StatBadge label="Decommissioned"   value={counts.decommissioned}  color="var(--text-3)" />
      </div>

      {typeBreakdown.length > 1 && (
        <div>
          <p className="label" style={{ marginBottom: 10 }}>By Product Type</p>
          <ResponsiveContainer width="100%" height={Math.min(typeBreakdown.length * 30 + 20, 200)}>
            <BarChart data={typeBreakdown} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} width={76} />
              <Tooltip {...MINI_TIP} />
              <Bar dataKey="value" fill="var(--purple)" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="field" style={{ paddingLeft: 32 }} placeholder="Filter assets…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} assets</p>
      {paged.length === 0
        ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
        : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
      }
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  );
}

/* ── Status Panel ──────────────────────────────────────────── */
function StatusContent({ products, panel, stats, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const statusAssets = useMemo(() => products.filter(p => p.status === panel.value), [products, panel.value]);

  const typeBreakdown = useMemo(() => {
    const map = {};
    statusAssets.forEach(p => { const t = p.product_type || 'Unknown'; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [statusAssets]);

  const filtered = useMemo(() => {
    if (!search) return statusAssets;
    const q = search.toLowerCase();
    return statusAssets.filter(p =>
      p.product_id?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q)
    );
  }, [statusAssets, search]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const pct = stats.total ? Math.round((statusAssets.length / stats.total) * 100) : 0;
  const uniqueLocs = new Set(statusAssets.map(p => p.location)).size;
  const summary = `${statusAssets.length} ${panel.value.replace(/_/g, ' ')} assets (${pct}% of fleet) across ${uniqueLocs} location${uniqueLocs !== 1 ? 's' : ''}.`;

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SmartSummary text={summary} />

      {typeBreakdown.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 10 }}>By Product Type</p>
          <ResponsiveContainer width="100%" height={Math.min(typeBreakdown.length * 30 + 20, 200)}>
            <BarChart data={typeBreakdown} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-3)" tickLine={false} axisLine={false} width={76} />
              <Tooltip {...MINI_TIP} />
              <Bar dataKey="value" fill={STATUS_COLORS[panel.value] || 'var(--purple)'} radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="field" style={{ paddingLeft: 32 }} placeholder="Filter assets…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} assets</p>
      {paged.length === 0
        ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
        : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
      }
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  );
}

/* ── Year Panel ────────────────────────────────────────────── */
function YearContent({ products, panel, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const yearAssets = useMemo(() => products.filter(p => String(p.manufacture_year) === panel.value), [products, panel.value]);

  const counts = useMemo(() => {
    const c = { operational: 0, faulty: 0, under_maintenance: 0, decommissioned: 0 };
    yearAssets.forEach(p => { if (c[p.status] !== undefined) c[p.status]++; });
    return c;
  }, [yearAssets]);

  const filtered = useMemo(() => {
    if (!search) return yearAssets;
    const q = search.toLowerCase();
    return yearAssets.filter(p =>
      p.product_id?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.product_type?.toLowerCase().includes(q)
    );
  }, [yearAssets, search]);

  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const age = new Date().getFullYear() - parseInt(panel.value);
  const summary = `${yearAssets.length} assets manufactured in ${panel.value} — now ${age} year${age !== 1 ? 's' : ''} old. ${counts.operational} operational, ${counts.faulty} faulty.`;

  return (
    <div className="px-6 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SmartSummary text={summary} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatBadge label="Operational"    value={counts.operational}      color="#27ae60" />
        <StatBadge label="Faulty"         value={counts.faulty}           color="var(--danger)" />
        <StatBadge label="Maintenance"    value={counts.under_maintenance} color="var(--warn)" />
        <StatBadge label="Decommissioned" value={counts.decommissioned}   color="var(--text-3)" />
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="field" style={{ paddingLeft: 32 }} placeholder="Filter assets…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} assets</p>
      {paged.length === 0
        ? <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-3)' }}>No assets match</p>
        : paged.map(p => <AssetRow key={p.product_id} p={p} onClose={onClose} />)
      }
      <Pagination page={page} total={filtered.length} onPage={setPage} />
    </div>
  );
}

/* ── Drill Panel (unified drawer) ──────────────────────────── */
const PANEL_META = {
  'kpi-health':      { label: 'Fleet Intelligence', title: 'Fleet Health Deep Dive' },
  'kpi-assets':      { label: 'Asset Explorer',     title: 'All Assets' },
  'kpi-faults':      { label: 'Fault Analysis',     title: 'Fault Rate Intelligence' },
  'kpi-maintenance': { label: 'Maintenance',         title: 'Maintenance Schedule' },
  'kpi-warranty':    { label: 'Warranty',            title: 'Warranty Expiring' },
  'kpi-age':         { label: 'Asset Lifecycle',     title: 'Asset Age Analysis' },
};

function DrillPanel({ panel, products, stats, onClose }) {
  useEffect(() => {
    if (!panel) return;
    const h = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [panel, onClose]);

  if (!panel) return null;

  const meta = PANEL_META[panel.type] || { label: 'Drill Down', title: panel.title || '' };

  const renderContent = () => {
    switch (panel.type) {
      case 'kpi-health':      return <FleetHealthContent products={products} stats={stats} onClose={onClose} />;
      case 'kpi-assets':      return <TotalAssetsContent products={products} stats={stats} onClose={onClose} />;
      case 'kpi-faults':      return <FaultRateContent   products={products} stats={stats} onClose={onClose} />;
      case 'kpi-maintenance': return <MaintenanceContent products={products} stats={stats} onClose={onClose} />;
      case 'kpi-warranty':    return <WarrantyContent    products={products} stats={stats} onClose={onClose} />;
      case 'kpi-age':         return <AssetAgeContent    products={products} stats={stats} onClose={onClose} />;
      case 'location':        return <LocationContent    products={products} panel={panel} onClose={onClose} />;
      case 'status':          return <StatusContent      products={products} panel={panel} stats={stats} onClose={onClose} />;
      case 'year':            return <YearContent        products={products} panel={panel} onClose={onClose} />;
      default:                return null;
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div
          className="flex items-center justify-between px-6 py-5 sticky top-0"
          style={{ background: 'var(--overlay)', borderBottom: '1px solid var(--border)', zIndex: 1 }}
        >
          <div>
            <p className="label">{meta.label}</p>
            <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15, marginTop: 4 }}>
              {panel.type === 'kpi-assets' && stats
                ? `All ${stats.total.toLocaleString()} Assets`
                : meta.title || panel.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg p-2 transition-colors"
            style={{ background: 'var(--surface-hi)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {renderContent()}
      </div>
    </>
  );
}

/* ── Main Analytics Page ───────────────────────────────────── */
export default function AnalyticsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [drill, setDrill]       = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true); setError('');
      try {
        const { data } = await searchProducts({ limit: 1000, offset: 0 });
        setProducts(data.results || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Could not load analytics'));
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    if (!products.length) return null;
    const total       = products.length;
    const thisYear    = new Date().getFullYear();
    const operational      = products.filter(p => p.status === 'operational').length;
    const faulty           = products.filter(p => p.status === 'faulty').length;
    const underMaintenance = products.filter(p => p.status === 'under_maintenance').length;
    const maintenanceDue   = products.filter(p => p.tags?.includes('maintenance_due') || p.tags?.includes('maintenance_overdue')).length;
    const warrantyExpiring = products.filter(p => p.tags?.includes('warranty_expiring_soon')).length;
    const avgAge = Math.round(products.reduce((s, p) => s + (thisYear - (p.manufacture_year || thisYear)), 0) / total * 10) / 10;
    const operationalPct = Math.round((operational / total) * 100);
    const faultRate      = Math.round((faulty / total) * 100);
    const maintenancePct = Math.round((maintenanceDue / total) * 100);
    const healthScore    = Math.max(0, Math.min(100, Math.round(operationalPct - faultRate * 0.6 - maintenancePct * 0.2)));

    const locMap = {};
    products.forEach(p => {
      const loc = p.location || 'Unknown';
      if (!locMap[loc]) locMap[loc] = { total: 0, operational: 0, faulty: 0, maintenance: 0, decommissioned: 0 };
      locMap[loc].total++;
      if      (p.status === 'operational')      locMap[loc].operational++;
      else if (p.status === 'faulty')           locMap[loc].faulty++;
      else if (p.status === 'under_maintenance') locMap[loc].maintenance++;
      else if (p.status === 'decommissioned')   locMap[loc].decommissioned++;
    });
    const locationData = Object.entries(locMap)
      .map(([name, d]) => ({ name, value: d.total, ...d }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const statusMap = {};
    products.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
    const statusData = Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const yearMap = {};
    products.forEach(p => { const y = p.manufacture_year || 'Unknown'; yearMap[y] = (yearMap[y] || 0) + 1; });
    const timelineData = Object.entries(yearMap)
      .filter(([y]) => y !== 'Unknown')
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .slice(-10)
      .map(([name, value]) => ({ name: String(name), value }));

    const topLocation = locationData[0];
    const typeMap = {};
    products.forEach(p => { const t = p.product_type || 'Unknown'; typeMap[t] = (typeMap[t] || 0) + 1; });
    const topType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0];

    return {
      total, operational, faulty, underMaintenance, maintenanceDue,
      warrantyExpiring, avgAge, operationalPct, faultRate, maintenancePct,
      healthScore, locationData, statusData, timelineData, topLocation, topType,
    };
  }, [products]);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );

  if (error) return (
    <div className="card p-8 text-center">
      <p style={{ color: 'var(--danger)' }}>{error}</p>
    </div>
  );

  if (!stats) return null;

  const healthColor = stats.healthScore >= 80 ? '#27ae60' : stats.healthScore >= 60 ? 'var(--accent)' : 'var(--danger)';

  return (
    <section className="fade-in space-y-12">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-4xl font-light" style={{ color: 'var(--text)' }}>Analytics</h1>
        <p className="mt-2 text-base" style={{ color: 'var(--text-2)' }}>
          Fleet performance across {stats.locationData.length} locations · {stats.total.toLocaleString()} assets · Click any metric to explore
        </p>
      </div>

      {/* ── KPI Overview ── */}
      <div>
        <SectionHeader title="KPI Overview" sub="Click any card to drill into detailed analytics" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger">
          <KpiCard
            label="Fleet Health"
            value={`${stats.healthScore}%`}
            sub={`${stats.operationalPct}% operational`}
            color={healthColor} Icon={Activity} trend={stats.healthScore}
            onClick={() => setDrill({ type: 'kpi-health' })}
          />
          <KpiCard
            label="Total Assets"
            value={stats.total.toLocaleString()}
            sub={`Across ${stats.locationData.length} sites`}
            Icon={Building2} color="var(--purple)"
            onClick={() => setDrill({ type: 'kpi-assets' })}
          />
          <KpiCard
            label="Fault Rate"
            value={`${stats.faultRate}%`}
            sub={`${stats.faulty} faulty assets`}
            color={stats.faultRate > 10 ? 'var(--danger)' : 'var(--accent)'}
            Icon={AlertTriangle} trend={stats.faultRate}
            onClick={() => setDrill({ type: 'kpi-faults' })}
          />
          <KpiCard
            label="Maintenance Due"
            value={stats.maintenanceDue}
            sub={`${stats.maintenancePct}% of fleet`}
            color={stats.maintenanceDue > 50 ? 'var(--warn)' : 'var(--accent)'}
            Icon={Wrench} trend={stats.maintenancePct}
            onClick={() => setDrill({ type: 'kpi-maintenance' })}
          />
          <KpiCard
            label="Warranty Expiring"
            value={stats.warrantyExpiring}
            sub="Within 30 days"
            color={stats.warrantyExpiring > 0 ? 'var(--warn)' : 'var(--purple)'}
            Icon={ShieldCheck}
            onClick={() => setDrill({ type: 'kpi-warranty' })}
          />
          <KpiCard
            label="Avg Asset Age"
            value={`${stats.avgAge}y`}
            sub={stats.topType ? `Mostly ${stats.topType[0]}` : 'Across all types'}
            Icon={Calendar} color="var(--purple)"
            onClick={() => setDrill({ type: 'kpi-age' })}
          />
        </div>
      </div>

      {/* ── Charts ── */}
      <div>
        <SectionHeader title="Charts" sub="Interactive — click any bar, slice, or data point to drill down" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar: by location */}
          <div className="card p-6">
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Assets by Location</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Click a bar to explore assets at that site</p>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={stats.locationData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                onClick={d => d?.activePayload?.[0] && setDrill({
                  type: 'location',
                  value: d.activePayload[0].payload.name,
                  title: `${d.activePayload[0].payload.name} — ${d.activePayload[0].payload.value} assets`,
                })}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-3)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-3)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<LocationTooltip />} cursor={{ fill: 'var(--purple-dim)' }} />
                <Bar dataKey="value" fill="var(--purple)" radius={[6, 6, 0, 0]}
                  animationDuration={900} animationBegin={150} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie: status distribution */}
          <div className="card p-6">
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Status Distribution</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Click a slice or legend item to see those assets</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={88}
                    paddingAngle={3} dataKey="value"
                    animationDuration={1000} animationBegin={200}
                    style={{ cursor: 'pointer' }}
                    onClick={d => setDrill({
                      type: 'status',
                      value: d.name,
                      title: `${d.name.replace(/_/g, ' ')} — ${d.value} assets`,
                    })}
                  >
                    {stats.statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {stats.statusData.map(d => (
                  <button
                    key={d.name}
                    onClick={() => setDrill({ type: 'status', value: d.name, title: `${d.name.replace(/_/g, ' ')} — ${d.value} assets` })}
                    className="flex items-center gap-2.5 w-full text-left rounded-lg px-3 py-2 transition-all"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hi)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLORS[d.name] || '#9ca3af', flexShrink: 0 }} />
                    <div className="min-w-0">
                      <p style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, textTransform: 'capitalize' }}>{d.name.replace(/_/g, ' ')}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.value} assets</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Line chart: by year */}
        <div className="card p-6 mt-6">
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Fleet by Manufacture Year</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Click a data point to see assets from that year</p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart
              data={stats.timelineData}
              margin={{ top: 4, right: 16, bottom: 0, left: -20 }}
              onClick={d => d?.activePayload?.[0] && setDrill({
                type: 'year',
                value: d.activePayload[0].payload.name,
                title: `Manufactured in ${d.activePayload[0].payload.name} — ${d.activePayload[0].payload.value} assets`,
              })}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-3)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-3)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<TimelineTooltip />} cursor={{ stroke: 'var(--purple)', strokeWidth: 1.5, strokeDasharray: '4 2' }} />
              <Line
                type="monotone" dataKey="value"
                stroke="var(--purple)" strokeWidth={2.5}
                dot={{ fill: 'var(--purple)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'var(--purple)', stroke: 'var(--overlay)', strokeWidth: 2 }}
                animationDuration={1200} animationBegin={100}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Insights ── */}
      <div>
        <SectionHeader title="Insights" sub="Automated observations from fleet data" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightCard Icon={Activity}    color={healthColor}    title={`Fleet health score: ${stats.healthScore}/100`}      desc={`${stats.operationalPct}% operational · ${stats.faultRate}% fault rate`} />
          {stats.topLocation && (
            <InsightCard Icon={MapPin}    color="var(--purple)"  title={`Largest site: ${stats.topLocation.name}`}           desc={`${stats.topLocation.value} assets · ${Math.round((stats.topLocation.operational / stats.topLocation.value) * 100)}% operational`} />
          )}
          {stats.maintenanceDue > 0 && (
            <InsightCard Icon={Wrench}    color="var(--warn)"    title={`${stats.maintenanceDue} assets need maintenance`}   desc={`${stats.maintenancePct}% of fleet — schedule service soon`} />
          )}
          {stats.warrantyExpiring > 0 && (
            <InsightCard Icon={ShieldCheck} color="var(--warn)"  title={`${stats.warrantyExpiring} warranties expiring`}     desc="Within the next 30 days — review coverage" />
          )}
          {stats.topType && (
            <InsightCard Icon={Zap}       color="var(--purple)"  title={`Most common type: ${stats.topType[0]}`}             desc={`${stats.topType[1]} units · ${Math.round((stats.topType[1] / stats.total) * 100)}% of fleet`} />
          )}
          <InsightCard   Icon={Calendar}  color="var(--purple)"  title={`Average asset age: ${stats.avgAge} years`}          desc={stats.avgAge > 7 ? 'Aging fleet — consider renewal planning' : 'Fleet is relatively modern'} />
        </div>
      </div>

      {/* ── Drill Panel ── */}
      <DrillPanel panel={drill} products={products} stats={stats} onClose={() => setDrill(null)} />
    </section>
  );
}
