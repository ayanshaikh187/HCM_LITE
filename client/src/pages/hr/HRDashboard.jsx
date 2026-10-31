
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserRoundCheck,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import api from "../../services/api";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
        <Icon size={21} />
      </div>
    </div>

    <p className="mt-4 text-3xl font-bold text-slate-900">
      {value ?? 0}
    </p>

    <p className="mt-1 text-xs text-slate-500">{description}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
    Cancelled: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

function HRDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/hr");

      setDashboard(response.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to load HR dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const employees = dashboard?.employees || {};
  const attendance = dashboard?.attendance || {};
  const recentLeaves = dashboard?.recentLeaves || [];

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <Header />

        <div className="mx-auto mt-6 max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                HR Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor employees, attendance and leave requests.
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Dashboard error</p>
                <p className="mt-1">{error}</p>
                <button
                  onClick={fetchDashboard}
                  className="mt-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {loading && !dashboard ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading HR dashboard...
            </div>
          ) : dashboard ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Active Employees"
                  value={employees.active}
                  icon={Users}
                  description="Currently active employees"
                />

                <StatCard
                  title="On Leave"
                  value={employees.onLeave}
                  icon={UserRoundCheck}
                  description="Employees marked as on leave"
                />

                <StatCard
                  title="Attendance Marked"
                  value={attendance.markedToday}
                  icon={ClipboardCheck}
                  description="Today's attendance records"
                />

                <StatCard
                  title="Late Today"
                  value={attendance.lateToday}
                  icon={Clock3}
                  description="Employees marked late today"
                />
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Recent Leave Requests
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest leave applications from employees
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                    <CalendarDays size={16} />
                    {dashboard.pendingLeaves ?? 0} Pending
                  </div>
                </div>

                {recentLeaves.length === 0 ? (
                  <div className="p-10 text-center">
                    <CalendarDays
                      className="mx-auto text-slate-300"
                      size={36}
                    />
                    <p className="mt-3 font-semibold text-slate-700">
                      No leave requests yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      New employee leave requests will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Employee Code</th>
                          <th className="px-5 py-4">Department</th>
                          <th className="px-5 py-4">Leave Type</th>
                          <th className="px-5 py-4">Start Date</th>
                          <th className="px-5 py-4">End Date</th>
                          <th className="px-5 py-4">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {recentLeaves.map((leave) => (
                          <tr
                            key={leave._id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {leave.employeeId?.employeeCode || "—"}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {leave.employeeId?.department || "—"}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {leave.leaveType || "—"}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(leave.startDate)}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(leave.endDate)}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={leave.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <p className="text-xs text-slate-400">
                Dashboard date: {dashboard.date || "—"}
              </p>
            </>
          ) : !error ? (
            <div className="rounded-xl bg-white p-8 text-center text-slate-500">
              No dashboard data available.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default HRDashboard;
