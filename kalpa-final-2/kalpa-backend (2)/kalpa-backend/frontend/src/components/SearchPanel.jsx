import { useState, useEffect } from 'react';
import { searchProducts, getFilterOptions } from '../api/api

export default function SearchPanel({ onResults, onProductSelect }) {
  const [filters, setFilters] = useState({
    product_type: '',
    location: '',
    manufacture_year: '',
    maintenance_due: false,
    recently_repaired: false,
  });
  const [options, setOptions] = useState({ types: [], locations: [], years: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getFilterOptions()
      .then(r => setOptions(r.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        product_type: filters.product_type || undefined,
        location: filters.location || undefined,
        manufacture_year: filters.manufacture_year ? parseInt(filters.manufacture_year) : undefined,
        maintenance_due: filters.maintenance_due || undefined,
        recently_repaired: filters.recently_repaired || undefined,
        limit: 50,
        offset: 0,
      };
      const res = await searchProducts(payload);
      onResults(res.data);
    } catch (err) {
      setError('Search failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ product_type: '', location: '', manufacture_year: '', maintenance_due: false, recently_repaired: false });
    onResults(null);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">⬡</span>
        <h2>SEARCH & FILTER</h2>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label>PRODUCT TYPE</label>
          <select name="product_type" value={filters.product_type} onChange={handleChange}>
            <option value="">All Types</option>
            {options.types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>LOCATION</label>
          <select name="location" value={filters.location} onChange={handleChange}>
            <option value="">All Locations</option>
            {options.locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>MANUFACTURE YEAR</label>
          <select name="manufacture_year" value={filters.manufacture_year} onChange={handleChange}>
            <option value="">All Years</option>
            {options.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="form-field checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" name="maintenance_due" checked={filters.maintenance_due} onChange={handleChange} />
            <span className="checkmark"></span>
            MAINTENANCE DUE
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="recently_repaired" checked={filters.recently_repaired} onChange={handleChange} />
            <span className="checkmark"></span>
            RECENTLY REPAIRED
          </label>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="btn-row">
        <button className="btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? '···' : '▶ SEARCH'}
        </button>
        <button className="btn-ghost" onClick={handleReset}>RESET</button>
      </div>
    </div>
  );
}
