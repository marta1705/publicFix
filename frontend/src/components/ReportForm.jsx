import React from "react";

const ReportForm = ({
  onSubmit,
  errors,
  address,
  setAddress,
  handleGeocode,
  latitude,
  longitude,
  onFindMyLocation,
  isLocating,
}) => {
  return (
    <form onSubmit={onSubmit} className="report-form">
      <div className="form-group">
        <label htmlFor="description">Opis problemu*</label>
        <textarea
          id="description"
          name="description"
          placeholder="Opisz problem, który chcesz zgłosić..."
          rows="4"
        />
        {errors.description && (
          <span className="error">{errors.description}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date">Data zauważenia*</label>
        <input type="date" id="date" name="date" />
        {errors.date && <span className="error">{errors.date}</span>}
      </div>

      <div className="form-group">
        <lable htmlFor="category">Kategoria</lable>
        <select id="category" name="category" defaultValue="">
          <option value="" disabled>
            --Wybierz kategorię
          </option>
          <option value="Infrastruktura drogowa">Infrastruktura drogowa</option>
          <option value="Oświetlenie i bezpieczeństwo">
            Oświetlenie i bezpieczeństwo
          </option>
          <option value="Czystość i środowisko">Czystość i środowisko</option>
          <option value="Inne">Inne</option>
        </select>
        {errors.category && <span className="error">{errors.category}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="image">Zdjęcie</label>
        <input type="file" id="image" name="image" accept="image/*" />
        <small>Opcjonalnie: dodaj zdjęcie problemu</small>
      </div>

      <div className="form-group">
        <label>Lokalizacja*</label>
        <div className="location-actions">
          <button
            type="button"
            onClick={onFindMyLocation}
            className="btn btn-location"
            disabled={isLocating}
          >
            {isLocating ? "📍 Lokalizowanie..." : "📍 Znajdź moją lokalizację"}
          </button>
        </div>

        <div className="location-input">
          <input
            type="text"
            placeholder="Lub wpisz adres ręcznie"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            type="button"
            onClick={handleGeocode}
            className="btn btn-secondary"
          >
            Szukaj
          </button>
        </div>
        {errors.address && <span className="error">{errors.address}</span>}
        {errors.location && <span className="error">{errors.location}</span>}
        {/* {latitude && longitude && (
          <small className="coordinates">
            📍 {parseFloat(latitude).toFixed(6)},{" "}
            {parseFloat(longitude).toFixed(6)}
          </small>
        )} */}
      </div>

      <button type="submit" className="btn btn-primary btn-submit">
        Wyślij zgłoszenie
      </button>
    </form>
  );
};

export default ReportForm;
