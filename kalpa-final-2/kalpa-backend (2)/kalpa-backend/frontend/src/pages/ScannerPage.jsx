import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [manualValue, setManualValue] = useState('');

  function openDecodedValue(value) {
    const id = value.trim().split('/').filter(Boolean).pop();
    if (!id) { setError('No QR value found.'); return; }
    navigate(`/product/${id}`);
  }

  async function stopScanner() {
    if (!scannerRef.current) return;
    try {
      if (scannerRef.current.isScanning) await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch { /* already stopped */ }
    setRunning(false);
  }

  async function startScanner() {
    setError('');
    if (!window.isSecureContext && !['localhost','127.0.0.1'].includes(window.location.hostname)) {
      setError('Camera requires HTTPS or localhost.'); return;
    }
    try {
      const scanner = scannerRef.current || new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (text) => stopScanner().finally(() => openDecodedValue(text)),
        () => {}
      );
      setRunning(true);
    } catch (err) {
      setRunning(false);
      setError(err?.message || 'Could not start camera. Allow permission and try again.');
    }
  }

  async function scanUploadedQr(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setError('');
    try {
      await stopScanner();
      const scanner = scannerRef.current || new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      openDecodedValue(await scanner.scanFile(file, true));
    } catch (err) {
      setError(err?.message || 'Could not read QR from image.');
    } finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  function submitManual(e) { e.preventDefault(); openDecodedValue(manualValue); }
  useEffect(() => () => stopScanner(), [navigate]);

  return (
    <section className="fade-in">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light text-[var(--text)]">Scan Asset</h1>
        <p className="mt-2 text-base text-[var(--text-2)]">Camera • Upload • Manual Entry</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-8">
        {/* Camera Section */}
        <div className="card overflow-hidden">
          <div className="px-8 py-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-[var(--text)]">Live Camera</p>
              {running && (
                <span className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                  <span className="pulse-ring inline-block h-2 w-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  Scanning
                </span>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Viewfinder */}
            <div
              className="relative overflow-hidden rounded-2xl bg-gray-100 mb-6"
              style={{ minHeight: '320px' }}
            >
              <div id="qr-reader" className="w-full" style={{ minHeight: '320px' }} />
              {!running && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/5">
                  {/* Corner marks */}
                  {[
                    'top-8 left-8 border-t-2 border-l-2 rounded-tl-lg',
                    'top-8 right-8 border-t-2 border-r-2 rounded-tr-lg',
                    'bottom-8 left-8 border-b-2 border-l-2 rounded-bl-lg',
                    'bottom-8 right-8 border-b-2 border-r-2 rounded-br-lg',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute h-8 w-8 ${cls}`} style={{ borderColor: 'rgba(15, 15, 16, 0.2)' }} />
                  ))}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-xs text-[var(--text-3)]">Camera off</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary flex-1" onClick={startScanner} disabled={running}>
                {running ? 'Scanning...' : 'Start Camera'}
              </button>
              <button className="btn btn-ghost flex-1" onClick={stopScanner} disabled={!running}>
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="card p-8">
          <p className="text-base font-semibold text-[var(--text)] mb-2">Upload Image</p>
          <p className="text-sm text-[var(--text-2)] mb-6">Upload a PNG or JPG containing a QR code</p>
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 transition-all duration-200"
            style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-sm font-medium">Choose image</span>
            <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={scanUploadedQr} />
          </label>
        </div>

        {/* Manual Entry Section */}
        <div className="card p-8">
          <p className="text-base font-semibold text-[var(--text)] mb-2">Manual Entry</p>
          <p className="text-sm text-[var(--text-2)] mb-6">Enter an asset ID or full QR URL</p>
          <form className="flex gap-3" onSubmit={submitManual}>
            <input className="field flex-1" placeholder="KPL-QR-GEN-0001" value={manualValue} onChange={e => setManualValue(e.target.value)} />
            <button className="btn btn-primary" style={{ minWidth: '100px' }}>Open</button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="card p-6 bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
