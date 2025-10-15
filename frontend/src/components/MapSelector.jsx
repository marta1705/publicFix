import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
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

function MapUpdater({ position }) {
  const map = useMap();
  map.setView(position, map.getZoom());
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

const MapSelector = ({ markerPosition, onMapClick }) => {
  return (
    <div className="map-wrapper-full">
      <MapContainer
        center={markerPosition}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />
        <MapUpdater position={markerPosition} />
        <Marker position={markerPosition} />
      </MapContainer>
    </div>
  );
};

export default MapSelector;
