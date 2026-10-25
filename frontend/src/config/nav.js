import { LayoutDashboard, Users, CalendarCheck, CalendarOff, Wallet, Megaphone, ScrollText, Settings } from "lucide-react";

const dash = { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard };
const news = { to: "/announcements", label: "Announcements", icon: Megaphone };

export const ROLE_LABEL = { admin: "Admin", hr: "HR", employee: "Employee" };

export const NAV = {
  admin: [
    dash,
    { to: "/employees", label: "Employees", icon: Users },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/leave", label: "Leave", icon: CalendarOff },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    news,
    { to: "/audit", label: "Audit log", icon: ScrollText },
    { to: "/settings", label: "Company setup", icon: Settings },
  ],
  hr: [
    dash,
    { to: "/employees", label: "Employees", icon: Users },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/leave", label: "Leave requests", icon: CalendarOff },
    { to: "/payroll", label: "Payroll", icon: Wallet },
    news,
  ],
  employee: [
    dash,
    { to: "/attendance", label: "My attendance", icon: CalendarCheck },
    { to: "/leave", label: "My leave", icon: CalendarOff },
    { to: "/payroll", label: "My payslips", icon: Wallet },
    news,
  ],
};
