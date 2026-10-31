
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();

  const savedUser = sessionStorage.getItem("hcm_user");
  const accessToken = sessionStorage.getItem("hcm_access_token");

  // Authentication check
  if (!savedUser || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  let user;

  // Parse saved user safely
  try {
    user = JSON.parse(savedUser);
  } catch {
    sessionStorage.removeItem("hcm_user");
    sessionStorage.removeItem("hcm_access_token");
    sessionStorage.removeItem("hcm_refresh_token");

    return <Navigate to="/login" replace />;
  }

  // Validate user session data
  if (
    !user ||
    typeof user !== "object" ||
    !user.role ||
    !allowedRoles.includes(user.role)
  ) {
    sessionStorage.removeItem("hcm_user");
    sessionStorage.removeItem("hcm_access_token");
    sessionStorage.removeItem("hcm_refresh_token");

    return <Navigate to="/login" replace />;
  }

  // Force password change
  if (
    user.mustChangePassword === true &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

export default ProtectedRoute;
