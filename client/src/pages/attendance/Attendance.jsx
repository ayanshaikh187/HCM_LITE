
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  LogIn,
  LogOut,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString();
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Request complete nahi ho saki."
  );
}

function getAttendanceStatus(record) {
  return (
    record?.status ||
    record?.attendanceStatus ||
    "Not marked"
  );
}

function StatusBadge({ status }) {
  const styles = {
    Present: "bg-green-100 text-green-700",
    Late: "bg-amber-100 text-amber-700",
    HalfDay: "bg-orange-100 text-orange-700",
    Absent: "bg-red-100 text-red-700",
    "Not marked": "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function Attendance() {
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(getToday());
  const [history, setHistory] = useState([]);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const role = user?.role;
  const isEmployee = role === "Employee";
  const isManager = role === "Admin" || role === "HR";

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem("hcm_user");
      setUser(savedUser ? JSON.parse(savedUser) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!role) return;

    setLoading(true);
    setError("");

    try {
      if (isEmployee) {
        const response = await api.get("/attendance/my-history");
        setHistory(response.data?.data?.attendance ?? []);
      } else if (isManager) {
        const response = await api.get("/attendance/board", {
          params: { date },
        });
        setBoard(response.data?.data?.attendance ?? []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [role, isEmployee, isManager, date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const todayRecord = history.find((record) => {
    const recordDate =
      record.date || record.attendanceDate || record.checkIn;

    return recordDate && getToday() === String(recordDate).slice(0, 10);
  });

  const hasCheckedIn = Boolean(
    todayRecord?.checkIn || todayRecord?.checkInTime
  );

  const hasCheckedOut = Boolean(
    todayRecord?.checkOut || todayRecord?.checkOutTime
  );

  const getCoordinates = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Is browser mein location support available nahi hai.")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          reject(
            new Error(
              "Location access nahi mili. Browser settings mein location permission allow karo."
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });

  const handleAttendanceAction = async (action) => {
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      let payload = {};

      if (action === "check-in") {
        payload = await getCoordinates();
      }

      const response = await api.post(
        `/attendance/${action}`,
        payload
      );

      setNotice(
        response.data?.message ||
          (action === "check-in"
            ? "Check-in successful."
            : "Check-out successful.")
      );

      await fetchAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = board.filter((record) =>
    ["Present", "Late", "HalfDay"].includes(
      getAttendanceStatus(record)
    )
  ).length;

  const lateCount = board.filter(
    (record) => getAttendanceStatus(record) === "Late"
  ).length;

  const employeeName = (record) =>
    record.employeeName ||
    record.name ||
    record.user?.name ||
    record.userId?.name ||
    "Employee";

  const employeeCode = (record) =>
    record.employeeCode ||
    record.employee?.employeeCode ||
    "—";

  const departmentName = (record) =>
    record.department ||
    record.employee?.department ||
    "—";

  const checkInValue = (record) =>
    record.checkIn || record.checkInTime;

  const checkOutValue = (record) =>
    record.checkOut || record.checkOutTime;

  if (!user) {
    return (
      <div className="p-8 text-slate-600">
        User session nahi mili. Dobara login karo.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              HCM Lite / Workforce
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Attendance
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isEmployee
                ? "Apni daily attendance aur history manage karo."
                : "Organization ki attendance monitor karo."}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAttendance}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={19} />
            <p>{notice}</p>
          </div>
        )}

        {isEmployee && (
          <>
            <section className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Today's date</p>
                    <p className="font-bold text-slate-900">
                      {formatDate(getToday())}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-50 p-3 text-green-600">
                    <LogIn size={22} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Check-in</p>
                    <p className="font-bold text-slate-900">
                      {formatTime(
                        todayRecord?.checkIn ||
                          todayRecord?.checkInTime
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                    <Clock3 size={22} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Check-out</p>
                    <p className="font-bold text-slate-900">
                      {formatTime(
                        todayRecord?.checkOut ||
                          todayRecord?.checkOutTime
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Today's attendance
                  </h2>
                  <div className="mt-3">
                    <StatusBadge
                      status={
                        todayRecord
                          ? getAttendanceStatus(todayRecord)
                          : "Not marked"
                      }
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Check-in ke liye browser location permission required ho
                    sakti hai.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleAttendanceAction("check-in")
                    }
                    disabled={submitting || hasCheckedIn}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogIn size={18} />
                    {submitting && !hasCheckedIn
                      ? "Processing..."
                      : hasCheckedIn
                        ? "Checked in"
                        : "Check in"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleAttendanceAction("check-out")
                    }
                    disabled={
                      submitting || !hasCheckedIn || hasCheckedOut
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut size={18} />
                    {hasCheckedOut ? "Checked out" : "Check out"}
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock3 size={21} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  My attendance history
                </h2>
              </div>

              <div className="mt-5 overflow-x-auto">
                {loading ? (
                  <p className="py-10 text-center text-slate-500">
                    Loading attendance...
                  </p>
                ) : history.length === 0 ? (
                  <p className="py-10 text-center text-slate-500">
                    Abhi attendance history available nahi hai.
                  </p>
                ) : (
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <th className="px-4 py-4">Date</th>
                        <th className="px-4 py-4">Check-in</th>
                        <th className="px-4 py-4">Check-out</th>
                        <th className="px-4 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((record, index) => {
                        const recordDate =
                          record.date ||
                          record.attendanceDate ||
                          record.checkIn;

                        return (
                          <tr
                            key={record.id || record._id || `${recordDate}-${index}`}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-4">
                              {formatDate(recordDate)}
                            </td>
                            <td className="px-4 py-4">
                              {formatTime(checkInValue(record))}
                            </td>
                            <td className="px-4 py-4">
                              {formatTime(checkOutValue(record))}
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge
                                status={getAttendanceStatus(record)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {isManager && (
          <>
            <section className="mt-8 grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total records</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {board.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Present / Late / Half day</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {presentCount}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Late arrivals</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {lateCount}
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <Users size={22} className="text-blue-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Attendance board
                    </h2>
                    <p className="text-sm text-slate-500">
                      Date ke hisaab se employee attendance.
                    </p>
                  </div>
                </div>

                <input
                  type="date"
                  value={date}
                  max={getToday()}
                  onChange={(event) => setDate(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-5 overflow-x-auto">
                {loading ? (
                  <p className="py-10 text-center text-slate-500">
                    Loading attendance board...
                  </p>
                ) : board.length === 0 ? (
                  <p className="py-10 text-center text-slate-500">
                    Is date ke liye attendance records nahi mile.
                  </p>
                ) : (
                  <table className="w-full min-w-[750px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <th className="px-4 py-4">Employee</th>
                        <th className="px-4 py-4">Code</th>
                        <th className="px-4 py-4">Department</th>
                        <th className="px-4 py-4">Check-in</th>
                        <th className="px-4 py-4">Check-out</th>
                        <th className="px-4 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {board.map((record, index) => (
                        <tr
                          key={record.id || record._id || `${employeeName(record)}-${index}`}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-4 font-medium text-slate-800">
                            {employeeName(record)}
                          </td>
                          <td className="px-4 py-4">
                            {employeeCode(record)}
                          </td>
                          <td className="px-4 py-4">
                            {departmentName(record)}
                          </td>
                          <td className="px-4 py-4">
                            {formatTime(checkInValue(record))}
                          </td>
                          <td className="px-4 py-4">
                            {formatTime(checkOutValue(record))}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge
                              status={getAttendanceStatus(record)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {!isEmployee && !isManager && (
          <div className="mt-8 rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
            Is role ke liye attendance page available nahi hai.
          </div>
        )}
      </div>
    </main>
  );
}

export default Attendance;
