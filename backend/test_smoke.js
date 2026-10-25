const BASE_URL = 'http://localhost:5000/api';

async function testEndpoint(title, method, url, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else if (contentType.includes('application/pdf')) {
      const buf = await res.arrayBuffer();
      data = `<PDF Binary Stream: ${buf.byteLength} bytes>`;
    } else {
      data = await res.text();
    }

    console.log(`\n========================================`);
    console.log(`TEST: ${title}`);
    console.log(`REQUEST: ${method} ${url}`);
    if (body) console.log(`PAYLOAD: ${JSON.stringify(body)}`);
    console.log(`STATUS: ${res.status} ${res.statusText}`);
    console.log(`RESPONSE: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
    return { status: res.status, data };
  } catch (err) {
    console.log(`\n========================================`);
    console.log(`TEST: ${title}`);
    console.log(`FAILED with exception: ${err.message}`);
    return { status: 0, error: err.message };
  }
}

async function runAllTests() {
  console.log('--- STARTING HCM LITE SMOKE & END-TO-END TESTS ---');

  // 1. Health Check
  await testEndpoint('Health Check', 'GET', `${BASE_URL}/health`);

  // 2. Setup Init (First-run)
  const setupRes = await testEndpoint('Init Setup (Company & Admin)', 'POST', `${BASE_URL}/setup/init`, {
    adminName: 'Super Admin',
    adminEmail: 'admin@company.com',
    adminPassword: 'Password123!',
    companyName: 'HCM Lite Tech'
  });

  // 3. Login Admin
  const loginAdminRes = await testEndpoint('Admin Login', 'POST', `${BASE_URL}/auth/login`, {
    email: 'admin@company.com',
    password: 'Password123!'
  });
  const adminToken = loginAdminRes.data?.token;

  if (!adminToken) {
    console.error('Cannot proceed without admin token!');
    return;
  }

  // 4. Create HR Employee
  const createHrRes = await testEndpoint('Create HR Employee (Admin)', 'POST', `${BASE_URL}/employees`, {
    name: 'Sarah HR',
    email: 'sarah.hr@company.com',
    password: 'Password123!',
    role: 'HR',
    department: 'People Operations',
    designation: 'HR Lead',
    basicSalary: 65000
  }, adminToken);

  // 5. Create Regular Employee
  const createEmpRes = await testEndpoint('Create Regular Employee (Admin)', 'POST', `${BASE_URL}/employees`, {
    name: 'John Developer',
    email: 'john.dev@company.com',
    password: 'Password123!',
    role: 'Employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    basicSalary: 45000
  }, adminToken);

  const empId = createEmpRes.data?._id || createEmpRes.data?.id;

  // 6. HR Login
  const loginHrRes = await testEndpoint('HR Login', 'POST', `${BASE_URL}/auth/login`, {
    email: 'sarah.hr@company.com',
    password: 'Password123!'
  });
  const hrToken = loginHrRes.data?.token;

  // 7. Employee Login
  const loginEmpRes = await testEndpoint('Employee Login', 'POST', `${BASE_URL}/auth/login`, {
    email: 'john.dev@company.com',
    password: 'Password123!'
  });
  const empToken = loginEmpRes.data?.token;

  // 8. Get Employees List
  await testEndpoint('Get Employees Directory (HR/Admin)', 'GET', `${BASE_URL}/employees`, null, hrToken);

  // 9. Employee Check-In
  await testEndpoint('Employee Check-In (/check-in)', 'POST', `${BASE_URL}/attendance/check-in`, {}, empToken);

  // 10. Employee Check-Out
  await testEndpoint('Employee Check-Out (/check-out)', 'POST', `${BASE_URL}/attendance/check-out`, {}, empToken);

  // 11. Get Daily Attendance
  await testEndpoint('Get Daily Attendance', 'GET', `${BASE_URL}/attendance`, null, empToken);

  // 12. Request Attendance Correction
  await testEndpoint('Submit Attendance Correction Request', 'POST', `${BASE_URL}/attendance/correction`, {
    date: '2026-10-25',
    reason: 'Forgot to swipe out when leaving at 6 PM'
  }, empToken);

  // 13. AI Smart Leave Parse
  const smartLeaveRes = await testEndpoint('AI Smart Leave Parsing', 'POST', `${BASE_URL}/ai/smart-leave`, {
    prompt: 'Need next Monday and Tuesday off for cousin wedding'
  }, empToken);

  // 14. Apply Leave
  const applyLeaveRes = await testEndpoint('Apply Leave Application', 'POST', `${BASE_URL}/leaves`, {
    leaveType: smartLeaveRes.data?.leaveType || 'Casual',
    startDate: smartLeaveRes.data?.startDate || '2026-10-26',
    endDate: smartLeaveRes.data?.endDate || '2026-10-27',
    reason: smartLeaveRes.data?.reason || 'Cousin wedding'
  }, empToken);

  const leaveId = applyLeaveRes.data?._id;

  // 15. Employee View Leaves
  await testEndpoint('Employee View Leaves', 'GET', `${BASE_URL}/leaves`, null, empToken);

  // 16. HR View Pending Leaves
  await testEndpoint('HR View Pending Leaves', 'GET', `${BASE_URL}/hr/leaves/pending`, null, hrToken);

  // 17. HR Approve Leave
  if (leaveId) {
    await testEndpoint('HR Approve Leave', 'PATCH', `${BASE_URL}/hr/leaves/${leaveId}`, {
      status: 'Approved'
    }, hrToken);
  }

  // 18. Generate Payroll Draft
  const currentMonth = '2026-10';
  const payrollGenRes = await testEndpoint('Generate Payroll Draft (Admin)', 'POST', `${BASE_URL}/payroll/generate`, {
    month: currentMonth
  }, adminToken);

  // 19. Get Payroll Records
  const getPayrollRes = await testEndpoint('Get Payroll Records', 'GET', `${BASE_URL}/payroll?month=${currentMonth}`, null, hrToken);
  const payrollRecordId = getPayrollRes.data?.records?.[0]?._id;

  // 20. Finalize Payroll
  await testEndpoint('Finalize Payroll (Admin Only)', 'POST', `${BASE_URL}/payroll/finalize`, {
    month: currentMonth
  }, adminToken);

  // 21. Download Payslip PDF
  if (payrollRecordId) {
    await testEndpoint('Download Payslip PDF (by record ID)', 'GET', `${BASE_URL}/payroll/payslip/${payrollRecordId}`, null, adminToken);
  }
  if (empId) {
    await testEndpoint('Download Payslip PDF (by employee ID & month)', 'GET', `${BASE_URL}/payroll/payslip/${empId}?month=${currentMonth}`, null, hrToken);
  }

  // 22. AI Policy Q&A
  await testEndpoint('AI Policy Q&A', 'POST', `${BASE_URL}/ai/policy-qa`, {
    question: 'What is the annual leave quota and work from home policy?'
  }, empToken);

  // 23. AI HR Chatbot
  await testEndpoint('AI HR Chatbot', 'POST', `${BASE_URL}/ai/chat`, {
    message: 'How many employees do we have and who is on leave today?'
  }, empToken);

  // 24. AI Attendance Summary (Bonus)
  await testEndpoint('AI Attendance Summary', 'POST', `${BASE_URL}/ai/attendance-summary`, {}, hrToken);

  // 25. Admin Metrics
  await testEndpoint('Admin Dashboard Metrics', 'GET', `${BASE_URL}/admin/metrics`, null, adminToken);

  // 26. Admin Audit Logs
  await testEndpoint('Admin Audit Logs', 'GET', `${BASE_URL}/admin/audit-logs`, null, adminToken);

  // 27. HR Metrics
  await testEndpoint('HR Dashboard Metrics', 'GET', `${BASE_URL}/hr/metrics`, null, hrToken);

  // 28. Employee Metrics
  await testEndpoint('Employee Dashboard Metrics', 'GET', `${BASE_URL}/employee/metrics`, null, empToken);

  // 29. Post Announcement
  await testEndpoint('Post Company Announcement (HR/Admin)', 'POST', `${BASE_URL}/comms/announcements`, {
    title: 'All-hands team meeting scheduled for Friday at 4 PM!'
  }, hrToken);

  // 30. Get Announcements
  await testEndpoint('Get Announcements', 'GET', `${BASE_URL}/comms/announcements`, null, empToken);

  console.log('\n--- ALL SMOKE & END-TO-END TESTS COMPLETED ---');
}

runAllTests();
