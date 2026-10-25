import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Bell, LogOut, Menu, X, Megaphone } from "lucide-react";
import { logout } from "../../features/auth/authSlice";
import { NAV, ROLE_LABEL } from "../../config/nav";
import { EmptyState } from "../ui";

// TODO: load from GET /announcements (latest) and GET /notifications.
function AnnouncementBanner({ item }) {
  const [hidden, setHidden] = useState(false);
  if (!item || hidden) return null;
  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
      <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{item.text}</p>
      <button onClick={() => setHidden(true)} aria-label="Dismiss announcement"><X className="size-4" /></button>
    </div>
  );
}

function NotificationsMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" aria-expanded={open}
        className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100">
        <Bell className="size-5" />
        {items.length > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-rose-500" />}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg">
          {items.length === 0
            ? <EmptyState title="No notifications" hint="Leave decisions and new payslips show up here." />
            : items.map((n) => <p key={n.id} className="border-b border-slate-100 p-3 text-sm last:border-0">{n.text}</p>)}
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-slate-800"}`;

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 p-4 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between px-2">
          <span className="text-lg font-semibold text-white">HCM Lite</span>
          <button className="text-slate-300 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1">
          {NAV[user.role].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkCls} onClick={() => setOpen(false)}>
              <Icon className="size-4" aria-hidden="true" />{label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => dispatch(logout())} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <LogOut className="size-4" aria-hidden="true" />Sign out
        </button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="ml-auto flex items-center gap-3">
          <NotificationsMenu />
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <AnnouncementBanner item={null} />
        <Outlet />
      </main>
    </div>
  );
}
