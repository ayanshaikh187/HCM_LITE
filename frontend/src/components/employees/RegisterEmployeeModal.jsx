import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import Modal from "../ui/Modal";
import Field from "../ui/Field";
import { createEmployee } from "../../services/mockServer";

export default function RegisterEmployeeModal({ org, onClose, onDone }) {
  const [f, setF] = useState({ code: "", name: "", email: "", department: "", designation: "", joinDate: "", salary: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const b = (k, extra = {}) => ({ id: k, value: f[k], error: errors[k], onChange: (e) => setF({ ...f, [k]: e.target.value }), ...extra });

  const submit = async (ev) => {
    ev.preventDefault(); setBusy(true); setErrors({});
    try { setCreated(await createEmployee(f)); onDone(); }
    catch (err) { setErrors(err.fields || { form: err.message }); }
    finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(created.tempPassword); setCopied(true); } catch { /* clipboard blocked */ } };

  if (created) return (
    <Modal title="Employee registered" onClose={onClose}>
      <p className="text-sm text-slate-700">{created.emp.name}'s login is ready. Share these details now. The password is shown only once, and they must change it at first sign-in.</p>
      <dl className="my-4 space-y-2 rounded-md bg-slate-50 p-3 text-sm">
        <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{created.emp.email}</dd></div>
        <div><dt className="text-slate-500">Temporary password</dt>
          <dd className="flex items-center gap-2 font-mono font-medium">{created.tempPassword}
            <button onClick={copy} aria-label="Copy password" className="text-slate-500 hover:text-slate-800">{copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}</button></dd></div>
      </dl>
      <button onClick={onClose} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Done</button>
    </Modal>);

  return (
    <Modal title="Register employee" onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Employee code" {...b("code")} />
        <Field label="Full name" {...b("name")} />
        <Field label="Email" type="email" {...b("email")} />
        <Field label="Joining date" type="date" {...b("joinDate")} />
        <Field label="Department" options={org.departments} {...b("department")} />
        <Field label="Designation" options={org.designations} {...b("designation")} />
        <Field label="Basic salary (PKR per month)" type="number" min="1" {...b("salary", { hint: "Gross is 1.5 × basic." })} />
        <p className="self-end text-sm text-slate-500">A temporary password is generated when you save.</p>
        {errors.form && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{errors.form}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" />}Register employee</button>
        </div>
      </form>
    </Modal>
  );
}
