import { Clock, AlarmClock, FileText } from "lucide-react";
import useAsync from "../../hooks/useAsync";
import { getEmployeeDashboard } from "../../services/dashboardApi";
import { Card, KpiCard, EmptyState, ErrorState } from "../../components/ui";
import CheckInWidget from "../../components/dashboard/CheckInWidget";
import AiChatWidget from "../../components/dashboard/AiChatWidget";

export default function EmployeeDashboard() {
  const { data, loading, error, reload } = useAsync(getEmployeeDashboard);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const d = data || { leaveLeft: {}, payslips: [] };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">My day</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        <CheckInWidget />
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-2">
          <KpiCard label="Hours this week (of 40)" value={d.hoursThisWeek} icon={Clock} loading={loading} />
          <KpiCard label="Late arrivals" value={d.lateCount} icon={AlarmClock} tone="amber" loading={loading} />
          <Card title="Leave left" className="sm:col-span-2">
            <dl className="grid grid-cols-3 text-center">
              {Object.entries(d.leaveLeft).map(([k, v]) => (
                <div key={k}><dt className="text-sm capitalize text-slate-500">{k}</dt><dd className="text-xl font-semibold text-slate-900">{v}</dd></div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Payslips">
          <EmptyState icon={FileText} title="No payslips yet" hint="Your payslip appears here once payroll is finalized." />
        </Card>
        <AiChatWidget />
      </div>
    </div>
  );
}
