import { useEffect, useState } from 'react';
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

const QUICK = [
  { to: '/scanner', label: 'Scan QR', desc: 'Open camera to scan an asset' },
  { to: '/product/KPL-QR-GEN-0001', label: 'Demo Asset', desc: 'View a seeded example asset' },
  { to: '/admin', label: 'Admin', desc: 'Create products and log events' },
];

export default function SearchPage() {
  const [filters, setFilters] = useState({ product_type: '', location: '', manufacture_year: '', tag: '' });
  const [options, setOptions] = useState({ types: [], locations: [], years: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getFilterOptions().then(({ data }) => setOptions(data)).catch(() => {}); }, []);

  async function runSearch(e) {
    e?.preventDefault(); setLoading(true); setError('');
    try {
      const payload = {
        product_type: filters.product_type || null,
        location: filters.location || null,
        manufacture_year: filters.manufacture_year ? Number(filters.manufacture_year) : null,
        maintenance_due: filters.tag === 'maintenance_due' || null,
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

  return (
    <section className="fade-in space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-5xl font-light" style={{ color: 'var(--text)' }}>Assets</h1>
        <p className="mt-2 text-base" style={{ color: 'var(--text-2)' }}>Search and manage your solar infrastructure</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {QUICK.map(({ to, label, desc }) => (
          <Link key={to} to={to} className="card card-hover block p-6 transition-all duration-200">
            <p className="font-semibold text-lg" style={{ color: 'var(--text)' }}>{label}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Filter bar */}
      <form className="card p-6" onSubmit={runSearch}>
        <p className="label mb-4" style={{ color: 'var(--text)' }}>Filter Assets</p>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'product_type', placeholder: 'All types', items: options.types },
            { key: 'location',     placeholder: 'All locations', items: options.locations },
            { key: 'manufacture_year', placeholder: 'All years', items: options.years },
            { key: 'tag', placeholder: 'Any tag', items: ['maintenance_due','faulty','recently_repaired','aging_asset','maintenance_overdue','under_warranty'] },
          ].map(({ key, placeholder, items }) => (
            <select
              key={key}
              className="field flex-1"
              style={{ minWidth: '130px' }}
              value={filters[key]}
              onChange={e => setFilters({ ...filters, [key]: e.target.value })}
            >
              <option value="">{placeholder}</option>
              {items.map(i => <option key={i}>{i}</option>)}
            </select>
          ))}
          <button className="btn btn-primary whitespace-nowrap" style={{ minWidth: '100px' }}>
            {loading ? (
              <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : 'Search'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <p className="rounded-lg p-4 text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>
          {error}
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="label mb-4" style={{ color: 'var(--text)' }}>{results.length} assets found</p>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map(item => (
              <Link key={item.product_id} to={`/product/${item.product_id}`} className="card card-hover block p-6 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold font-mono text-sm truncate" style={{ color: 'var(--text)' }}>{item.product_id}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
                      {item.product_type} · {item.location} · {item.manufacture_year}
                    </p>
                  </div>
                  <span className={statusClass(item.status)}>{item.status}</span>
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
