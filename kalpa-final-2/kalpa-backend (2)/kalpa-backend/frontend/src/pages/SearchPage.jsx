import { ChevronDown, ScanLine, Search as SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage, getFilterOptions, searchProducts } from '../api/api';

function tagClass(tag) {
  if (['faulty','maintenance_overdue','warranty_expired','high_repair_frequency'].includes(tag)) return 'chip chip-red';
  if (['recently_repaired'].includes(tag)) return 'chip chip-blue';
  if (['maintenance_due','aging_asset','under_maintenance','warranty_expiring_soon'].includes(tag)) return 'chip chip-orange';
  if (['under_warranty','new_asset','operational'].includes(tag)) return 'chip chip-green';
  return 'chip';
}
function statusClass(s) {
  return { operational:'status-pill status-green', faulty:'status-pill status-red', under_maintenance:'status-pill status-orange', decommissioned:'status-pill status-gray' }[s] || 'status-pill status-gray';
}

/* ── Custom theme-aware dropdown (fixes double-arrow bug) ── */
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1" style={{ minWidth: '130px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="field w-full flex items-center justify-between gap-2"
        style={{ cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{
          color: value ? 'var(--text)' : 'var(--text-3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: '0.875rem', flex: 1,
        }}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-3)', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-1 w-full rounded-xl overflow-hidden drop-in"
          style={{
            background: 'var(--overlay)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 20,
            maxHeight: '210px',
            overflowY: 'auto',
          }}
        >
          <DropOption
            label={placeholder}
            active={!value}
            dim
            onClick={() => { onChange(''); setOpen(false); }}
          />
          {options.map(opt => (
            <DropOption
              key={opt}
              label={String(opt)}
              active={String(opt) === String(value)}
              onClick={() => { onChange(opt); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropOption({ label, active, dim, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        color: dim ? 'var(--text-3)' : active ? 'var(--accent)' : 'var(--text)',
        background: active ? 'var(--accent-dim)' : 'transparent',
        fontWeight: active ? 600 : 400,
        border: 'none', cursor: 'pointer',
        display: 'block', width: '100%', textAlign: 'left',
        padding: '8px 14px', fontSize: '0.875rem',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-hi)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {label}
    </button>
  );
}

const QUICK_ALL = [
  { to: '/scanner',               label: 'Scan QR',     desc: 'Open camera to scan an asset QR code',   Icon: ScanLine },
  { to: '/product/KPL-QR-GEN-0001', label: 'Demo Asset', desc: 'View a seeded example asset record',    Icon: SearchIcon },
];

export default function SearchPage() {
  const [filters, setFilters] = useState({ product_type: '', location: '', manufacture_year: '', tag: '' });
  const [options, setOptions]  = useState({ types: [], locations: [], years: [] });
  const [results, setResults]  = useState([]);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');

  useEffect(() => { getFilterOptions().then(({ data }) => setOptions(data)).catch(() => {}); }, []);

  async function runSearch(e) {
    e?.preventDefault(); setLoading(true); setError('');
    try {
      const payload = {
        product_type: filters.product_type || null,
        location:     filters.location     || null,
        manufacture_year: filters.manufacture_year ? Number(filters.manufacture_year) : null,
        maintenance_due:   filters.tag === 'maintenance_due'   || null,
        recently_repaired: filters.tag === 'recently_repaired' || null,
        limit: 100, offset: 0,
      };
      const { data } = await searchProducts(payload);
      let next = data.results;
      if (filters.tag && !['maintenance_due','recently_repaired'].includes(filters.tag))
        next = next.filter(i => i.tags.includes(filters.tag));
      setResults(next);
    } catch (err) {
      setResults([]);
      setError(getApiErrorMessage(err, 'Could not reach the backend.'));
    } finally { setLoading(false); }
  }

  useEffect(() => { runSearch(); }, []);

  const filterConfig = [
    { key: 'product_type',     placeholder: 'All types',     items: options.types },
    { key: 'location',         placeholder: 'All locations', items: options.locations },
    { key: 'manufacture_year', placeholder: 'All years',     items: options.years.map(String) },
    { key: 'tag',              placeholder: 'Any tag',       items: ['maintenance_due','faulty','recently_repaired','aging_asset','maintenance_overdue','under_warranty'] },
  ];

  return (
    <section className="fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-light" style={{ color: 'var(--text)' }}>Assets</h1>
        <p className="mt-2 text-base" style={{ color: 'var(--text-2)' }}>Search and manage your solar infrastructure</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        {QUICK_ALL.map(({ to, label, desc, Icon }) => (
          <Link key={to} to={to} className="card card-hover block p-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ padding: '8px', background: 'var(--accent-dim)', color: 'var(--accent)', flexShrink: 0 }}
              >
                <Icon size={16} />
              </div>
              <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>{label}</p>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <form className="card p-6" onSubmit={runSearch}>
        <p className="label mb-4">Filter Assets</p>
        <div className="flex flex-wrap gap-3">
          {filterConfig.map(({ key, placeholder, items }) => (
            <CustomSelect
              key={key}
              value={filters[key]}
              onChange={v => setFilters({ ...filters, [key]: v })}
              options={items}
              placeholder={placeholder}
            />
          ))}
          <button type="submit" className="btn btn-primary whitespace-nowrap" style={{ minWidth: '100px' }}>
            {loading ? (
              <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : 'Search'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'rgba(192,57,43,0.08)', color: 'var(--danger)', border: '1px solid rgba(192,57,43,0.2)' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="label mb-4">{results.length} assets found</p>
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {results.map(item => (
              <Link key={item.product_id} to={`/product/${item.product_id}`} className="card card-hover block p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold font-mono text-sm truncate" style={{ color: 'var(--text)' }}>{item.product_id}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
                      {item.product_type} · {item.location} · {item.manufacture_year}
                    </p>
                  </div>
                  <span className={statusClass(item.status)} style={{ flexShrink: 0 }}>{item.status.replace(/_/g,' ')}</span>
                </div>
                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map(t => <span className={tagClass(t)} key={t}>{t.replace(/_/g,' ')}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && results.length === 0 && !error && (
        <div className="card flex flex-col items-center py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>No assets found</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>Adjust your filters or verify the backend is running.</p>
        </div>
      )}
    </section>
  );
}
