import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import AddReport from "./pages/AddReport";
import Reports from "./pages/Reports";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dodaj" element={<AddReport />} />
            <Route path="/zgloszenia" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
