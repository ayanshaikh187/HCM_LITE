import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Search, UserPlus, Upload, Download, ChevronLeft, ChevronRight, Users } from "lucide-react";
import useAsync from "../hooks/useAsync";
import { listEmployees, listOrg, exportEmployees } from "../services/mockServer";
import { Card, EmptyState, ErrorState, Skeleton } from "../components/ui";
import RegisterEmployeeModal from "../components/employees/RegisterEmployeeModal";
import EmployeeProfileModal from "../components/employees/EmployeeProfileModal";
import CsvImportModal from "../components/employees/CsvImportModal";
import { toCsv, download } from "../utils/csv";

const sel = "rounded-md border border-slate-300 px-3 py-2 text-sm";

export default function Employees() {
  const isHr = useSelector((s) => s.auth.user.role) === "hr";
  const [q, setQ] = useState(""); const [dq, setDq] = useState("");
  const [dept, setDept] = useState(""); const [desig, setDesig] = useState(""); const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // "register" | "import" | employee id
  const org = useAsync(listOrg).data || { departments: [], designations: [] };

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const fetcher = useCallback(() => listEmployees({ page, q: dq, dept, desig }), [page, dq, dept, desig]);
  const { data, loading, error, reload } = useAsync(fetcher);

  const exportAll = async () => {
    const all = await exportEmployees();
    download("employees.csv", toCsv([["code", "name", "email", "department", "designation", "joinDate", "salary"],
      ...all.map((e) => [e.code, e.name, e.email, e.department, e.designation, e.joinDate, e.basic])]));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
        {isHr && (
          <div className="flex flex-wrap gap-2">
            <button onClick={exportAll} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"><Download className="size-4" />Export CSV</button>
            <button onClick={() => setModal("import")} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"><Upload className="size-4" />Import CSV</button>
            <button onClick={() => setModal("register")} className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"><UserPlus className="size-4" />Register employee</button>
          </div>)}
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search employees" placeholder="Search by name, code or email" className={`${sel} w-full pl-9`} />
          </div>
          <select aria-label="Department" value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} className={sel}>
            <option value="">All departments</option>{org.departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select aria-label="Designation" value={desig} onChange={(e) => { setDesig(e.target.value); setPage(1); }} className={sel}>
            <option value="">All designations</option>{org.designations.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        {error ? <ErrorState message={error} onRetry={reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>{["Code", "Name", "Department", "Designation", "Joined", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading && !data && Array.from({ length: 5 }, (_, i) => <tr key={i}><td colSpan={6} className="p-2"><Skeleton className="h-8 w-full" /></td></tr>)}
                {data?.items.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-medium">{e.code}</td>
                    <td className="px-3 py-2">{e.name}<span className="block text-xs text-slate-500">{e.email}</span></td>
                    <td className="px-3 py-2">{e.department}</td><td className="px-3 py-2">{e.designation}</td><td className="px-3 py-2">{e.joinDate}</td>
                    <td className="px-3 py-2 text-right"><button onClick={() => setModal(e.id)} className="font-medium text-teal-700 hover:underline">View 360</button></td>
                  </tr>))}
              </tbody>
            </table>
            {data?.items.length === 0 && (
              <EmptyState icon={Users} title={data.total === 0 && !dq && !dept && !desig ? "No employees yet" : "No employees match"}
                hint={isHr && !dq && !dept && !desig ? "Register your first employee or import a CSV." : "Try a different search or filter."} />)}
          </div>)}

        {data && data.total > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Page {data.page} of {data.pages} · {data.total} employees</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page" className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} aria-label="Next page" className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"><ChevronRight className="size-4" /></button>
            </div>
          </div>)}
      </Card>

      {modal === "register" && <RegisterEmployeeModal org={org} onClose={() => setModal(null)} onDone={reload} />}
      {modal === "import" && <CsvImportModal onClose={() => setModal(null)} onDone={reload} />}
      {modal && modal !== "register" && modal !== "import" && <EmployeeProfileModal id={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
