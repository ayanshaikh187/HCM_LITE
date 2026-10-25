import { Users, UserMinus, Wallet, Banknote, ScrollText, TrendingUp } from "lucide-react";
import useAsync from "../../hooks/useAsync";
import { getAdminDashboard } from "../../services/dashboardApi";
import { Card, KpiCard, EmptyState, ErrorState } from "../../components/ui";
import AiSummaryPanel from "../../components/dashboard/AiSummaryPanel";

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(getAdminDashboard);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const d = data || {};
  const money = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Company overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Headcount" value={d.headcount} icon={Users} loading={loading} />
        <KpiCard label="Attrition this year" value={`${d.attritionYtd}%`} icon={UserMinus} tone="rose" loading={loading} />
        <KpiCard label="Payroll cost" value={money(d.payrollCost)} icon={Wallet} tone="violet" loading={loading} />
        <KpiCard label="Average salary" value={money(d.avgSalary)} icon={Banknote} tone="amber" loading={loading} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Headcount and payroll by department" className="lg:col-span-2">
          <EmptyState icon={TrendingUp} title="No trend data yet" hint="Charts appear once employees are registered and a payroll run exists." />
        </Card>
        <AiSummaryPanel kpis={d} />
      </div>
      <Card title="Audit feed">
        {d.audit?.length ? null : <EmptyState icon={ScrollText} title="No activity recorded" hint="Creates, approvals and payroll finalizations are listed here." />}
      </Card>
    </div>
  );
}
