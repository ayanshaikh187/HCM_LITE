import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LocateFixed } from "lucide-react";
import Field from "../components/ui/Field";
import { Card } from "../components/ui";
import { runSetup } from "../services/mockServer";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const split = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const init = { companyName: "", startTime: "09:00", graceMinutes: "15", halfDayHours: "5", weekend: ["Sat", "Sun"], lat: "", lng: "", radius: "150",
  departments: "", designations: "", adminName: "", adminEmail: "", password: "", confirm: "" };

function validate(f) {
  const e = {};
  if (!f.companyName.trim()) e.companyName = "Enter the company name.";
  if (!/^\d{2}:\d{2}$/.test(f.startTime)) e.startTime = "Enter the office start time.";
  if (f.graceMinutes === "" || f.graceMinutes < 0 || f.graceMinutes > 120) e.graceMinutes = "Enter 0 to 120 minutes.";
  if (!(f.halfDayHours > 0 && f.halfDayHours <= 12)) e.halfDayHours = "Enter hours between 1 and 12.";
  if (!f.weekend.length) e.weekend = "Pick at least one weekend day.";
  if (f.lat === "" || Math.abs(f.lat) > 90) e.lat = "Latitude must be between -90 and 90.";
  if (f.lng === "" || Math.abs(f.lng) > 180) e.lng = "Longitude must be between -180 and 180.";
  if (!(f.radius > 0)) e.radius = "Enter a radius in metres, greater than 0.";
  if (!split(f.departments).length) e.departments = "Add at least one department.";
  if (!split(f.designations).length) e.designations = "Add at least one designation.";
  if (!f.adminName.trim()) e.adminName = "Enter the Admin's name.";
  if (!/^\S+@\S+\.\S+$/.test(f.adminEmail)) e.adminEmail = "Enter a valid email address.";
  if (f.password.length < 8) e.password = "Use at least 8 characters.";
  if (f.confirm !== f.password) e.confirm = "Passwords don't match.";
  return e;
}

export default function Setup({ onDone }) {
  const nav = useNavigate();
  const [f, setF] = useState(init);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [fail, setFail] = useState("");
  const bind = (k) => ({ id: k, value: f[k], error: errors[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  const toggle = (d) => setF({ ...f, weekend: f.weekend.includes(d) ? f.weekend.filter((x) => x !== d) : [...f.weekend, d] });

  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("This browser can't share your location. Enter it manually.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setF((s) => ({ ...s, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) })); setGeoMsg(""); },
      () => setGeoMsg("Location permission was denied. Enter it manually."));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(f); setErrors(e); setFail("");
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await runSetup({
        settings: { companyName: f.companyName.trim(), startTime: f.startTime, graceMinutes: +f.graceMinutes, halfDayHours: +f.halfDayHours,
          weekend: f.weekend, office: { lat: +f.lat, lng: +f.lng, radius: +f.radius } },
        admin: { name: f.adminName.trim(), email: f.adminEmail, password: f.password },
        departments: split(f.departments), designations: split(f.designations),
      });
      await onDone(); nav("/login", { replace: true });
    } catch (err) { setFail(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Set up your company</h1>
      <p className="mb-5 text-sm text-slate-500">This runs once. You'll create the Admin account, then sign in.</p>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Card title="Company">
          <Field label="Company name" {...bind("companyName")} />
        </Card>
        <Card title="Attendance rules">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Office start time" type="time" {...bind("startTime")} />
            <Field label="Grace time (minutes)" type="number" min="0" {...bind("graceMinutes")} hint="Late after start time plus grace." />
            <Field label="Half day under (hours)" type="number" min="1" step="0.5" {...bind("halfDayHours")} />
          </div>
          <fieldset className="mt-4">
            <legend className="mb-1 text-sm font-medium text-slate-700">Weekend days</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <label key={d} className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${f.weekend.includes(d) ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-300 text-slate-600"}`}>
                  <input type="checkbox" className="sr-only" checked={f.weekend.includes(d)} onChange={() => toggle(d)} />{d}
                </label>))}
            </div>
            {errors.weekend && <p className="mt-1 text-sm text-rose-700">{errors.weekend}</p>}
          </fieldset>
        </Card>
        <Card title="Office location for camera check-in" action={
          <button type="button" onClick={locate} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline"><LocateFixed className="size-4" />Use my location</button>}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Latitude" type="number" step="any" {...bind("lat")} />
            <Field label="Longitude" type="number" step="any" {...bind("lng")} />
            <Field label="Radius (metres)" type="number" min="1" {...bind("radius")} hint="For example 150." />
          </div>
          {geoMsg && <p role="status" className="mt-2 text-sm text-slate-600">{geoMsg}</p>}
        </Card>
        <Card title="Departments and designations">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Departments" placeholder="Engineering, HR, Sales" {...bind("departments")} hint="Separate with commas. You can edit these later." />
            <Field label="Designations" placeholder="Manager, Developer" {...bind("designations")} hint="Separate with commas." />
          </div>
        </Card>
        <Card title="Admin account">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" {...bind("adminName")} />
            <Field label="Email" type="email" autoComplete="username" {...bind("adminEmail")} />
            <Field label="Password" type="password" autoComplete="new-password" {...bind("password")} />
            <Field label="Confirm password" type="password" autoComplete="new-password" {...bind("confirm")} />
          </div>
        </Card>
        {fail && <p role="alert" className="text-sm text-rose-700">{fail}</p>}
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />}Create company and Admin
        </button>
      </form>
    </div>
  );
}
