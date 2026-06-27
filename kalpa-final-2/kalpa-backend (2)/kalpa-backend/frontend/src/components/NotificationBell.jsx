import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      // Update local state to mark all as read
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Open dropdown and mark all as read
  const toggleDropdown = () => {
    if (!isOpen && unreadCount > 0) {
      handleMarkAllRead();
    }
    setIsOpen(!isOpen);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
      setIsOpen(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warranty':
        return '⚠️';
      case 'maintenance':
        return '🔧';
      case 'system':
        return '➕';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-lg transition-colors"
        style={{
          background: isOpen ? 'var(--border)' : 'transparent',
          color: 'var(--text-2)',
          border: '1px solid var(--border)',
        }}
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        
        {/* Red dot for unread */}
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: '#ef4444' }}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-2)' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-2)' }}>
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                    notification.read ? '' : 'opacity-100'
                  }`}
                  style={{
                    borderColor: 'var(--border)',
                    background: notification.read ? 'transparent' : 'rgba(212, 175, 55, 0.05)',
                    color: 'var(--text)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(212, 175, 55, 0.05)';
                  }}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <span className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {notification.message}
                      </p>
                      {notification.product_id && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--text-2)' }}
                        >
                          {notification.product_id}
                        </p>
                      )}
                      <p
                        className="text-xs mt-1"
                        style={{ color: 'var(--text-2)' }}
                      >
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Only show if there are notifications */}
          {notifications.length > 0 && (
            <div
              className="px-4 py-3 text-center border-t"
              style={{
                borderColor: 'var(--border)',
              }}
            >
              <button
                onClick={fetchNotifications}
                className="text-xs font-medium transition-colors"
                style={{
                  color: 'var(--accent)',
                }}
              >
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
