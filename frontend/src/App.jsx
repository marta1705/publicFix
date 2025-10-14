import './App.css'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const baseUrl = "http://localhost:5000"

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function App() {
  const [errors, setErrors] = useState({})
  const [markerPosition, setMarkerPosition] = useState([52.2297, 21.0122])
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [address, setAddress] = useState('')

  function MapUpdater({ position}) {
    const map = useMap()
    map.setView(position, map.getZoom())
    return null
  }

  const handleGeocode = () => {
    if (address.trim())  {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`)
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            const { lat, lon } = data[0]
            setMarkerPosition([lat, lon])
            setLatitude(lat)
            setLongitude(lon)
          } else {
            setErrors({...errors, address: "Nie znaleziono adresu!" })
          }
        })
        .catch(error => {
          console.error("Error:", error)
          alert("Wystąpił błąd podczas szukania adresu.")
        })
    }
  }

  const reverseGeocode = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    const response = await fetch(url)
    const data = await response.json()
    return data.display_name || ""
  }

  const handleSubmit = e => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const description = formData.get('description')
    const date = formData.get('date')
    formData.set('latitude', latitude)
    formData.set('longitude', longitude)

    const newErrors = {}

    if (!description.trim()) {
      newErrors.description = "Opis jest wymagany!"
    }
    if (!date.trim()) {
      newErrors.date = "Data jest wymagana!"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    fetch(`${baseUrl}/report`, {
      method: 'POST',
      body: formData,
    }).then(response => {
      if (response.ok) {
        alert("Zgłoszenie zostało dodane!")
        e.target.reset()
        setLatitude('')
        setLongitude('')
        setAddress('')
      } else {
        alert("Wystąpił błąd podczas dodawania zgłoszenia.")
      }
    }
    ).catch(error => {
      console.error("Error:", error)
      alert("Wystąpił błąd podczas dodawania zgłoszenia.")
    })

  }

  const MapClickHandler = () => {
    const map = useMapEvents({
        click: async (e) => {
          const { lat, lng } = e.latlng
          setMarkerPosition([lat, lng])
          setLatitude(lat)
          setLongitude(lng)

          try {
            const addr = await reverseGeocode(lat, lng)
            setAddress(addr)
            console.log("Adres:", addr)
          } catch (err) {
            console.error("Błąd reverse geocode:", err)
          }
        }
      })
      return null

  }

  function success(position) {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    setMarkerPosition([latitude, longitude])
    setLatitude(latitude)
    setLongitude(longitude)

    reverseGeocode(latitude, longitude)
    .then(addr => setAddress(addr))
    .catch(err => console.error("Błąd reverse geocode:", err))
  }

  function error() {
    console.log("Nie można uzyskać lokalizacji.")
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error)
    }
    else {
      console.log("Geolokalizacja nie jest obsługiwana przez tę przeglądarkę.")
    }
  }, [])


  return (
    <>
    <form onSubmit={handleSubmit}>
      <label htmlFor="description">Opis*:</label>
      <input type="text" id="description" name="description"/>
      {errors.description && <span style={{color: 'red'}}>{errors.description}</span>}

      <label htmlFor='date'>Data*:</label>
      <input type="date" id="date" name="date" />
      {errors.date && <span style={{color: 'red'}}>{errors.date}</span>}

      <label htmlFor='image'>Zdjęcie:</label>
      <input type="file" id="image" name="image" />

      <button type="submit">Dodaj zgłoszenie</button>
    </form>

    <h3>Wybierz lokalizację na mapie lub wpisz adres</h3>
    <input
      type="text"
      placeholder="Wpisz adres"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
    />
    {errors.address && <span style={{color: 'red'}}>{errors.address}</span>}
    <button type='button' onClick={handleGeocode}>Szukaj adresu</button>
    <MapContainer
      center={markerPosition}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
      scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'/>
          <MapClickHandler />
          <MapUpdater position={markerPosition} />
          <Marker position={markerPosition} ></Marker>
    </MapContainer>
    </>
  )
}

export default App
