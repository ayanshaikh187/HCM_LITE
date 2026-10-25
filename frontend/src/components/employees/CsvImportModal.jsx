import { useState } from "react";
import { Loader2, FileCheck2, Download } from "lucide-react";
import Modal from "../ui/Modal";
import { StatusBadge } from "../ui";
import { parseCsv, toCsv, download } from "../../utils/csv";
import { dryRunCsv, importCsv } from "../../services/mockServer";

const REQUIRED = ["code", "name", "email", "department", "designation", "joinDate", "salary"];
const btn = "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50";

export default function CsvImportModal({ onClose, onDone }) {
  const [records, setRecords] = useState([]);
  const [err, setErr] = useState("");
  const [dry, setDry] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const pick = async (e) => {
    const file = e.target.files[0];
    setDry(null); setErr(""); setRecords([]);
    if (!file) return;
    const { headers, records: rows } = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
    const missing = REQUIRED.filter((h) => !headers.includes(h));
    if (missing.length) return setErr(`Missing columns: ${missing.join(", ")}.`);
    if (!rows.length) return setErr("The file has no data rows.");
    setRecords(rows);
  };
  const run = async (fn, set) => { setBusy(true); setErr(""); try { set(await fn(records)); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  const failedRows = dry ? new Set(dry.results.filter((r) => r.status === "error").map((r) => r.row)).size : 0;

  if (done) return (
    <Modal title="Import complete" onClose={onClose}>
      <p className="flex items-center gap-2 text-sm text-slate-700"><FileCheck2 className="size-5 text-emerald-600" />{done.count} employees imported with temporary passwords.</p>
      <p className="mt-2 text-sm text-slate-500">Download the logins now. The passwords aren't shown again.</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => download("new-employee-logins.csv", toCsv([["code", "email", "tempPassword"], ...done.credentials.map((c) => [c.code, c.email, c.tempPassword])]))}
          className={`${btn} border border-slate-300`}><Download className="size-4" />Download logins</button>
        <button onClick={onClose} className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}>Done</button>
      </div>
    </Modal>);

  return (
    <Modal title="Import employees from CSV" onClose={onClose} wide>
      <p className="mb-3 text-sm text-slate-600">Columns: <code className="text-xs">{REQUIRED.join(", ")}</code>. Dates use YYYY-MM-DD, and salary is the monthly basic.</p>
      <input type="file" accept=".csv,text/csv" onChange={pick} aria-label="Choose CSV file" className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-2" />
      {err && <p role="alert" className="mt-3 text-sm text-rose-700">{err}</p>}
      {records.length > 0 && <p className="mt-3 text-sm text-slate-600">{records.length} rows ready to check.</p>}

      {dry && (
        <div className="mt-4">
          <p role="status" className={`mb-2 text-sm font-medium ${dry.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {dry.ok ? `Dry run passed. All ${records.length} rows can be imported.` : `${failedRows} of ${records.length} rows have errors. Fix the file and choose it again.`}</p>
          <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-slate-500"><tr>{["Row", "Status", "Field", "Reason"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>{dry.results.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">{r.row}</td><td className="px-3 py-1.5"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-1.5">{r.field || "-"}</td><td className="px-3 py-1.5">{r.reason}</td></tr>))}</tbody>
            </table>
          </div>
        </div>)}

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={`${btn} border border-slate-300`}>Cancel</button>
        <button disabled={!records.length || busy} onClick={() => run(dryRunCsv, setDry)} className={`${btn} border border-teal-600 text-teal-700`}>
          {busy && <Loader2 className="size-4 animate-spin" />}Run dry run</button>
        <button disabled={!dry?.ok || busy} onClick={() => run(importCsv, setDone)} className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}>Confirm and import</button>
      </div>
    </Modal>
  );
}
