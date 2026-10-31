
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  UserRound,
  CheckCheck,
  LoaderCircle,
  X,
} from "lucide-react";

import api from "../../services/api";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const notificationRef = useRef(null);

  let user = {};

  try {
    user = JSON.parse(sessionStorage.getItem("hcm_user") || "{}");
  } catch {
    user = {};
  }

  const displayName =
    user.name || user.fullName || user.email || "User";

  const role = user.role || "Employee";
  const initial = displayName.charAt(0).toUpperCase();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      setNotificationError("");

      const response = await api.get("/notifications?page=1&limit=20");

      const data = response.data?.data;

      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Notifications load nahi ho sakin."
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Mark one notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await api.patch(
        `/notifications/${notificationId}/read`
      );

      const updatedNotification = response.data?.data?.notification;

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? updatedNotification || {
                ...notification,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      if (notifications.some(
        (notification) =>
          notification._id === notificationId &&
          notification.readAt === null
      )) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Notification update nahi ho saki."
      );
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      const now = new Date().toISOString();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          readAt: notification.readAt || now,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      setNotificationError(
        error.response?.data?.message ||
          "Notifications update nahi ho sakin."
      );
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 md:px-8">
      <div>
        <p className="text-sm text-slate-500">
          HCM Lite / {role}
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Overview
        </h2>
      </div>

      <div className="flex items-center gap-4">

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={() => {
              const nextState = !notificationsOpen;
              setNotificationsOpen(nextState);

              if (nextState) {
                fetchNotifications();
              }
            }}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 z-50 mt-3 w-[340px] max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-[400px]">

              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      <CheckCheck size={15} />
                      Mark all read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                    className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto">

                {loadingNotifications ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                    <LoaderCircle size={18} className="animate-spin" />
                    Loading notifications...
                  </div>
                ) : notificationError ? (
                  <div className="p-5 text-center">
                    <p className="text-sm text-red-600">
                      {notificationError}
                    </p>

                    <button
                      type="button"
                      onClick={fetchNotifications}
                      className="mt-2 text-sm font-medium text-blue-600"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell
                      size={28}
                      className="mx-auto mb-2 text-slate-300"
                    />

                    <p className="text-sm font-medium text-slate-700">
                      No notifications yet
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      You are all caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isUnread = notification.readAt === null;

                    return (
                      <div
                        key={notification._id}
                        className={`border-b border-slate-100 p-4 ${
                          isUnread ? "bg-blue-50/60" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {notification.title}
                              </p>

                              {isUnread && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                              )}
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              {notification.createdAt
                                ? new Date(
                                    notification.createdAt
                                  ).toLocaleString()
                                : ""}
                            </p>
                          </div>

                          {isUnread && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkAsRead(notification._id)
                              }
                              className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Mark read
                            </button>
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

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {initial || <UserRound size={20} />}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>

              <p className="text-xs text-slate-500">
                {role}
              </p>
            </div>

            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
              <p className="text-sm font-medium text-slate-800">
                {displayName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Role: {role}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
