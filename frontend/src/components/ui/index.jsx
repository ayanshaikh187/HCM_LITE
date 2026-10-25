import { Inbox } from "lucide-react";

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />
);

export const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
    {(title || action) && (
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
    )}
    {children}
  </section>
);

const TONES = {
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  blue: "bg-sky-50 text-sky-700",
};

export function KpiCard({ label, value, icon: Icon, tone = "teal", loading }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <span className={`grid size-10 shrink-0 place-items-center rounded-md ${TONES[tone]}`}>
        {Icon && <Icon className="size-5" aria-hidden="true" />}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-1 h-6 w-16" /> : <p className="text-2xl font-semibold text-slate-900">{value}</p>}
      </div>
    </div>
  );
}

const STATUS = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  error: "bg-rose-50 text-rose-700 ring-rose-600/20",
  present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  late: "bg-amber-50 text-amber-800 ring-amber-600/20",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20",
  half_day: "bg-orange-50 text-orange-700 ring-orange-600/20",
  missing_checkout: "bg-orange-50 text-orange-700 ring-orange-600/20",
  absent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  on_leave: "bg-sky-50 text-sky-700 ring-sky-600/20",
  draft: "bg-slate-100 text-slate-700 ring-slate-500/20",
  finalized: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS[status] || STATUS.draft}`}>
    {status.replace(/_/g, " ")}
  </span>
);

export const EmptyState = ({ icon: Icon = Inbox, title, hint }) => (
  <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
    <Icon className="size-8 text-slate-300" aria-hidden="true" />
    <p className="text-sm font-medium text-slate-700">{title}</p>
    {hint && <p className="max-w-xs text-sm text-slate-500">{hint}</p>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
    {message}{" "}
    {onRetry && <button onClick={onRetry} className="font-medium underline">Try again</button>}
  </div>
);
