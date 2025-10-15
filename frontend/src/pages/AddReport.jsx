import { useState, useEffect } from "react";
import ReportForm from "../components/ReportForm";
import MapSelector from "../components/MapSelector";

const baseUrl = "http://localhost:5000";

const AddReport = () => {
  const [errors, setErrors] = useState({});
  const [markerPosition, setMarkerPosition] = useState([52.2297, 21.0122]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const reverseGeocode = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name || "";
  };

  const handleGeocode = () => {
    if (address.trim()) {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${address}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            const { lat, lon } = data[0];
            setMarkerPosition([parseFloat(lat), parseFloat(lon)]);
            setLatitude(lat);
            setLongitude(lon);
            setErrors({ ...errors, address: "" });
          } else {
            setErrors({ ...errors, address: "Nie znaleziono adresu!" });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Wystąpił błąd podczas szukania adresu.");
        });
    }
  };

  const handleMapClick = async (lat, lng) => {
    setMarkerPosition([lat, lng]);
    setLatitude(lat);
    setLongitude(lng);

    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch (err) {
      console.error("Błąd reverse geocode:", err);
    }
  };

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolokalizacja nie jest obsługiwana przez tę przeglądarkę.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMarkerPosition([lat, lon]);
        setLatitude(lat);
        setLongitude(lon);

        reverseGeocode(lat, lon)
          .then((addr) => setAddress(addr))
          .catch((err) => console.error("Błąd reverse geocode:", err))
          .finally(() => setIsLocating(false));
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
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const description = formData.get("description");
    const date = formData.get("date");
    const category = formData.get("category");
    formData.set("latitude", latitude);
    formData.set("longitude", longitude);

    const newErrors = {};

    if (!description.trim()) {
      newErrors.description = "Opis jest wymagany!";
    }
    if (!date.trim()) {
      newErrors.date = "Data jest wymagana!";
    }
    if (!latitude || !longitude) {
      newErrors.location = "Wybierz lokalizację na mapie!";
    }
    if (!category.trim()) {
      newErrors.category = "Kategoria jest wymagana!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    fetch(`${baseUrl}/report`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          alert("Zgłoszenie zostało dodane!");
          e.target.reset();
          setLatitude("");
          setLongitude("");
          setAddress("");
          setMarkerPosition([52.2297, 21.0122]);
        } else {
          alert("Wystąpił błąd podczas dodawania zgłoszenia.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Wystąpił błąd podczas dodawania zgłoszenia.");
      });
  };

  useEffect(() => {
    if (navigator.geolocation) {
      handleFindMyLocation();
    }
  }, []);

  return (
    <div className="add-view">
      <div className="form-container-unified">
        <h2>Dodaj nowe zgłoszenie</h2>
        <div className="form-map-grid">
          <div className="form-section">
            <ReportForm
              onSubmit={handleSubmit}
              errors={errors}
              address={address}
              setAddress={setAddress}
              handleGeocode={handleGeocode}
              latitude={latitude}
              longitude={longitude}
              onFindMyLocation={handleFindMyLocation}
              isLocating={isLocating}
            />
          </div>

          <div className="map-section">
            <h3>Wskaż lokalizację</h3>
            <p className="map-hint">
              Kliknij na mapie, aby wybrać lokalizację problemu
            </p>
            <MapSelector
              markerPosition={markerPosition}
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddReport;
