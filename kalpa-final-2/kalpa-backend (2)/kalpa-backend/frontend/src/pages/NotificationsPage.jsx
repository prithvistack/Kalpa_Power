import { AlertCircle, Bell, RefreshCw, Settings, Shield, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const TYPE_CONFIG = {
  maintenance: { label: 'Maintenance', color: 'var(--warn)',   bg: 'rgba(217,119,6,0.12)', Icon: Wrench },
  warranty:    { label: 'Warranty',    color: 'var(--accent)', bg: 'var(--accent-dim)',    Icon: Shield },
  fault:       { label: 'Fault',       color: 'var(--danger)', bg: 'rgba(192,57,43,0.10)', Icon: AlertCircle },
  system:      { label: 'System',      color: 'var(--text-3)', bg: 'var(--bg-subtle)',     Icon: Settings },
};
const typeOf = t => TYPE_CONFIG[t] || { label: 'Alert', color: 'var(--text-2)', bg: 'var(--bg-subtle)', Icon: Bell };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const navigate = useNavigate();

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    fetchNotifications();
  }

  function handleClick(n) {
    if (n.product_id) navigate(`/product/${n.product_id}`);
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="fade-in max-w-lg mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)', margin: 0 }}>Notifications</h1>
          {unread > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              {unread} unread · tap to view asset
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
              Mark all read
            </button>
          )}
          <button onClick={handleRefresh}
            className="flex items-center justify-center p-2 rounded-lg"
            style={{ background: 'var(--surface-hi)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ margin: '0 auto' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Bell size={24} style={{ color: 'var(--text-3)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>No notifications</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: '1.5' }}>
            Warranty & maintenance alerts will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notifications.map((n, idx) => {
            const cfg = typeOf(n.type);
            const TypeIcon = cfg.Icon;
            return (
              <div key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '14px 16px',
                  cursor: n.product_id ? 'pointer' : 'default',
                  borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                  background: n.read ? 'transparent' : 'var(--accent-glow)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (n.product_id) e.currentTarget.style.background = 'var(--surface-hi)'; }}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-glow)'}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <TypeIcon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      {!n.read && (
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: cfg.bg, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: '1.45' }}>{n.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      {n.product_id && (
                        <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 600 }}>
                          {n.product_id}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {new Date(n.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {n.product_id && (
                        <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 'auto' }}>View →</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
