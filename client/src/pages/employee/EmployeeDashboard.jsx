
import { useCallback, useEffect, useState } from "react";
import {
  UserRound,
  Building2,
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  CalendarDays,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
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

const formatTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (amount, currency = "PKR") => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const StatusBadge = ({ status }) => {
  const styles = {
    Present: "bg-emerald-100 text-emerald-700",
    Late: "bg-amber-100 text-amber-700",
    HalfDay: "bg-orange-100 text-orange-700",
    Absent: "bg-red-100 text-red-700",
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
    Finalized: "bg-emerald-100 text-emerald-700",
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

const SummaryCard = ({ title, value, description, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
        <Icon size={21} />
      </div>
    </div>

    <p className="mt-4 text-3xl font-bold text-slate-900">
      {value ?? 0}
    </p>

    <p className="mt-1 text-xs text-slate-500">{description}</p>
  </div>
);

function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/employee");

      setDashboard(response.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load employee dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const employee = dashboard?.employee || {};
  const todayAttendance = dashboard?.todayAttendance;
  const leaves = dashboard?.leaves || {};
  const recentAttendance = dashboard?.recentAttendance || [];
  const recentPayslips = dashboard?.recentPayslips || [];

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <Header />

        <div className="mx-auto mt-6 max-w-7xl space-y-6">
          {/* Page Heading */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                My Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Your personal attendance, leaves and payroll overview.
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

          {/* Error */}
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
              Loading your dashboard...
            </div>
          ) : dashboard ? (
            <>
              {/* Employee Profile */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <UserRound size={28} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900">
                      Welcome Back!
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Employee Code: {employee.employeeCode || "—"}
                    </p>
                  </div>

                  <StatusBadge status={employee.employmentStatus} />
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Building2 className="text-slate-400" size={19} />
                    <div>
                      <p className="text-xs text-slate-500">Department</p>
                      <p className="font-semibold text-slate-800">
                        {employee.department || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness className="text-slate-400" size={19} />
                    <div>
                      <p className="text-xs text-slate-500">Designation</p>
                      <p className="font-semibold text-slate-800">
                        {employee.designation || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  title="Total Leave Requests"
                  value={leaves.totalRequests}
                  description="All your leave applications"
                  icon={CalendarDays}
                />

                <SummaryCard
                  title="Pending Leaves"
                  value={leaves.pendingRequests}
                  description="Waiting for review"
                  icon={Clock3}
                />

                <SummaryCard
                  title="Attendance Records"
                  value={recentAttendance.length}
                  description="Recent attendance records"
                  icon={CalendarCheck}
                />

                <SummaryCard
                  title="Finalized Payslips"
                  value={recentPayslips.length}
                  description="Available salary records"
                  icon={Wallet}
                />
              </div>

              {/* Today's Attendance */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <CalendarCheck size={22} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Today's Attendance
                    </h2>

                    <p className="text-sm text-slate-500">
                      Your check-in and check-out details
                    </p>
                  </div>
                </div>

                {todayAttendance ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Check In</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatTime(todayAttendance.checkIn)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Check Out</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatTime(todayAttendance.checkOut)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">Status</p>
                      <div className="mt-3">
                        <StatusBadge status={todayAttendance.status} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center">
                    <Clock3
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 font-semibold text-slate-700">
                      No attendance recorded today
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Your attendance details will appear here after check-in.
                    </p>
                  </div>
                )}
              </section>

              {/* Recent Attendance */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="font-bold text-slate-900">
                    Recent Attendance
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest attendance records
                  </p>
                </div>

                {recentAttendance.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No attendance records available.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Date</th>
                          <th className="px-5 py-4">Check In</th>
                          <th className="px-5 py-4">Check Out</th>
                          <th className="px-5 py-4">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {recentAttendance.map((record) => (
                          <tr
                            key={record._id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-medium text-slate-800">
                              {formatDate(record.date)}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(record.checkIn)}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatTime(record.checkOut)}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge status={record.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Recent Payslips */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="font-bold text-slate-900">
                    Recent Payslips
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest finalized payroll records
                  </p>
                </div>

                {recentPayslips.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No finalized payslips available yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Period</th>
                          <th className="px-5 py-4">Gross Salary</th>
                          <th className="px-5 py-4">Deductions</th>
                          <th className="px-5 py-4">Net Salary</th>
                          <th className="px-5 py-4">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {recentPayslips.map((payslip) => {
                          const period = new Date(
                            Number(payslip.year),
                            Number(payslip.month) - 1
                          ).toLocaleDateString("en-PK", {
                            month: "long",
                            year: "numeric",
                          });

                          return (
                            <tr
                              key={payslip._id}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-5 py-4 font-medium text-slate-800">
                                {period}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {formatMoney(
                                  payslip.grossSalary,
                                  payslip.currency
                                )}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {formatMoney(
                                  payslip.totalDeductions,
                                  payslip.currency
                                )}
                              </td>

                              <td className="px-5 py-4 font-semibold text-slate-900">
                                {formatMoney(
                                  payslip.netSalary,
                                  payslip.currency
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge status={payslip.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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

export default EmployeeDashboard;
