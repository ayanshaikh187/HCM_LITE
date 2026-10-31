
import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock3,
  Banknote,
  CalendarDays,
  AlertCircle,
  LockKeyhole,
  Users,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import api from "../../services/api";

// -------------------- CONSTANTS --------------------

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentDate = new Date();

const previousMonth = new Date(
  currentDate.getFullYear(),
  currentDate.getMonth() - 1,
  1
);

const initialYear = previousMonth.getFullYear();
const initialMonth = previousMonth.getMonth() + 1;

const yearOptions = [
  ...new Set([
    initialYear,
    ...Array.from(
      { length: 7 },
      (_, index) => currentDate.getFullYear() - index
    ),
  ]),
].sort((a, b) => b - a);

// -------------------- HELPERS --------------------

function money(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function monthLabel(year, month) {
  return `${MONTHS[Number(month) - 1] || "Unknown"} ${year}`;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

// -------------------- REUSABLE COMPONENTS --------------------

function StatusBadge({ status }) {
  const finalized = status === "Finalized";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        finalized
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200"
      }`}
    >
      {finalized ? (
        <CheckCircle2 size={14} />
      ) : (
        <Clock3 size={14} />
      )}

      {status || "Unknown"}
    </span>
  );
}

function SummaryCard({ title, value, icon: Icon, description, color }) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-xl p-3 ${
            colorStyles[color] || colorStyles.indigo
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ isEmployee }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FileText size={28} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        No payroll records found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {isEmployee
          ? "Abhi koi finalized payslip available nahi hai. Jab Admin payroll finalize karega, tumhari payslip yahan show hogi."
          : "Selected period aur status ke mutabiq koi record nahi mila. Filters change karo ya payroll generate karo."}
      </p>
    </div>
  );
}

// -------------------- MAIN PAGE --------------------

export default function Payroll() {
  const storedUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("hcm_user") || "{}");
    } catch {
      return {};
    }
  })();

  const role = storedUser.role;
  const isEmployee = role === "Employee";
  const canGenerate = role === "Admin";

  const [payrolls, setPayrolls] = useState([]);

  const [year, setYear] = useState(String(initialYear));
  const [month, setMonth] = useState(String(initialMonth));
  const [status, setStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [finalizingId, setFinalizingId] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // -------------------- FETCH PAYROLL --------------------

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (isEmployee) {
        const response = await api.get("/payroll/my-payslips");

        setPayrolls(
          response.data?.data?.payslips || []
        );
      } else {
        const params = {};

        if (year) params.year = year;
        if (month) params.month = month;
        if (status !== "All") params.status = status;

        const response = await api.get("/payroll", {
          params,
        });

        setPayrolls(
          response.data?.data?.payrolls || []
        );
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Payroll records load nahi ho sake."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [isEmployee, year, month, status]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // -------------------- GENERATE PAYROLL --------------------

  const handleGenerate = async () => {
    const selectedYear = Number(year);
    const selectedMonth = Number(month);

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 2100 ||
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      setError("Valid year aur month select karo.");
      return;
    }

    const period = monthLabel(
      selectedYear,
      selectedMonth
    );

    if (
      !window.confirm(
        `${period} ka payroll generate karna hai? Is month ka payroll dobara generate nahi ho sakega.`
      )
    ) {
      return;
    }

    setGenerating(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        "/payroll/generate",
        {
          year: selectedYear,
          month: selectedMonth,
        }
      );

      setNotice(
        response.data?.message ||
          `${period} ka payroll successfully generate ho gaya.`
      );

      await fetchPayroll();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Payroll generate nahi ho saka."
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  // -------------------- FINALIZE PAYSLIP --------------------

  const handleFinalize = async (payroll) => {
    if (payroll.status !== "Draft") return;

    const employeeName =
      payroll.employeeId?.userId?.name ||
      "this employee";

    const period = monthLabel(
      payroll.year,
      payroll.month
    );

    if (
      !window.confirm(
        `Kya ${employeeName} ki ${period} payslip finalize karni hai? Finalized record lock ho jayega.`
      )
    ) {
      return;
    }

    setFinalizingId(payroll._id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/payroll/${payroll._id}/finalize`
      );

      setNotice(
        response.data?.message ||
          "Payslip successfully finalized."
      );

      await fetchPayroll();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Payslip finalize nahi ho saki."
        )
      );
    } finally {
      setFinalizingId("");
    }
  };

  // -------------------- SUMMARY CALCULATIONS --------------------

  const totalNetSalary = payrolls.reduce(
    (sum, item) =>
      sum + (Number(item.netSalary) || 0),
    0
  );

  const finalizedCount = payrolls.filter(
    (item) => item.status === "Finalized"
  ).length;

  const draftCount = payrolls.filter(
    (item) => item.status === "Draft"
  ).length;

  const totalEmployees = new Set(
    payrolls.map((item) => item.employeeId?._id).filter(Boolean)
  ).size;

  const totalHRA = payrolls.reduce(
    (sum, item) => sum + (Number(item.hra) || 0),
    0
  );

  const totalMedical = payrolls.reduce(
    (sum, item) =>
      sum + (Number(item.medicalAllowance) || 0),
    0
  );

  const totalAbsenceDeduction = payrolls.reduce(
    (sum, item) =>
      sum + (Number(item.absenceDeduction) || 0),
    0
  );

  const totalUnpaidLeaveDeduction = payrolls.reduce(
    (sum, item) =>
      sum + (Number(item.unpaidLeaveDeduction) || 0),
    0
  );

  const pageTitle = isEmployee
    ? "My Payslips"
    : "Payroll Management";

  // -------------------- UI --------------------

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <Header />

        <div className="mx-auto mt-6 max-w-7xl space-y-6">

          {/* PAGE HEADING */}

          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
                <Wallet size={16} />
                Human Capital Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {pageTitle}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {isEmployee
                  ? "Apni finalized salary slips aur payment breakdown dekho."
                  : "Monthly salary records, deductions aur payslip status manage karo."}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPayroll}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </section>

          {/* ERROR MESSAGE */}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {notice && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p>{notice}</p>
            </div>
          )}

          {/* PAYROLL FILTERS */}

          {!isEmployee && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={CalendarDays}
                title="Payroll Period"
                description="Select a month and year to view payroll records."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <label className="block text-sm font-medium text-slate-700">
                  Year

                  <select
                    value={year}
                    onChange={(event) =>
                      setYear(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {yearOptions.map((itemYear) => (
                      <option
                        key={itemYear}
                        value={itemYear}
                      >
                        {itemYear}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Month

                  <select
                    value={month}
                    onChange={(event) =>
                      setMonth(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {MONTHS.map((name, index) => (
                      <option
                        key={name}
                        value={index + 1}
                      >
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Status

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="All">All statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Finalized">Finalized</option>
                  </select>
                </label>

                {canGenerate ? (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Wallet size={17} />

                      {generating
                        ? "Generating..."
                        : "Generate Payroll"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <div className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      <LockKeyhole size={15} />
                      Payroll generation is Admin-only.
                    </div>
                  </div>
                )}
              </div>

              {canGenerate && (
                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0"
                  />

                  Sirf completed month ka payroll generate
                  ho sakta hai. Duplicate payroll backend
                  par blocked hona chahiye.
                </p>
              )}
            </section>
          )}

          {/* SUMMARY CARDS */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

            <SummaryCard
              title={
                isEmployee
                  ? "Payslips Available"
                  : "Payroll Records"
              }
              value={payrolls.length}
              icon={FileText}
              color="indigo"
              description={
                isEmployee
                  ? "Finalized payslips"
                  : "Current selected filters ke mutabiq"
              }
            />

            <SummaryCard
              title="Total Net Salary"
              value={money(totalNetSalary)}
              icon={Banknote}
              color="emerald"
              description="Listed payroll records ka total"
            />

            <SummaryCard
              title={
                isEmployee
                  ? "Finalized Payslips"
                  : "Draft Payrolls"
              }
              value={
                isEmployee ? finalizedCount : draftCount
              }
              icon={
                isEmployee ? CheckCircle2 : Clock3
              }
              color="amber"
              description={
                isEmployee
                  ? "Available for employee viewing"
                  : `${finalizedCount} finalized records`
              }
            />
          </section>

          {/* PAYROLL RECORDS TABLE */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {isEmployee
                    ? "Salary History"
                    : "Payroll Records"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {isEmployee
                    ? "Sirf finalized payslips yahan show hoti hain."
                    : "Employee-wise salary records aur payslip status."}
                </p>
              </div>

              <div className="flex w-fit items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                <Users size={14} />
                {payrolls.length} record(s)
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-sm text-slate-500">
                <RefreshCw
                  size={24}
                  className="animate-spin text-indigo-600"
                />

                Payroll records load ho rahe hain...
              </div>
            ) : payrolls.length === 0 ? (
              <EmptyState isEmployee={isEmployee} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {!isEmployee && (
                        <th className="px-5 py-4 font-semibold">
                          Employee
                        </th>
                      )}

                      <th className="px-5 py-4 font-semibold">
                        Period
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Basic Salary
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Gross Salary
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Deductions
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Net Salary
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                      {!isEmployee && (
                        <th className="px-5 py-4 font-semibold">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {payrolls.map((payroll) => {
                      const employee = payroll.employeeId;

                      const employeeName =
                        employee?.userId?.name || "Employee";

                      const employeeCode =
                        employee?.employeeCode || "—";

                      return (
                        <tr
                          key={payroll._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          {!isEmployee && (
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">
                                {employeeName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {employeeCode}
                              </p>
                            </td>
                          )}

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                            {monthLabel(
                              payroll.year,
                              payroll.month
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                            {money(payroll.basicSalary)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                            {money(payroll.grossSalary)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-rose-600">
                            {money(payroll.totalDeductions)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                            {money(payroll.netSalary)}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={payroll.status}
                            />
                          </td>

                          {!isEmployee && (
                            <td className="px-5 py-4">
                              {canGenerate &&
                              payroll.status === "Draft" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleFinalize(payroll)
                                  }
                                  disabled={
                                    finalizingId === payroll._id
                                  }
                                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <LockKeyhole size={14} />

                                  {finalizingId === payroll._id
                                    ? "Finalizing..."
                                    : "Finalize"}
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                  <LockKeyhole size={13} />

                                  {payroll.status === "Finalized"
                                    ? "Locked"
                                    : "View only"}
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

          {/* SALARY BREAKDOWN */}

          {payrolls.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={Banknote}
                title="Salary Breakdown"
                description="Combined allowances and deductions for the listed records."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    HRA Allowance
                  </p>

                  <p className="mt-2 break-words text-lg font-bold text-slate-900">
                    {money(totalHRA)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Medical Allowance
                  </p>

                  <p className="mt-2 break-words text-lg font-bold text-slate-900">
                    {money(totalMedical)}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Absence Deductions
                  </p>

                  <p className="mt-2 break-words text-lg font-bold text-rose-600">
                    {money(totalAbsenceDeduction)}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Unpaid Leave Deductions
                  </p>

                  <p className="mt-2 break-words text-lg font-bold text-rose-600">
                    {money(totalUnpaidLeaveDeduction)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Generated payroll records ke amounts backend
                calculations se aate hain. Tax deduction abhi
                configured nahi hai, is liye production use se
                pehle applicable tax rules verify karna zaroori hai.
              </p>
            </section>
          )}

          {/* PAYROLL NOTICE */}

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p className="leading-6">
              Payroll calculations attendance, approved leave
              aur organization ke working days par depend karti
              hain. Finalize karne se pehle records verify karo.
              Finalized payroll ko backend dobara finalize karne
              se rokta hai.
            </p>
          </div>

          {isEmployee && payrolls.length > 0 && (
            <p className="text-xs leading-5 text-slate-500">
              Payslips are read-only. HR ya Admin se contact
              karo agar salary record mein koi discrepancy ho.
            </p>
          )}

        </div>
      </main>
    </div>
  );
}
