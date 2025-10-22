import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import noImg from "../static/no-image.png";

const baseUrl = "http://localhost:5000";

const MyReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/logowanie");
      return;
    }
    fetchMyReports();
  }, [user, navigate]);

  const fetchMyReports = async () => {
    try {
      const response = await fetch(`${baseUrl}/report`);
      const data = await response.json();

      // Filtruj zgłoszenia należące do zalogowanego użytkownika
      const myReports = data.reports.filter(
        (report) => report.user_id === user.id
      );

      const reportsWithAddresses = await Promise.all(
        myReports.map(async (report) => {
          const address = await reverseGeocode(
            report.latitude,
            report.longitude
          );
          return { ...report, address };
        })
      );

      setReports(reportsWithAddresses);
    } catch (error) {
      console.error("Błąd podczas pobierania zgłoszeń:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Zarejestrowane: "#757575",
      Zweryfikowane: "#2196F3",
      Rozwiązane: "#4CAF50",
      Odrzucone: "#ef5350",
    };
    return colors[status] || "#999";
  };

  const reverseGeocode = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    return data.address || "";
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Czy na pewno chcesz usunąć to zgłoszenie?")) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/report/${reportId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Zgłoszenie zostało usunięte");
        fetchMyReports(); // Odśwież listę
      } else {
        alert("Błąd podczas usuwania zgłoszenia");
      }
    } catch (error) {
      console.error("Błąd:", error);
      alert("Błąd podczas usuwania zgłoszenia");
    }
  };

  if (loading) {
    return <div className="loading">Ładowanie zgłoszeń...</div>;
  }

  return (
    <div className="my-reports-view">
      <div className="my-reports-container">
        <div className="my-reports-header">
          <h2>Moje zgłoszenia</h2>
          <p className="reports-count">
            Łącznie zgłoszeń: <strong>{reports.length}</strong>
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="no-reports">
            <p>Nie masz jeszcze żadnych zgłoszeń</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/dodaj")}
            >
              Dodaj pierwsze zgłoszenie
            </button>
          </div>
        ) : (
          <div className="my-reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="my-report-card">
                <div className="report-card-header">
                  <span className="report-id"></span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(report.status) }}
                  >
                    {report.status}
                  </span>
                </div>

                {report.image_url ? (
                  <div className="report-card-image">
                    <img
                      src={`${baseUrl}${report.image_url}`}
                      alt="Zdjęcie problemu"
                    />
                  </div>
                ) : (
                  <div className="report-card-image">
                    <img src={noImg} alt="Brak zdjęcia" />
                  </div>
                )}

                <div className="report-card-body">
                  <p className="report-description">{report.description}</p>
                  <div className="report-category">{report.category}</div>

                  <div className="report-meta">
                    <div className="meta-item">
                      <span className="meta-label">Data zgłoszenia:</span>
                      <span>{report.date}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Lokalizacja:</span>
                      <span>
                        {`ul. ${report.address.road}, ${report.address.postcode} ${report.address.city} ` ||
                          `${report.latitude}, ${report.longitude}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="report-card-actions">
                  {/* <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/zgloszenia`)}
                  >
                    Zobacz na mapie
                  </button> */}
                  {/* <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(report.id)}
                  >
                    Usuń
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;
