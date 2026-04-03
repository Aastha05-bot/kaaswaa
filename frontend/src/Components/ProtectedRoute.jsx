import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import UnAuthorized from "../pages/UnAuthorized";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnAuthorized />;
  }

  return children;
}

export default ProtectedRoute;
