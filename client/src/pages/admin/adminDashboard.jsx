import { useCallback, useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  Wallet,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import api from "../../services/api";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/admin");
      setDashboard(response.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Dashboard data load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = [
    {
      title: "Total Employees",
      value: dashboard?.employees?.total ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Employees",
      value: dashboard?.employees?.active ?? 0,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Total HR",
      value: dashboard?.totalHR ?? 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Pending Leaves",
      value: dashboard?.pendingLeaves ?? 0,
      icon: CalendarCheck,
      color: "text-orange-600",
    },
    {
      title: "Attendance Marked Today",
      value: dashboard?.attendance?.markedToday ?? 0,
      icon: CalendarCheck,
      color: "text-blue-600",
    },
    {
      title: "Present / Late / Half Day",
      value: dashboard?.attendance?.presentToday ?? 0,
      icon: CalendarCheck,
      color: "text-green-600",
    },
    {
      title: "Late Today",
      value: dashboard?.attendance?.lateToday ?? 0,
      icon: CalendarCheck,
      color: "text-red-600",
    },
    {
      title: "Finalized Payslips",
      value: dashboard?.payroll?.finalizedPayslips ?? 0,
      icon: Wallet,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <Header />

        <div className="mx-auto mt-6 max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Welcome to HCM Lite. Monitor your organization.
              </p>
            </div>

            <button
              type="button"
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
                  type="button"
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
              Loading dashboard...
            </div>
          ) : dashboard ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(({ title, value, icon: Icon, color }) => (
                  <MetricCard
                    key={title}
                    title={title}
                    value={value}
                    icon={<Icon className={color} size={22} />}
                  />
                ))}
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Payroll Overview
                </h2>

                <p className="mt-3 text-sm text-slate-500">
                  Total Finalized Net Salary
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatMoney(dashboard.payroll?.totalNetSalary)}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Payroll Period:{" "}
                  {dashboard.payroll?.month ?? "—"}/
                  {dashboard.payroll?.year ?? "—"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Summary date: {dashboard.date || "—"}
                </p>
              </section>
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

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon}
      </div>

      <p className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default AdminDashboard;
