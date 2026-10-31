
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Search,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

const leaveTypes = ["Annual", "Sick", "Casual", "Unpaid"];
const statuses = ["Pending", "Approved", "Rejected", "Cancelled"];

const initialForm = {
  leaveType: "Casual",
  startDate: "",
  endDate: "",
  reason: "",
};

function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("hcm_user") || "null");
  } catch {
    return null;
  }
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function getLeaveId(leave) {
  return leave._id || leave.id;
}

function getEmployeeName(leave) {
  return (
    leave.employeeName ||
    leave.employee?.name ||
    leave.user?.name ||
    leave.name ||
    "Employee"
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getStatusClass(status) {
  const styles = {
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-red-50 text-red-700",
    Cancelled: "bg-slate-100 text-slate-600",
  };

  return styles[status] || "bg-slate-100 text-slate-600";
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function LeaveManagement() {
  const user = getUser();
  const role = user?.role;
  const isEmployee = role === "Employee";
  const isManager = role === "Admin" || role === "HR";

  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewComments, setReviewComments] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let response;

      if (isEmployee) {
        response = await api.get("/leaves/my-history");
      } else if (isManager) {
        const params = {};

        if (statusFilter !== "All") params.status = statusFilter;
        if (departmentFilter.trim()) {
          params.department = departmentFilter.trim();
        }

        response = await api.get("/leaves", { params });
      } else {
        setError("Your account role cannot access leave management.");
        setLeaves([]);
        return;
      }

      const list = response.data?.data?.leaves;
      setLeaves(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isEmployee, isManager, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.endDate < form.startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/leaves", {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });

      setSuccess("Leave request submitted successfully.");
      setForm(initialForm);
      setShowForm(false);
      await fetchLeaves();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(leave, decision) {
    const id = getLeaveId(leave);

    if (!id) {
      setError("This leave request has no valid ID.");
      return;
    }

    const message =
      decision === "Approved"
        ? "Approve this leave request?"
        : "Reject this leave request?";

    if (!window.confirm(message)) return;

    setError("");
    setSuccess("");
    setReviewingId(id);

    try {
      await api.patch(`/leaves/${id}/review`, {
        decision,
        reviewComment: reviewComments[id] || "",
      });

      setSuccess(`Leave request ${decision.toLowerCase()} successfully.`);
      await fetchLeaves();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewingId(null);
    }
  }

  const visibleLeaves = leaves.filter((leave) => {
    const query = search.toLowerCase();

    const searchable = [
      getEmployeeName(leave),
      leave.employeeCode,
      leave.department,
      leave.leaveType,
      leave.reason,
      leave.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  const pendingCount = leaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === "Rejected"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Header />

        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                HCM Lite / Leave
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Leave Management
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {isEmployee
                  ? "Apply for leave and track your requests."
                  : "Review and manage employee leave requests."}
              </p>
            </div>

            {isEmployee && (
              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowForm((current) => !current);
                }}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {showForm ? "Close Form" : "Apply for Leave"}
              </button>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <XCircle size={18} />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              {success}
            </div>
          )}

          {isEmployee && showForm && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-slate-900">
                New Leave Request
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Leave Type
                    </span>
                    <select
                      value={form.leaveType}
                      onChange={(event) =>
                        setForm({ ...form, leaveType: event.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      {leaveTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Start Date
                    </span>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(event) =>
                        setForm({ ...form, startDate: event.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      End Date
                    </span>
                    <input
                      type="date"
                      required
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={(event) =>
                        setForm({ ...form, endDate: event.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </label>

                  <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">
                    <CalendarDays className="mb-2" size={20} />
                    Select the dates and explain why you need leave.
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Reason
                  </span>
                  <textarea
                    required
                    minLength={5}
                    maxLength={1000}
                    rows={4}
                    value={form.reason}
                    onChange={(event) =>
                      setForm({ ...form, reason: event.target.value })
                    }
                    placeholder="Explain your leave request..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Minimum 5 characters, maximum 1000.
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submitting && (
                      <LoaderCircle size={16} className="animate-spin" />
                    )}
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Requests" value={leaves.length} icon={FileText} />
            <StatCard title="Pending" value={pendingCount} icon={Clock3} />
            <StatCard
              title="Approved"
              value={approvedCount}
              icon={CheckCircle2}
            />
            <StatCard title="Rejected" value={rejectedCount} icon={XCircle} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isEmployee ? "My Leave History" : "Leave Requests"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {visibleLeaves.length} request(s)
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search requests..."
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-56"
                  />
                </div>

                {isManager && (
                  <>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="All">All statuses</option>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <input
                      value={departmentFilter}
                      onChange={(event) =>
                        setDepartmentFilter(event.target.value)
                      }
                      placeholder="Department"
                      className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 sm:w-40"
                    />

                    <button
                      onClick={fetchLeaves}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
                <LoaderCircle className="animate-spin" size={22} />
                Loading leave requests...
              </div>
            ) : visibleLeaves.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDays className="mx-auto mb-3 text-slate-300" size={36} />
                <h3 className="font-semibold text-slate-800">
                  No leave requests found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Requests will appear here when available.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      {isManager && <th className="px-5 py-4">Employee</th>}
                      <th className="px-5 py-4">Leave Type</th>
                      <th className="px-5 py-4">Dates</th>
                      <th className="px-5 py-4">Reason</th>
                      <th className="px-5 py-4">Status</th>
                      {isManager && <th className="px-5 py-4">Review</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleLeaves.map((leave, index) => {
                      const id = getLeaveId(leave) || `${leave.startDate}-${index}`;
                      const canReview =
                        isManager && leave.status === "Pending";

                      return (
                        <tr key={id} className="align-top hover:bg-slate-50/70">
                          {isManager && (
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {getEmployeeName(leave)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {leave.department || leave.employee?.department || "—"}
                              </p>
                            </td>
                          )}
                          <td className="px-5 py-4">
                            <span className="font-medium text-slate-800">
                              {leave.leaveType || "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            <p>{formatDate(leave.startDate)}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              to {formatDate(leave.endDate)}
                            </p>
                          </td>
                          <td className="max-w-xs whitespace-normal px-5 py-4 text-slate-600">
                            <p className="line-clamp-3">{leave.reason || "—"}</p>
                            {leave.reviewComment && (
                              <p className="mt-2 text-xs text-slate-500">
                                Review: {leave.reviewComment}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(leave.status)}`}
                            >
                              {leave.status || "Unknown"}
                            </span>
                          </td>
                          {isManager && (
                            <td className="min-w-64 px-5 py-4">
                              {canReview ? (
                                <div className="space-y-2">
                                  <input
                                    value={reviewComments[id] || ""}
                                    onChange={(event) =>
                                      setReviewComments((current) => ({
                                        ...current,
                                        [id]: event.target.value,
                                      }))
                                    }
                                    maxLength={500}
                                    placeholder="Optional review comment"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      disabled={reviewingId === id}
                                      onClick={() => handleReview(leave, "Approved")}
                                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      disabled={reviewingId === id}
                                      onClick={() => handleReview(leave, "Rejected")}
                                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  No action required
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
