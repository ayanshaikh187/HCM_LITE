
import { useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api";

const initialForm = {
  name: "",
  email: "",
  temporaryPassword: "",
  employeeCode: "",
  phone: "",
  address: "",
  department: "",
  designation: "",
  joiningDate: "",
  basicSalary: "",
};

function EmployeeForm({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/employees", {
        ...form,
        basicSalary: Number(form.basicSalary),
      });

      onSuccess();
      onClose();
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      const firstFieldError = fieldErrors
        ? Object.values(fieldErrors).flat()[0]
        : null;

      setError(
        firstFieldError ||
          err.response?.data?.message ||
          "Employee register nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { name: "name", label: "Full Name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "temporaryPassword",
      label: "Temporary Password (minimum 12 characters)",
      type: "password",
      required: true,
    },
    { name: "employeeCode", label: "Employee Code", required: true },
    { name: "phone", label: "Phone" },
    { name: "department", label: "Department", required: true },
    { name: "designation", label: "Designation", required: true },
    {
      name: "joiningDate",
      label: "Joining Date",
      type: "date",
      required: true,
    },
    {
      name: "basicSalary",
      label: "Basic Salary",
      type: "number",
      required: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Register Employee
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the employee's details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.name}
                className="text-sm font-medium text-slate-700"
              >
                {field.label}

                <input
                  name={field.name}
                  type={field.type || "text"}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required || false}
                  min={field.name === "basicSalary" ? "0" : undefined}
                  step={field.name === "basicSalary" ? "0.01" : undefined}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Address
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                maxLength={300}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Registering..." : "Register Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeForm;
