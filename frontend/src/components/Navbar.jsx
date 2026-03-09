import React from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { useAuth } from "../AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/logowanie");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Nazwa aplikacji</h1>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Strona główna
        </NavLink>
        {isAuthenticated && (
          <NavLink
            to="/dodaj"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dodaj zgłoszenie
          </NavLink>
        )}

        <NavLink
          to="/zgloszenia"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Wszystkie zgłoszenia
        </NavLink>

        {user && (
          <NavLink
            to="/moje-zgloszenia"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Moje zgłoszenia
          </NavLink>
        )}

        {user ? (
          <div className="user-menu">
            <span className="user-name">
              {user.first_name} {user.last_name}
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Wyloguj
            </button>
          </div>
        ) : (
          <>
            <NavLink
              to="/logowanie"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Logowanie
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
