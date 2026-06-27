import { getProduct } from '../services/api';
import { useState } from 'react';

const TAG_META = {
  maintenance_overdue: { label: 'MAINT. OVERDUE', cls: 'tag-red' },
  maintenance_due: { label: 'MAINT. DUE', cls: 'tag-orange' },
  recently_repaired: { label: 'RECENTLY REPAIRED', cls: 'tag-blue' },
  warranty_expired: { label: 'WARRANTY EXPIRED', cls: 'tag-red' },
  warranty_expiring_soon: { label: 'WARRANTY EXPIRING', cls: 'tag-orange' },
  under_warranty: { label: 'UNDER WARRANTY', cls: 'tag-green' },
  aging_asset: { label: 'AGING ASSET', cls: 'tag-orange' },
  new_asset: { label: 'NEW ASSET', cls: 'tag-green' },
  faulty: { label: 'FAULTY', cls: 'tag-red' },
  decommissioned: { label: 'DECOMMISSIONED', cls: 'tag-gray' },
  under_maintenance: { label: 'UNDER MAINTENANCE', cls: 'tag-orange' },
  operational: { label: 'OPERATIONAL', cls: 'tag-green' },
  high_repair_frequency: { label: 'HIGH REPAIR FREQ.', cls: 'tag-red' },
};

const STATUS_CLS = {
  operational: 'status-green',
  faulty: 'status-red',
  under_maintenance: 'status-orange',
  decommissioned: 'status-gray',
};

const EVENT_ICONS = {
  inspection: '🔍',
  maintenance: '🔧',
  repair: '⚙️',
  overhaul: '🏗️',
  installation: '📦',
  calibration: '🎯',
  upgrade: '⬆️',
};

export default function ProductDetails({ product, searchResults, onProductSelect }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleSelectFromSearch = async (pid) => {
    setLoadingId(pid);
    try {
      const res = await getProduct(pid);
      onProductSelect(res.data);
    } catch (e) {}
    finally { setLoadingId(null); }
  };

  if (!product && !searchResults) return null;

  return (
    <div className="result-area">
      {searchResults && !product && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">▦</span>
            <h2>SEARCH RESULTS <span className="result-count">{searchResults.total} ASSETS</span></h2>
          </div>
          {searchResults.results.length === 0 ? (
            <p className="no-results">No products match the selected filters.</p>
          ) : (
            <div className="result-table-wrap">
              <table className="result-table">
                <thead>
                  <tr>
                    <th>PRODUCT ID</th>
                    <th>TYPE</th>
                    <th>LOCATION</th>
                    <th>YEAR</th>
                    <th>STATUS</th>
                    <th>TAGS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.results.map(r => (
                    <tr key={r.product_id} className="result-row">
                      <td className="mono">{r.product_id}</td>
                      <td>{r.product_type}</td>
                      <td>{r.location}</td>
                      <td className="mono">{r.manufacture_year}</td>
                      <td>
                        <span className={`status-dot ${STATUS_CLS[r.status] || 'status-gray'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div className="tag-mini-row">
                          {r.tags.slice(0, 2).map(t => {
                            const m = TAG_META[t];
                            return <span key={t} className={`tag-mini ${m?.cls || 'tag-gray'}`}>{m?.label || t}</span>;
                          })}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-detail"
                          onClick={() => handleSelectFromSearch(r.product_id)}
                          disabled={loadingId === r.product_id}
                        >
                          {loadingId === r.product_id ? '···' : 'DETAILS →'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {product && (
        <div className="panel detail-panel">
          <div className="panel-header">
            <span className="panel-icon">◉</span>
            <h2>ASSET RECORD</h2>
            <span className="pid-badge">{product.product_id}</span>
          </div>

          {/* Tags */}
          <div className="tags-row">
            {product.tags.map(t => {
              const m = TAG_META[t];
              return <span key={t} className={`tag ${m?.cls || 'tag-gray'}`}>{m?.label || t}</span>;
            })}
          </div>

          <div className="detail-grid">
            {/* Core Info */}
            <div className="detail-section">
              <h3>CORE INFORMATION</h3>
              <div className="kv-list">
                <div className="kv"><span>QR Code</span><span className="mono">{product.qr_code}</span></div>
                <div className="kv"><span>Serial No.</span><span className="mono">{product.serial_number}</span></div>
                <div className="kv"><span>Location</span><span>{product.location}</span></div>
                <div className="kv"><span>Site</span><span>{product.site}</span></div>
                <div className="kv"><span>Mfg. Year</span><span className="mono">{product.manufacture_year}</span></div>
                <div className="kv"><span>Installed</span><span className="mono">{product.installation_date}</span></div>
                <div className="kv"><span>Status</span>
                  <span className={`status-dot ${STATUS_CLS[product.status] || 'status-gray'}`}>{product.status}</span>
                </div>
                <div className="kv"><span>Warranty Until</span><span className="mono">{product.warranty_expiry}</span></div>
              </div>
            </div>

            {/* Model Specs */}
            <div className="detail-section">
              <h3>MODEL SPECIFICATIONS — {product.model.model_name}</h3>
              <div className="kv-list">
                <div className="kv"><span>Type</span><span>{product.model.product_type}</span></div>
                <div className="kv"><span>Rated Power</span><span className="mono">{product.model.rated_power_kw} kW</span></div>
                <div className="kv"><span>Efficiency</span><span className="mono">{product.model.efficiency_pct}%</span></div>
                <div className="kv"><span>Voltage</span><span className="mono">{product.model.voltage_v} V</span></div>
                <div className="kv"><span>Current</span><span className="mono">{product.model.current_a} A</span></div>
                <div className="kv"><span>Weight</span><span className="mono">{product.model.weight_kg} kg</span></div>
                <div className="kv"><span>Cooling</span><span>{product.model.cooling_type}</span></div>
                <div className="kv"><span>IP Rating</span><span className="mono">{product.model.ip_rating}</span></div>
              </div>
            </div>

            {/* Maintenance */}
            <div className="detail-section">
              <h3>MAINTENANCE SCHEDULE</h3>
              <div className="kv-list">
                <div className="kv"><span>Last Maintenance</span><span className="mono">{product.last_maintenance || '—'}</span></div>
                <div className="kv"><span>Next Maintenance</span><span className="mono">{product.next_maintenance || '—'}</span></div>
              </div>
              {product.notes && <p className="notes-text">{product.notes}</p>}
            </div>
          </div>

          {/* Events */}
          <div className="events-section">
            <h3>LIFECYCLE EVENTS <span className="event-count">{product.events.length}</span></h3>
            <div className="event-list">
              {product.events.map(e => (
                <div key={e.id} className="event-card">
                  <div className="event-left">
                    <span className="event-icon">{EVENT_ICONS[e.event_type] || '📋'}</span>
                    <div>
                      <span className="event-type">{e.event_type.toUpperCase()}</span>
                      <span className="event-date">{e.event_date}</span>
                    </div>
                  </div>
                  <div className="event-body">
                    <p className="event-desc">{e.description}</p>
                    {e.parts_replaced && <p className="event-parts">Parts: {e.parts_replaced}</p>}
                    <div className="event-footer">
                      <span>By: {e.performed_by}</span>
                      {e.cost_inr && <span className="event-cost">₹ {e.cost_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
