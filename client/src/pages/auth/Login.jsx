
import { useEffect, useState } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Check whether initial organization setup is completed
  useEffect(() => {
    let active = true;

    const checkSetup = async () => {
      try {
        const response = await api.get("/setup/status");

        if (!active) return;

        const setupRequired = response.data?.data?.setupRequired;

        if (setupRequired === true) {
          navigate("/setup", { replace: true });
          return;
        }

        if (setupRequired !== false) {
          setError("Invalid setup status received from server.");
        }
      } catch {
        if (active) {
          setError("Unable to connect to the server. Please try again.");
        }
      } finally {
        if (active) {
          setCheckingSetup(false);
        }
      }
    };

    checkSetup();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { accessToken, user } = response.data.data;

      sessionStorage.setItem("hcm_access_token", accessToken);
      sessionStorage.setItem("hcm_user", JSON.stringify(user));

      if (user.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        const dashboardRoutes = {
          Admin: "/admin/dashboard",
          HR: "/hr/dashboard",
          Employee: "/employee/dashboard",
        };

        const dashboard = dashboardRoutes[user.role];

        if (dashboard) {
          navigate(dashboard, { replace: true });
        } else {
          sessionStorage.removeItem("hcm_access_token");
          sessionStorage.removeItem("hcm_user");
          setError("Your account role is not recognized.");
        }
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your connection and credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-950">
      {/* Left branding panel */}
      <section className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-blue-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3">
            <Building2 size={28} />
          </div>
          <span className="text-2xl font-bold">HCM Lite</span>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
            Human Capital Management
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            Your people.
            <br />
            Your workplace.
            <br />
            One platform.
          </h1>

          <p className="mt-6 max-w-md leading-7 text-blue-100">
            Manage employees, attendance, leave requests and payroll
            through one organized workspace.
          </p>
        </div>

        <p className="relative text-sm text-blue-100">
          © 2026 HCM Lite. All rights reserved.
        </p>
      </section>

      {/* Login form */}
      <section className="flex w-full items-center justify-center bg-slate-50 px-6 py-12 lg:w-[520px] lg:flex-none xl:w-[580px]">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <Building2 size={26} />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              HCM Lite
            </span>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-blue-600">
              WELCOME BACK
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-3 text-slate-500">
              Enter your work credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work email
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                <Mail size={19} className="text-slate-400" />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
                <LockKeyhole size={19} className="text-slate-400" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || checkingSetup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={19} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Secure access for your organization.
            <br />
            Contact your administrator if you need account assistance.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
