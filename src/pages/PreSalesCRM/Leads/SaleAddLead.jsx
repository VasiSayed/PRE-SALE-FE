// src/pages/SaleAddLead.jsx
import React, { useState, useEffect } from "react";
import { SetupAPI, URLS } from "../../../api/endpoints";
import api from "../../../api/axiosInstance";
import { showToast } from "../../../utils/toast";

const SECTION_KEY = "lead_setup";
const SECTION_TITLE = "Lead Setup";

// ---- Field config ----
const FIELDS = [
  // Lead Information
  {
    section: "lead",
    name: "first_name",
    label: "First Name",
    type: "text",
    required: true,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "last_name",
    label: "Last Name",
    type: "text",
    required: true,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "email",
    label: "Email",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "mobile_number",
    label: "Mobile Number",
    type: "text",
    required: true,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "tel_res",
    label: "Tel(Res)",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "tel_office",
    label: "Tel(Office)",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "project_id",
    label: "Project",
    type: "select",
    required: true,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "walking",
    label: "Walk-in Lead",
    type: "checkbox",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "budget",
    label: "Budget",
    type: "number",
    required: false,
    span: 1,
    parse: "number",
  },
  {
    section: "lead",
    name: "annual_income",
    label: "Annual Income",
    type: "number",
    required: false,
    span: 1,
    parse: "number",
  },
  {
    section: "lead",
    name: "company",
    label: "Company",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "lead_classification_id",
    label: "Lead Classification",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_subclass_id",
    label: "Lead Subclass",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_source_id",
    label: "Lead Source",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_sub_source_id",
    label: "Lead Sub Source",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  // 🔹 Channel Partner dropdown (based on source/sub-source)
  {
    section: "lead",
    name: "channel_partner_id",
    label: "Channel Partner",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  // 🔹 Unknown CP text box
  {
    section: "lead",
    name: "unknown_channel_partner",
    label: "Unregistered CP Name",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "lead",
    name: "status_id",
    label: "Status",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "sub_status_id",
    label: "Sub Status",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "lead_owner_id",
    label: "Lead Owner",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "assign_to_id",
    label: "Assign To (User / Round Robin)",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "purpose_id",
    label: "Purpose",
    type: "select",
    required: false,
    span: 1,
    parse: "number",
    options: [],
  },
  {
    section: "lead",
    name: "offering_type",
    label: "Offering Type",
    type: "select",
    required: false,
    span: 1,
    parse: "identity",
    options: [],
  },

  // Address Information
  {
    section: "address",
    name: "flat_no",
    label: "Flat No/ Building",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "area",
    label: "Area",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "pin_code",
    label: "Pin Code",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "city",
    label: "City",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "state",
    label: "State",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },
  {
    section: "address",
    name: "country",
    label: "Country",
    type: "text",
    required: false,
    span: 1,
    parse: "identity",
  },

  // Description Information
  {
    section: "description",
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    span: 3,
    parse: "identity",
  },
];

// ---------- helpers ----------

const ROUND_ROBIN_VALUE = "__ROUND_ROBIN__";

const buildInitialFormState = () => {
  const form = {};
  FIELDS.forEach((field) => {
    form[field.name] = field.type === "checkbox" ? false : "";
  });
  // internal state flag, not rendered as field
  form.round_robin = false;
  return form;
};

const evaluateExpression = (expr, { form, setup, scope }) => {
  if (!expr) return false;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("form", "setup", "scope", `return (${expr});`);
    return !!fn(form, setup, scope);
  } catch {
    return false;
  }
};

const resolvePathFromSetup = (setup, path) => {
  if (!path || !setup) return undefined;
  const keys = path.split(".").filter(Boolean);
  let current = setup;
  for (const k of keys) {
    if (current == null) return undefined;
    current = current[k];
  }
  return current;
};

const normalizeScalarValue = (value, field) => {
  if (value === "" || value === undefined || value === null) return null;

  if (field.parse === "number") {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  if (field.parse === "date") return value || null;

  if (
    field.type === "select" &&
    typeof value === "string" &&
    /^\d+$/.test(value)
  ) {
    return Number(value);
  }

  return value;
};

// =================== MAIN COMPONENT ===================

const SaleAddLead = ({ handleLeadSubmit }) => {
  const [form, setForm] = useState(buildInitialFormState);

  // collapsible groups
  const [openGroups, setOpenGroups] = useState({
    lead: true,
    address: true,
    description: true,
  });

  const [projects, setProjects] = useState([]);
  const [masters, setMasters] = useState(null);
  const [loadingMasters, setLoadingMasters] = useState(false);
const [cpSearch, setCpSearch] = useState("");
  const [channelPartners, setChannelPartners] = useState([]);
  const [loadingCP, setLoadingCP] = useState(false);

  useEffect(() => {
    SetupAPI.myScope()
      .then((data) => {
        const list =
          data?.projects || data?.project_list || data?.results || [];
        setProjects(list);
      })
      .catch((err) => {
        console.error("Failed to load scope", err);
        showToast("Failed to load project scope", "error");
      });
  }, []);

  useEffect(() => {
    if (!form.project_id) {
      setMasters(null);
      return;
    }
    setLoadingMasters(true);
    api
      .get(URLS.leadMasters, {
        params: { project_id: form.project_id },
      })
      .then((res) => {
        setMasters(res.data);
      })
      .catch((err) => {
        console.error("Failed to load lead masters", err);
        showToast("Failed to load lead masters", "error");
      })
      .finally(() => setLoadingMasters(false));
  }, [form.project_id]);

  // ------- when source / sub-source changes, fetch Channel Partners -------
useEffect(() => {
  const sourceId = form.lead_source_id;
  const subSourceId = form.lead_sub_source_id;

  // no source selected => clear
  if (!sourceId) {
    setChannelPartners([]);
    return;
  }

  setLoadingCP(true);

  // path-style URL: /api/channel/partners/by-source/{source_id}/
  const url = `${URLS.channelPartnersBySource}${sourceId}/`;

  const config = subSourceId ? { params: { sub_source_id: subSourceId } } : {};

  api
    .get(url, config)
    .then((res) => {
      const data = res.data;
      let list = [];

      if (Array.isArray(data)) {
        // in case backend ever returns plain list
        list = data;
      } else if (Array.isArray(data.results)) {
        // DRF paginated response
        list = data.results;
      } else {
        list = [];
      }

      setChannelPartners(list);
    })
    .catch((err) => {
      console.error("Failed to load channel partners", err);
      setChannelPartners([]);
      showToast("Failed to load channel partners", "error");
    })
    .finally(() => setLoadingCP(false));
}, [form.lead_source_id, form.lead_sub_source_id]);

  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

const handleChange = (name, value) => {
  setForm((prev) => {
    const next = { ...prev, [name]: value };

    // When main source changes: reset sub-source + CP (but NOT assign_to)
    if (name === "lead_source_id") {
      next.lead_sub_source_id = "";
      next.channel_partner_id = "";
      setCpSearch(""); // <-- NEW
    }

    if (name === "lead_sub_source_id") {
      next.channel_partner_id = "";
      setCpSearch(""); // <-- NEW
    }

    // When Assign To is changed, update internal round_robin flag
    if (name === "assign_to_id") {
      if (value === ROUND_ROBIN_VALUE) {
        next.round_robin = true;
      } else {
        next.round_robin = false;
      }
    }

    return next;
  });
};


  const isFieldHidden = (field) =>
    evaluateExpression(field.hiddenWhen, {
      form,
      setup: { masters, projects },
      scope: null,
    });

  const isFieldDisabled = (field) =>
    evaluateExpression(field.disabledWhen, {
      form,
      setup: { masters, projects },
      scope: null,
    });

  // map masters/projects to select options
  const getOptionsForField = (field) => {
    const toOptions = (items) =>
      (items || []).map((item) => ({
        value: item.id,
        label: item.name || item.label || item.title || `#${item.id}`,
      }));

    // Project select uses my-scope projects
    if (field.name === "project_id") {
      return (projects || []).map((p) => ({
        value: p.id,
        label: p.name || p.project_name || p.title || `Project #${p.id}`,
      }));
    }

    if (!masters) {
      if (field.options && field.options.length) return field.options;
      return [];
    }

    switch (field.name) {
      case "lead_classification_id":
        return toOptions(masters.classifications);

      case "lead_subclass_id": {
        const selectedId = form.lead_classification_id
          ? String(form.lead_classification_id)
          : null;
        const root = (masters.classifications || []).find(
          (c) => String(c.id) === selectedId
        );
        return toOptions(root?.children || root?.subclasses);
      }

      case "lead_source_id":
        return toOptions(masters.sources);

      case "lead_sub_source_id": {
        const selectedId = form.lead_source_id
          ? String(form.lead_source_id)
          : null;
        const root = (masters.sources || []).find(
          (s) => String(s.id) === selectedId
        );
        return toOptions(root?.children || root?.sub_sources);
      }

      case "status_id":
        return toOptions(masters.statuses);

      case "sub_status_id": {
        const selectedId = form.status_id ? String(form.status_id) : null;
        const st = (masters.statuses || []).find(
          (s) => String(s.id) === selectedId
        );
        return toOptions(st?.sub_statuses);
      }

      case "purpose_id":
        return toOptions(masters.purposes);

      case "offering_type":
        return toOptions(masters.offering_types);

      case "lead_owner_id":
        // Owner = normal assign_users list
        return (masters.assign_users || []).map((u) => ({
          value: u.id,
          label: u.name || u.username,
        }));

      case "assign_to_id": {
        // Assign To = ONLY users + special "Round Robin" option
        const userOptions = (masters.assign_users || []).map((u) => ({
          value: u.id,
          label: u.name || u.username,
        }));
        return [
          { value: ROUND_ROBIN_VALUE, label: "Round Robin" },
          ...userOptions,
        ];
      }

      case "channel_partner_id": {
        // Channel Partner dropdown: based on channelPartners API
        const term = (cpSearch || "").toLowerCase();

        let opts = (channelPartners || []).map((cp) => {
          const fullName =
            cp.user?.full_name ||
            [cp.user?.first_name, cp.user?.last_name].filter(Boolean).join(" ");

          const mainLabel =
            fullName || cp.company_name || cp.user?.email || `CP #${cp.id}`;

          const extra =
            cp.company_name && fullName
              ? ` (${cp.company_name})`
              : cp.company_name && !fullName
              ? ` (${cp.company_name})`
              : "";

          return {
            value: cp.id,
            label: `${mainLabel}${extra}`,
          };
        });

        if (term) {
          opts = opts.filter((o) => o.label.toLowerCase().includes(term));
        }

        return opts;
      }

      default: {
        if (field.options && field.options.length) return field.options;

        if (field.optionsFrom) {
          const src = resolvePathFromSetup(
            { masters, projects },
            field.optionsFrom
          );
          if (Array.isArray(src)) {
            const valueKey = field.valueKey || "id";
            const labelKey = field.labelKey || "name";
            return src.map((item) => ({
              value: item[valueKey],
              label: item[labelKey],
            }));
          }
        }
        return [];
      }
    }
  };

  const buildRowsForSection = (sectionName) => {
    const fields = FIELDS.filter((f) => f.section === sectionName);
    const rows = [];
    let currentRow = [];
    let currentSpan = 0;

    fields.forEach((field) => {
      if (isFieldHidden(field)) return;

      const span = field.span || 1;
      if (currentSpan + span > 3) {
        rows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }
      currentRow.push(field);
      currentSpan += span;
    });

    if (currentRow.length) rows.push(currentRow);
    return rows;
  };

  const validateRequired = () => {
    const missing = [];

    FIELDS.forEach((field) => {
      if (!field.required || isFieldHidden(field)) return;
      const v = form[field.name];
      if (v === "" || v === null || v === undefined) {
        missing.push(field.label);
      }
    });

    if (missing.length) {
      window.alert("Please fill required fields");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const payload = {};
    FIELDS.forEach((field) => {
      if (isFieldHidden(field)) return;
      const raw = form[field.name];
      payload[field.name] = normalizeScalarValue(raw, field);
    });
    return payload;
  };

  // const onSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!validateRequired()) return;

  //   const isRoundRobin = form.assign_to_id === ROUND_ROBIN_VALUE;

  //   const normalized = buildPayload();

  //   if (!normalized.project_id) {
  //     showToast("Please select a project", "error");
  //     return;
  //   }

  //   // Per your note:
  //   //  - Round Robin ON  => round_robin: true, assign_to: []
  //   //  - Round Robin OFF => round_robin: false, assign_to: <user_id|null>
  //   const assignToValue = isRoundRobin
  //     ? []
  //     : normalized.assign_to_id || null;

  //   // ✅ Backend ab sirf `project` expect karta hai
  //   const leadPayload = {
  //     project: normalized.project_id,

  //     first_name: normalized.first_name || null,
  //     last_name: normalized.last_name || null,

  //     email: normalized.email,
  //     mobile_number: normalized.mobile_number,
  //     tel_res: normalized.tel_res,
  //     tel_office: normalized.tel_office,

  //     company: normalized.company,
  //     budget: normalized.budget,
  //     annual_income: normalized.annual_income,

  //     // taxonomy
  //     classification: normalized.lead_classification_id,
  //     sub_classification: normalized.lead_subclass_id,
  //     source: normalized.lead_source_id,
  //     sub_source: normalized.lead_sub_source_id,
  //     status: normalized.status_id,
  //     sub_status: normalized.sub_status_id,
  //     purpose: normalized.purpose_id,

  //     // owners
  //     current_owner: normalized.lead_owner_id || null,
  //     // first_owner: normalized.lead_owner_id || null,  // if you want

  //     // 🔹 CP / walking / round-robin
  //     channel_partner: normalized.channel_partner_id || null,
  //     unknown_channel_partner: normalized.channel_partner_id
  //       ? null
  //       : normalized.unknown_channel_partner || "",
  //     walking: !!normalized.walking,
  //     round_robin: isRoundRobin,

  //     assign_to: assignToValue,

  //     offering_types:
  //       normalized.offering_type != null && normalized.offering_type !== ""
  //         ? [normalized.offering_type]
  //         : [],

  //     address: {
  //       flat_or_building: normalized.flat_no || "",
  //       area: normalized.area || "",
  //       pincode: normalized.pin_code || "",
  //       city: normalized.city || "",
  //       state: normalized.state || "",
  //       country: normalized.country || "",
  //       description: normalized.description || "",
  //     },
  //   };

  //   const body = {
  //     lead: leadPayload,
  //     first_update: {
  //       title: "Lead created",
  //       info: `${normalized.first_name || ""} ${
  //         normalized.last_name || ""
  //       }`.trim(),
  //     },
  //   };

  //   try {
  //     const res = await api.post(URLS.salesLeadBundleCreate, body);
  //     showToast("Lead saved successfully", "success");

  //     if (typeof handleLeadSubmit === "function") {
  //       handleLeadSubmit(res.data);
  //     }

  //     setForm(buildInitialFormState());
  //     setMasters(null);
  //     setChannelPartners([]);
  //   } catch (err) {
  //     console.error("Failed to save lead", err);

  //     let msg = "Failed to save lead. Please check the data.";
  //     const data = err?.response?.data;
  //     if (data) {
  //       if (typeof data === "string") msg = data;
  //       else if (data.detail) msg = data.detail;
  //       else if (data.lead && typeof data.lead === "object") {
  //         const firstKey = Object.keys(data.lead)[0];
  //         const firstVal = data.lead[firstKey];
  //         msg = Array.isArray(firstVal) ? firstVal.join(" ") : String(firstVal);
  //       }
  //     }

  //     showToast(msg, "error");
  //   }
  // };


  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateRequired()) return;

    // 1) Check Round Robin from raw form value (before normalization)
    const isRoundRobin = form.assign_to_id === ROUND_ROBIN_VALUE;

    // 2) Normalize all form fields
    const normalized = buildPayload();

    if (!normalized.project_id) {
      showToast("Please select a project", "error");
      return;
    }

    // 3) Build lead payload for backend
    const leadPayload = {
      project: normalized.project_id,

      first_name: normalized.first_name || null,
      last_name: normalized.last_name || null,

      email: normalized.email,
      mobile_number: normalized.mobile_number,
      tel_res: normalized.tel_res,
      tel_office: normalized.tel_office,

      company: normalized.company,
      budget: normalized.budget,
      annual_income: normalized.annual_income,

      // taxonomy
      classification: normalized.lead_classification_id,
      sub_classification: normalized.lead_subclass_id,
      source: normalized.lead_source_id,
      sub_source: normalized.lead_sub_source_id,
      status: normalized.status_id,
      sub_status: normalized.sub_status_id,
      purpose: normalized.purpose_id,

      // owners
      current_owner: normalized.lead_owner_id || null,
      // first_owner: normalized.lead_owner_id || null,  // if you decide to use

      // CP / walking / round-robin
      channel_partner: normalized.channel_partner_id || null,
      unknown_channel_partner: normalized.channel_partner_id
        ? null
        : normalized.unknown_channel_partner || "",
      walking: !!normalized.walking,
      round_robin: isRoundRobin,

      // offering types as array
      offering_types:
        normalized.offering_type != null && normalized.offering_type !== ""
          ? [normalized.offering_type]
          : [],

      address: {
        flat_or_building: normalized.flat_no || "",
        area: normalized.area || "",
        pincode: normalized.pin_code || "",
        city: normalized.city || "",
        state: normalized.state || "",
        country: normalized.country || "",
        description: normalized.description || "",
      },
    };

    // 4) Only send assign_to when NOT round-robin
    //    Backend rule: either assign_to OR round_robin, not both.
    if (
      !isRoundRobin &&
      normalized.assign_to_id != null &&
      normalized.assign_to_id !== ""
    ) {
      leadPayload.assign_to = normalized.assign_to_id; // single user id
    }
    // If isRoundRobin === true => we don't set assign_to at all

    const body = {
      lead: leadPayload,
      first_update: {
        title: "Lead created",
        info: `${normalized.first_name || ""} ${
          normalized.last_name || ""
        }`.trim(),
      },
    };

try {
  const res = await api.post(URLS.salesLeadBundleCreate, body);
  console.log("✅ Lead create success", res.data); // <--- add this

  showToast("Lead saved successfully", "success");

  if (typeof handleLeadSubmit === "function") {
    handleLeadSubmit(res.data);
  }

  setForm(buildInitialFormState());
  setMasters(null);
  setChannelPartners([]);
} catch (err) {
  console.error("Failed to save lead", err);

  let msg = "Failed to save lead. Please check the data.";
  const data = err?.response?.data;
  if (data) {
    if (typeof data === "string") msg = data;
    else if (data.detail) msg = data.detail;
    else if (data.lead && typeof data.lead === "object") {
      const firstKey = Object.keys(data.lead)[0];
      const firstVal = data.lead[firstKey];
      msg = Array.isArray(firstVal) ? firstVal.join(" ") : String(firstVal);
    }
  }

  showToast(msg, "error");
}
  };



  const handleCancel = () => {
    setForm(buildInitialFormState());
    setMasters(null);
    setChannelPartners([]);
  };

  const renderField = (field) => {
    const id = `${SECTION_KEY}_${field.name}`;
    const disabledExpr = isFieldDisabled(field);

    const extraDisabled =
      (field.name !== "project_id" && !masters && loadingMasters) ||
      (field.name === "channel_partner_id" && loadingCP);

    const disabled = disabledExpr || extraDisabled;

    const baseInputClass =
      "form-input" + (disabled ? " form-input-disabled" : "");
    const label = (
      <label htmlFor={id} className="form-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>
    );

    // ---------- CHECKBOX ----------
    if (field.type === "checkbox") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          <label className="form-label checkbox-label">
            <input
              id={id}
              type="checkbox"
              checked={!!form[field.name]}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={disabled}
              style={{ marginRight: "8px" }}
            />
            {field.label}
          </label>
        </div>
      );
    }

    // ---------- TEXTAREA ----------
    if (field.type === "textarea") {
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          {label}
          <textarea
            id={id}
            className="form-textarea"
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={disabled}
          />
        </div>
      );
    }

    // ---------- SELECT ----------
    if (field.type === "select") {
      const options = getOptionsForField(field);
      return (
        <div
          key={field.name}
          className={field.span === 3 ? "form-field-full" : "form-field"}
        >
          {label}
          <select
            id={id}
            className={baseInputClass}
            value={form[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={disabled}
          >
            <option value="">
              {field.name === "project_id"
                ? "Select project"
                : field.name === "channel_partner_id" && loadingCP
                ? "Loading..."
                : loadingMasters && field.name !== "project_id"
                ? "Loading..."
                : "Select"}
            </option>

            {options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // ---------- TEXT / NUMBER / DATE ----------
    return (
      <div
        key={field.name}
        className={field.span === 3 ? "form-field-full" : "form-field"}
      >
        {label}
        <input
          id={id}
          className={baseInputClass}
          type={field.type === "number" ? "number" : field.type || "text"}
          value={form[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  };

  const renderSectionGroup = (groupKey, title) => {
    const rows = buildRowsForSection(groupKey);
    if (!rows.length) return null;

    const open = openGroups[groupKey];

    return (
      <div style={{ marginBottom: "12px" }}>
        <button
          type="button"
          className="section-header"
          onClick={() => toggleGroup(groupKey)}
        >
          <div className="section-title">{title}</div>
          <div className={`chevron-icon ${open ? "open" : ""}`}>⌄</div>
        </button>

        {open && (
          <div style={{ marginTop: "10px" }}>
            {rows.map((row, idx) => {
              const totalSpan = row.reduce((sum, f) => sum + (f.span || 1), 0);
              const rowClass =
                totalSpan === 2 && row.length <= 2 ? "form-row-2" : "form-row";

              return (
                <div key={`${groupKey}_${idx}`} className={rowClass}>
                  {row.map((field) => renderField(field))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="setup-section" id={SECTION_KEY}>
      <div className="section-content">
        <form onSubmit={onSubmit}>
          {renderSectionGroup("lead", "Lead Information")}
          {renderSectionGroup("address", "Address Information")}
          {renderSectionGroup("description", "Description Information")}
          {/* Buttons row */}
          <div className="form-row">
            <div className="form-field-full">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "40px",
                  marginTop: "40px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button type="submit" className="btn-primary">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleAddLead;