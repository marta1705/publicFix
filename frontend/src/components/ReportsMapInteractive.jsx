import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const categoryIcons = {
  "Infrastruktura drogowa": L.AwesomeMarkers.icon({
    icon: "road",
    markerColor: "red",
    prefix: "fa",
  }),
  "Oświetlenie i bezpieczeństwo": L.AwesomeMarkers.icon({
    icon: "lightbulb",
    markerColor: "yellow",
    prefix: "fa",
  }),
  "Czystość i środowisko": L.AwesomeMarkers.icon({
    icon: "tree",
    markerColor: "green",
    prefix: "fa",
  }),
  "Infrastruktura publiczna": L.AwesomeMarkers.icon({
    icon: "bench",
    markerColor: "blue",
    prefix: "fa",
  }),
  "Inne zgłoszenia": L.AwesomeMarkers.icon({
    icon: "exclamation-circle",
    markerColor: "gray",
    prefix: "fa",
  }),
};

// Custom user location icon
const userIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNENBRjUwIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapUpdater({ center, selectedReport }) {
  const map = useMap();

  useEffect(() => {
    if (selectedReport) {
      map.flyTo([selectedReport.latitude, selectedReport.longitude], 15, {
        duration: 1,
      });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [map, center, selectedReport]);

  return null;
}

function ReportsMapInteractive({
  reports,
  userLocation,
  showNearby,
  selectedReport,
  onReportSelect,
}) {
  const getStatusBadge = (status) => {
    const statusMap = {
      zarejestrowane: { label: "Oczekujące", color: "#FFA500" },
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

  const mapCenter =
    userLocation && showNearby
      ? [userLocation.latitude, userLocation.longitude]
      : [52.2297, 21.0122];

  return (
    <div className="map-wrapper-reports">
      <MapContainer
        center={mapCenter}
        zoom={showNearby ? 13 : 12}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={mapCenter} selectedReport={selectedReport} />

        {userLocation && showNearby && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            >
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <strong>Twoja lokalizacja</strong>
                </div>
              </Popup>
            </Marker>
            {/* <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={5000}
              pathOptions={{
                color: "#4CAF50",
                fillColor: "#4CAF50",
                fillOpacity: 0.1,
              }}
            /> */}
          </>
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            icon={
              categoryIcons[report.category] || categoryIcons["Inne zgłoszenia"]
            }
            position={[report.latitude, report.longitude]}
            eventHandlers={{
              click: () => onReportSelect(report),
            }}
          >
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <br />
                {report.description}
                <br />
                <small>📅 {report.date}</small>
                <br />
                {report.distance && showNearby && (
                  <>
                    <small>
                      📍{" "}
                      {report.distance < 1
                        ? `${Math.round(report.distance * 1000)}m`
                        : `${report.distance.toFixed(1)}km`}
                    </small>
                    <br />
                  </>
                )}
                {getStatusBadge(report.status)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ReportsMapInteractive;
