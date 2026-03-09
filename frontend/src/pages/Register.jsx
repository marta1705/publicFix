import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    first_name: "",
    password: "",
    confirmPassword: "",
    submit: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Czyść błąd tylko dla tego pola (przy wpisywaniu)
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "", // czyścimy też ogólny błąd przy każdej zmianie
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email jest wymagany";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Nieprawidłowy format email";
    }

    // Imię
    if (!formData.first_name.trim()) {
      newErrors.first_name = "Imię jest wymagane";
    } else if (formData.first_name.length > 20) {
      newErrors.first_name = "Imię może mieć maksymalnie 20 znaków";
    }

    // Hasło
    if (!formData.password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (formData.password.length < 8) {
      newErrors.password = "Hasło musi mieć minimum 8 znaków";
    } else {
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        newErrors.password =
          "Hasło musi zawierać wielką literę, małą literę i cyfrę";
      }
    }

    // Potwierdzenie hasła
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Potwierdź hasło";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są identyczne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Walidacja klienta
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, submit: "" }));

    try {
      const result = await register(
        formData.email,
        formData.first_name,
        formData.password,
      );

      if (result.success) {
        console.log("Zarejestrowano jako:", result.user?.email);
        navigate("/");
      } else {
        // Najczęstsze błędy z backendu
        if (
          result.error?.includes("Email już zajęty") ||
          result.status === 409
        ) {
          setErrors((prev) => ({
            ...prev,
            email: "Ten email jest już zajęty",
            submit: "",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            submit: result.error || "Rejestracja nie powiodła się",
          }));
        }
      }
    } catch (err) {
      console.error("Błąd rejestracji:", err);

      let message = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.";

      if (err.response) {
        if (err.response.status === 400) {
          message = err.response.data?.error || "Nieprawidłowe dane";
        } else if (err.response.status === 409) {
          setErrors((prev) => ({
            ...prev,
            email: "Ten email jest już zajęty",
          }));
          return;
        } else if (err.response.status === 429) {
          message = "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.";
        }
      }

      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Rejestracja</h2>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="first_name">Imię:</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Jan"
              required
              maxLength={21}
              className={errors.first_name ? "input-error" : ""}
            />
            {errors.first_name && (
              <small className="error">{errors.first_name}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="twoj@email.pl"
              required
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <small className="error">{errors.email}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <small className="error">{errors.password}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Potwierdź hasło:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && (
              <small className="error">{errors.confirmPassword}</small>
            )}
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "Rejestracja w toku..." : "Zarejestruj się"}
          </button>
        </form>

        <p className="auth-link">
          Masz już konto? <a href="/logowanie">Zaloguj się</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
