import { useState } from 'react';
import { getProduct } from '../api/api';

export default function ProductLookup({ onProduct }) {
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!productId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await getProduct(productId.trim());
      onProduct(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Product "${productId}" not found.`);
      } else {
        setError('Lookup failed. Ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">◈</span>
        <h2>PRODUCT ID LOOKUP</h2>
      </div>

      <div className="lookup-row">
        <div className="form-field" style={{ flex: 1 }}>
          <label>PRODUCT ID / QR CODE</label>
          <input
            type="text"
            placeholder="e.g. KPL-GEN-0001"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="btn-primary lookup-btn" onClick={handleLookup} disabled={loading}>
          {loading ? '···' : '▶ GET'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <p className="hint">Try: KPL-GEN-0001 · KPL-TRA-0015 · KPL-MOT-0042</p>
    </div>
  );
}
