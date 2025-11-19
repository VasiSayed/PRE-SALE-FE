import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api, { axiosInstance } from "../../api/axiosInstance";
import "./InventoryPlanning.css";

const AVAILABILITY_CLASS = {
  AVAILABLE: "status-available",
  BOOKED: "status-booked",
  BLOCKED: "status-blocked",
};

const InventoryPlanning = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [openFloors, setOpenFloors] = useState({});

  // ---- resolve project id from URL or localStorage ----
  const projectIdFromUrl = searchParams.get("project_id");
  const projectId =
    projectIdFromUrl ||
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID");

  useEffect(() => {
    if (!projectId) {
      setError("project_id is missing in URL or localStorage.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    api
      .get("/client/inventory/tree/", {
        params: { project_id: projectId },
      })
      .then((res) => {
        const data = res.data;
        setTree(data);

        if (data.towers && data.towers.length > 0) {
          setSelectedTowerId(data.towers[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load inventory tree", err);
        setError("Failed to load inventory data.");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleTowerClick = (towerId) => {
    setSelectedTowerId(towerId);
    setOpenFloors({}); // reset floor expansion
  };

  const toggleFloor = (floorId) => {
    setOpenFloors((prev) => ({
      ...prev,
      [floorId]: !prev[floorId],
    }));
  };

  const handleUnitClick = (unitId) => {
    // 👉 Navigate to detail page with unit id + project id in URL
    if (projectId) {
      navigate(`/inventory/unit/${unitId}?project_id=${projectId}`);
    } else {
      navigate(`/inventory/unit/${unitId}`);
    }
  };

  const selectedTower =
    tree?.towers?.find((t) => t.id === selectedTowerId) || null;
  const floors = selectedTower?.floors || [];

  const getUnitStatusClass = (unit) => {
    const inv = unit.inventory;
    if (!inv) return "status-unknown";

    const cls = AVAILABILITY_CLASS[inv.availability_status];
    return cls || "status-unknown";
  };

  if (loading) {
    return <div className="inventory-page">Loading inventory...</div>;
  }

  if (error) {
    return <div className="inventory-page error-text">{error}</div>;
  }

  if (!tree) {
    return (
      <div className="inventory-page">
        <div>No inventory data found for this project.</div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <h1 className="inventory-title">
          Inventory Plan – {tree.project?.name || "Project"}
        </h1>
        <div className="inventory-subtitle">
          Select a tower on the left, then a floor to view units and their
          status.
        </div>
      </div>

      <div className="inventory-layout">
        {/* ---------------- LEFT: Towers ---------------- */}
        <div className="inventory-tower-panel">
          <div className="panel-title">Towers</div>

          {tree.towers?.length ? (
            tree.towers.map((tower) => (
              <button
                key={tower.id}
                type="button"
                className={
                  "tower-item" +
                  (tower.id === selectedTowerId ? " tower-item-active" : "")
                }
                onClick={() => handleTowerClick(tower.id)}
              >
                <div className="tower-name">{tower.name}</div>
                <div className="tower-meta">
                  {tower.floors?.length || 0} floors
                </div>
              </button>
            ))
          ) : (
            <div className="empty-text">No towers found.</div>
          )}
        </div>

        {/* ---------------- RIGHT: Floors + Units ---------------- */}
        <div className="inventory-main-panel">
          <div className="inventory-main-header">
            <div>
              <div className="panel-title">
                {selectedTower ? selectedTower.name : "Select a tower"}
              </div>
              <div className="inventory-main-sub">
                {floors.length
                  ? `${floors.length} floor(s) configured`
                  : "No floors for this tower."}
              </div>
            </div>

            {/* Legend */}
            <div className="inventory-legend">
              <span className="legend-item">
                <span className="legend-chip status-available" /> Available
              </span>
              <span className="legend-item">
                <span className="legend-chip status-booked" /> Booked
              </span>
              <span className="legend-item">
                <span className="legend-chip status-blocked" /> Blocked
              </span>
              <span className="legend-item">
                <span className="legend-chip status-unknown" /> No Inventory
              </span>
            </div>
          </div>

          {/* Floors as big boxes, each expandable */}
          <div className="floors-container">
            {floors.map((floor) => {
              const isOpen = !!openFloors[floor.id];
              return (
                <div key={floor.id} className="floor-card">
                  <div
                    className="floor-header"
                    onClick={() => toggleFloor(floor.id)}
                  >
                    <div className="floor-title">
                      Floor {floor.number || floor.id}
                    </div>
                    <div className="floor-meta">
                      {floor.units?.length || 0} units
                      <span className="floor-toggle-icon">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="unit-grid">
                      {floor.units && floor.units.length ? (
                        floor.units.map((unit) => {
                          const inv = unit.inventory;
                          const statusCls = getUnitStatusClass(unit);

                          return (
                            <div
                              key={unit.id}
                              className={`unit-chip ${statusCls} ${
                                inv ? "unit-chip-has-inventory" : ""
                              }`}
                              onClick={() => handleUnitClick(unit.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUnitClick(unit.id);
                                }
                              }}
                            >
                              <div className="unit-no">
                                {unit.unit_no || `Unit ${unit.id}`}
                              </div>
                              {inv && (
                                <div className="unit-status-text">
                                  {inv.availability_status}
                                </div>
                              )}
                              {!inv && (
                                <div className="unit-status-text">No Inv</div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-text">
                          No units configured on this floor.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {!floors.length && (
              <div className="empty-text">
                No floors found for the selected tower.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPlanning;
