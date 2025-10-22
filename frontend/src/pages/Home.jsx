import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home-view">
      <div className="hero-section">
        <h2>Zgłoś problem w Twojej okolicy</h2>
        {/* <p>
          Pomóż nam utrzymać miasto w lepszym stanie. Zgłoś dziury w drogach,
          uszkodzone ławki, problemy z oświetleniem i wiele więcej.
        </p> */}
        <div className="hero-buttons">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dodaj")}
          >
            Dodaj zgłoszenie
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/zgloszenia")}
          >
            Zobacz zgłoszenia
          </button>
        </div>
      </div>

      {/* <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Lokalizacja GPS</h3>
          <p>Automatyczne wykrywanie lokalizacji lub wybór miejsca na mapie</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📸</div>
          <h3>Załącz zdjęcie</h3>
          <p>Dodaj zdjęcie problemu, aby lepiej go zobrazować</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔔</div>
          <h3>Śledź status</h3>
          <p>Monitoruj postępy w rozwiązywaniu zgłoszenia</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🗺️</div>
          <h3>Mapa zgłoszeń</h3>
          <p>Zobacz wszystkie zgłoszenia w Twojej okolicy</p>
        </div>
      </div> */}
    </div>
  );
};
export default Home;
