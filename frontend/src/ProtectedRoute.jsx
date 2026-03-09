import { Navigate, redirect, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
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

  return user ? children : <Navigate to="/logowanie" />;
};

export default ProtectedRoute;
