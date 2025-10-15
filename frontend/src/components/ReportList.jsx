const baseUrl = "http://localhost:5000";

function ReportList({
  reports,
  userLocation,
  showNearby,
  selectedReport,
  onReportSelect,
}) {
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Oczekujące", color: "#FFA500" },
      in_progress: { label: "W trakcie", color: "#2196F3" },
      resolved: { label: "Rozwiązane", color: "#4CAF50" },
    };
    const statusInfo = statusMap[status] || { label: status, color: "#757575" };
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: statusInfo.color,
        }}
      >
        {statusInfo.label}
      </span>
    );
  };

  console.log("Reports in ReportList:", reports);

  const formatDistance = (distance) => {
    if (!distance) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className="reports-list">
      {/* {showNearby && userLocation && (
        <div className="list-header">
          <p className="sort-info">Sortowane według odległości od Ciebie</p>
        </div>
      )} */}

      {reports.map((report) => (
        <div
          key={report.id}
          className={`report-list-item ${
            selectedReport?.id === report.id ? "selected" : ""
          }`}
          onClick={() => onReportSelect(report)}
        >
          {report.image_url ? (
            <div className="report-thumbnail">
              <img src={`${baseUrl}${report.image_url}`} alt="Zgłoszenie" />
            </div>
          ) : (
            <div className="report-thumbnail no-image">
              <span>📷</span>
            </div>
          )}

          <div className="report-details">
            <div className="report-top-row">
              {report.distance && showNearby && (
                <span className="report-distance">
                  📍 {formatDistance(report.distance)}
                </span>
              )}
            </div>

            <p className="report-description-list">{report.description}</p>

            <div className="report-bottom-row">
              <span className="report-date">📅 {report.date}</span>
              {getStatusBadge(report.status)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReportList;
