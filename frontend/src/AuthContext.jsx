// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import api from "./services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sprawdź czy użytkownik jest zalogowany (przy montowaniu)
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, user: response.data.user };
    } catch (error) {
      let errorMessage = "Logowanie nie powiodło się";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Nieprawidłowy email lub hasło";
        } else if (error.response.status === 403) {
          errorMessage = "Konto jest nieaktywne";
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = "Brak połączenia z serwerem";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (email, first_name, password) => {
    try {
      const response = await api.post("/auth/register", {
        email,
        first_name,
        password,
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, user: response.data.user };
    } catch (error) {
      let errorMessage = "Rejestracja nie powiodła się";

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = "Użytkownik o tym emailu już istnieje";
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = "Brak połączenia z serwerem";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        register,
        isAuthenticated,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
