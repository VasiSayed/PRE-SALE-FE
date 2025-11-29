// src/pages/OnsiteRegistration.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance"; // adjust path if needed
import { showToast } from "../utils/toast";
import "./OnsiteRegistration.css";

const SCOPE_URL = "/client/my-scope/";
const ONSITE_API = "/sales/onsite-registration/";

// CP Mode
const CP_MODE = {
  REGISTERED: "REGISTERED",
  UNREGISTERED: "UNREGISTERED",
};

const initialForm = {
  project_id: "",
  first_name: "",
  last_name: "",
  mobile_number: "",
  email: "",
  // selection
  offering_type_id: "",
  tower_id: "",
  floor_id: "",
  unit_id: "",
  inventory_id: "", // backend ko bhejna hai
  flat_number: "", // from unit.unit_no
  // CP
  has_channel_partner: false,
  channel_partner_id: "",
  terms_accepted: false,
};

export default function OnsiteRegistration() {
  const [form, setForm] = useState(initialForm);

  // ✅ yaha pe safe hai – ab `form` defined hai
  const usingType = !!form.offering_type_id; // true => type-only mode

  const [scopeLoading, setScopeLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [offeringTypes, setOfferingTypes] = useState([]); // from my-scope (global)

  const [cpLoading, setCpLoading] = useState(false);
  const [channelPartners, setChannelPartners] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const [lookupResult, setLookupResult] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
const [showLookupDetails, setShowLookupDetails] = useState(false);

  // ---------- CP state (REGISTERED vs UNREGISTERED) ----------
  const [cpMode, setCpMode] = useState(CP_MODE.REGISTERED);

  // Quick CP create modal + form
  const [showQuickCpModal, setShowQuickCpModal] = useState(false);
  const [quickCpForm, setQuickCpForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    company_name: "",
    pan_number: "",
    rera_number: "",
    partner_tier_id: "",
  });
  const [quickCpOtpSending, setQuickCpOtpSending] = useState(false);
  const [quickCpOtpVerifying, setQuickCpOtpVerifying] = useState(false);
  const [quickCpOtpCode, setQuickCpOtpCode] = useState("");
  const [quickCpEmailVerified, setQuickCpEmailVerified] = useState(false);
  const [partnerTiers, setPartnerTiers] = useState([]);

  // ---------- Phone lookup (10 digits + project) ----------
useEffect(() => {
  const digits = (form.mobile_number || "").replace(/\D/g, "");

  // naya lookup start -> details collapse
  setShowLookupDetails(false);

  if (digits.length === 10 && form.project_id) {
    setCheckingPhone(true);
    api
      .get("/sales/sales-leads/lookup-by-phone/", {
        params: {
          phone: digits,
          project_id: form.project_id,
        },
      })
      .then((res) => {
        setLookupResult(res.data || null);
      })
      .catch((err) => {
        console.error("phone lookup failed", err);
        setLookupResult(null);
      })
      .finally(() => setCheckingPhone(false));
  } else {
    setLookupResult(null);
  }
}, [form.mobile_number, form.project_id]);

  // ---------- Load scope with towers + floors + units + offering_types ----------
  useEffect(() => {
    setScopeLoading(true);
    api
      .get(SCOPE_URL, { params: { include_units: true, unit_type: true } })
      .then((res) => {
        const data = res.data || {};
        const list = data.projects || data.project_list || data.results || [];
        setProjects(list);
        setOfferingTypes(data.offering_types || []);

        // auto-select project if only one
        if (list.length === 1) {
          setForm((prev) => ({ ...prev, project_id: String(list[0].id) }));
        }
      })
      .catch((err) => {
        console.error("Failed to load project scope", err);
        showToast("Failed to load project scope", "error");
      })
      .finally(() => setScopeLoading(false));
  }, []);

  // ---------- Load partner tiers for Quick CP when project selected ----------
  useEffect(() => {
    if (!form.project_id) {
      setPartnerTiers([]);
      return;
    }

    api
      .get("/channel/partner-tiers/")
      .then((res) => {
        const list = res.data?.results || res.data || [];
        setPartnerTiers(list);
      })
      .catch((err) => {
        console.error("Failed to load partner tiers", err);
      });
  }, [form.project_id]);

  const selectedProject = useMemo(
    () =>
      projects.find((p) => String(p.id) === String(form.project_id)) || null,
    [projects, form.project_id]
  );

  const towers = useMemo(
    () => selectedProject?.towers || [],
    [selectedProject]
  );

  const selectedTower = useMemo(
    () => towers.find((t) => String(t.id) === String(form.tower_id)) || null,
    [towers, form.tower_id]
  );

  const floors = useMemo(() => selectedTower?.floors || [], [selectedTower]);

  const units = useMemo(() => {
    if (!selectedTower || !form.floor_id) return [];
    const floor =
      (selectedTower.floors || []).find(
        (f) => String(f.id) === String(form.floor_id)
      ) || null;
    // ⭐ saare units return karo, status ke saath
    return floor?.units || [];
  }, [selectedTower, form.floor_id]);

  // ---------- Load CPs when needed (REGISTERED mode only) ----------
  useEffect(() => {
    if (!form.project_id || !form.has_channel_partner) {
      setChannelPartners([]);
      return;
    }

    if (cpMode !== CP_MODE.REGISTERED) {
      setChannelPartners([]);
      return;
    }

    setCpLoading(true);
    api
      .get("/channel/partners/by-project/", {
        params: { project_id: form.project_id },
      })
      .then((res) => {
        const data = res.data || {};
        const list = data.results || data || [];
        setChannelPartners(list);
      })
      .catch((err) => {
        console.error("Failed to load channel partners", err);
        showToast("Failed to load channel partners", "error");
      })
      .finally(() => setCpLoading(false));
  }, [form.project_id, form.has_channel_partner, cpMode]);

  // ---------- helpers ----------
  const handleChange = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "project_id") {
        next.tower_id = "";
        next.floor_id = "";
        next.unit_id = "";
        next.inventory_id = "";
        next.flat_number = "";
        next.offering_type_id = "";
        next.channel_partner_id = "";
        setCpMode(CP_MODE.REGISTERED);

        // ⭐ auto-select tower if only one tower in this project
        const project = projects.find((p) => String(p.id) === String(value));
        if (project && project.towers && project.towers.length === 1) {
          next.tower_id = String(project.towers[0].id);
        }
      }

      if (name === "tower_id") {
        next.floor_id = "";
        next.unit_id = "";
        next.inventory_id = "";
        next.flat_number = "";
        // user unit side pe aa raha hai => type clear
        next.offering_type_id = "";
      }

      if (name === "floor_id") {
        next.unit_id = "";
        next.inventory_id = "";
        next.flat_number = "";
        next.offering_type_id = "";
      }

      if (name === "has_channel_partner" && value === false) {
        next.channel_partner_id = "";
        setCpMode(CP_MODE.REGISTERED);
      }

      // 👉 If user selects an offering type, clear tower/floor/unit
      if (name === "offering_type_id") {
        if (value) {
          next.tower_id = "";
          next.floor_id = "";
          next.unit_id = "";
          next.inventory_id = "";
          next.flat_number = "";
        }
      }

      return next;
    });
  };

  // 🔹 unit select => inventory_id + flat_number set
