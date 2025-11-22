// src/pages/CostSheet/CostSheetTemplateCreate.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SetupAPI } from "../../api/endpoints";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast"; // 👈 NEW
import "../Inventory/InventoryCreate.css";
import "./CostSheetTemplateCreate.css";

const CostSheetTemplateCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // <-- if present => EDIT mode
  const isEdit = Boolean(id);

  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // configuration form state
  const [form, setForm] = useState({
    company_name: "",
    company_logo: null,
    quotation_header: "",
    quotation_subheader: "",
    validity_days: "7",
    gst_percent: "",
    stamp_duty_percent: "",
    registration_amount: "",
    legal_fee_amount: "",
    terms_and_conditions: "",
  });

  // project toggle state
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectMappings, setProjectMappings] = useState([]); // existing map rows in edit

  // ============= LOAD SCOPE (PROJECTS) =============
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const s = await SetupAPI.myScope({ include_units: false });
        setScope(s);
      } catch (e) {
        console.error("Failed to load scope for cost sheet template", e);
        setError("Failed to load projects / scope.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const projects = useMemo(() => scope?.projects ?? [], [scope]);

  // ============= LOAD TEMPLATE (EDIT MODE) =============
  useEffect(() => {
    if (!isEdit) return;

    const loadTemplate = async () => {
      try {
        const res = await api.get(`costsheet/cost-sheet-templates/${id}/`);
        const t = res.data || {};

        setForm({
          company_name: t.company_name || "",
          company_logo: null, // file upload not handled from backend yet
          quotation_header: t.quotation_header || "",
          quotation_subheader: t.quotation_subheader || "",
          validity_days:
            t.validity_days !== null && t.validity_days !== undefined
              ? String(t.validity_days)
              : "7",
          gst_percent: t.gst_percent ?? "",
          stamp_duty_percent: t.stamp_duty_percent ?? "",
          registration_amount: t.registration_amount ?? "",
          legal_fee_amount: t.legal_fee_amount ?? "",
          terms_and_conditions: t.terms_and_conditions || "",
        });
      } catch (e) {
        console.error("Failed to load cost sheet template", e);
        setError("Failed to load cost sheet template.");
      }
    };

    loadTemplate();
  }, [isEdit, id]);

  // ============= LOAD PROJECT ↔ TEMPLATE MAPPINGS (EDIT MODE) =============
  useEffect(() => {
    if (!isEdit) return;

    const loadMappings = async () => {
      try {
        const res = await api.get("costsheet/project-cost-sheet-templates/", {
          params: { template_id: id },
        });
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results ?? [];

        setProjectMappings(items);

        const projIds = items
          .map((m) => m.project ?? m.project_id)
          .filter((v) => v !== null && v !== undefined);

        setSelectedProjects(projIds);
      } catch (e) {
        console.error("Failed to load project-cost-sheet mappings", e);
        // Not fatal for page render
      }
    };

    loadMappings();
  }, [isEdit, id]);

  // ============= HANDLERS =============
  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, company_logo: file }));
  };

  const toggleProject = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const resetForm = () => {
    setForm({
      company_name: "",
      company_logo: null,
      quotation_header: "",
      quotation_subheader: "",
      validity_days: "7",
      gst_percent: "",
      stamp_duty_percent: "",
      registration_amount: "",
      legal_fee_amount: "",
      terms_and_conditions: "",
    });
    setSelectedProjects([]);
    setProjectMappings([]);
  };

  const handleCancel = () => {
    if (isEdit) {
      navigate(-1);
    } else {
      resetForm();
    }
  };

  const buildTemplatePayload = () => ({
    company_name: form.company_name,
    company_logo: null, // TODO: hook up file upload if needed
    quotation_header: form.quotation_header,
    quotation_subheader: form.quotation_subheader,
    validity_days: form.validity_days ? Number(form.validity_days) : null,
    gst_percent: form.gst_percent || "0",
    stamp_duty_percent: form.stamp_duty_percent || "0",
    registration_amount: form.registration_amount || "0",
    legal_fee_amount: form.legal_fee_amount || "0",
    terms_and_conditions: form.terms_and_conditions || "",
    config: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.company_name || !form.quotation_header) {
      toast.error("Please fill Company Name and Quotation Header.");
      return;
    }
    if (!selectedProjects.length) {
      toast.error("Please select at least one project in Associated Project.");
      return;
    }

    try {
      setSubmitting(true);

      if (!isEdit) {
        // ========== CREATE ==========
        const payload = {
          template: buildTemplatePayload(),
          projects: selectedProjects,
          extra_charges: null,
          is_active: true,
        };

        await api.post("costsheet/cost-sheet-templates/bulk-create/", payload);

        toast.success("Cost sheet template created and mapped successfully.");
        resetForm();
        navigate(-1);
      } else {
        // ========== EDIT ==========
        // 1) Update template
        const templatePayload = buildTemplatePayload();
        await api.patch(
          `costsheet/cost-sheet-templates/${id}/`,
          templatePayload
        );

        // 2) Update mappings
        const existingProjectIds = projectMappings
          .map((m) => m.project ?? m.project_id)
          .filter((v) => v !== null && v !== undefined);

        const toAdd = selectedProjects.filter(
          (pid) => !existingProjectIds.includes(pid)
        );
        const toRemove = projectMappings.filter(
          (m) => !selectedProjects.includes(m.project ?? m.project_id)
        );

        await Promise.all(
          toAdd.map((projId) =>
            api.post("costsheet/project-cost-sheet-templates/", {
              template: id,
              project: projId,
              is_active: true,
            })
          )
        );

        await Promise.all(
          toRemove.map((m) =>
            api.delete(`costsheet/project-cost-sheet-templates/${m.id}/`)
          )
        );

        toast.success("Cost sheet template updated successfully.");
        navigate(-1);
      }
    } catch (err) {
      console.error(
        isEdit
          ? "Failed to update cost sheet template"
          : "Failed to create cost sheet template",
        err
      );
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Failed to save cost sheet template.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="inventory-page">
        <div style={{ padding: 24 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="setup-section">
        <div className="section-content">
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* HEADER */}
            <div className="costsheet-header">
              <h3>
                {isEdit
                  ? "Edit Cost Sheet Template"
                  : "Create Cost Sheet Template"}
              </h3>
            </div>

            {/* SECTION 1 – CONFIGURATION */}
            <div className="costsheet-section">
              <div className="costsheet-section-title-row">
                <h4 className="costsheet-section-title">Configuration</h4>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.company_name}
                    onChange={(e) =>
                      handleChange("company_name", e.target.value)
                    }
                    placeholder="Enter company name"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Validity (Days)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.validity_days}
                    onChange={(e) =>
                      handleChange("validity_days", e.target.value)
                    }
                    min="1"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Company Logo</label>
                  <label className="upload-box upload-box-sm">
                    <span className="upload-icon">⬆</span>
                    <span>
                      {form.company_logo
                        ? form.company_logo.name
                        : "Upload Logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Quotation Header</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.quotation_header}
                    onChange={(e) =>
                      handleChange("quotation_header", e.target.value)
                    }
                    placeholder="e.g. Cost Sheet - Residential Tower"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Quotation Sub Header</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.quotation_subheader}
                    onChange={(e) =>
                      handleChange("quotation_subheader", e.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="form-field" />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">GST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.gst_percent}
                    onChange={(e) =>
                      handleChange("gst_percent", e.target.value)
                    }
                    placeholder="e.g. 5"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Stamp Duty (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.stamp_duty_percent}
                    onChange={(e) =>
                      handleChange("stamp_duty_percent", e.target.value)
                    }
                    placeholder="e.g. 6"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Registration Fee (Amount)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.registration_amount}
                    onChange={(e) =>
                      handleChange("registration_amount", e.target.value)
                    }
                    placeholder="e.g. 35000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Legal Fee (Amount)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.legal_fee_amount}
                    onChange={(e) =>
                      handleChange("legal_fee_amount", e.target.value)
                    }
                    placeholder="e.g. 15000"
                  />
                </div>

                <div className="form-field-full">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea
                    className="form-input costsheet-textarea"
                    rows={4}
                    value={form.terms_and_conditions}
                    onChange={(e) =>
                      handleChange("terms_and_conditions", e.target.value)
                    }
                    placeholder="Enter standard terms and conditions..."
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2 – PROJECT AUTHORIZATION */}
            <div className="costsheet-section">
              <div className="costsheet-section-title-row">
                <h4 className="costsheet-section-title text-center">
                  Associated Project
                </h4>
              </div>

              <div className="project-toggle-list">
                {projects.map((p) => {
                  const isOn = selectedProjects.includes(p.id);
                  return (
                    <label key={p.id} className="project-toggle-row">
                      <button
                        type="button"
                        className={`toggle-switch ${isOn ? "on" : ""}`}
                        onClick={() => toggleProject(p.id)}
                      >
                        <span className="toggle-knob" />
                      </button>
                      <span className="project-toggle-label">{p.name}</span>
                    </label>
                  );
                })}

                {!projects.length && (
                  <div className="project-toggle-empty">
                    No projects available in your scope.
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="form-row">
              <div className="form-field-full">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "40px",
                    marginTop: "30px",
                    marginBottom: "10px",
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? isEdit
                        ? "Updating..."
                        : "Saving..."
                      : isEdit
                      ? "Update Template"
                      : "Save Template"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CostSheetTemplateCreate;
