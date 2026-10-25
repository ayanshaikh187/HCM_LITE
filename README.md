# HCM Lite — Enterprise Human Capital Management (Hackathon Edition)

A high-performance, full-stack Human Capital Management (HCM) application designed for modern organizations. Built with React 19, Tailwind CSS, Express, MongoDB Mongoose, Groq Cloud AI, and PDFKit.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide Icons
- **Backend**: Node.js, Express 5, MongoDB / Mongoose 9, CommonJS architecture
- **Security**: JWT Authentication, bcryptjs password hashing, role-based access control (Admin, HR, Employee)
- **AI Engine**: Groq Cloud SDK (`llama-3.3-70b-versatile`) with heuristic offline fallback
- **Document Engine**: PDFKit streaming generator for official employee payslips

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Password123!` | Company setup, employee registry, payroll lock, audit logs, metrics |
| **HR Lead** | `sarah.hr@company.com` | `Password123!` | Employee registration, leave approvals, payroll draft, announcements |
| **Employee** | `john.dev@company.com` | `Password123!` | Attendance check-in/out, AI smart leave, payslips, policy Q&A |

> **Note**: If you want to re-initialize from scratch on a clean database, navigate to `/setup` in the browser or use the `POST /api/setup/init` API.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x+)
- MongoDB Atlas cluster or local MongoDB instance

### 2. Backend Setup
```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Copy environment template
cp .env.example .env

# Verify environment variables in .env:
# PORT=5000
# MONGODB_URI=your_mongodb_connection_string
# GROQ_API_KEY=your_groq_api_key
# JWT_SECRET=your_jwt_secret_key

# Start backend server
npm start
# or development with hot reload:
npm run dev
```

The backend server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Copy environment template
cp .env.example .env

# Start frontend development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🧪 Automated Smoke & End-to-End Testing

A complete automated smoke test suite covers all 30 endpoints across the entire lifecycle:
```bash
cd backend
npm test
```

This script:
1. Validates system health (`/api/health`)
2. Tests first-run company setup and admin creation
3. Authenticates Admin, HR, and Employee users
4. Validates employee registration and directory querying
5. Tests check-in and check-out workflows with duplicate protection
6. Runs AI smart leave prompt parsing (natural language -> structured dates)
7. Submits leave applications and processes HR approvals
8. Generates draft payroll with tax calculations and deductions
9. Finalizes and locks payroll
10. Generates and streams PDF payslips
11. Tests AI Policy Q&A, HR chatbot, and attendance summarizer
12. Fetches Admin, HR, and Employee metrics and audit feeds
13. Tests company announcements

---

## 📋 Complete API Reference

### Authentication & Setup
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health check |
| `POST` | `/api/setup/init` | Public | First-time company profile and initial admin account creation |
| `POST` | `/api/auth/login` | Public | Authenticates user; returns JWT token and profile |

### Employees
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employees` | Authenticated (HR, Admin) | Search and filter company employee directory |
| `POST` | `/api/employees` | HR, Admin | Register a new employee with auto-generated credentials |

### Attendance
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/check-in` | Authenticated | Record check-in timestamp (supports `/checkin`) |
| `POST` | `/api/attendance/check-out` | Authenticated | Record check-out timestamp (supports `/checkout`) |
| `GET` | `/api/attendance` | Authenticated | View daily records and personal `todayStatus` |
| `POST` | `/api/attendance/correction` | Authenticated | Submit attendance discrepancy correction request |

### Leave Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leaves` | Authenticated | Submit a formal leave application |
| `GET` | `/api/leaves` | Authenticated | Fetch leave history (personal or company-wide) |
| `GET` | `/api/hr/leaves/pending` | HR, Admin | View pending leave requests awaiting approval |
| `PATCH` | `/api/hr/leaves/:id` | HR, Admin | Approve or reject a leave request |

### Payroll & Payslips
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payroll?month=YYYY-MM` | Authenticated | Get payroll records for a period |
| `POST` | `/api/payroll/generate` | Admin | Generate draft payroll with automated tax slabs |
| `POST` | `/api/payroll/finalize` | Admin | Lock and finalize monthly payroll |
| `GET` | `/api/payroll/payslip/:id` | Authenticated | Download official PDF payslip stream |

### Artificial Intelligence (Groq Cloud SDK)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/smart-leave` | Authenticated | Natural language leave parser to structured JSON |
| `POST` | `/api/ai/policy-qa` | Authenticated | Ask company policy questions with citations |
| `POST` | `/api/ai/chat` | Authenticated | Context-aware organizational HR assistant chatbot |
| `POST` | `/api/ai/attendance-summary` | Authenticated | Instant natural language attendance digest |

### Dashboard Metrics & Communications
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/metrics` | Admin | Headcount, avg salary, payroll cost, attrition |
| `GET` | `/api/admin/audit-logs` | Admin | View tamper-evident audit logs |
| `GET` | `/api/hr/metrics` | HR, Admin | Daily attendance, pending leaves, on-leave count |
| `GET` | `/api/employee/metrics` | Employee, HR, Admin | Personal weekly hours, late marks, leave balance |
| `GET` | `/api/comms/announcements` | Authenticated | Company announcement feed |
| `POST` | `/api/comms/announcements` | HR, Admin | Post new announcement |

---

## 🛡️ Architecture & Design Decisions

1. **CommonJS Standardization**:
   Standardized backend on CommonJS (`require` / `module.exports`) across controllers, routes, models, and config. Eliminates ESM / CJS module collision and ensures zero runtime `ReferenceError: require is not defined`.
2. **Defensive Parameter Resolution**:
   Endpoints accept frontend payload variants (e.g. `adminName` vs `name`, `adminEmail` vs `email`, `employeeId` vs `_id`) to ensure seamless interop with any UI component without breaking schemas.
3. **Dual Identification in Payslip Downloads**:
   Payslip download supports querying both by Mongoose Payroll Document `_id` and by `employeeId?month=YYYY-MM`, streaming standard RFC-compliant PDF binaries directly.
4. **Resilient AI Pipeline**:
   The Groq AI integration dynamically checks credentials and includes immediate heuristic fallbacks for rate limits or network issues, guaranteeing 100% uptime for core user flows.
5. **Global Axios Interceptor**:
   Configured automated JWT bearer token injection and 401 redirect handling on the frontend.
