import { Users, UserCheck, CalendarOff, Clock, ClipboardList } from "lucide-react";
import useAsync from "../../hooks/useAsync";
import { getHrDashboard } from "../../services/dashboardApi";
import { Card, KpiCard, EmptyState, ErrorState } from "../../components/ui";
import AiSummaryPanel from "../../components/dashboard/AiSummaryPanel";

export default function HRDashboard() {
  const { data, loading, error, reload } = useAsync(getHrDashboard);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const d = data || {};

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">People today</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Headcount" value={d.headcount} icon={Users} loading={loading} />
        <KpiCard label="Present" value={d.present} icon={UserCheck} loading={loading} />
        <KpiCard label="On leave" value={d.onLeave} icon={CalendarOff} tone="blue" loading={loading} />
        <KpiCard label="Late today" value={d.lateToday} icon={Clock} tone="amber" loading={loading} />
        <KpiCard label="Pending approvals" value={d.pendingApprovals} icon={ClipboardList} tone="violet" loading={loading} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Daily attendance board" className="lg:col-span-2">
          <EmptyState title="No check-ins yet today" hint="Employees appear here with their status as they check in." />
        </Card>
        <AiSummaryPanel kpis={d} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Top late-comers"><EmptyState title="No late arrivals" /></Card>
        <Card title="Leave requests"><EmptyState title="Nothing to approve" hint="New requests land here for your decision." /></Card>
        <Card title="Absenteeism by department"><EmptyState title="No absences recorded" /></Card>
      </div>
    </div>
  );
}
