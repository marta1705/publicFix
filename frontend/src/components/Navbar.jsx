import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Nazwa aplikacji</h1>
        <p>Portal zgłoszeń miejskich</p>
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
      </div>
    </nav>
  );
};

export default Navbar;
