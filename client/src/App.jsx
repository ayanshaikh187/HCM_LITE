
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Setup from "./pages/auth/Setup";
import SetupGuard from "./pages/auth/SetupGuard";
import ChangePassword from "./pages/auth/ChangePassword";

import AdminDashboard from "./pages/admin/adminDashboard";
import AuditLogs from "./pages/admin/AuditLogs";
import HRDashboard from "./pages/hr/HRDashboard";
import HRManagement from "./pages/admin/HRManagement";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import Employees from "./pages/admin/Employees";
import Attendance from "./pages/attendance/Attendance";
import LeaveManagement from "./pages/leave/LeaveManagement";
import Payroll from "./pages/payroll/payroll";
import Settings from "./pages/admin/Settings";
import Assistant from "./pages/ai/Assistant";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* First-time organization setup */}
        <Route
          path="/setup"
          element={
            <SetupGuard>
              <Setup />
            </SetupGuard>
          }
        />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={["Admin", "HR", "Employee"]}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hr-management"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <HRManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/payroll"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Payroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Assistant />
            </ProtectedRoute>
          }
        />

        {/* HR */}
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/leaves"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/payroll"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <Payroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <Assistant />
            </ProtectedRoute>
          }
        />

        {/* Employee */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <Attendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/leaves"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/payroll"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <Payroll />
            </ProtectedRoute>
          }
        />

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
