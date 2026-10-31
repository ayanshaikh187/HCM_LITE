
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../services/api";

function SetupGuard({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    const checkSetup = async () => {
      try {
        const response = await api.get("/setup/status");

        if (!active) return;

        const setupRequired = response.data?.data?.setupRequired;

        setStatus(setupRequired === true ? "required" : "completed");
      } catch (error) {
        if (!active) return;

        setStatus("error");
      }
    };

    checkSetup();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (status === "completed") {
    return <Navigate to="/login" replace />;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5">
        <div className="rounded-xl bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Unable to check setup status
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please check your server connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default SetupGuard;
