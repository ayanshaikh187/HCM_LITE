import { Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import { ErrorState } from "../ui";
import useAsync from "../../hooks/useAsync";
import { getEmployee360 } from "../../services/mockServer";
import { useCallback } from "react";

const pkr = (n) => `PKR ${Number(n).toLocaleString()}`;
const Block = ({ title, children }) => (
  <section className="rounded-md border border-slate-200 p-3"><h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>{children}</section>);
const Row = ({ k, v }) => <div className="flex justify-between gap-3 py-0.5 text-sm"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-800">{v}</dd></div>;

export default function EmployeeProfileModal({ id, onClose }) {
  const { data: e, error, loading } = useAsync(useCallback(() => getEmployee360(id), [id]));
  return (
    <Modal title={e ? e.name : "Employee profile"} onClose={onClose} wide>
      {loading && !e && <Loader2 className="mx-auto my-8 size-6 animate-spin text-teal-600" aria-label="Loading" />}
      {error && <ErrorState message={error} />}
      {e && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Block title="Job details"><dl>
            <Row k="Code" v={e.code} /><Row k="Email" v={e.email} /><Row k="Department" v={e.department} />
            <Row k="Designation" v={e.designation} /><Row k="Joined" v={e.joinDate} /><Row k="Status" v={e.status} /></dl></Block>
          <Block title="Salary structure (monthly)"><dl>
            <Row k="Basic" v={pkr(e.salary.basic)} /><Row k="HRA (40%)" v={pkr(e.salary.hra)} />
            <Row k="Medical (10%)" v={pkr(e.salary.medical)} /><Row k="Gross" v={pkr(e.salary.gross)} /></dl></Block>
          <Block title="Attendance this month">
            <dl><Row k="Present" v={e.attendance.present} /><Row k="Late" v={e.attendance.late} /><Row k="Absent" v={e.attendance.absent} /><Row k="Half days" v={e.attendance.halfDay} /></dl>
            <p className="mt-1 text-xs text-slate-500">No attendance records yet.</p></Block>
          <Block title="Leave balance (days left)">
            <dl><Row k="Annual" v={`${e.leave.annual} of 14`} /><Row k="Sick" v={`${e.leave.sick} of 8`} /><Row k="Casual" v={`${e.leave.casual} of 10`} /></dl></Block>
        </div>)}
    </Modal>
  );
}
