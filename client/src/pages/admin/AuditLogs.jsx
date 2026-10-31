
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchAuditLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: 20,
      };

      if (action) params.action = action;
      if (resourceType) params.resourceType = resourceType;
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get("/audit", { params });

      const data = response.data?.data;

      setLogs(data?.logs || []);
      setPagination(
        data?.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Audit logs load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  }, [action, resourceType, from, to]);

  useEffect(() => {
    fetchAuditLogs(1);
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((log) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      log.actorName,
      log.actorRole,
      log.action,
      log.resourceType,
      log.description,
      log.resourceId,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    );
  });

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString();
  };

  const getActionStyle = (value) => {
    const normalized = String(value || "").toLowerCase();

    if (
      normalized.includes("delete") ||
      normalized.includes("deactivate")
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      normalized.includes("create") ||
      normalized.includes("register")
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      normalized.includes("update") ||
      normalized.includes("approve")
    ) {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <Header />

        <div className="mx-auto mt-6 max-w-7xl">
          {/* Page Heading */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Audit Logs
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Monitor important activities performed in your organization.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <ShieldCheck size={20} className="text-blue-600" />

              <span className="text-sm text-slate-500">
                Total Logs
              </span>

              <span className="font-bold text-slate-900">
                {pagination.total}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="relative xl:col-span-2">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search actor, action, description..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
                <option value="Login">Login</option>
                <option value="Approve">Approve</option>
              </select>

              <select
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Resources</option>
                <option value="Employee">Employee</option>
                <option value="Attendance">Attendance</option>
                <option value="Leave">Leave</option>
                <option value="Payroll">Payroll</option>
                <option value="Organization">Organization</option>
                <option value="User">User</option>
              </select>

              <button
                type="button"
                onClick={() => fetchAuditLogs(1)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  From Date
                </label>

                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  To Date
                </label>

                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setAction("");
                  setResourceType("");
                  setFrom("");
                  setTo("");
                  setSearch("");
                }}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              {loading ? (
                <p className="py-16 text-center text-slate-500">
                  Loading audit logs...
                </p>
              ) : error ? (
                <div className="py-16 text-center">
                  <p className="text-red-600">{error}</p>

                  <button
                    type="button"
                    onClick={() => fetchAuditLogs(pagination.page)}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-16 text-center">
                  <Activity
                    size={36}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="font-medium text-slate-700">
                    {search
                      ? "No matching audit logs found."
                      : "No audit logs available yet."}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Activities will appear here when recorded by the system.
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4 font-semibold">Actor</th>
                      <th className="px-5 py-4 font-semibold">Action</th>
                      <th className="px-5 py-4 font-semibold">Resource</th>
                      <th className="px-5 py-4 font-semibold">Description</th>
                      <th className="px-5 py-4 font-semibold">Date & Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log._id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {log.actorName || "System"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {log.actorRole || "System"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getActionStyle(log.action)}`}
                          >
                            {log.action || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {log.resourceType || "—"}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-600">
                          <p className="line-clamp-2">
                            {log.description || "—"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && !error && pagination.totalPages > 0 && (
              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                  {" · "}
                  {pagination.total} total records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchAuditLogs(pagination.page - 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchAuditLogs(pagination.page + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuditLogs;
