"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  escrow_id?: string;
  read: boolean;
  created_at: string;
}

interface NotificationsBellProps {
  walletAddress: string;
}

export default function NotificationsBell({ walletAddress }: NotificationsBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?wallet=${walletAddress}&unreadOnly=true`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications?.length || 0);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, wallet: walletAddress }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);
    
    // Route based on notification type
    if (notification.type === 'invoice_funded' && notification.escrow_id) {
      router.push(`/dashboard?tab=pending-work`);
    } else if (notification.escrow_id) {
      router.push(`/pay/${notification.escrow_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_funded':
        return '💰';
      case 'work_delivered':
        return '📦';
      case 'payment_released':
        return '✅';
      case 'dispute_opened':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg transition-all hover:bg-white/5"
        style={{ color: '#888' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span 
            className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: '#FF6B2B', color: 'white' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50"
          style={{ 
            background: 'rgba(15,15,15,0.95)', 
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#f7f7f5' }}>Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm" style={{ color: '#666' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: '#666' }}>
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full p-4 text-left transition-all hover:bg-white/5 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#f7f7f5' }}>
                        {notification.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#888' }}>
                        {notification.message}
                      </p>
                      <p className="text-xs mt-2" style={{ color: '#666' }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => router.push('/dashboard?tab=notifications')}
                className="w-full text-xs text-center"
                style={{ color: '#FF6B2B' }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
