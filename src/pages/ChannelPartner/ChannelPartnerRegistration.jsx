// src/pages/ChannelPartner/ChannelPartnerRegistration.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./ChannelPartnerRegistration.css";
import api from "../../api/axiosInstance";
import { showToast } from "../../utils/toast";
import projectImage from "../../assets/project.webp";

const PARTNER_TYPE_MAP = {
  independent: "BROKER", // "Independent Broker" -> BROKER
  agency: "AGENCY", // "Agency" -> AGENCY
  online: "CHANNEL_SALES_PARTNER", // "Online Portal" -> CHANNEL_SALES_PARTNER
  other: "CONSULTANT", // "Other" -> CONSULTANT
};

const ChannelPartnerRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ---------- PROJECT SELECTION (from MY_SCOPE) ----------
  const [scopeProjects, setScopeProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);

  // read MY_SCOPE from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("MY_SCOPE");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setScopeProjects(parsed.projects || []);
    } catch (err) {
      console.error("Failed to parse MY_SCOPE from localStorage", err);
    }
  }, []);

  // when URL changes OR scopeProjects load → decide selected project
  useEffect(() => {
    const idParam = searchParams.get("project_id");

    if (idParam) {
      const pid = Number(idParam);
      setProjectId(pid);

      // keep in localStorage for other screens
      localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
      localStorage.setItem("PROJECT_ID", String(pid));

      const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
      const displayName = proj
        ? proj.name || `Project #${proj.id}`
        : `Project #${pid}`;
      setProjectName(displayName);

      setShowProjectModal(false);
    } else {
      // no project in URL → force selection
      setProjectId(null);
      setProjectName("");
      setShowProjectModal(true);
    }
  }, [searchParams, scopeProjects]);

  const handleProjectSelect = (id) => {
    const params = new URLSearchParams(window.location.search);
    params.set("project_id", id);

    navigate(`/channel-partner-add?${params.toString()}`, {
      replace: true,
    });
  };

  // ---------- existing CP state ----------
  const [section, setSection] = useState("cp");
  const [activeItem, setActiveItem] = useState("cp-registration");

  const [submitting, setSubmitting] = useState(false);

  // Lead source data
  const [sources, setSources] = useState([]);
  const [subSources, setSubSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const [form, setForm] = useState({
    // Basic Information
    agencyName: "",
    contactName: "",
    designation: "",
    mobile: "",
    altMobile: "",
    email: "",

    // Real Estate Business Details
    partnerType: "",
    reraNumber: "",
    experienceYears: "",
    teamAgents: "",
    businessAddress: "",
    operationAreas: "",
    catResidential: false,
    catCommercial: false,
    catPlots: false,
    catRentals: false,
    catLuxury: false,
    brokerageStructure: "",

    // Lead Source
    sourceId: "",
    subSourceId: "",

    // Sales Performance
    avgClosures: "",
    annualSalesVolume: "",
    builderAssociations: "",
    pastSalesExperience: "",
    currentInventory: "",

    // Document & Compliance
    pan: "",
    gst: "",
    reraCert: null,
    licenseProof: null,
    termsAccepted: false,

    // Marketing & Capability
    marketingDigital: false,
    marketingField: false,
    marketingCalling: false,
    marketingSocial: false,
    crmUsed: "",
    leadHandlingProcess: "",
    supportFromDeveloper: "",
    teamSize: "",

    // Additional Information
    preferredProjectTypes: "",
    preferredTicketSize: "",
    comments: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (field) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFile = (field, fileList) => {
    const file = fileList && fileList[0] ? fileList[0] : null;
    setForm((prev) => ({ ...prev, [field]: file }));
  };

  // ---------------- Fetch sources & sub-sources (depends on projectId) ----------------
  useEffect(() => {
    if (!projectId) return;

    const fetchSources = async () => {
      try {
        setLoadingSources(true);
        const res = await api.get("/leadManagement/sources/", {
          params: { project_id: projectId, parent: "root" },
        });
        setSources(res.data || []);
      } catch (err) {
        console.error("Failed to load lead sources", err);
        showToast("Failed to load lead sources.", "error");
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, [projectId]);

  const fetchSubSources = async (sourceId) => {
    if (!sourceId) {
      setSubSources([]);
      return;
    }
    try {
      if (!projectId) return;
      const res = await api.get("/leadManagement/sources/", {
        params: {
          project_id: projectId,
          parent: sourceId,
        },
      });
      setSubSources(res.data || []);
    } catch (err) {
      console.error("Failed to load sub-sources", err);
      showToast("Failed to load sub-sources.", "error");
    }
  };

  const handleSourceSelect = (value) => {
    // update source, reset sub-source
    setForm((prev) => ({
      ...prev,
      sourceId: value,
      subSourceId: "",
    }));
    fetchSubSources(value);
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // avoid double submit

    // ---------- 1) Frontend validation ----------
    if (!form.agencyName || !form.contactName || !form.mobile) {
      showToast("Please fill Agency Name, Contact Name & Mobile.", "error");
      return;
    }
    if (!form.termsAccepted) {
      showToast("You must accept the Terms & Conditions.", "error");
      return;
    }

    // helper: clean integers (for years_experience, etc.)
    const toIntOrNull = (value) => {
      if (value === null || value === undefined) return null;
      const trimmed = String(value).trim();
      if (!trimmed) return null;
      const n = parseInt(trimmed, 10);
      return Number.isNaN(n) ? null : n;
    };

    // ---------- 2) Build enums / helpers ----------

    // PropertyCategoryChoice: RESIDENTIAL, COMMERCIAL, PLOTS, RENTALS, LUXURY
    const propertyCategories = [];
    if (form.catResidential) propertyCategories.push("RESIDENTIAL");
    if (form.catCommercial) propertyCategories.push("COMMERCIAL");
    if (form.catPlots) propertyCategories.push("PLOTS");
    if (form.catRentals) propertyCategories.push("RENTALS");
    if (form.catLuxury) propertyCategories.push("LUXURY");

    // MarketingStrengthChoice: DIGITAL_MARKETING, FIELD_TEAM, CALLING_TEAM, SOCIAL_MEDIA
    const marketingStrengths = [];
    if (form.marketingDigital) marketingStrengths.push("DIGITAL_MARKETING");
    if (form.marketingField) marketingStrengths.push("FIELD_TEAM");
    if (form.marketingCalling) marketingStrengths.push("CALLING_TEAM");
    if (form.marketingSocial) marketingStrengths.push("SOCIAL_MEDIA");

    // ChannelPartnerType enum
    const backendPartnerType = PARTNER_TYPE_MAP[form.partnerType] || "";

    // Resolve source: prefer sub-source if selected
    const resolvedSourceId = form.subSourceId || form.sourceId || null;

    // Split name for User serializer
    const nameParts = (form.contactName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // To avoid "username already exists", make it unique
    const uniqueUsernameBase = form.email || form.mobile || "cp_user";
    const uniqueUsername = `${uniqueUsernameBase}_${Date.now()}`;

    // ---------- 3) Build bulk payload ----------
    const payload = [
      {
        user: {
          username: uniqueUsername,
          password: form.mobile || "cp-temp-1234",
          email: form.email || "",
          first_name: firstName,
          last_name: lastName,
        },

        partner: {
          agency_name: form.agencyName,
          contact_person_name: form.contactName,
          designation: form.designation,
          primary_mobile: form.mobile,
          alternate_mobile: form.altMobile,
          partner_type: backendPartnerType,
          source: resolvedSourceId, // FK -> LeadSource
        },

        profile: {
          rera_registration_number: form.reraNumber,
          years_experience: toIntOrNull(form.experienceYears),
          number_of_agents: toIntOrNull(form.teamAgents),
          business_address: form.businessAddress,
          areas_of_operation: form.operationAreas,

          property_categories: propertyCategories,
          preferred_payment_mode: "",

          average_monthly_closures: toIntOrNull(form.avgClosures),
          annual_sales_volume: form.annualSalesVolume,
          past_project_experience: form.pastSalesExperience,
          top_builder_associations: form.builderAssociations,
          current_inventory: form.currentInventory,

          pan_or_tax_id: form.pan,
          gst_number: form.gst,
          terms_accepted: form.termsAccepted,

          marketing_strength: marketingStrengths,
          crm_used: form.crmUsed,
          lead_handling_process: form.leadHandlingProcess,
          support_required: form.supportFromDeveloper,
          team_size: toIntOrNull(form.teamSize),

          preferred_project_types: form.preferredProjectTypes,
          preferred_ticket_size: form.preferredTicketSize,
          comments: form.comments,
        },
      },
    ];

    // ---------- 4) Call API & handle 207 properly ----------
    try {
      setSubmitting(true);

      const res = await api.post("/channel/partners/bulk-register/", payload);

      const { created_ids = [], errors = [] } = res.data || {};

      // If 207 or any errors returned: DO NOT clear form, show errors
      if (!created_ids.length && errors.length) {
        console.warn("Bulk CP register validation errors:", errors);
        const first = errors[0]?.errors || errors[0];

        // Build a human-ish message
        let msg = "Validation failed: ";
        try {
          msg += JSON.stringify(first);
        } catch {
          msg += String(first);
        }

        showToast(msg, "error");
        return; // stop here, keep form data
      }

      // Success 🎉
      showToast("Channel partner registration submitted (bulk).", "success");
      console.log("Bulk register response:", res.data);

      // ---------- 5) Reset form only on real success ----------
      setForm({
        // Basic
        agencyName: "",
        contactName: "",
        designation: "",
        mobile: "",
        altMobile: "",
        email: "",

        // Business
        partnerType: "",
        reraNumber: "",
        experienceYears: "",
        teamAgents: "",
        businessAddress: "",
        operationAreas: "",
        catResidential: false,
        catCommercial: false,
        catPlots: false,
        catRentals: false,
        catLuxury: false,
        brokerageStructure: "",
        sourceId: "",
        subSourceId: "",

        // Performance
        avgClosures: "",
        annualSalesVolume: "",
        builderAssociations: "",
        pastSalesExperience: "",
        currentInventory: "",

        // Compliance
        pan: "",
        gst: "",
        reraCert: null,
        licenseProof: null,
        termsAccepted: false,

        // Marketing
        marketingDigital: false,
        marketingField: false,
        marketingCalling: false,
        marketingSocial: false,
        crmUsed: "",
        leadHandlingProcess: "",
        supportFromDeveloper: "",
        teamSize: "",

        // Additional
        preferredProjectTypes: "",
        preferredTicketSize: "",
        comments: "",
      });

      setSubSources([]);
    } catch (err) {
      console.error("Bulk CP register failed (exception)", err);
      const data = err?.response?.data;
      let msg = "Failed to submit registration.";

      if (data?.detail) msg = data.detail;
      else if (Array.isArray(data?.errors) && data.errors.length) {
        const first = data.errors[0];
        msg = JSON.stringify(first.errors || first);
      }

      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // helper for header chip
  const currentProjectLabel =
    projectName || (projectId ? `Project #${projectId}` : "Select a project");

  // ======================== RENDER ========================
  return (
    <div className="projects-page">
      {/* Small chip above form to show current project */}
      <div className="cp-project-chip">
        <span>
          Project:&nbsp;
          <strong>{currentProjectLabel}</strong>
        </span>
        <button type="button" onClick={() => setShowProjectModal(true)}>
          Change Project
        </button>
      </div>

      <div className="cp-page">
        <h1 className="cp-header-title">Channel Partner Registration</h1>

        <form onSubmit={handleSubmit}>
          {/* BASIC INFORMATION */}
          <section className="cp-card">
            <div className="cp-card-header">Basic Information</div>
            <div className="cp-card-body">
              <div className="cp-grid cp-grid-4">
                <div className="cp-field">
                  <label>Channel Partner / Agency Name</label>
                  <input
                    className="cp-input"
                    placeholder="Enter agency name"
                    value={form.agencyName}
                    onChange={(e) => handleChange("agencyName", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>Contact Person Name</label>
                  <input
                    className="cp-input"
                    placeholder="Enter contact person's name"
                    value={form.contactName}
                    onChange={(e) =>
                      handleChange("contactName", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Designation</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., Director, Manager"
                    value={form.designation}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Mobile Number</label>
                  <input
                    className="cp-input"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>Alternate Mobile Number</label>
                  <input
                    className="cp-input"
                    placeholder="Optional"
                    value={form.altMobile}
                    onChange={(e) => handleChange("altMobile", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>Email Address</label>
                  <input
                    className="cp-input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* REAL ESTATE BUSINESS DETAILS */}
          <section className="cp-card">
            <div className="cp-card-header">Real Estate Business Details</div>
            <div className="cp-card-body">
              <div className="cp-grid cp-grid-4">
                <div className="cp-field">
                  <label>Type of Channel Partner</label>
                  <select
                    className="cp-input"
                    value={form.partnerType}
                    onChange={(e) =>
                      handleChange("partnerType", e.target.value)
                    }
                  >
                    <option value="">Select partner type</option>
                    <option value="independent">Independent Broker</option>
                    <option value="agency">Agency</option>
                    <option value="online">Online Portal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="cp-field">
                  <label>RERA Registration Number</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., PRM/KA/RERA/1251/308/PR/18060"
                    value={form.reraNumber}
                    onChange={(e) => handleChange("reraNumber", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>Years of Experience in Real Estate</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 5"
                    value={form.experienceYears}
                    onChange={(e) =>
                      handleChange("experienceYears", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Number of Agents in Team</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 10"
                    value={form.teamAgents}
                    onChange={(e) => handleChange("teamAgents", e.target.value)}
                  />
                </div>
              </div>

              <div className="cp-grid cp-grid-2 cp-mt-16">
                <div className="cp-field">
                  <label>Business Address</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="Enter full business address"
                    value={form.businessAddress}
                    onChange={(e) =>
                      handleChange("businessAddress", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Areas of Operation (Comma-separated)</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="e.g., Bangalore, Mumbai, Delhi-NCR"
                    value={form.operationAreas}
                    onChange={(e) =>
                      handleChange("operationAreas", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="cp-grid cp-grid-2 cp-mt-16">
                <div className="cp-field">
                  <label>Property Categories Dealt In</label>
                  <div className="cp-checkbox-row">
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.catResidential}
                        onChange={() => handleCheckbox("catResidential")}
                      />
                      <span>Residential</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.catCommercial}
                        onChange={() => handleCheckbox("catCommercial")}
                      />
                      <span>Commercial</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.catPlots}
                        onChange={() => handleCheckbox("catPlots")}
                      />
                      <span>Plots</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.catRentals}
                        onChange={() => handleCheckbox("catRentals")}
                      />
                      <span>Rentals</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.catLuxury}
                        onChange={() => handleCheckbox("catLuxury")}
                      />
                      <span>Luxury</span>
                    </label>
                  </div>
                </div>
                <div className="cp-field">
                  <label>Brokerage Percentage / Fee Structure</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 2% of transaction value"
                    value={form.brokerageStructure}
                    onChange={(e) =>
                      handleChange("brokerageStructure", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Lead Source & Sub Source */}
              <div className="cp-grid cp-grid-2 cp-mt-16">
                <div className="cp-field">
                  <label>
                    Lead Source{" "}
                    {loadingSources && (
                      <span style={{ fontSize: 12 }}>(loading...)</span>
                    )}
                  </label>
                  <select
                    className="cp-input"
                    value={form.sourceId}
                    onChange={(e) => handleSourceSelect(e.target.value)}
                  >
                    <option value="">Select source</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cp-field">
                  <label>Sub Source</label>
                  <select
                    className="cp-input"
                    value={form.subSourceId}
                    onChange={(e) =>
                      handleChange("subSourceId", e.target.value)
                    }
                    disabled={!form.sourceId || subSources.length === 0}
                  >
                    <option value="">Select sub source</option>
                    {subSources.map((ss) => (
                      <option key={ss.id} value={ss.id}>
                        {ss.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* SALES PERFORMANCE */}
          <section className="cp-card">
            <div className="cp-card-header">Sales Performance</div>
            <div className="cp-card-body">
              <div className="cp-grid cp-grid-3">
                <div className="cp-field">
                  <label>Average Monthly Closures</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 5"
                    value={form.avgClosures}
                    onChange={(e) =>
                      handleChange("avgClosures", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Annual Sales Volume</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 20 Crore INR"
                    value={form.annualSalesVolume}
                    onChange={(e) =>
                      handleChange("annualSalesVolume", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Top Builder/Developer Associations</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="List major builders/developers you've worked with"
                    value={form.builderAssociations}
                    onChange={(e) =>
                      handleChange("builderAssociations", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="cp-grid cp-grid-2 cp-mt-16">
                <div className="cp-field">
                  <label>Past Project Sales Experience</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="Describe key projects and your role"
                    value={form.pastSalesExperience}
                    onChange={(e) =>
                      handleChange("pastSalesExperience", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Current Inventory or Listings</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="Briefly describe your current active listings or inventory"
                    value={form.currentInventory}
                    onChange={(e) =>
                      handleChange("currentInventory", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* DOCUMENT & COMPLIANCE */}
          <section className="cp-card">
            <div className="cp-card-header">Document &amp; Compliance</div>
            <div className="cp-card-body">
              <div className="cp-grid cp-grid-3">
                <div className="cp-field">
                  <label>PAN / Tax ID</label>
                  <input
                    className="cp-input"
                    placeholder="Enter PAN or Tax ID"
                    value={form.pan}
                    onChange={(e) => handleChange("pan", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>GST Number</label>
                  <input
                    className="cp-input"
                    placeholder="Enter GST number (if applicable)"
                    value={form.gst}
                    onChange={(e) => handleChange("gst", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>Upload RERA Certificate (name only in bulk)</label>
                  <input
                    className="cp-input"
                    type="file"
                    onChange={(e) => handleFile("reraCert", e.target.files)}
                  />
                </div>
                <div className="cp-field">
                  <label>Upload Business License / ID Proof (name only)</label>
                  <input
                    className="cp-input"
                    type="file"
                    onChange={(e) => handleFile("licenseProof", e.target.files)}
                  />
                </div>
              </div>

              <div className="cp-terms-row">
                <label className="cp-checkbox">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={() => handleCheckbox("termsAccepted")}
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#terms" className="cp-link">
                      Terms &amp; Conditions
                    </a>
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* MARKETING & CAPABILITY */}
          <section className="cp-card">
            <div className="cp-card-header">
              Marketing &amp; Capability Information
            </div>
            <div className="cp-card-body">
              <div className="cp-grid cp-grid-3">
                <div className="cp-field">
                  <label>Marketing Strength</label>
                  <div className="cp-checkbox-row">
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.marketingDigital}
                        onChange={() => handleCheckbox("marketingDigital")}
                      />
                      <span>Digital Marketing</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.marketingField}
                        onChange={() => handleCheckbox("marketingField")}
                      />
                      <span>Field Team</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.marketingCalling}
                        onChange={() => handleCheckbox("marketingCalling")}
                      />
                      <span>Calling Team</span>
                    </label>
                    <label className="cp-checkbox">
                      <input
                        type="checkbox"
                        checked={form.marketingSocial}
                        onChange={() => handleCheckbox("marketingSocial")}
                      />
                      <span>Social Media</span>
                    </label>
                  </div>
                </div>
                <div className="cp-field">
                  <label>Team Size (Sales + Support)</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 25"
                    value={form.teamSize}
                    onChange={(e) => handleChange("teamSize", e.target.value)}
                  />
                </div>
              </div>

              <div className="cp-grid cp-grid-3 cp-mt-16">
                <div className="cp-field">
                  <label>CRM Used</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="e.g., Salesforce, Zoho CRM"
                    value={form.crmUsed}
                    onChange={(e) => handleChange("crmUsed", e.target.value)}
                  />
                </div>
                <div className="cp-field">
                  <label>Lead Handling Process</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="Describe your lead handling workflow"
                    value={form.leadHandlingProcess}
                    onChange={(e) =>
                      handleChange("leadHandlingProcess", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Support Required from Developer</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="e.g., Marketing collaterals, Site visit assistance"
                    value={form.supportFromDeveloper}
                    onChange={(e) =>
                      handleChange("supportFromDeveloper", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ADDITIONAL INFORMATION */}
          <section className="cp-card">
            <div className="cp-card-header">Additional Information</div>
            <div className="cp-card-body">
              <div className="cp-grid cp-grid-2">
                <div className="cp-field">
                  <label>Preferred Project Types (Comma-separated)</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., Luxury Apartments, Commercial Office Spaces"
                    value={form.preferredProjectTypes}
                    onChange={(e) =>
                      handleChange("preferredProjectTypes", e.target.value)
                    }
                  />
                </div>
                <div className="cp-field">
                  <label>Preferred Ticket Size</label>
                  <input
                    className="cp-input"
                    placeholder="e.g., 1 - 5 Crore INR"
                    value={form.preferredTicketSize}
                    onChange={(e) =>
                      handleChange("preferredTicketSize", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="cp-grid cp-grid-1 cp-mt-16">
                <div className="cp-field">
                  <label>Comments / Notes</label>
                  <textarea
                    className="cp-textarea"
                    placeholder="Any additional information or comments"
                    value={form.comments}
                    onChange={(e) => handleChange("comments", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SUBMIT + FOOTER */}
          <div className="cp-submit-wrapper">
            <button
              type="submit"
              className="btn-primary cp-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>

          <div className="cp-footer">
            <a href="#terms" className="cp-link">
              Terms &amp; Conditions
            </a>
            <span className="cp-footer-sep">|</span>
            <a href="#privacy" className="cp-link">
              Privacy Policy
            </a>
            <span className="cp-footer-sep">|</span>
            <span>© 2024 Channel Partner Portal</span>
          </div>
        </form>
      </div>

      {/* ---------- PROJECT SELECT MODAL ---------- */}
      {showProjectModal && (
        <div className="cp-project-modal-backdrop">
          <div className="cp-project-modal">
            <div className="cp-project-modal-header">
              <div>
                <h2 className="cp-project-modal-title">Select Project</h2>
                <p className="cp-project-modal-subtitle">
                  Choose a project for which you are registering the Channel
                  Partner.
                </p>
              </div>
              <button
                type="button"
                className="cp-project-modal-close"
                onClick={() => {
                  // If no project selected at all, keep modal open
                  if (!projectId) return;
                  setShowProjectModal(false);
                }}
              >
                ✕
              </button>
            </div>

            {scopeProjects.length === 0 ? (
              <div style={{ padding: "16px 0", color: "#6b7280" }}>
                No projects found in your scope. Please login again or contact
                admin.
              </div>
            ) : (
              <div className="cp-project-grid">
                {scopeProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="cp-project-card"
                    onClick={() => handleProjectSelect(p.id)}
                  >
                    <div className="cp-project-image-wrap">
                      <img
                        src={projectImage}
                        alt={p.name}
                        className="cp-project-image"
                      />
                    </div>
                    <div className="cp-project-info">
                      <div className="cp-project-name">{p.name}</div>
                      <div className="cp-project-meta">
                        Status: {p.status} • Approval: {p.approval_status}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPartnerRegistration;
