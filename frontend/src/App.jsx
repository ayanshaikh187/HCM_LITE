import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Employees from "./pages/Employees";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import HRDashboard from "./pages/dashboards/HRDashboard";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import { EmptyState } from "./components/ui";
import useAsync from "./hooks/useAsync";
import { getSetupStatus } from "./services/mockServer";
import { NAV } from "./config/nav";

const DASHBOARDS = { admin: AdminDashboard, hr: HRDashboard, employee: EmployeeDashboard };
const useRole = () => useSelector((s) => s.auth.user?.role);

function RoleDashboard() { const Page = DASHBOARDS[useRole()]; return <Page />; }
function RoleGate({ roles, children }) {
  return roles.includes(useRole()) ? children : <EmptyState title="You don't have access to this page" hint="Use the menu to go back to your pages." />;
}
function ModulePlaceholder() {
  const role = useRole(); const { pathname } = useLocation();
  const item = NAV[role].find((n) => pathname.startsWith(n.to));
  return item
    ? <EmptyState icon={item.icon} title={`${item.label} is coming next`} hint="This screen is built in a later step." />
    : <EmptyState title="You don't have access to this page" hint="Use the menu to go back to your pages." />;
}

export default function App() {
  const user = useSelector((s) => s.auth.user);
  const { data: configured, loading, reload } = useAsync(getSetupStatus);
  if (loading && configured === null) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-teal-600" aria-label="Loading" /></div>;

  return (
    <Routes>
      <Route path="/setup" element={configured ? <Navigate to="/login" replace /> : <Setup onDone={reload} />} />
      <Route path="/login" element={configured ? <Login /> : <Navigate to="/setup" replace />} />
      <Route element={!configured ? <Navigate to="/setup" replace /> : user ? <AppShell /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RoleDashboard />} />
        <Route path="/employees" element={<RoleGate roles={["admin", "hr"]}><Employees /></RoleGate>} />
        <Route path="*" element={<ModulePlaceholder />} />
      </Route>
    </Routes>
  );
}
