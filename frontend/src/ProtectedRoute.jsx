import { Navigate } from "react-router-dom";
import { useAuth } from "./pages/AuthContext";
import "./spinner.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/logowanie" replace />;
  }

  return children;
};

export default ProtectedRoute;
