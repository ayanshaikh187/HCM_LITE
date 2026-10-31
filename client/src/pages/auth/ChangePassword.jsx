
import { useState } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 12) {
      setError("New password must contain at least 12 characters.");
      return;
    }

    if (newPassword.length > 72) {
      setError("New password cannot exceed 72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setSuccess(
        response.data?.message ||
          response.data?.data?.message ||
          "Password changed successfully. Please log in again."
      );

      sessionStorage.removeItem("hcm_access_token");
      sessionStorage.removeItem("hcm_user");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordInput = (
    label,
    name,
    value,
    setter,
    visible,
    toggle,
    autoComplete
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
        <LockKeyhole size={19} className="text-slate-400" />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => setter(event.target.value)}
          autoComplete={autoComplete}
          required
          maxLength={72}
          className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none"
        />

        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-slate-400 hover:text-slate-700"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <ShieldCheck size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Change Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a new password to continue using HCM Lite.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {passwordInput(
            "Current Password",
            "current",
            currentPassword,
            setCurrentPassword,
            showPasswords.current,
            () =>
              setShowPasswords((previous) => ({
                ...previous,
                current: !previous.current,
              })),
            "current-password"
          )}

          {passwordInput(
            "New Password",
            "new",
            newPassword,
            setNewPassword,
            showPasswords.new,
            () =>
              setShowPasswords((previous) => ({
                ...previous,
                new: !previous.new,
              })),
            "new-password"
          )}

          {passwordInput(
            "Confirm New Password",
            "confirm",
            confirmPassword,
            setConfirmPassword,
            showPasswords.confirm,
            () =>
              setShowPasswords((previous) => ({
                ...previous,
                confirm: !previous.confirm,
              })),
            "new-password"
          )}

          <p className="text-xs text-slate-500">
            Your new password must contain at least 12 characters and
            must be different from your current password.
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(success)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={19} className="animate-spin" />}
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePassword;
