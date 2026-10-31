
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Settings,
  LogOut,
  Building2,
  Activity,
  Bot,
  UserPlus,
} from "lucide-react";
import api from "../../services/api";

function Sidebar() {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(sessionStorage.getItem("hcm_user") || "null");
  } catch {
    user = null;
  }

  const role = user?.role;

  const dashboardPath =
    role === "Admin"
      ? "/admin/dashboard"
      : role === "HR"
        ? "/hr/dashboard"
        : "/employee/dashboard";

  const attendancePath =
    role === "Admin"
      ? "/admin/attendance"
      : role === "HR"
        ? "/hr/attendance"
        : "/employee/attendance";

  const menuItems = [
    {
      label: "Dashboard",
      path: dashboardPath,
      icon: LayoutDashboard,
      active: true,
    },
    ...(role === "Admin" || role === "HR"
      ? [
        {
          label: "Employees",
          path: role === "Admin" ? "/admin/employees" : "/hr/employees",
          icon: Users,
          active: true,
        },
        {
          label: "AI Assistant",
          path:
            role === "Admin"
              ? "/admin/ai-assistant"
              : "/hr/ai-assistant",
          icon: Bot,
          active: true,
        },
      ]
      : []),
    {
      label: "Attendance",
      path: attendancePath,
      icon: CalendarCheck,
      active: true,
    },
    {
      label: "Leave Management",
      path:
        role === "Admin"
          ? "/admin/leaves"
          : role === "HR"
            ? "/hr/leaves"
            : "/employee/leaves",
      icon: CalendarDays,
      active: true,
    },
    {
      label: "Payroll",
      path:
        role === "Admin"
          ? "/admin/payroll"
          : role === "HR"
            ? "/hr/payroll"
            : "/employee/payroll",
      icon: Wallet,
      active: true,
    },
    ...(role === "Admin"
      ? [
        {
          label: "HR Management",
          path: "/admin/hr-management",
          icon: UserPlus,
          active: true,
        },
        {
          label: "Audit Logs",
          path: "/admin/audit-logs",
          icon: Activity,
          active: true,
        },
        {
          label: "Settings",
          path: "/admin/settings",
          icon: Settings,
          active: true,
        },
      ]
      : []),
  ];

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      sessionStorage.removeItem("hcm_access_token");
      sessionStorage.removeItem("hcm_user");
      navigate("/login", { replace: true });
    }
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Building2 size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            HCM Lite
          </h2>
          <p className="text-xs text-slate-500">
            Human Capital Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={(event) => {
                if (!item.active) event.preventDefault();
              }}
              title={!item.active ? "Coming soon" : item.label}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive && item.active
                  ? "bg-blue-600 text-white shadow-sm"
                  : item.active
                    ? "text-slate-600 hover:bg-slate-100"
                    : "cursor-not-allowed text-slate-400"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>

              {!item.active && (
                <span className="ml-auto text-[10px]">Soon</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <p className="mb-3 px-3 text-xs text-slate-500">
          {user?.name || user?.email || "User"} · {role || "Account"}
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
          Logout
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          HCM Lite · {role || "Workspace"}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
