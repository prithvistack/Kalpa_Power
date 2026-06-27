import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getApiErrorMessage, searchProducts } from '../api/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError('');
      try {
        const { data: results } = await searchProducts({ limit: 1000, offset: 0 });
        const products = results.results;

        // Calculate KPIs
        const total = products.length;
        const operational = products.filter(p => p.status === 'operational').length;
        const maintenanceDue = products.filter(p => p.tags.includes('maintenance_due')).length;

        const operationalPct = total > 0 ? Math.round((operational / total) * 100) : 0;
        const maintenancePct = total > 0 ? Math.round((maintenanceDue / total) * 100) : 0;

        // Assets by Location
        const locationMap = {};
        products.forEach(p => {
          const loc = p.location || 'Unknown';
          locationMap[loc] = (locationMap[loc] || 0) + 1;
        });
        const locationData = Object.entries(locationMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        // Status Distribution
        const statusMap = {};
        products.forEach(p => {
          const status = p.status || 'unknown';
          statusMap[status] = (statusMap[status] || 0) + 1;
        });
        const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // Maintenance Over Time (simulated by manufacture year)
        const yearMap = {};
        products.forEach(p => {
          const year = p.manufacture_year || 'Unknown';
          yearMap[year] = (yearMap[year] || 0) + 1;
        });
        const timelineData = Object.entries(yearMap)
          .sort((a, b) => a[0] - b[0])
          .slice(-10)
          .map(([name, value]) => ({ name: String(name), value }));

        setData({
          kpis: {
            total,
            operational,
            operationalPct,
            maintenanceDue,
            maintenancePct,
          },
          locationData,
          statusData,
          timelineData,
        });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Could not load analytics'));
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const COLORS = {
    operational: '#10b981',
    faulty: '#ef4444',
    under_maintenance: '#f59e0b',
    decommissioned: '#9ca3af',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-base text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <section className="fade-in">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-light text-[var(--text)]">Analytics</h1>
        <p className="mt-2 text-base text-[var(--text-2)]">Asset performance and lifecycle insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Total Assets */}
        <div className="card p-8">
          <p className="label mb-4">Total Assets</p>
          <p className="text-4xl font-light text-[var(--text)]">{data.kpis.total}</p>
          <p className="mt-3 text-xs text-[var(--text-3)]">In system</p>
        </div>

        {/* Operational */}
        <div className="card p-8">
          <p className="label mb-4">Operational</p>
          <p className="text-4xl font-light text-[var(--text)]">{data.kpis.operationalPct}%</p>
          <p className="mt-3 text-xs text-[var(--text-3)]">
            {data.kpis.operational} of {data.kpis.total} assets
          </p>
        </div>

        {/* Maintenance Due */}
        <div className="card p-8">
          <p className="label mb-4">Maintenance Due</p>
          <p className="text-4xl font-light text-orange-600">{data.kpis.maintenancePct}%</p>
          <p className="mt-3 text-xs text-[var(--text-3)]">
            {data.kpis.maintenanceDue} assets require attention
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Assets by Location */}
        <div className="card p-8">
          <p className="text-lg font-light text-[var(--text)] mb-6">Assets by Location</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.locationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-3)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text-3)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card p-8">
          <p className="text-lg font-light text-[var(--text)] mb-6">Status Distribution</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="card p-8 mb-12">
        <p className="text-lg font-light text-[var(--text)] mb-6">Assets by Manufacture Year</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-3)" style={{ fontSize: '12px' }} />
            <YAxis stroke="var(--text-3)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              cursor={{ stroke: 'var(--accent)', strokeWidth: 2 }}
            />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="card p-8">
        <p className="text-lg font-light text-[var(--text)] mb-6">Insights</p>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">📊</span>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                {data.kpis.operationalPct}% of assets are operational
              </p>
              <p className="text-xs text-[var(--text-3)] mt-1">
                {data.kpis.operational} out of {data.kpis.total} assets are running smoothly
              </p>
            </div>
          </div>

          {data.kpis.maintenancePct > 0 && (
            <div className="flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {data.kpis.maintenancePct}% of assets require maintenance soon
                </p>
                <p className="text-xs text-[var(--text-3)] mt-1">
                  {data.kpis.maintenanceDue} assets have upcoming maintenance tasks
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">📍</span>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                Assets distributed across {data.locationData.length} location{data.locationData.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[var(--text-3)] mt-1">
                Largest site has {Math.max(...data.locationData.map(d => d.value))} assets
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
