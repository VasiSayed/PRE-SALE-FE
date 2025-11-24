import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import "./DocumentBrowser.css";

const DocumentBrowser = () => {
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTower, setSelectedTower] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDocType, setFilterDocType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Preview state
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/book/bookings/by-sales-person");
      setBookingsData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Group data by hierarchy
  const projectGroups = {};
  bookingsData.forEach((item) => {
    const project = item.inventory.project;
    if (!projectGroups[project]) {
      projectGroups[project] = {};
    }

    const tower = item.inventory.tower;
    if (!projectGroups[project][tower]) {
      projectGroups[project][tower] = {};
    }

    const floor = item.inventory.floor;
    if (!projectGroups[project][tower][floor]) {
      projectGroups[project][tower][floor] = {};
    }

    const unit = item.inventory.unit_no;
    projectGroups[project][tower][floor][unit] = item;
  });

  // Get current documents based on selection
  const getCurrentDocuments = () => {
    let documents = [];

    bookingsData.forEach((item) => {
      const matchesProject =
        !selectedProject || item.inventory.project === selectedProject;
      const matchesTower =
        !selectedTower || item.inventory.tower === selectedTower;
      const matchesFloor =
        !selectedFloor || item.inventory.floor === selectedFloor;
      const matchesUnit =
        !selectedUnit || item.inventory.unit_no === selectedUnit;

      if (matchesProject && matchesTower && matchesFloor && matchesUnit) {
        item.bookings.forEach((booking) => {
          booking.attachments?.forEach((att) => {
            documents.push({
              ...att,
              booking: booking,
              inventory: item.inventory,
            });
          });
        });
      }
    });

    // Apply filters
    if (filterDocType !== "ALL") {
      documents = documents.filter((doc) => doc.doc_type === filterDocType);
    }

    if (filterStatus !== "ALL") {
      documents = documents.filter(
        (doc) => doc.booking.status === filterStatus
      );
    }

    if (searchQuery) {
      documents = documents.filter(
        (doc) =>
          doc.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.booking.primary_full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    return documents;
  };

  const documents = getCurrentDocuments();

  // Get document type icon
  const getDocIcon = (docType) => {
    switch (docType) {
      case "PAN":
        return "🆔";
      case "AADHAR":
        return "📇";
      case "PHOTO":
        return "📷";
      case "AGREEMENT":
        return "📄";
      case "PAYMENT_PROOF":
        return "💰";
      default:
        return "📎";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownload = (doc) => {
    window.open(doc.file, "_blank");
  };

  const resetNavigation = () => {
    setSelectedProject(null);
    setSelectedTower(null);
    setSelectedFloor(null);
    setSelectedUnit(null);
  };

  if (loading) {
    return (
      <div className="db-page">
        <div className="db-loading">
          <div className="db-spinner"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page">
      {/* Header */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Documents</h1>
          <p className="db-subtitle">Browse and manage all booking documents</p>
        </div>
        <div className="db-header-actions">
          <div className="db-view-toggle">
            <button
              className={`db-view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={`db-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="db-container">
        {/* Sidebar - Folder Tree */}
        <div className="db-sidebar">
          <div className="db-sidebar-header">
            <h3>📂 Folders</h3>
            {selectedProject && (
              <button className="db-reset-btn" onClick={resetNavigation}>
                Reset
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          {(selectedProject ||
            selectedTower ||
            selectedFloor ||
            selectedUnit) && (
            <div className="db-breadcrumb">
              {selectedProject && (
                <span className="db-breadcrumb-item">{selectedProject}</span>
              )}
              {selectedTower && (
                <>
                  <span className="db-breadcrumb-sep">›</span>
                  <span className="db-breadcrumb-item">{selectedTower}</span>
                </>
              )}
              {selectedFloor && (
                <>
                  <span className="db-breadcrumb-sep">›</span>
                  <span className="db-breadcrumb-item">
                    Floor {selectedFloor}
                  </span>
                </>
              )}
              {selectedUnit && (
                <>
                  <span className="db-breadcrumb-sep">›</span>
                  <span className="db-breadcrumb-item">
                    Unit {selectedUnit}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="db-folder-tree">
            {!selectedProject ? (
              // Show projects
              <>
                {Object.keys(projectGroups).map((project) => (
                  <button
                    key={project}
                    className="db-folder-item"
                    onClick={() => setSelectedProject(project)}
                  >
                    <span className="db-folder-icon">🏢</span>
                    <span className="db-folder-name">{project}</span>
                    <span className="db-folder-count">
                      {Object.keys(projectGroups[project]).length} towers
                    </span>
                  </button>
                ))}
              </>
            ) : !selectedTower ? (
              // Show towers
              <>
                <button
                  className="db-folder-back"
                  onClick={() => setSelectedProject(null)}
                >
                  ← Back to Projects
                </button>
                {Object.keys(projectGroups[selectedProject]).map((tower) => (
                  <button
                    key={tower}
                    className="db-folder-item"
                    onClick={() => setSelectedTower(tower)}
                  >
                    <span className="db-folder-icon">🏗️</span>
                    <span className="db-folder-name">{tower}</span>
                    <span className="db-folder-count">
                      {
                        Object.keys(projectGroups[selectedProject][tower])
                          .length
                      }{" "}
                      floors
                    </span>
                  </button>
                ))}
              </>
            ) : !selectedFloor ? (
              // Show floors
              <>
                <button
                  className="db-folder-back"
                  onClick={() => setSelectedTower(null)}
                >
                  ← Back to Towers
                </button>
                {Object.keys(projectGroups[selectedProject][selectedTower])
                  .sort((a, b) => Number(a) - Number(b))
                  .map((floor) => (
                    <button
                      key={floor}
                      className="db-folder-item"
                      onClick={() => setSelectedFloor(floor)}
                    >
                      <span className="db-folder-icon">🔢</span>
                      <span className="db-folder-name">Floor {floor}</span>
                      <span className="db-folder-count">
                        {
                          Object.keys(
                            projectGroups[selectedProject][selectedTower][floor]
                          ).length
                        }{" "}
                        units
                      </span>
                    </button>
                  ))}
              </>
            ) : (
              // Show units
              <>
                <button
                  className="db-folder-back"
                  onClick={() => setSelectedFloor(null)}
                >
                  ← Back to Floors
                </button>
                {Object.keys(
                  projectGroups[selectedProject][selectedTower][selectedFloor]
                ).map((unit) => (
                  <button
                    key={unit}
                    className={`db-folder-item ${
                      selectedUnit === unit ? "active" : ""
                    }`}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <span className="db-folder-icon">🚪</span>
                    <span className="db-folder-name">Unit {unit}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Main Content - Documents */}
        <div className="db-main">
          {/* Search and Filters */}
          <div className="db-toolbar">
            <div className="db-search">
              <input
                type="text"
                placeholder="🔍 Search documents or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="db-search-input"
              />
            </div>

            <div className="db-filters">
              <select
                className="db-filter-select"
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="PAN">PAN</option>
                <option value="AADHAR">Aadhar</option>
                <option value="PHOTO">Photo</option>
                <option value="AGREEMENT">Agreement</option>
                <option value="PAYMENT_PROOF">Payment Proof</option>
              </select>

              <select
                className="db-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="BOOKED">Booked</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Document Count */}
          <div className="db-result-info">
            <span className="db-result-count">
              {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
              found
            </span>
          </div>

          {/* Documents Display */}
          {documents.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-icon">📭</div>
              <h3>No documents found</h3>
              <p>
                {searchQuery ||
                filterDocType !== "ALL" ||
                filterStatus !== "ALL"
                  ? "Try adjusting your filters"
                  : "Select a folder to view documents"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="db-grid">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="db-doc-card"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <div className="db-doc-icon">{getDocIcon(doc.doc_type)}</div>
                  <div className="db-doc-info">
                    <div className="db-doc-label">{doc.label}</div>
                    <div className="db-doc-type">
                      {doc.doc_type || "Document"}
                    </div>
                  </div>
                  <div className="db-doc-meta">
                    <div className="db-doc-customer">
                      👤 {doc.booking.primary_full_name}
                    </div>
                    <div className="db-doc-unit">
                      📍 {doc.inventory.project} • {doc.inventory.tower} • Unit{" "}
                      {doc.inventory.unit_no}
                    </div>
                    <div className="db-doc-date">
                      📅 {formatDate(doc.booking.created_at)}
                    </div>
                  </div>
                  <div className="db-doc-actions">
                    <button
                      className="db-doc-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                    >
                      ⬇ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="db-list">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Document Name</th>
                    <th>Customer</th>
                    <th>Unit</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="db-list-icon">
                          {getDocIcon(doc.doc_type)}
                        </span>
                      </td>
                      <td>
                        <div className="db-list-doc-name">{doc.label}</div>
                        <div className="db-list-doc-type">{doc.doc_type}</div>
                      </td>
                      <td>{doc.booking.primary_full_name}</td>
                      <td>
                        {doc.inventory.tower} - Unit {doc.inventory.unit_no}
                      </td>
                      <td>{formatDate(doc.booking.created_at)}</td>
                      <td>
                        <button
                          className="db-list-action-btn"
                          onClick={() => handleDownload(doc)}
                        >
                          ⬇
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal - UPDATED */}
      {previewDoc && (
        <div className="db-preview-modal" onClick={() => setPreviewDoc(null)}>
          <div
            className="db-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="db-preview-header">
              <div>
                <h3>{previewDoc.label}</h3>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  {previewDoc.doc_type || "Document"}
                </div>
              </div>
              <button
                className="db-preview-close"
                onClick={() => setPreviewDoc(null)}
              >
                ✕
              </button>
            </div>
            <div className="db-preview-body">
              {(() => {
                const fileUrl = previewDoc.file;
                const fileExt = fileUrl.split(".").pop().toLowerCase();

                // Check if it's an image
                if (
                  ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(fileExt)
                ) {
                  return (
                    <img
                      src={fileUrl}
                      alt={previewDoc.label}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Cannot Preview File</div>
                      <div style="font-size: 14px;">Please download the file to view it</div>
                    </div>
                  `;
                      }}
                    />
                  );
                }

                // Check if it's a PDF
                if (fileExt === "pdf") {
                  return (
                    <iframe
                      src={fileUrl}
                      title={previewDoc.label}
                      className="db-preview-iframe"
                      onError={() => {
                        toast.error(
                          "Cannot preview PDF. Click download to view."
                        );
                      }}
                    />
                  );
                }

                // For other file types
                return (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "64px", marginBottom: "16px" }}>
                      {getDocIcon(previewDoc.doc_type)}
                    </div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "8px",
                      }}
                    >
                      Preview not available
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        marginBottom: "24px",
                      }}
                    >
                      This file type cannot be previewed in browser
                    </p>
                    <button
                      className="db-doc-btn"
                      style={{ maxWidth: "200px", margin: "0 auto" }}
                      onClick={() => handleDownload(previewDoc)}
                    >
                      ⬇ Download File
                    </button>
                  </div>
                );
              })()}
            </div>
            <div className="db-preview-footer">
              <button
                className="db-preview-btn-secondary"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
              <button
                className="db-preview-btn"
                onClick={() => handleDownload(previewDoc)}
              >
                ⬇ Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentBrowser;
