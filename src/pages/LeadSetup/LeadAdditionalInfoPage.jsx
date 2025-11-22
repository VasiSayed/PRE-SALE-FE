// src/pages/LeadSetup/LeadAdditionalInfoPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { SetupAPI, AdditionalInfoAPI } from "../../api/endpoints";
import { showToast } from "../../utils/toast";
import "./LeadSetup.css";

// Map all lookup lists with API path + bundle key
const LIST_CONFIG = [
  {
    key: "visiting_half",
    label: "Visiting Half",
    endpoint: "/leadManagement/visiting-half/",
  },
  {
    key: "family_size",
    label: "Family Size",
    endpoint: "/leadManagement/family-size/",
  },
  {
    key: "residency_ownership",
    label: "Residency Ownership",
    endpoint: "/leadManagement/residency-ownership/",
  },
  {
    key: "possession_designed",
    label: "Possession Designed",
    endpoint: "/leadManagement/possession-designed/",
  },
  {
    key: "occupations",
    label: "Occupation",
    endpoint: "/leadManagement/occupations/",
  },
  {
    key: "designations",
    label: "Designation",
    endpoint: "/leadManagement/designations/",
  },
];

const LeadAdditionalInfoPage = () => {
  const { projectId: projectIdFromRoute } = useParams();
  const [searchParams] = useSearchParams();

  // optional deep-link: ?list=family_size&id=12
  const focusListKey = searchParams.get("list");
  const focusItemId = searchParams.get("id");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectIdFromRoute || ""
  );

  const [bundle, setBundle] = useState(null); // API bundle for selected project
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // per list "new name" input
  const [newValues, setNewValues] = useState({});

  // --- Load project list from scope ---
  useEffect(() => {
    SetupAPI.myScope()
      .then((data) => {
        const list =
          data?.projects || data?.project_list || data?.results || [];
        setProjects(list);

        // if no selectedProjectId yet, pick from URL / localStorage / first
        if (!selectedProjectId) {
          const fromUrl = projectIdFromRoute;
          if (fromUrl && list.some((p) => String(p.id) === String(fromUrl))) {
            setSelectedProjectId(String(fromUrl));
            return;
          }

          const localId =
            localStorage.getItem("ACTIVE_PROJECT_ID") ||
            localStorage.getItem("PROJECT_ID");

          if (localId && list.some((p) => String(p.id) === String(localId))) {
            setSelectedProjectId(String(localId));
          } else if (list.length) {
            setSelectedProjectId(String(list[0].id));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load scope", err);
        setError("Failed to load project scope");
        showToast("Failed to load project scope", "error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Load bundle when project changes ---
  useEffect(() => {
    if (!selectedProjectId) return;
    fetchBundle(selectedProjectId);
  }, [selectedProjectId]);

  const fetchBundle = async (projId) => {
    setLoading(true);
    setError("");
    setBundle(null);

    try {
    const data = await AdditionalInfoAPI.getBulkExtraInfo({
       project_id: projId,
     });
     setBundle(data);

    } catch (err) {
      console.error("Failed to load additional info bundle", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to load additional info for this project.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Auto-focus deep link (optional) ---
  useEffect(() => {
    if (!bundle || !focusListKey || !focusItemId) return;

    const listCfg = LIST_CONFIG.find((l) => l.key === focusListKey);
    if (!listCfg) return;

    const items = bundle[focusListKey] || [];
    const target = items.find(
      (item) => String(item.id) === String(focusItemId)
    );
    if (!target) return;

    // Auto-open rename prompt
    handleRename(listCfg, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, focusListKey, focusItemId]);

  const handleProjectChange = (e) => {
    const value = e.target.value;
    setSelectedProjectId(value);
  };

  const handleNewValueChange = (listKey, value) => {
    setNewValues((prev) => ({ ...prev, [listKey]: value }));
  };

  const handleAdd = async (listCfg) => {
    const name = (newValues[listCfg.key] || "").trim();
    if (!name) {
      showToast("Please enter a name", "error");
      return;
    }

    if (!bundle?.project_lead_id) {
      showToast("Project lead not initialized for this project.", "error");
      return;
    }

    try {
      const res = await api.post(listCfg.endpoint, {
        name,
        is_active: true,
        project_lead: bundle.project_lead_id,
      });

      showToast(`${listCfg.label} added`, "success");

      setNewValues((prev) => ({ ...prev, [listCfg.key]: "" }));
      setBundle((prev) => {
        if (!prev) return prev;
        const existing = prev[listCfg.key] || [];
        return {
          ...prev,
          [listCfg.key]: [res.data, ...existing],
        };
      });
    } catch (err) {
      console.error("Failed to add item", err);
      let msg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to add item");
      showToast(msg, "error");
    }
  };

  const handleRename = async (listCfg, item) => {
    const currentName = item.name || "";
    const next = window.prompt(`Rename ${listCfg.label} item:`, currentName);
    if (next === null) return; // cancelled
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentName) return;

    try {
      const res = await api.patch(`${listCfg.endpoint}${item.id}/`, {
        name: trimmed,
      });
      showToast("Name updated", "success");

      setBundle((prev) => {
        if (!prev) return prev;
        const updatedList = (prev[listCfg.key] || []).map((i) =>
          i.id === item.id ? res.data : i
        );
        return { ...prev, [listCfg.key]: updatedList };
      });
    } catch (err) {
      console.error("Failed to rename item", err);
      let msg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to update name");
      showToast(msg, "error");
    }
  };

  const handleToggleActive = async (listCfg, item) => {
    try {
      const res = await api.patch(`${listCfg.endpoint}${item.id}/`, {
        is_active: !item.is_active,
      });
      showToast("Status updated", "success");

      setBundle((prev) => {
        if (!prev) return prev;
        const updatedList = (prev[listCfg.key] || []).map((i) =>
          i.id === item.id ? res.data : i
        );
        return { ...prev, [listCfg.key]: updatedList };
      });
    } catch (err) {
      console.error("Failed to toggle status", err);
      let msg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to update status");
      showToast(msg, "error");
    }
  };

  const handleDelete = async (listCfg, item) => {
    if (
      !window.confirm(
        `Delete "${item.name}" from ${listCfg.label}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`${listCfg.endpoint}${item.id}/`);
      showToast("Item deleted", "success");

      setBundle((prev) => {
        if (!prev) return prev;
        const updatedList = (prev[listCfg.key] || []).filter(
          (i) => i.id !== item.id
        );
        return { ...prev, [listCfg.key]: updatedList };
      });
    } catch (err) {
      console.error("Failed to delete item", err);
      let msg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to delete item");
      showToast(msg, "error");
    }
  };

  const renderListCard = (listCfg) => {
    const items = bundle?.[listCfg.key] || [];

    // sort: active first, then by name
    const sorted = [...items].sort((a, b) => {
      if (a.is_active === b.is_active) {
        return (a.name || "").localeCompare(b.name || "");
      }
      return a.is_active ? -1 : 1;
    });

    return (
      <div key={listCfg.key} className="setup-card">
        <div className="setup-card-header">
          <div>
            <div className="setup-card-title">{listCfg.label}</div>
            <div className="setup-card-sub">Total: {items.length} item(s)</div>
          </div>
        </div>

        <div className="setup-card-body">
          {/* Add new row */}
          <div className="list-add-row">
            <input
              className="form-input"
              placeholder={`Add new ${listCfg.label}...`}
              value={newValues[listCfg.key] || ""}
              onChange={(e) =>
                handleNewValueChange(listCfg.key, e.target.value)
              }
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleAdd(listCfg)}
            >
              Add
            </button>
          </div>

          {/* Items table */}
          {sorted.length ? (
            <div className="simple-table">
              <div className="simple-table-header">
                <div className="col-name">Name</div>
                <div className="col-status">Active</div>
                <div className="col-actions">Actions</div>
              </div>
              {sorted.map((item) => (
                <div key={item.id} className="simple-table-row">
                  <div className="col-name">{item.name}</div>
                  <div className="col-status">
                    {item.is_active ? "Yes" : "No"}
                  </div>
                  <div className="col-actions">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => handleRename(listCfg, item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => handleToggleActive(listCfg, item)}
                    >
                      {item.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => handleDelete(listCfg, item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-text">No items configured yet.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-header-row">
          <div>
            <h1 className="setup-title">Additional Lead Information</h1>
            <p className="setup-subtitle">
              Manage Visiting Half, Family Size, Occupation, Designation and
              other extra dropdowns per project.
            </p>
          </div>

          {/* Project dropdown */}
          <div className="setup-project-select">
            <label className="form-label">Project</label>
            <select
              className="form-input"
              value={selectedProjectId || ""}
              onChange={handleProjectChange}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="loading-spinner">Loading additional info...</div>
        )}

        {error && !loading && (
          <div className="error-message" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && bundle && (
          <div className="setup-grid-2">
            {LIST_CONFIG.map((listCfg) => renderListCard(listCfg))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadAdditionalInfoPage;
