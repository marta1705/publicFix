import { useState, useEffect } from "react";
import noImg from "../static/no-image.png";

const baseUrl = "http://localhost:5000";

function ReportList({
  reports,
  userLocation,
  showNearby,
  selectedReport,
  onReportSelect,
}) {
  const [addresses, setAddresses] = useState({});
  const getStatusBadge = (status) => {
    const statusMap = {
      Zarejestrowane: { label: "Zarejestrowane", color: "#757575" },
      Zweryfikowane: { label: "Zweryfikowane - w toku", color: "#2196F3" },
      Rozwiązane: { label: "Rozwiązane", color: "#4CAF50" },
      Odrzucone: { label: "Odrzucone", color: "#ef5350" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "#757575" };
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: statusInfo.color,
        }}
      >
        {statusInfo.label}
      </span>
    );
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      const newAddresses = {};
      for (const report of reports) {
        const key = `${report.latitude},${report.longitude}`;
        if (!addresses[key]) {
          try {
            const address = await reverseGeocode(
              report.latitude,
              report.longitude
            );
            newAddresses[key] = address;
          } catch (error) {
            console.error("Błąd geokodowania:", error);
            newAddresses[key] = "Nieznany adres";
          }
        }
      }
      setAddresses((prev) => ({ ...prev, ...newAddresses }));
    };

    fetchAddresses();
  }, [reports]);

  const reverseGeocode = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name || "";
  };

  console.log("Reports in ReportList:", reports);

  const formatDistance = (distance) => {
    if (!distance) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className="reports-list">
      {/* {showNearby && userLocation && (
        <div className="list-header">
          <p className="sort-info">Sortowane według odległości od Ciebie</p>
        </div>
      )} */}

      {reports.map((report) => (
        <div
          key={report.id}
          className={`report-list-item ${
            selectedReport?.id === report.id ? "selected" : ""
          }`}
          onClick={() => onReportSelect(report)}
        >
          {report.image_url ? (
            <div className="report-thumbnail">
              <img src={`${baseUrl}${report.image_url}`} alt="Zgłoszenie" />
            </div>
          ) : (
            <div className="report-thumbnail">
              <img src={noImg} alt="Brak zdjęcia" />
            </div>
          )}

          <div className="report-details">
            <div className="report-top-row">
              {report.distance && showNearby && (
                <span className="report-distance">
                  {formatDistance(report.distance)}
                </span>
              )}
            </div>

            <p className="report-description-list">{report.description}</p>
            <p className="report-address">
              {addresses[`${report.latitude},${report.longitude}`] ||
                "Ładowanie adresu..."}
            </p>

            <div className="report-bottom-row">
              <span className="report-date"> {report.date}</span>
              {getStatusBadge(report.status)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReportList;
