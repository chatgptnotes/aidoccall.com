import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const PatientNotificationBell = ({ patientId, patientEmail }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const appointmentsRef = useRef({});

  useEffect(() => {
    if (!patientId) return;

    const storedKey = `patient_notif_v2_${patientId}`;
    const seenKey = `patient_notif_seen_${patientId}`;

    // Load previously saved notifications from localStorage
    const stored = localStorage.getItem(storedKey);
    const savedNotifs = stored ? JSON.parse(stored) : [];

    // Load IDs of appointments we've already generated notifications for
    const seenStored = localStorage.getItem(seenKey);
    const seenAptIds = seenStored ? new Set(JSON.parse(seenStored)) : new Set();

    const fetchAndGenerateNotifications = async () => {
      // Fetch patient's appointments (including cancelled) to build snapshot
      // and generate notifications for recently changed ones
      const { data } = await supabase
        .from('doc_appointments')
        .select('id, status, appointment_date, start_time, end_time, patient_name, patient_email, doctor_id, updated_at, created_at')
        .or(`patient_id.eq.${patientId}${patientEmail ? `,patient_email.eq.${patientEmail}` : ''}`)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (!data) return;

      const snapshot = {};
      const newNotifs = [...savedNotifs];

      data.forEach((apt) => {
        snapshot[apt.id] = {
          status: apt.status,
          date: apt.appointment_date,
          start_time: apt.start_time,
        };

        // Generate notifications for cancelled appointments not yet seen
        if (apt.status === 'cancelled' && !seenAptIds.has(`cancel_${apt.id}`)) {
          const dateStr = formatDate(apt.appointment_date);
          const timeStr = apt.start_time?.slice(0, 5) || '';
          newNotifs.push({
            id: `cancel_${apt.id}`,
            type: 'cancelled',
            title: 'Appointment Cancelled',
            message: `Your appointment on ${dateStr} at ${timeStr} has been cancelled.`,
            createdAt: apt.updated_at || apt.created_at,
            isRead: false,
          });
          seenAptIds.add(`cancel_${apt.id}`);
        }

        // Generate notifications for confirmed appointments not yet seen
        if (apt.status === 'confirmed' && !seenAptIds.has(`confirmed_${apt.id}`)) {
          const dateStr = formatDate(apt.appointment_date);
          const timeStr = apt.start_time?.slice(0, 5) || '';
          newNotifs.push({
            id: `confirmed_${apt.id}`,
            type: 'confirmed',
            title: 'Appointment Confirmed',
            message: `Your appointment on ${dateStr} at ${timeStr} has been confirmed.`,
            createdAt: apt.updated_at || apt.created_at,
            isRead: false,
          });
          seenAptIds.add(`confirmed_${apt.id}`);
        }
      });

      appointmentsRef.current = snapshot;

      // Sort by createdAt descending and limit
      const sortedNotifs = newNotifs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 30);

      setNotifications(sortedNotifs);
      localStorage.setItem(storedKey, JSON.stringify(sortedNotifs));
      localStorage.setItem(seenKey, JSON.stringify([...seenAptIds]));
    };

    fetchAndGenerateNotifications();

    // Subscribe to real-time changes on appointments
    const channel = supabase
      .channel(`patient-apt-notifs-${patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'doc_appointments',
        },
        (payload) => {
          const apt = payload.new;

          // Check if this appointment belongs to this patient
          const isMyApt =
            apt.patient_id === patientId ||
            (patientEmail && apt.patient_email === patientEmail);

          if (!isMyApt) return;

          const prev = appointmentsRef.current[apt.id];
          let notifItem = null;

          // Detect cancellation
          if (apt.status === 'cancelled' && prev?.status !== 'cancelled') {
            const dateStr = formatDate(apt.appointment_date);
            const timeStr = apt.start_time?.slice(0, 5) || '';
            notifItem = {
              id: `cancel_${apt.id}`,
              type: 'cancelled',
              title: 'Appointment Cancelled',
              message: `Your appointment on ${dateStr} at ${timeStr} has been cancelled.`,
              createdAt: new Date().toISOString(),
              isRead: false,
            };
          }
          // Detect reschedule (date or time changed)
          else if (
            prev &&
            (apt.appointment_date !== prev.date || apt.start_time !== prev.start_time)
          ) {
            const newDateStr = formatDate(apt.appointment_date);
            const newTimeStr = apt.start_time?.slice(0, 5) || '';
            notifItem = {
              id: `reschedule_${apt.id}_${Date.now()}`,
              type: 'rescheduled',
              title: 'Appointment Rescheduled',
              message: `Your appointment has been rescheduled to ${newDateStr} at ${newTimeStr}.`,
              createdAt: new Date().toISOString(),
              isRead: false,
            };
          }
          // Detect confirmation
          else if (apt.status === 'confirmed' && prev?.status === 'pending') {
            const dateStr = formatDate(apt.appointment_date);
            const timeStr = apt.start_time?.slice(0, 5) || '';
            notifItem = {
              id: `confirmed_${apt.id}`,
              type: 'confirmed',
              title: 'Appointment Confirmed',
              message: `Your appointment on ${dateStr} at ${timeStr} has been confirmed.`,
              createdAt: new Date().toISOString(),
              isRead: false,
            };
          }

          // Update snapshot
          appointmentsRef.current[apt.id] = {
            status: apt.status,
            date: apt.appointment_date,
            start_time: apt.start_time,
          };

          if (notifItem) {
            setNotifications((prev) => {
              // Remove any existing notification for the same appointment action
              const filtered = prev.filter((n) => n.id !== notifItem.id);
              const updated = [notifItem, ...filtered].slice(0, 30);
              localStorage.setItem(storedKey, JSON.stringify(updated));

              // Track seen
              const seenStored2 = localStorage.getItem(seenKey);
              const seenSet = seenStored2 ? new Set(JSON.parse(seenStored2)) : new Set();
              seenSet.add(notifItem.id);
              localStorage.setItem(seenKey, JSON.stringify([...seenSet]));

              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, patientEmail]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem(`patient_notif_v2_${patientId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'cancelled':
        return { icon: 'event_busy', bg: 'bg-red-100', color: 'text-red-600' };
      case 'rescheduled':
        return { icon: 'event_repeat', bg: 'bg-blue-100', color: 'text-blue-600' };
      case 'confirmed':
        return { icon: 'event_available', bg: 'bg-green-100', color: 'text-green-600' };
      default:
        return { icon: 'notifications', bg: 'bg-gray-100', color: 'text-gray-600' };
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={handleToggle}
        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition relative"
      >
        <span className="material-icons text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <span className="material-icons text-3xl mb-2 block">notifications_none</span>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const iconInfo = getIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                      !notif.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconInfo.bg}`}
                      >
                        <span className={`material-icons text-lg ${iconInfo.color}`}>
                          {iconInfo.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-800 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientNotificationBell;
