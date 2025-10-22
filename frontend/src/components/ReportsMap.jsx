import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const ReportsMap = ({ reports }) => {
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Oczekujące", color: "#FFA500" },
      in_progress: { label: "W trakcie", color: "#2196F3" },
      resolved: { label: "Rozwiązane", color: "#4CAF50" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "#757575" };
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: "12px",
          backgroundColor: statusInfo.color,
          color: "white",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="map-wrapper" style={{ marginTop: "30px" }}>
      <h3>Mapa zgłoszeń</h3>
      <MapContainer
        center={[52.2297, 21.0122]}
        zoom={12}
        style={{ height: "500px", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
          >
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <strong>#{report.id}</strong>
                <br />
                {report.description}
                <br />
                <small>{report.date}</small>
                <br />
                {getStatusBadge(report.status)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ReportsMap;
