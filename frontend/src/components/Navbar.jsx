import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

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
        <NavLink
          to="/dodaj"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Dodaj zgłoszenie
        </NavLink>
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
            <button onClick={logout} className="btn-logout">
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
