// Browser-only stand-in for the backend so the flow works today (setup -> login -> register -> directory).
// Every function mirrors a planned REST endpoint; swap each body for an axios call later. Real passwords are bcrypt-hashed on the server.
const K = "hcm_mock_db";
const read = () => {
  let s = {}; try { s = JSON.parse(localStorage.getItem(K)) || {}; } catch { /* empty */ }
  return { settings: null, users: [], employees: [], departments: [], designations: [], ...s };
};
const write = (d) => localStorage.setItem(K, JSON.stringify(d));
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 250));
const reject = (message, extra = {}) => Promise.reject(Object.assign(new Error(message), extra));
const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";
export const makePassword = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => ALPHA[b % ALPHA.length]).join("") + "#7";
const isDate = (s) => { const d = new Date(`${s}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(d) && d.toISOString().slice(0, 10) === s; };

// GET /setup/status
export const getSetupStatus = () => wait(!!read().settings);

// POST /setup  (only allowed while no company exists)
export const runSetup = ({ settings, admin, departments, designations }) => {
  const db = read();
  if (db.settings) return reject("Setup is already complete.", { status: 409 });
  db.settings = settings; db.departments = departments; db.designations = designations;
  db.users.push({ id: crypto.randomUUID(), name: admin.name, email: admin.email.toLowerCase(), password: admin.password, role: "admin", mustChangePassword: false });
  write(db); return wait(true);
};

// POST /auth/login
export const loginRequest = (email, password) => {
  const u = read().users.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
  if (!u) return reject("Invalid email or password.", { status: 401 });
  return wait({ name: u.name, email: u.email, role: u.role, mustChangePassword: u.mustChangePassword });
};

// GET /org  (departments + designations, managed by Admin in the Organization module)
export const listOrg = () => { const d = read(); return wait({ departments: d.departments, designations: d.designations }); };

const FIELDS = ["code", "name", "email", "department", "designation", "joinDate", "salary"];
function check(e, db, seen = { codes: new Set(), emails: new Set() }) {
  const errs = []; const add = (field, reason) => errs.push({ field, reason });
  const has = (f) => String(e[f] ?? "").trim() !== "";
  FIELDS.forEach((f) => { if (!has(f)) add(f, "Required"); });
  if (has("code")) { const c = e.code.trim().toLowerCase(); if (db.employees.some((x) => x.code.toLowerCase() === c) || seen.codes.has(c)) add("code", "Duplicate code"); seen.codes.add(c); }
  if (has("email")) {
    const m = e.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(m)) add("email", "Invalid email");
    else if (db.users.some((u) => u.email === m) || seen.emails.has(m)) add("email", "Duplicate email");
    seen.emails.add(m);
  }
  if (has("department") && !db.departments.includes(e.department.trim())) add("department", "Unknown department");
  if (has("designation") && !db.designations.includes(e.designation.trim())) add("designation", "Unknown designation");
  if (has("joinDate") && !isDate(e.joinDate.trim())) add("joinDate", "Invalid ISO date (use YYYY-MM-DD)");
  if (has("salary") && !(Number(e.salary) > 0)) add("salary", "Salary must be greater than 0");
  return errs;
}
function insert(db, e) {
  const tempPassword = makePassword(); const id = crypto.randomUUID();
  const emp = { id, code: e.code.trim(), name: e.name.trim(), email: e.email.trim().toLowerCase(), department: e.department.trim(), designation: e.designation.trim(), joinDate: e.joinDate.trim(), basic: Number(e.salary), status: "active" };
  db.employees.push(emp);
  db.users.push({ id: crypto.randomUUID(), name: emp.name, email: emp.email, password: tempPassword, role: "employee", mustChangePassword: true, employeeId: id });
  return { emp, tempPassword };
}

// GET /employees?page&limit&q&dept&desig
export const listEmployees = ({ page = 1, limit = 10, q = "", dept = "", desig = "" }) => {
  const s = q.trim().toLowerCase();
  const all = read().employees.filter((e) =>
    (!dept || e.department === dept) && (!desig || e.designation === desig) &&
    (!s || [e.name, e.code, e.email].some((v) => v.toLowerCase().includes(s))));
  const pages = Math.max(1, Math.ceil(all.length / limit));
  return wait({ items: all.slice((page - 1) * limit, page * limit), total: all.length, page, pages });
};
export const exportEmployees = () => wait(read().employees); // GET /employees/export

// POST /employees  (creates the login with a temporary password)
export const createEmployee = (e) => {
  const db = read(); const errs = check(e, db);
  if (errs.length) return reject("Check the highlighted fields.", { fields: Object.fromEntries(errs.map((x) => [x.field, x.reason])) });
  const r = insert(db, e); write(db); return wait(r);
};

// GET /employees/:id/360
export const getEmployee360 = (id) => {
  const e = read().employees.find((x) => x.id === id);
  if (!e) return reject("Employee not found.");
  const b = e.basic;
  return wait({ ...e, salary: { basic: b, hra: b * 0.4, medical: b * 0.1, gross: b * 1.5 },
    attendance: { present: 0, late: 0, absent: 0, halfDay: 0 }, leave: { annual: 14, sick: 8, casual: 10 } });
};

// POST /employees/import?dryRun=true
export const dryRunCsv = (records) => {
  const db = read(); const seen = { codes: new Set(), emails: new Set() }; const results = [];
  records.forEach((r, i) => {
    const errs = check(r, db, seen);
    if (!errs.length) results.push({ row: i + 2, status: "success", field: "", reason: "Ready to import" });
    else errs.forEach((x) => results.push({ row: i + 2, status: "error", ...x }));
  });
  return wait({ results, ok: records.length > 0 && results.every((x) => x.status === "success") });
};

// POST /employees/import  (re-validates; imports nothing if any row fails)
export const importCsv = async (records) => {
  const { ok } = await dryRunCsv(records);
  if (!ok) return reject("The file still has errors. Run the dry run again.", { status: 422 });
  const db = read();
  const credentials = records.map((r) => { const { emp, tempPassword } = insert(db, r); return { code: emp.code, email: emp.email, tempPassword }; });
  write(db); return { count: credentials.length, credentials };
};
