import { useState, useEffect } from "react";

const baseUrl = "http://localhost:5000";

function AdminPanel() {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchPendingReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/pending-reports`);
      const data = await response.json();
      setPendingReports(data.reports || []);
    } catch (error) {
      console.error("Błąd pobierania zgłoszeń:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveReport = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/admin/approve-report/${id}`, {
        method: "POST",
      });
      if (response.ok) {
        alert("Zgłoszenie zatwierdzone!");
        fetchPendingReports();
      }
    } catch (error) {
      console.error("Błąd zatwierdzania:", error);
    }
  };

  const rejectReport = async (id) => {
    if (!confirm("Czy na pewno chcesz odrzucić to zgłoszenie?")) return;

    try {
      const response = await fetch(`${baseUrl}/admin/reject-report/${id}`, {
        method: "POST",
      });
      if (response.ok) {
        alert("Zgłoszenie odrzucone!");
        fetchPendingReports();
      }
    } catch (error) {
      console.error("Błąd odrzucania:", error);
    }
  };

  const approveAll = async () => {
    if (
      !confirm(
        `Czy na pewno chcesz zatwierdzić wszystkie ${pendingReports.length} zgłoszeń?`,
      )
    )
      return;

    try {
      const response = await fetch(`${baseUrl}/admin/approve-all`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchPendingReports();
      }
    } catch (error) {
      console.error("Błąd masowego zatwierdzania:", error);
    }
  };

  const syncTwitter = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${baseUrl}/admin/sync-twitter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok) {
        alert(
          `Synchronizacja zakończona!\nUtworzono: ${data.result.created}\nPominięto: ${data.result.skipped}`,
        );
        fetchPendingReports();
      }
    } catch (error) {
      console.error("Błąd synchronizacji:", error);
      alert("Błąd synchronizacji z Twitterem");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ margin: 0 }}>Panel Administratora</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={syncTwitter}
            disabled={syncing}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1DA1F2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: syncing ? "not-allowed" : "pointer",
              opacity: syncing ? 0.6 : 1,
            }}
          >
            {syncing ? "Synchronizowanie..." : "🔄 Synchronizuj Twitter"}
          </button>
          <button
            onClick={approveAll}
            disabled={pendingReports.length === 0}
            style={{
              padding: "10px 20px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: pendingReports.length === 0 ? "not-allowed" : "pointer",
              opacity: pendingReports.length === 0 ? 0.6 : 1,
            }}
          >
            ✓ Zatwierdź wszystkie ({pendingReports.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          Ładowanie zgłoszeń...
        </div>
      ) : pendingReports.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ color: "#6b7280" }}>Brak zgłoszeń oczekujących</h2>
          <p style={{ color: "#9ca3af" }}>
            Wszystkie zgłoszenia zostały przetworzone
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {pendingReports.map((report) => (
            <div
              key={report.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 12px",
                        backgroundColor:
                          report.source === "twitter" ? "#1DA1F2" : "#6b7280",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {report.source === "twitter" ? "🐦 Twitter" : "📝 Ręczne"}
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#f59e0b",
                        color: "white",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {report.category}
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
                    {report.description}
                  </h3>
                  <p
                    style={{
                      color: "#6b7280",
                      margin: "5px 0",
                      fontSize: "14px",
                    }}
                  >
                    📅 {report.date}
                  </p>
                  <p
                    style={{
                      color: "#6b7280",
                      margin: "5px 0",
                      fontSize: "14px",
                    }}
                  >
                    📍 {report.latitude.toFixed(6)},{" "}
                    {report.longitude.toFixed(6)}
                  </p>
                </div>
                {report.image_url && (
                  <img
                    src={`${baseUrl}${report.image_url}`}
                    alt="Zdjęcie zgłoszenia"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      marginLeft: "20px",
                    }}
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  onClick={() => approveReport(report.id)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  ✓ Zatwierdź
                </button>
                <button
                  onClick={() => rejectReport(report.id)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  ✗ Odrzuć
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
