
import { useCallback, useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Clock,
  MapPin,
  CalendarDays,
  Palmtree,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import api from "../../services/api";

const WEEKDAYS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const DEFAULT_SETTINGS = {
  name: "",
  timezone: "Asia/Karachi",
  officeStart: "09:00",
  graceMinutes: 15,
  halfDayUnderHours: 5,
  weekendDays: [0, 6],
  officeLocation: {
    latitude: null,
    longitude: null,
    radiusMeters: 150,
  },
  leaveTypes: [
    { name: "Annual", yearlyQuota: 14 },
    { name: "Sick", yearlyQuota: 8 },
    { name: "Casual", yearlyQuota: 10 },
    { name: "Unpaid", yearlyQuota: null },
  ],
  holidays: [],
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
}

function Section({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      {children}

      {hint && (
        <span className="mt-1 block text-xs text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [holidayForm, setHolidayForm] = useState({
    date: "",
    name: "",
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await api.get("/setup/settings");
      const data = response.data?.data?.settings;

      if (!data) {
        throw new Error("Settings response mein data nahi mila.");
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
        officeLocation: {
          ...DEFAULT_SETTINGS.officeLocation,
          ...data.officeLocation,
        },
        leaveTypes: data.leaveTypes || DEFAULT_SETTINGS.leaveTypes,
        holidays: (data.holidays || []).map((holiday) => ({
          ...holiday,
          date: holiday.date
            ? new Date(holiday.date).toISOString().slice(0, 10)
            : "",
        })),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function updateField(field, value) {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateLocation(field, value) {
    setSettings((previous) => ({
      ...previous,
      officeLocation: {
        ...previous.officeLocation,
        [field]: value,
      },
    }));
  }

  function updateLeaveQuota(index, value) {
    setSettings((previous) => ({
      ...previous,
      leaveTypes: previous.leaveTypes.map((leave, i) =>
        i === index
          ? {
              ...leave,
              yearlyQuota:
                leave.name === "Unpaid"
                  ? null
                  : value === ""
                    ? ""
                    : Number(value),
            }
          : leave
      ),
    }));
  }

  function toggleWeekend(day) {
    setSettings((previous) => {
      const exists = previous.weekendDays.includes(day);

      return {
        ...previous,
        weekendDays: exists
          ? previous.weekendDays.filter((item) => item !== day)
          : [...previous.weekendDays, day].sort((a, b) => a - b),
      };
    });
  }

  function addHoliday() {
    if (!holidayForm.date || !holidayForm.name.trim()) {
      setError("Holiday ki date aur name dono enter karo.");
      return;
    }

    const duplicate = settings.holidays.some(
      (holiday) => holiday.date === holidayForm.date
    );

    if (duplicate) {
      setError("Is date ka holiday already added hai.");
      return;
    }

    setSettings((previous) => ({
      ...previous,
      holidays: [
        ...previous.holidays,
        {
          date: holidayForm.date,
          name: holidayForm.name.trim(),
        },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));

    setHolidayForm({ date: "", name: "" });
    setError("");
  }

  function removeHoliday(index) {
    setSettings((previous) => ({
      ...previous,
      holidays: previous.holidays.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setError("");
    setNotice("");

    if (settings.name.trim().length < 2) {
      setError("Company name kam az kam 2 characters ka hona chahiye.");
      return;
    }

    if (
      settings.officeLocation.latitude !== null &&
      settings.officeLocation.longitude === null
    ) {
      setError("Latitude ke saath longitude bhi enter karo.");
      return;
    }

    if (
      settings.officeLocation.longitude !== null &&
      settings.officeLocation.latitude === null
    ) {
      setError("Longitude ke saath latitude bhi enter karo.");
      return;
    }

    if (
      settings.leaveTypes.some(
        (leave) =>
          leave.name !== "Unpaid" &&
          (leave.yearlyQuota === "" ||
            !Number.isFinite(Number(leave.yearlyQuota)) ||
            Number(leave.yearlyQuota) < 0)
      )
    ) {
      setError("Leave quotas valid numbers hone chahiye.");
      return;
    }

    const payload = {
      name: settings.name.trim(),
      timezone: settings.timezone,
      officeStart: settings.officeStart,
      graceMinutes: Number(settings.graceMinutes),
      halfDayUnderHours: Number(settings.halfDayUnderHours),
      weekendDays: settings.weekendDays,
      officeLocation: {
        latitude:
          settings.officeLocation.latitude === "" ||
          settings.officeLocation.latitude === null
            ? null
            : Number(settings.officeLocation.latitude),
        longitude:
          settings.officeLocation.longitude === "" ||
          settings.officeLocation.longitude === null
            ? null
            : Number(settings.officeLocation.longitude),
        radiusMeters: Number(settings.officeLocation.radiusMeters),
      },
      leaveTypes: settings.leaveTypes.map((leave) => ({
        name: leave.name,
        yearlyQuota:
          leave.name === "Unpaid"
            ? null
            : Number(leave.yearlyQuota),
      })),
      holidays: settings.holidays.map((holiday) => ({
        date: holiday.date,
        name: holiday.name,
      })),
    };

    setSaving(true);

    try {
      const response = await api.patch("/setup/settings", payload);

      setNotice(
        response.data?.message ||
          "Organization settings successfully update ho gayi hain."
      );

      await fetchSettings();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <RefreshCw className="animate-spin" size={19} />
          Organization settings load ho rahi hain...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <Header />

        <div className="px-6 pb-8 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  Human Capital Management
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Organization Settings
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Company, attendance, leave aur holiday configurations manage karo.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchSettings}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {notice && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
              >
                <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                {notice}
              </div>
            )}

            <Section
              title="Company Information"
              description="Basic organization details aur timezone."
              icon={Building2}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company Name">
                  <input
                    value={settings.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass}
                    maxLength={120}
                  />
                </Field>

                <Field label="Timezone" hint="Example: Asia/Karachi">
                  <input
                    value={settings.timezone}
                    onChange={(e) => updateField("timezone", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Attendance Configuration"
              description="Office timing aur attendance calculation rules."
              icon={Clock}
            >
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Office Start Time">
                  <input
                    type="time"
                    value={settings.officeStart}
                    onChange={(e) => updateField("officeStart", e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Grace Period (Minutes)">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={settings.graceMinutes}
                    onChange={(e) =>
                      updateField("graceMinutes", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Half-Day Threshold (Hours)">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={settings.halfDayUnderHours}
                    onChange={(e) =>
                      updateField("halfDayUnderHours", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Weekend Days
                </h3>

                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const selected = settings.weekendDays.includes(day.value);

                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => toggleWeekend(day.value)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            <Section
              title="Office Location"
              description="Optional location coordinates for attendance geofencing."
              icon={MapPin}
            >
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Latitude">
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={settings.officeLocation.latitude ?? ""}
                    onChange={(e) =>
                      updateLocation(
                        "latitude",
                        e.target.value === "" ? null : e.target.value
                      )
                    }
                    placeholder="e.g. 24.8607"
                    className={inputClass}
                  />
                </Field>

                <Field label="Longitude">
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={settings.officeLocation.longitude ?? ""}
                    onChange={(e) =>
                      updateLocation(
                        "longitude",
                        e.target.value === "" ? null : e.target.value
                      )
                    }
                    placeholder="e.g. 67.0011"
                    className={inputClass}
                  />
                </Field>

                <Field label="Radius (Meters)">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={settings.officeLocation.radiusMeters}
                    onChange={(e) =>
                      updateLocation("radiusMeters", e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Coordinates optional hain. Agar location configure nahi karni
                to latitude aur longitude blank chhor sakte ho.
              </p>
            </Section>

            <Section
              title="Leave Types & Quotas"
              description="Har leave type ki yearly allowance configure karo."
              icon={Palmtree}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {settings.leaveTypes.map((leave, index) => (
                  <Field
                    key={leave.name}
                    label={`${leave.name} Leave`}
                    hint={
                      leave.name === "Unpaid"
                        ? "Unpaid leave ki fixed yearly quota nahi hoti."
                        : "Allowed days per year."
                    }
                  >
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={leave.name === "Unpaid"}
                      value={leave.yearlyQuota ?? ""}
                      onChange={(e) => updateLeaveQuota(index, e.target.value)}
                      className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
                    />
                  </Field>
                ))}
              </div>
            </Section>

            <Section
              title="Public Holidays"
              description="Organization holidays add aur manage karo."
              icon={CalendarDays}
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field label="Holiday Date">
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) =>
                      setHolidayForm((previous) => ({
                        ...previous,
                        date: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Holiday Name">
                  <input
                    value={holidayForm.name}
                    onChange={(e) =>
                      setHolidayForm((previous) => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Independence Day"
                    className={inputClass}
                  />
                </Field>

                <button
                  type="button"
                  onClick={addHoliday}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus size={17} />
                  Add Holiday
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {settings.holidays.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Abhi koi holiday add nahi hai.
                  </div>
                ) : (
                  settings.holidays.map((holiday, index) => (
                    <div
                      key={`${holiday.date}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {holiday.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {holiday.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeHoliday(index)}
                        aria-label={`Remove ${holiday.name}`}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fetchSettings}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Discard Changes
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">
              HCM Lite · Organization Configuration
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
