import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getApiErrorMessage, getProduct, logScan } from '../api/api';

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

const EVENT_ICONS = {
  inspection:'🔍', maintenance:'🔧', repair:'⚙️',
  overhaul:'🏗️', installation:'📦', calibration:'🎯', upgrade:'⬆️',
};

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
      <span className="text-sm text-white font-mono">{value ?? '—'}</span>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProduct(id)
      .then(({ data }) => {
        if (!active) return;
        setProduct(data);
        return logScan({ product_id: id, scan_type: 'qr', scan_value: id }).catch(() => null);
      })
      .catch(err => setError(getApiErrorMessage(err, 'Product not found')))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </div>
  );

  if (error) return (
    <div className="card p-8 text-center">
      <p className="text-base text-red-600">{error}</p>
    </div>
  );

  const specs = product.model;

  return (
    <section className="fade-in">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
          <div>
            <p className="label mb-3">Asset Record</p>
            <h1 className="text-4xl font-light text-[var(--text)]">{product.product_id}</h1>
            <p className="mt-3 text-base text-[var(--text-2)]">
              {specs.product_type} • {specs.model_name}
            </p>
          </div>
          <span className={statusClass(product.status)}>{product.status}</span>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <span className={tagClass(tag)} key={tag}>{tag.replace(/_/g,' ')}</span>
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-8 md:grid-cols-2 mb-12">
        {/* Specifications */}
        <div className="card p-8">
          <p className="text-lg font-light text-[var(--text)] mb-6">Specifications</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">QR Code</span>
              <span className="text-sm font-mono text-[var(--text)]">{product.qr_code}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">Location</span>
              <span className="text-sm text-[var(--text)]">{product.location}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">Site</span>
              <span className="text-sm text-[var(--text)]">{product.site}</span>
            </div>
            {specs.rated_power_kw != null && (
              <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--text-2)]">Rated Power</span>
                <span className="text-sm font-medium text-[var(--text)]">{specs.rated_power_kw} kW</span>
              </div>
            )}
            {specs.voltage_v != null && (
              <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--text-2)]">Voltage</span>
                <span className="text-sm text-[var(--text)]">{specs.voltage_v} V</span>
              </div>
            )}
            {specs.efficiency_pct != null && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-[var(--text-2)]">Efficiency</span>
                <span className="text-sm font-medium text-[var(--text)]">{specs.efficiency_pct}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Lifecycle Timeline */}
        <div className="card p-8">
          <p className="text-lg font-light text-[var(--text)] mb-6">Lifecycle</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">Manufactured</span>
              <span className="text-sm text-[var(--text)]">{product.manufacture_year}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">Installed</span>
              <span className="text-sm text-[var(--text)]">{product.installation_date || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">Warranty Until</span>
              <span className="text-sm text-[var(--text)]">{product.warranty_expiry || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--text-2)]">Last Maintenance</span>
              <span className="text-sm text-[var(--text)]">{product.last_maintenance || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-[var(--text-2)]">Next Due</span>
              <span className="text-sm text-[var(--text)]">{product.next_maintenance || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-lg font-light text-[var(--text)]">Event History</p>
            <p className="mt-1 text-sm text-[var(--text-3)]">{product.events.length} event{product.events.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>

        {product.events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--text-3)]">No events recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {product.events.map((ev, idx) => (
              <div key={ev.id} className="pb-6" style={idx !== product.events.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{EVENT_ICONS[ev.event_type] || '📋'}</span>
                      <div>
                        <p className="text-sm font-medium text-[var(--text)] capitalize">{ev.event_type}</p>
                        <p className="text-xs text-[var(--text-3)]">{ev.event_date}</p>
                      </div>
                    </div>
                    {ev.description && (
                      <p className="mt-2 text-sm text-[var(--text-2)]">{ev.description}</p>
                    )}
                    {ev.performed_by && (
                      <p className="mt-2 text-xs text-[var(--text-3)]">Performed by {ev.performed_by}</p>
                    )}
                  </div>
                  {ev.cost_inr && (
                    <div className="text-right">
                      <span className="chip chip-green text-xs">
                        ₹{ev.cost_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
