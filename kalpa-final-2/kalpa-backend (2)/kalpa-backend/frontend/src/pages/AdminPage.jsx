import { useState } from 'react';
import { createEvent, createProduct, generateQr, getApiErrorMessage } from '../api/api';

const initialProduct = {
  product_id: '', qr_code: '', type: 'Generator', model: '',
  location: '', site: '', manufacture_year: new Date().getFullYear(),
  installation_date: '', status: 'operational', warranty_expiry: '',
};

const PLABELS = {
  product_id: 'Product ID', qr_code: 'QR Code', type: 'Type', model: 'Model',
  location: 'Location', site: 'Site', manufacture_year: 'Manufacture Year',
  installation_date: 'Installation Date', status: 'Status', warranty_expiry: 'Warranty Expiry',
};

const ELABELS = {
  product_id: 'Product ID', event_type: 'Event Type', date: 'Date',
  description: 'Description', technician: 'Technician', cost: 'Cost (₹)',
};

export default function AdminPage() {
  const [product, setProduct] = useState(initialProduct);
  const [event, setEvent] = useState({ product_id: '', event_type: 'maintenance', date: '', description: '', technician: '', cost: '' });
  const [qrCode, setQrCode] = useState('KPL-QR-GEN-0001');
  const [qr, setQr] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submitProduct(e) {
    e.preventDefault(); setError('');
    try { await createProduct(product); setMessage(`Created ${product.product_id}`); setProduct(initialProduct); }
    catch (err) { setError(getApiErrorMessage(err, 'Create product failed')); }
  }
  async function submitEvent(e) {
    e.preventDefault(); setError('');
    try { await createEvent({ ...event, cost: event.cost ? Number(event.cost) : null }); setMessage('Event logged'); }
    catch (err) { setError(getApiErrorMessage(err, 'Create event failed')); }
  }
  async function submitQr(e) {
    e.preventDefault(); setError('');
    try { const { data } = await generateQr({ qr_code: qrCode }); setQr(data); setMessage('QR generated'); }
    catch (err) { setError(getApiErrorMessage(err, 'QR generation failed')); }
  }
  function downloadQr() {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${qr.png_base64}`;
    a.download = `${qr.qr_code}.png`; a.click();
  }

  return (
    <section className="fade-in">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-light text-[var(--text)]">Administration</h1>
        <p className="mt-2 text-base text-[var(--text-2)]">Manage assets, events, and generate QR codes</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="card p-5 mb-8 bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}
      {error && (
        <div className="card p-5 mb-8 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Product */}
      <div className="mb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-light text-[var(--text)]">Create Product</h2>
          <p className="mt-1 text-sm text-[var(--text-2)]">Register a new solar asset in the system</p>
        </div>

        <div className="card p-8">
          <form className="space-y-8" onSubmit={submitProduct}>
            {/* Basic Information Section */}
            <div>
              <p className="label mb-5">Basic Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2">Product ID</label>
                  <input
                    className="field w-full"
                    placeholder="e.g., KPL-SOL-0001"
                    value={product.product_id}
                    onChange={e => setProduct({ ...product, product_id: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label mb-2">QR Code</label>
                  <input
                    className="field w-full"
                    placeholder="QR code value"
                    value={product.qr_code}
                    onChange={e => setProduct({ ...product, qr_code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label mb-2">Asset Type</label>
                  <input
                    className="field w-full"
                    placeholder="e.g., Solar Panel"
                    value={product.type}
                    onChange={e => setProduct({ ...product, type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label mb-2">Model</label>
                  <input
                    className="field w-full"
                    placeholder="Model name"
                    value={product.model}
                    onChange={e => setProduct({ ...product, model: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--border)', height: '1px' }} />

            {/* Location Section */}
            <div>
              <p className="label mb-5">Location</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2">Site</label>
                  <input
                    className="field w-full"
                    placeholder="Site name"
                    value={product.site}
                    onChange={e => setProduct({ ...product, site: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label mb-2">Location</label>
                  <input
                    className="field w-full"
                    placeholder="Specific location"
                    value={product.location}
                    onChange={e => setProduct({ ...product, location: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--border)', height: '1px' }} />

            {/* Dates Section */}
            <div>
              <p className="label mb-5">Timeline</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2">Manufacture Year</label>
                  <input
                    className="field w-full"
                    type="number"
                    placeholder="2024"
                    value={product.manufacture_year}
                    onChange={e => setProduct({ ...product, manufacture_year: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label mb-2">Installation Date</label>
                  <input
                    className="field w-full"
                    type="date"
                    value={product.installation_date}
                    onChange={e => setProduct({ ...product, installation_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--border)', height: '1px' }} />

            {/* Status Section */}
            <div>
              <p className="label mb-5">Status</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2">Current Status</label>
                  <select
                    className="field w-full"
                    value={product.status}
                    onChange={e => setProduct({ ...product, status: e.target.value })}
                  >
                    <option value="operational">Operational</option>
                    <option value="under_maintenance">Under Maintenance</option>
                    <option value="faulty">Faulty</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-2">Warranty Expiry</label>
                  <input
                    className="field w-full"
                    type="date"
                    value={product.warranty_expiry}
                    onChange={e => setProduct({ ...product, warranty_expiry: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button className="btn btn-primary w-full">Create Product</button>
            </div>
          </form>
        </div>
      </div>

      {/* Log Event */}
      <div className="mb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-light text-[var(--text)]">Log Event</h2>
          <p className="mt-1 text-sm text-[var(--text-2)]">Record a maintenance or lifecycle event</p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={submitEvent}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-2">Product ID</label>
                <input
                  className="field w-full"
                  placeholder="KPL-QR-GEN-0001"
                  value={event.product_id}
                  onChange={e => setEvent({ ...event, product_id: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label mb-2">Event Type</label>
                <select
                  className="field w-full"
                  value={event.event_type}
                  onChange={e => setEvent({ ...event, event_type: e.target.value })}
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="repair">Repair</option>
                  <option value="overhaul">Overhaul</option>
                  <option value="installation">Installation</option>
                </select>
              </div>
              <div>
                <label className="label mb-2">Date</label>
                <input
                  className="field w-full"
                  type="date"
                  value={event.date}
                  onChange={e => setEvent({ ...event, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label mb-2">Cost (₹)</label>
                <input
                  className="field w-full"
                  type="number"
                  placeholder="0"
                  value={event.cost}
                  onChange={e => setEvent({ ...event, cost: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label mb-2">Technician</label>
              <input
                className="field w-full"
                placeholder="Technician name"
                value={event.technician}
                onChange={e => setEvent({ ...event, technician: e.target.value })}
              />
            </div>

            <div>
              <label className="label mb-2">Description</label>
              <textarea
                className="field w-full"
                rows="3"
                placeholder="Describe the event..."
                value={event.description}
                onChange={e => setEvent({ ...event, description: e.target.value })}
              />
            </div>

            <button className="btn btn-primary w-full">Log Event</button>
          </form>
        </div>
      </div>

      {/* Generate QR */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-light text-[var(--text)]">Generate QR Code</h2>
          <p className="mt-1 text-sm text-[var(--text-2)]">Create a downloadable QR code</p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={submitQr}>
            <div>
              <label className="label mb-2">Asset ID</label>
              <div className="flex gap-3">
                <input className="field flex-1" value={qrCode} onChange={e => setQrCode(e.target.value)} required />
                <button className="btn btn-primary" style={{ minWidth: '120px' }} type="submit">Generate</button>
              </div>
            </div>
          </form>

          {qr && (
            <div className="mt-8 flex flex-col items-center gap-6 pt-8 border-t border-[var(--border)]">
              <div className="rounded-2xl p-6 bg-white" style={{ border: '1px solid var(--border)' }}>
                <img className="h-40 w-40 block" src={`data:image/png;base64,${qr.png_base64}`} alt="QR Code" />
              </div>
              <p className="text-sm text-center text-[var(--text-3)] max-w-sm">{qr.url}</p>
              <button type="button" className="btn btn-outline" onClick={downloadQr}>Download PNG</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
