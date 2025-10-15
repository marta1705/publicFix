import React from "react";

const baseUrl = "http://localhost:5000";

const ReportCard = ({ report }) => {
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
    <div className="report-card">
      {report.image_url && (
        <div className="report-image">
          <img src={`${baseUrl}${report.image_url}`} alt="Zdjęcie zgłoszenia" />
        </div>
      )}
      <div className="report-content">
        <div className="report-header">
          <span className="report-id">#{report.id}</span>
          {getStatusBadge(report.status)}
        </div>
        <p className="report-description">{report.description}</p>
        <div className="report-meta">
          <span>📅 {report.date}</span>
          <span>
            📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