const handleUnitChange = (unitId) => {
  setForm((prev) => {
    const next = { ...prev };

    if (!unitId) {
      next.unit_id = "";
      next.inventory_id = "";
      next.flat_number = "";
      return next;
    }

    const unit = units.find((u) => String(u.id) === String(unitId)) || null;
    if (!unit) return next;

    // ❌ Non-AVAILABLE unit select kiya to ignore + toast
    if (unit.status !== "AVAILABLE") {
      showToast("This unit is not available.", "error");
      return next;
    }

    next.unit_id = unitId;
    next.offering_type_id = ""; // unit pe shift => type clear

    next.inventory_id = unit?.inventory_id || unit?.id || "";
    next.flat_number = unit?.unit_no || "";

    return next;
  });
};



  const validate = () => {
    const missing = [];

    if (!form.project_id) missing.push("Project");
    if (!form.first_name.trim()) missing.push("First Name");
    if (!form.last_name.trim()) missing.push("Last Name");
    if (!form.mobile_number.trim()) missing.push("Mobile Number");
    if (!form.email.trim()) missing.push("Email");

    const hasType = !!form.offering_type_id;
    const hasFlatCombo = !!(form.tower_id && form.floor_id && form.flat_number);

    if (!hasType && !hasFlatCombo) {
      missing.push("Either Offering Type OR Tower + Floor + Unit");
    }

    if (hasType && hasFlatCombo) {
      showToast(
        "Please select either Offering Type OR Tower + Floor + Unit, not both.",
        "error"
      );
      return false;
    }

    if (!form.terms_accepted) {
      missing.push("Terms & Conditions");
    }

    if (form.has_channel_partner && !form.channel_partner_id) {
      missing.push("Channel Partner");
    }

    if (missing.length) {
      showToast("Please fill required fields:\n" + missing.join("\n"), "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    const payload = {
      project_id: Number(form.project_id),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      mobile_number: form.mobile_number.trim(),
      email: form.email.trim(),

      // CASE 1: type-only
      offering_type_id: form.offering_type_id
        ? Number(form.offering_type_id)
        : null,

      // CASE 2: tower + floor + unit/inventory
      tower_id: form.tower_id ? Number(form.tower_id) : null,
      floor_id: form.floor_id ? Number(form.floor_id) : null,
      inventory_id: form.inventory_id ? Number(form.inventory_id) : null,

      flat_number: form.flat_number || "",

      has_channel_partner: !!form.has_channel_partner,
      channel_partner_id:
        form.has_channel_partner && form.channel_partner_id
          ? Number(form.channel_partner_id)
          : null,

      terms_accepted: !!form.terms_accepted,
    };

    setSubmitting(true);
    try {
      const res = await api.post(ONSITE_API, payload);
      console.log("Onsite registration success:", res.data);
      showToast("Onsite registration created successfully.", "success");
      setForm(initialForm);
      setLookupResult(null);
      setCpMode(CP_MODE.REGISTERED);
    } catch (err) {
      console.error("Failed to create onsite registration", err);
      let msg = "Failed to create onsite registration.";
      const data = err?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Quick CP: OTP send/verify + create ----------
  const handleSendQuickCpOtp = async () => {
    const email = (quickCpForm.email || "").trim();
    if (!email) {
      showToast("Please enter CP email first.", "error");
      return;
    }

    setQuickCpEmailVerified(false);
    setQuickCpOtpCode("");
    setQuickCpOtpSending(true);

    try {
      await api.post("/sales/sales-leads/email-otp/start/", { email });
      showToast("OTP sent to CP email.", "success");
    } catch (err) {
      console.error("Failed to send quick CP OTP", err);
      let msg = "Failed to send OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setQuickCpOtpSending(false);
    }
  };

  const handleVerifyQuickCpOtp = async () => {
    const email = (quickCpForm.email || "").trim();
    const otp = (quickCpOtpCode || "").trim();

    if (!email) {
      showToast("Please enter CP email first.", "error");
      return;
    }
    if (!otp) {
      showToast("Please enter OTP.", "error");
      return;
    }

    setQuickCpOtpVerifying(true);
    try {
      await api.post("/sales/sales-leads/email-otp/verify/", { email, otp });
      showToast("CP email verified.", "success");
      setQuickCpEmailVerified(true);
    } catch (err) {
      console.error("Failed to verify quick CP OTP", err);
      setQuickCpEmailVerified(false);
      let msg = "Failed to verify OTP.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    } finally {
      setQuickCpOtpVerifying(false);
    }
  };

  const handleQuickCpCreate = async () => {
    if (!quickCpEmailVerified) {
      showToast("Please verify CP email first.", "error");
      return;
    }

    if (
      !quickCpForm.name ||
      !quickCpForm.email ||
      !quickCpForm.partner_tier_id
    ) {
      showToast("Name, Email, and Partner Tier are required.", "error");
      return;
    }

    try {
      const body = {
        name: quickCpForm.name,
        email: quickCpForm.email,
        mobile_number: quickCpForm.mobile_number || "",
        company_name: quickCpForm.company_name || "",
        pan_number: quickCpForm.pan_number || "",
        rera_number: quickCpForm.rera_number || "",
        partner_tier_id: quickCpForm.partner_tier_id,
        project_id: form.project_id,
      };

      const res = await api.post("/channel/partners/quick-create/", body);
      showToast("Channel Partner created successfully.", "success");

      const newCp = res.data;

      // Reload CPs for this project (registered mode)
      const reloadRes = await api.get("/channel/partners/by-project/", {
        params: { project_id: form.project_id },
      });
      const list = reloadRes.data?.results || reloadRes.data || [];
      setChannelPartners(list);

      // Auto-select new CP in form
      setForm((prev) => ({
        ...prev,
        has_channel_partner: true,
        channel_partner_id: String(newCp.id),
      }));
      setCpMode(CP_MODE.REGISTERED);

      // Close modal + reset quick form
      setShowQuickCpModal(false);
      setQuickCpForm({
        name: "",
        email: "",
        mobile_number: "",
        company_name: "",
        pan_number: "",
        rera_number: "",
        partner_tier_id: "",
      });
      setQuickCpOtpCode("");
      setQuickCpEmailVerified(false);
    } catch (err) {
      console.error("Failed to create quick CP", err);
      let msg = "Failed to create Channel Partner.";
      const data = err?.response?.data;
      if (data?.detail) msg = data.detail;
      showToast(msg, "error");
    }
  };

  // ---------- render ----------
  return (
    <div className="onsite-page">
      <div className="onsite-card">
        <div className="onsite-header">
          <button
            type="button"
            className="onsite-back-btn"
            onClick={() => window.history.back()}
          >
            ←
          </button>
          <h1 className="onsite-title">Onsite Registration</h1>
        </div>

        <form className="onsite-body" onSubmit={handleSubmit}>
          {/* Project */}
          <div className="onsite-field">
            <label className="onsite-label">
              Project <span className="onsite-required">*</span>
            </label>
            <select
              className="onsite-input"
              value={form.project_id}
              onChange={(e) => handleChange("project_id", e.target.value)}
              disabled={scopeLoading}
            >
              <option value="">
                {scopeLoading ? "Loading..." : "Select Project"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.project_name || `Project #${p.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* First / Last name */}
          <div className="onsite-field">
            <label className="onsite-label">
              First Name <span className="onsite-required">*</span>
            </label>
            <input
              className="onsite-input"
              type="text"
              placeholder="Enter First Name"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
            />
          </div>

          <div className="onsite-field">
            <label className="onsite-label">
              Last Name <span className="onsite-required">*</span>
            </label>
            <input
              className="onsite-input"
              type="text"
              placeholder="Enter Last Name"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
            />
          </div>

          {/* Mobile / Email */}
          <div className="onsite-field">
            <label className="onsite-label">
              Mobile Number <span className="onsite-required">*</span>
            </label>
            <input
              className="onsite-input"
              type="tel"
              placeholder="Enter Mobile Number"
              value={form.mobile_number}
              onChange={(e) => handleChange("mobile_number", e.target.value)}
            />
            {(checkingPhone || lookupResult) && (
              <div className="onsite-lookup-banner">
                {checkingPhone ? (
                  <span>Checking existing records…</span>
                ) : lookupResult?.present ? (
                  <>
                    <span>
                      Lead / opportunity already exists for this mobile. Leads:{" "}
                      {lookupResult.lead_count || 0}, Opportunities:{" "}
                      {lookupResult.opportunity_count || 0}.
                    </span>
                    <button
                      type="button"
                      className="onsite-lookup-more-btn"
                      onClick={() => setShowLookupDetails((prev) => !prev)}
                    >
                      {showLookupDetails ? "Hide details" : "Show more"}
                    </button>
                  </>
                ) : (
                  <span>No existing lead found. New lead will be created.</span>
                )}
              </div>
            )}

            {/* Details block */}
            {lookupResult?.present && showLookupDetails && (
              <div className="onsite-lookup-details">
                {lookupResult.leads?.length ? (
                  <table className="onsite-lookup-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Flat</th>
                        <th>CP</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lookupResult.leads.map((lead, idx) => (
                        <tr key={lead.id}>
                          <td>{idx + 1}</td>
                          <td>
                            {lead.full_name ||
                              `${lead.first_name} ${lead.last_name}`}
                          </td>
                          <td>{lead.email || "-"}</td>
                          <td>{lead.address?.flat_or_building || "-"}</td>
                          <td>{lead.channel_partner_name || "-"}</td>
                          <td>{lead.status_name || "-"}</td>
                          <td>
                            {lead.created_at
                              ? lead.created_at.slice(0, 10)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="onsite-helper">
                    No lead details available.
                  </div>
                )}
              </div>
            )}

            {/* Details block */}
            {lookupResult?.present && showLookupDetails && (
              <div className="onsite-lookup-details">
                {lookupResult.leads?.length ? (
                  <table className="onsite-lookup-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Flat</th>
                        <th>CP</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lookupResult.leads.map((lead, idx) => (
                        <tr key={lead.id}>
                          <td>{idx + 1}</td>
                          <td>
                            {lead.full_name ||
                              `${lead.first_name} ${lead.last_name}`}
                          </td>
                          <td>{lead.email || "-"}</td>
                          <td>{lead.address?.flat_or_building || "-"}</td>
                          <td>{lead.channel_partner_name || "-"}</td>
                          <td>{lead.status_name || "-"}</td>
                          <td>
                            {lead.created_at
                              ? lead.created_at.slice(0, 10)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="onsite-helper">
                    No lead details available.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="onsite-field">
            <label className="onsite-label">
              Email <span className="onsite-required">*</span>
            </label>
            <input
              className="onsite-input"
              type="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          {/* Select Type = Offering Type pills */}
          <div className="onsite-field">
            <label className="onsite-label">
              Select Type <span className="onsite-required">*</span>
            </label>
            {offeringTypes.length === 0 ? (
              <div className="onsite-helper">
                {selectedProject
                  ? "No offering types configured."
                  : "Select a project to see types."}
              </div>
            ) : (
              <div className="onsite-type-pills">
                {offeringTypes.map((ot) => {
                  const active =
                    String(form.offering_type_id) === String(ot.id);
                  return (
                    <button
                      key={ot.id}
                      type="button"
                      className={
                        "onsite-type-pill" +
                        (active ? " onsite-type-pill-active" : "")
                      }
                      onClick={() =>
                        handleChange(
                          "offering_type_id",
                          active ? "" : String(ot.id)
                        )
                      }
                    >
                      {ot.name || ot.label || `Type #${ot.id}`}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="onsite-helper" style={{ marginTop: 4 }}>
              You can either choose an Offering Type above OR select a specific
              Unit below.
            </div>
          </div>

          {/* 👉 Tower/Floor/Unit only when NOT using type */}
          {!usingType && (
            <>
              <div className="onsite-field">
                <label className="onsite-label">Tower (optional)</label>
                <select
                  className="onsite-input"
                  value={form.tower_id}
                  onChange={(e) => handleChange("tower_id", e.target.value)}
                  disabled={!selectedProject}
                >
                  <option value="">Select Tower</option>
                  {towers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || `Tower #${t.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="onsite-field">
                <label className="onsite-label">Floor (optional)</label>
                <select
                  className="onsite-input"
                  value={form.floor_id}
                  onChange={(e) => handleChange("floor_id", e.target.value)}
                  disabled={!form.tower_id}
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.number || f.name || `Floor #${f.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="onsite-field">
                <label className="onsite-label">Unit (optional)</label>
                <select
                  className="onsite-input"
                  value={form.unit_id}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  disabled={!form.tower_id || !form.floor_id}
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => {
                    const isAvailable = u.status === "AVAILABLE";
                    const label = `${u.unit_no || `Unit #${u.id}`} ${
                      u.status ? `(${u.status})` : ""
                    }`;

                    return (
                      <option
                        key={u.id}
                        value={u.id}
                        disabled={!isAvailable}
                        data-status={u.status}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}

          {/* Channel Partner toggle */}
          <div className="onsite-field onsite-checkbox-row">
            <label className="onsite-checkbox-label">
              <input
                type="checkbox"
                checked={form.has_channel_partner}
                onChange={(e) =>
                  handleChange("has_channel_partner", e.target.checked)
                }
              />
              <span>Channel Partner involved</span>
            </label>
          </div>

          {/* CP Type + CP section */}
          {form.has_channel_partner && (
            <>
              {/* CP Type selector */}
              <div className="onsite-field">
                <label className="onsite-label">Channel Partner Type</label>
                <select
                  className="onsite-input"
                  value={cpMode}
                  onChange={(e) => {
                    const nextMode = e.target.value;
                    setCpMode(nextMode);
                    setForm((prev) => ({
                      ...prev,
                      channel_partner_id: "",
                    }));
                  }}
                >
                  <option value={CP_MODE.REGISTERED}>Registered</option>
                  <option value={CP_MODE.UNREGISTERED}>Unregistered</option>
                </select>
              </div>

              {/* Registered: show CP dropdown */}
              {cpMode === CP_MODE.REGISTERED && (
                <div className="onsite-field">
                  <label className="onsite-label">
                    Channel Partner <span className="onsite-required">*</span>
                  </label>
                  <select
                    className="onsite-input"
                    value={form.channel_partner_id}
                    onChange={(e) =>
                      handleChange("channel_partner_id", e.target.value)
                    }
                    disabled={cpLoading}
                  >
                    <option value="">
                      {cpLoading ? "Loading..." : "Select Channel Partner"}
                    </option>
                    {channelPartners.map((cp) => {
                      const fullName =
                        cp.full_name ||
                        cp.name ||
                        [cp.first_name, cp.last_name].filter(Boolean).join(" ");
                      const label =
                        fullName ||
                        cp.company_name ||
                        cp.email ||
                        `CP #${cp.id}`;
                      return (
                        <option key={cp.id} value={cp.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Unregistered: quick CP create button */}
              {cpMode === CP_MODE.UNREGISTERED && (
                <div className="onsite-field">
                  <label className="onsite-label">
                    Channel Partner <span className="onsite-required">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowQuickCpModal(true)}
                    style={{ padding: "10px 16px", borderRadius: 8 }}
                  >
                    + Create New Channel Partner
                  </button>
                  <div className="onsite-helper" style={{ marginTop: 4 }}>
                    Once created & verified, the partner will be auto-selected
                    for this registration.
                  </div>
                </div>
              )}
            </>
          )}

          {/* T&C checkbox */}
          <div className="onsite-field onsite-checkbox-row">
            <label className="onsite-checkbox-label">
              <input
                type="checkbox"
                checked={form.terms_accepted}
                onChange={(e) =>
                  handleChange("terms_accepted", e.target.checked)
                }
              />
              <span>
                I agree to the terms and conditions{" "}
                <span className="onsite-required">*</span>
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="onsite-footer">
            <button
              type="submit"
              className="onsite-submit-btn"
              // ⭐ Button disabled jab tak T&C accept nahi
              disabled={submitting || !form.terms_accepted}
            >
              {submitting ? "Creating..." : "CREATE"}
            </button>
          </div>
        </form>
      </div>

      {/* Quick CP Create Modal */}
      {showQuickCpModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <h3 className="modal-title">Create New Channel Partner</h3>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Name<span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Email<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={quickCpForm.email}
                  onChange={(e) => {
                    setQuickCpForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
                    setQuickCpEmailVerified(false);
                    setQuickCpOtpCode("");
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSendQuickCpOtp}
                  disabled={quickCpOtpSending}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {quickCpOtpSending ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                OTP<span className="required">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Enter OTP"
                  value={quickCpOtpCode}
                  onChange={(e) => setQuickCpOtpCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleVerifyQuickCpOtp}
                  disabled={quickCpOtpVerifying}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {quickCpOtpVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
              {quickCpEmailVerified && (
                <span style={{ fontSize: 12, color: "#16a34a" }}>
                  ✓ Email verified
                </span>
              )}
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">
                Partner Tier<span className="required">*</span>
              </label>
              <select
                className="form-input"
                value={quickCpForm.partner_tier_id}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    partner_tier_id: e.target.value,
                  }))
                }
              >
                <option value="">Select Partner Tier</option>
                {partnerTiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name || tier.title || `Tier #${tier.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.mobile_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    mobile_number: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.company_name}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.pan_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    pan_number: e.target.value,
                  }))
                }
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label className="form-label">RERA Number</label>
              <input
                type="text"
                className="form-input"
                value={quickCpForm.rera_number}
                onChange={(e) =>
                  setQuickCpForm((prev) => ({
                    ...prev,
                    rera_number: e.target.value,
                  }))
                }
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowQuickCpModal(false);
                  setQuickCpForm({
                    name: "",
                    email: "",
                    mobile_number: "",
                    company_name: "",
                    pan_number: "",
                    rera_number: "",
                    partner_tier_id: "",
                  });
                  setQuickCpOtpCode("");
                  setQuickCpEmailVerified(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleQuickCpCreate}
              >
                Create CP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
