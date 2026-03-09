import { useState, useEffect } from "react";
import ReportList from "../components/ReportList";
import ReportsMapInteractive from "../components/ReportsMapInteractive";
import api from "../services/api";

const baseUrl = "http://localhost:5000";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showNearby, setShowNearby] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/report");
      let reportsData = response.data.reports || [];

      // Calculate distance for each report if user location is available
      if (userLocation) {
        reportsData = reportsData.map((report) => ({
          ...report,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            report.latitude,
            report.longitude,
          ),
        }));

        // Sort by distance if showNearby is enabled
        if (showNearby) {
          reportsData.sort((a, b) => a.distance - b.distance);
        }
      }

      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);

      if (error.response?.status === 401) {
        console.log("Niezalogowany - to OK dla publicznych zgłoszeń");
      } else {
        alert("Błąd podczas pobierania zgłoszeń");
      }
    } finally {
      setLoading(false);
    }
  };

  console.log("User Location:", reports);

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokalizacja nie jest obsługiwana przez tę przeglądarkę.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setShowNearby(true);
        setIsLocating(false);
      },
      (error) => {
        console.error("Błąd geolokalizacji:", error);
        let errorMessage = "Nie można uzyskać lokalizacji.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Odmówiono dostępu do lokalizacji. Sprawdź ustawienia przeglądarki.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informacje o lokalizacji są niedostępne.";
            break;
          case error.TIMEOUT:
            errorMessage = "Przekroczono czas oczekiwania na lokalizację.";
            break;
        }

        alert(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const toggleShowNearby = () => {
    if (!userLocation) {
      handleFindMyLocation();
    } else {
      setShowNearby(!showNearby);
      fetchReports();
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userLocation, showNearby]);

  // Filter reports for map (show nearby if enabled)
  const mapReports =
    showNearby && userLocation
      ? reports.filter((r) => r.distance && r.distance <= 5) // 5km radius
      : reports;

  return (
    <div className="reports-view-split">
      <div className="reports-container-unified">
        <div className="reports-header-unified">
          <h2>Wszystkie zgłoszenia</h2>
          <div className="header-actions">
            <button
              onClick={toggleShowNearby}
              className={
                showNearby ? "btn btn-location active" : "btn btn-location"
              }
              disabled={isLocating}
            >
              {isLocating
                ? "Lokalizowanie..."
                : showNearby
                  ? "Pokaż wszystkie"
                  : "Pokaż w mojej okolicy"}
            </button>
            {/* <button onClick={fetchReports} className="btn btn-secondary">
              🔄 Odśwież
            </button> */}
          </div>
        </div>

        <div className="reports-split-layout">
          <div className="map-column">
            <div className="map-info">
              <h3>Mapa zgłoszeń</h3>
              {/* {showNearby && userLocation && (
                <p className="nearby-info">
                  Pokazuję zgłoszenia w promieniu 5km
                </p>
              )} */}
            </div>
            <ReportsMapInteractive
              reports={mapReports}
              userLocation={userLocation}
              showNearby={showNearby}
              selectedReport={selectedReport}
              onReportSelect={setSelectedReport}
            />
          </div>

          <div className="list-column">
            {loading ? (
              <div className="loading">Ładowanie zgłoszeń...</div>
            ) : reports.length === 0 ? (
              <div className="no-reports">
                <p>Brak zgłoszeń do wyświetlenia</p>
              </div>
            ) : (
              <ReportList
                reports={reports}
                userLocation={userLocation}
                showNearby={showNearby}
                selectedReport={selectedReport}
                onReportSelect={setSelectedReport}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
