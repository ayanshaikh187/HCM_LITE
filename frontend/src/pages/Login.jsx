import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { login } from "../features/auth/authSlice";
import { loginRequest } from "../services/mockServer";
import Field from "../components/ui/Field";

export default function Login() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [fail, setFail] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Enter your password.";
    setErrors(e); setFail("");
    if (Object.keys(e).length) return;
    setBusy(true);
    try { dispatch(login(await loginRequest(form.email, form.password))); }
    catch (err) { setFail(err.message); setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} noValidate className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sign in to HCM Lite</h1>
          <p className="text-sm text-slate-500">Use the email and password your Admin or HR gave you.</p>
        </div>
        <Field id="email" label="Email" type="email" autoComplete="username" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {fail && <p role="alert" className="text-sm text-rose-700">{fail}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />}Sign in
        </button>
      </form>
    </div>
  );
}
