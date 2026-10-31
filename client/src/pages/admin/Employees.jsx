
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  RefreshCw,
  Plus,
  Filter,
} from "lucide-react";
import api from "../../services/api";
import EmployeeForm from "../employee/EmployeeForm";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/employees");
      setEmployees(response.data?.data?.employees ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Employees load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const departments = [
    "All",
    ...new Set(
      employees
        .map((employee) => employee.department)
        .filter(Boolean)
    ),
  ];

  const filteredEmployees = employees.filter((employee) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      employee.employeeCode,
      employee.department,
      employee.designation,
      employee.name,
      employee.user?.name,
      employee.email,
      employee.user?.email,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    );

    const matchesDepartment =
      department === "All" ||
      employee.department === department;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <Header />
        <div className="mx-auto mt-6 max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Employees
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage and organize your employees.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
                <Users size={20} className="text-blue-600" />
                <span className="text-sm text-slate-500">Total</span>
                <span className="font-bold text-slate-900">
                  {employees.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Register Employee
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search code, name, email, department..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Filter size={17} className="text-slate-400" />
                <select
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="min-w-32 bg-transparent py-3 text-sm outline-none"
                >
                  {departments.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All Departments" : item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={fetchEmployees}
                disabled={loading}
                title="Refresh employees"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              {loading ? (
                <p className="py-12 text-center text-slate-500">
                  Loading employees...
                </p>
              ) : error ? (
                <div className="py-12 text-center">
                  <p className="text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={fetchEmployees}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-12 text-center">
                  <Users
                    size={36}
                    className="mx-auto mb-3 text-slate-300"
                  />
                  <p className="font-medium text-slate-700">
                    {search || department !== "All"
                      ? "No matching employees found."
                      : "No employees registered yet."}
                  </p>
                  {!search && department === "All" && (
                    <p className="mt-1 text-sm text-slate-500">
                      Register your first employee to get started.
                    </p>
                  )}
                </div>
              ) : (
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-4 font-semibold">Employee Code</th>
                      <th className="px-4 py-4 font-semibold">Department</th>
                      <th className="px-4 py-4 font-semibold">Designation</th>
                      <th className="px-4 py-4 font-semibold">Joining Date</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => {
                      const status =
                        employee.employmentStatus ||
                        employee.status ||
                        "Unknown";

                      return (
                        <tr
                          key={employee.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {employee.employeeCode || "—"}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {employee.department || "—"}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {employee.designation || "—"}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {employee.joiningDate
                              ? new Date(
                                employee.joiningDate
                              ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-600"
                                }`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && !error && (
              <p className="mt-4 text-xs text-slate-500">
                Showing {filteredEmployees.length} of {employees.length} employees
              </p>
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <EmployeeForm
          onClose={() => setShowForm(false)}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}

export default Employees;
