
import { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Copy,
  RefreshCw,
  UserX,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

function HRManagement() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    temporaryPassword: "",
  });

  const [hrUsers, setHrUsers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdHR, setCreatedHR] = useState(null);

  async function fetchHRUsers() {
    setListLoading(true);

    try {
      const response = await api.get("/hr");
      setHrUsers(response.data?.data?.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load HR accounts."
      );
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchHRUsers();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const temporaryPassword = form.temporaryPassword;

    if (name.length < 2 || name.length > 100) {
      setError("Name must contain 2–100 characters.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (
      temporaryPassword.length < 12 ||
      temporaryPassword.length > 72
    ) {
      setError("Password must contain 12–72 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setCreatedHR(null);

    try {
      const response = await api.post("/hr", {
        name,
        email,
        temporaryPassword,
      });

      const user = response.data?.data?.user;

      setCreatedHR(user || null);
      setSuccess(
        response.data?.message ||
          "HR account created successfully."
      );

      setForm({
        name: "",
        email: "",
        temporaryPassword: "",
      });

      await fetchHRUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create HR account."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(hr) {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${hr.name}'s account?`
    );

    if (!confirmed) return;

    setDeactivatingId(hr.id);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/hr/${hr.id}/deactivate`
      );

      setSuccess(
        response.data?.message ||
          "HR account deactivated successfully."
      );

      await fetchHRUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate HR account."
      );
    } finally {
      setDeactivatingId(null);
    }
  }

  async function copyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      setSuccess("Email address copied.");
    } catch {
      setError("Unable to copy email address.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <Users size={17} />
              Organization Management
            </div>

            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              HR Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create and manage your organization's HR accounts.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 size={18} className="shrink-0" />
              {success}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <UserPlus size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Create HR Account
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter the new HR user's details.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-400">
                    <Users size={18} className="text-slate-400" />
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter HR full name"
                      minLength={2}
                      maxLength={100}
                      required
                      disabled={loading}
                      className="w-full bg-transparent py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-400">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="hr@company.com"
                      maxLength={254}
                      required
                      disabled={loading}
                      className="w-full bg-transparent py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="temporaryPassword" className="mb-2 block text-sm font-medium text-slate-700">
                    Temporary Password
                  </label>

                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-400">
                    <Lock size={18} className="text-slate-400" />
                    <input
                      id="temporaryPassword"
                      name="temporaryPassword"
                      type={showPassword ? "text" : "password"}
                      value={form.temporaryPassword}
                      onChange={handleChange}
                      placeholder="Minimum 12 characters"
                      minLength={12}
                      maxLength={72}
                      required
                      disabled={loading}
                      className="w-full bg-transparent py-3 text-sm outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    HR must change this password after first login.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create HR Account
                    </>
                  )}
                </button>
              </form>
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <ShieldCheck size={24} className="mb-3 text-blue-600" />

                <h3 className="font-bold text-slate-900">
                  HR Account Permissions
                </h3>

                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>• Access HR dashboard</li>
                  <li>• Manage employee workflows</li>
                  <li>• Review attendance and leave</li>
                  <li>• Access authorized payroll features</li>
                </ul>
              </div>

              {createdHR && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={20} />
                    <h3 className="font-bold">Account Created</h3>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {createdHR.name}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
                    <span className="break-all text-xs text-slate-600">
                      {createdHR.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyEmail(createdHR.email)}
                      aria-label="Copy email"
                      className="text-slate-500 hover:text-blue-600"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-amber-700">
                    HR must change the temporary password after login.
                  </p>
                </div>
              )}
            </aside>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  HR Accounts
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {hrUsers.length} HR account(s) in your organization
                </p>
              </div>

              <button
                type="button"
                onClick={fetchHRUsers}
                disabled={listLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw size={16} className={listLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {listLoading ? (
              <div className="flex justify-center py-12">
                <LoaderCircle className="animate-spin text-blue-600" size={28} />
              </div>
            ) : hrUsers.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">
                  No HR accounts found
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Create your first HR account using the form above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">HR User</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {hrUsers.map((hr) => (
                      <tr key={hr.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-4 font-medium text-slate-800">
                          {hr.name}
                        </td>

                        <td className="px-3 py-4 text-slate-500">
                          {hr.email}
                        </td>

                        <td className="px-3 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            hr.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {hr.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {hr.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(hr)}
                              disabled={deactivatingId === hr.id}
                              className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deactivatingId === hr.id ? (
                                <LoaderCircle size={15} className="animate-spin" />
                              ) : (
                                <UserX size={15} />
                              )}
                              Deactivate
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Deactivated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default HRManagement;
