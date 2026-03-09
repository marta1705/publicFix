import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AddReport from "./pages/AddReport";
import Reports from "./pages/Reports";

import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";
import MyReports from "./pages/MyReports";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "./AuthContext";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/zgloszenia" element={<Reports />} />
              <Route path="/logowanie" element={<Login />} />
              <Route path="/rejestracja" element={<Register />} />
              <Route
                path="/moje-zgloszenia"
                element={
                  <ProtectedRoute>
                    <MyReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dodaj"
                element={
                  <ProtectedRoute>
                    <AddReport />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}
