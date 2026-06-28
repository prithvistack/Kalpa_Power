import { AlertCircle, Bell, BellRing, RefreshCw, Settings, Shield, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const TYPE_CONFIG = {
  maintenance: { label: 'Maintenance', color: 'var(--warn)',    bg: 'rgba(217,119,6,0.12)',  Icon: Wrench },
  warranty:    { label: 'Warranty',    color: 'var(--accent)',  bg: 'var(--accent-dim)',     Icon: Shield },
  fault:       { label: 'Fault',       color: 'var(--danger)',  bg: 'rgba(192,57,43,0.10)',  Icon: AlertCircle },
  system:      { label: 'System',      color: 'var(--text-3)',  bg: 'var(--bg-subtle)',      Icon: Settings },
};
const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || { label: 'Notification', color: 'var(--text-2)', bg: 'var(--bg-subtle)', Icon: BellRing };

export default function NotificationBell() {
  const [isOpen, setIsOpen]           = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]  = useState(0);
  const [loading, setLoading]          = useState(false);
  const [bellKey, setBellKey]          = useState(0);
  const prevUnread = useRef(0);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      const count = response.data.unread_count || 0;
      setNotifications(response.data.notifications || []);
      setUnreadCount(count);
      if (count > prevUnread.current && prevUnread.current !== null) {
        setBellKey(k => k + 1);
      }
      prevUnread.current = count;
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      prevUnread.current = 0;
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch { /* silent */ }
  };

  const toggleDropdown = () => {
    if (!isOpen && unreadCount > 0) handleMarkAllRead();
    setIsOpen(o => !o);
  };

  const handleClick = (n) => {
    if (n.product_id) { navigate(`/product/${n.product_id}`); setIsOpen(false); }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center p-2 rounded-lg transition-all"
        style={{
          background: isOpen ? 'var(--surface-hi)' : 'transparent',
          color: isOpen ? 'var(--accent)' : 'var(--text-2)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
        title="Notifications"
      >
        <span key={bellKey} className={unreadCount > 0 ? 'bell-anim' : ''} style={{ display: 'flex' }}>
          <Bell size={15} />
        </span>
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center"
            style={{
              top: '3px', right: '3px',
              minWidth: '15px', height: '15px',
              borderRadius: '99px', padding: '0 3px',
              background: 'var(--danger)',
              color: '#fff', fontSize: '9px', fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-xl overflow-hidden drop-in"
          style={{
            width: '380px',
            background: 'var(--overlay)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)',
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <Bell size={14} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>Notifications</h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 7px', borderRadius: '99px',
                    background: 'rgba(192,57,43,0.12)',
                    color: 'var(--danger)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={fetchNotifications}
              className="flex items-center justify-center p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--text-3)' }}>
                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span style={{ fontSize: '13px' }}>Loading…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div
                  className="mx-auto mb-3 flex items-center justify-center rounded-full"
                  style={{ width: '44px', height: '44px', background: 'var(--bg-subtle)', color: 'var(--text-3)' }}
                >
                  <Bell size={20} />
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>No notifications</p>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                  Warranty & maintenance alerts will appear here
                </p>
              </div>
            ) : (
              notifications.map((n, idx) => {
                const cfg = getTypeConfig(n.type);
                const TypeIcon = cfg.Icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '12px 16px',
                      cursor: n.product_id ? 'pointer' : 'default',
                      borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                      background: n.read ? 'transparent' : 'var(--accent-glow)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hi)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-glow)'}
                  >
                    <div className="flex gap-3">
                      {/* Type icon */}
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{
                          width: '32px', height: '32px',
                          background: cfg.bg,
                          color: cfg.color,
                          marginTop: '1px',
                        }}
                      >
                        <TypeIcon size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {!n.read && (
                            <span style={{
                              display: 'inline-block', width: '6px', height: '6px',
                              borderRadius: '50%', background: 'var(--accent)', flexShrink: 0,
                            }} />
                          )}
                          <span
                            style={{
                              fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                              borderRadius: '4px', background: cfg.bg, color: cfg.color,
                              textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: '1.4' }}>{n.message}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '5px', alignItems: 'center' }}>
                          {n.product_id && (
                            <span style={{
                              fontSize: '10px', color: 'var(--accent)',
                              fontFamily: 'monospace', fontWeight: 600,
                            }}>
                              {n.product_id}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                            {new Date(n.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          {n.product_id && (
                            <span style={{ fontSize: '10px', color: 'var(--accent)', marginLeft: 'auto' }}>
                              View →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-4 py-2.5 text-center"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · updates every 30s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
