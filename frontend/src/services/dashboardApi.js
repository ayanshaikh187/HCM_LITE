// Placeholder service. The system starts empty (no dummy data), so these return zeros and empty lists.
// TODO: replace each body with an axios call, e.g. GET /dashboard/admin?from=&to=&dept=
export const getAdminDashboard = async () => ({
  headcount: 0, attritionYtd: 0, payrollCost: 0, avgSalary: 0, audit: [],
});

export const getHrDashboard = async () => ({
  headcount: 0, present: 0, onLeave: 0, lateToday: 0, pendingApprovals: 0,
  board: [], lateComers: [], leaveRequests: [], absenteeism: [],
});

export const getEmployeeDashboard = async () => ({
  hoursThisWeek: 0, lateCount: 0, leaveLeft: { annual: 14, sick: 8, casual: 10 }, payslips: [],
});

// TODO: POST /ai/summary with the current KPI JSON; POST /ai/chat for the assistant.
export const summarize = async () => { throw new Error("AI service is not connected yet"); };
export const askAssistant = async () => { throw new Error("AI service is not connected yet"); };
