// src/pages/CostSheet/CostSheetCreate.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import "./CostSheetCreate.css";

// Generic collapsible section with chevron
const SectionCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`cs-card ${open ? "cs-card-open" : "cs-card-closed"}`}>
      <button
        type="button"
        className="cs-card-header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <h2 className="cs-section-title">{title}</h2>
        <span className={`cs-chevron ${open ? "cs-chevron-open" : ""}`} />
      </button>

      {open && <div className="cs-card-body">{children}</div>}
    </section>
  );
};

const CostSheetCreate = () => {
  const { leadId } = useParams(); // route: /cost-sheets/create/:leadId

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
 const [initError, setInitError] = useState("");

  // ----------- API data -----------
  const [lead, setLead] = useState(null);
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [offers, setOffers] = useState([]);

  const [towers, setTowers] = useState([]); // nested tower -> floor -> inventories
  const [inventoryMap, setInventoryMap] = useState({}); // inventory_id -> inventory

  // dates from backend
  const [apiToday, setApiToday] = useState(""); // "today" from init API
  const [validTillLimit, setValidTillLimit] = useState(""); // max allowed valid_till

  // ----------- Header form -----------
  const [quotationDate, setQuotationDate] = useState("");
  const [validTill, setValidTill] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [preparedBy, setPreparedBy] = useState("");
 const [quotationNo, setQuotationNo] = useState("");
  // ----------- Attachments -----------
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // ----------- Customer & Unit section -----------
  const [customerName, setCustomerName] = useState("");
  const [customerContactPerson, setCustomerContactPerson] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [projectName, setProjectName] = useState("");
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState("");

  const [towerName, setTowerName] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [unitNo, setUnitNo] = useState("");

  // ----------- Base pricing -----------
  const [areaBasis, setAreaBasis] = useState("RERA"); // RERA / CARPET / SALEABLE
  const [baseAreaSqft, setBaseAreaSqft] = useState("");
  const [baseRatePsf, setBaseRatePsf] = useState(""); // from project.price_per_sqft
  const [discountPercent, setDiscountPercent] = useState("");

  const baseValue = useMemo(() => {
    const a = parseFloat(baseAreaSqft) || 0;
    const r = parseFloat(baseRatePsf) || 0;
    return a * r;
  }, [baseAreaSqft, baseRatePsf]);

  const discountAmount = useMemo(() => {
    const bv = baseValue || 0;
    const dp = parseFloat(discountPercent) || 0;
    return (bv * dp) / 100;
  }, [baseValue, discountPercent]);

  const netBaseValue = useMemo(() => {
    return baseValue - (discountAmount || 0);
  }, [baseValue, discountAmount]);

  // ----------- Payment plan -----------
  const [paymentPlanType, setPaymentPlanType] = useState("MASTER"); // MASTER or CUSTOM
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planRows, setPlanRows] = useState([]); // {name, percentage, due_date, slab_id?}
  const [planError, setPlanError] = useState("");

  const totalPercentage = useMemo(
    () =>
      planRows.reduce((sum, row) => sum + (parseFloat(row.percentage) || 0), 0),
    [planRows]
  );

  // ----------- Additional charges -----------
  const [charges, setCharges] = useState([
    { name: "Amenity Charges", type: "Fixed", value: "", amount: "" },
  ]);

  const additionalChargesTotal = useMemo(
    () => charges.reduce((sum, c) => sum + (parseFloat(c.amount || 0) || 0), 0),
    [charges]
  );

  const amountBeforeTaxes = useMemo(
    () => (netBaseValue || 0) + (additionalChargesTotal || 0),
    [netBaseValue, additionalChargesTotal]
  );

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(files);
  };

  // ----------- Taxes toggle -----------
  const [taxes, setTaxes] = useState({
    gst: true,
    stampDuty: true,
    registration: true,
    legalFees: true,
  });

  // derived tax amounts based on toggles + template
  const {
    gstAmount,
    stampAmount,
    registrationAmountCalc,
    legalAmountCalc,
    totalTaxes,
    finalAmount,
  } = useMemo(() => {
    const taxBase = amountBeforeTaxes || 0;

    const gstPercent =
      taxes.gst && template?.gst_percent
        ? parseFloat(template.gst_percent) || 0
        : 0;

    const stampPercent =
      taxes.stampDuty && template?.stamp_duty_percent
        ? parseFloat(template.stamp_duty_percent) || 0
        : 0;

    const gstVal = (taxBase * gstPercent) / 100;
    const stampVal = (taxBase * stampPercent) / 100;

    const regVal =
      taxes.registration && template?.registration_amount
        ? parseFloat(template.registration_amount) || 0
        : 0;

    const legalVal =
      taxes.legalFees && template?.legal_fee_amount
        ? parseFloat(template.legal_fee_amount) || 0
        : 0;

    const totalTax = gstVal + stampVal + regVal + legalVal;
    const final = taxBase + totalTax;

    return {
      gstAmount: gstVal,
      stampAmount: stampVal,
      registrationAmountCalc: regVal,
      legalAmountCalc: legalVal,
      totalTaxes: totalTax,
      finalAmount: final,
    };
  }, [amountBeforeTaxes, taxes, template]);

  // ----------- Text sections -----------
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // ==============================
  // Load username from localStorage for "Prepared by"
  // ==============================
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        const name = u?.username || u?.full_name || "";
        if (name) setPreparedBy(name);
      }
    } catch (e) {
      console.warn("Could not read user from localStorage", e);
    }
  }, []);

  // ==============================
  // 1) Load init + inventory data
  // ==============================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setInitError("");


        // ---- Lead init ----
        const initRes = await api.get(`/costsheet/lead/${leadId}/init/`);
        const data = initRes.data;

        setLead(data.lead);
        setProject(data.project);
        setTemplate(data.template);
        setPaymentPlans(data.payment_plans || []);
        setOffers(data.offers || []);

        setApiToday(data.today);
        setQuotationDate(data.today);
        setValidTill(data.valid_till);
        setValidTillLimit(data.valid_till);

        setCustomerName(data.lead.full_name || "");
        setCustomerContactPerson(data.lead.full_name || "");
        setCustomerPhone(data.lead.mobile_number || "");
        setCustomerEmail(data.lead.email || "");

        setProjectName(data.project.name || "");
        setBaseRatePsf(
          data.project.price_per_sqft ? data.project.price_per_sqft : ""
        );

        if (data.template) {
          setTermsAndConditions(data.template.terms_and_conditions || "");
        }

        // ---- Inventory (nested tower -> floor -> inventories) ----
        const invRes = await api.get("/costsheet/available-inventory/", {
          params: {
            project_id: data.project.id,
            lead_id: data.lead.id,
          },
        });

        const invData = invRes.data;
        const towersList = invData.results || [];
        setTowers(towersList);

        // Flatten inventory lookup map
        const map = {};
        towersList.forEach((t) => {
          (t.floors || []).forEach((f) => {
            (f.inventories || []).forEach((inv) => {
              map[String(inv.inventory_id)] = {
                ...inv,
                tower_id: t.tower_id,
                tower_name: t.tower_name,
                floor_id: f.floor_id,
                floor_number: f.floor_number,
              };
            });
          });
        });
        setInventoryMap(map);
      } catch (err) {
        console.error(err);
        setInitError("Failed to load cost sheet init data.");
        toast.error("Failed to load cost sheet init data.");
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      load();
    }
  }, [leadId]);

  // ==============================
  // 2) Inventory select handlers
  // ==============================
  const handleTowerChange = (e) => {
    const value = e.target.value;
    setSelectedTowerId(value);
    setSelectedFloorId("");
    setSelectedInventoryId("");
    setTowerName(
      towers.find((t) => String(t.tower_id) === value)?.tower_name || ""
    );
  };

  const handleFloorChange = (e) => {
    const value = e.target.value;
    setSelectedFloorId(value);
    setSelectedInventoryId("");
    const tower = towers.find((t) => String(t.tower_id) === selectedTowerId);
    const floor =
      tower?.floors.find((f) => String(f.floor_id) === value) || null;
    setFloorNumber(floor?.floor_number || "");
  };

  const handleInventoryChange = (e) => {
    const value = e.target.value;
    setSelectedInventoryId(value);

    const inv = inventoryMap[String(value)];
    if (!inv) return;

    setSelectedTowerId(String(inv.tower_id || ""));
    setTowerName(inv.tower_name || "");
    setSelectedFloorId(String(inv.floor_id || ""));
    setFloorNumber(inv.floor_number || "");
    setUnitNo(inv.unit_no || "");

    // area basis: RERA preferred, else saleable, else carpet
    let area = inv.rera_area_sqft || inv.saleable_sqft || inv.carpet_sqft || "";
    setAreaBasis(inv.rera_area_sqft ? "RERA" : "SALEABLE");
    setBaseAreaSqft(area || "");
  };

  const selectedTower = towers.find(
    (t) => String(t.tower_id) === String(selectedTowerId)
  );
  const floors = selectedTower ? selectedTower.floors || [] : [];
  const selectedFloor = floors.find(
    (f) => String(f.floor_id) === String(selectedFloorId)
  );
  const inventories = selectedFloor ? selectedFloor.inventories || [] : [];

  // ==============================
  // 3) Payment plan handlers
  // ==============================
  const handlePlanSelect = (e) => {
    const value = e.target.value;
    setSelectedPlanId(value);
    setPlanError("");

    const plan = paymentPlans.find((p) => String(p.id) === String(value));
    if (!plan) {
      setPlanRows([]);
      return;
    }

    const rows = (plan.slabs || []).map((slab) => ({
      slab_id: slab.id,
      name: slab.name,
      percentage: slab.percentage,
      due_date: "",
    }));
    setPlanRows(rows);
  };

  const handlePlanRowChange = (index, field, value) => {
    setPlanError("");
    const updated = [...planRows];
    updated[index] = { ...updated[index], [field]: value };
    setPlanRows(updated);
  };

  const addInstallment = () => {
    setPlanRows((rows) => [
      ...rows,
      { slab_id: null, name: "", percentage: "", due_date: "" },
    ]);
  };

  const removeInstallment = (index) => {
    setPlanError("");
    setPlanRows((rows) => rows.filter((_, i) => i !== index));
  };

  // ==============================
  // 4) Charges / Taxes handlers
  // ==============================
  const handleChargesChange = (index, field, value) => {
    const updated = [...charges];
    updated[index][field] = value;
    setCharges(updated);
  };

  const addCharge = () => {
    setCharges([
      ...charges,
      { name: "", type: "Fixed", value: "", amount: "" },
    ]);
  };

  const handleTaxChange = (name) => {
    setTaxes((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // ==============================
  // 5) Date handlers (validation)
  // ==============================
  const handleQuotationDateChange = (e) => {
    const value = e.target.value;

    // ❌ Quoted date cannot be before today
    if (apiToday && value < apiToday) {
      toast.error("Quoted date cannot be before today.");
      setQuotationDate(apiToday);
      return;
    }

    // ❌ Quoted date cannot be after valid till
    if (validTill && value > validTill) {
      toast.error("Quoted date cannot be after Valid Until date.");
      setQuotationDate(validTill);
      return;
    }

    setQuotationDate(value);
  };

  const handleValidTillChange = (e) => {
    const value = e.target.value;

    // ❌ cannot be before today
    if (apiToday && value < apiToday) {
      toast.error("Valid until cannot be before today.");
      setValidTill(apiToday);
      return;
    }

    // ❌ cannot go beyond template validity
    if (validTillLimit && value > validTillLimit) {
      toast.error("Valid until cannot go beyond allowed validity.");
      setValidTill(validTillLimit);
      return;
    }

    // ❌ cannot be before quotation date
    if (quotationDate && value < quotationDate) {
      toast.error("Valid until cannot be before quoted date.");
      setValidTill(quotationDate);
      return;
    }

    setValidTill(value);
  };

  // ==============================
  // 6) Save (POST)
  // ==============================
  const handleSave = async () => {
    if (!lead || !project) {
      toast.error("Lead / project not loaded.");
      return;
    }
    if (!selectedInventoryId) {
      toast.error("Please select an inventory/unit.");
      return;
    }

    
 if (!quotationNo.trim()) {
    toast.error("Quotation number is required.");
    return;
  }

    // Quoted date cannot be after valid_till
    if (quotationDate && validTill && quotationDate > validTill) {
      toast.error("Quote date cannot be after Valid Until date.");
      return;
    }

    // Whatever plan type: if rows present, total must be 100
    if (planRows.length && Math.round(totalPercentage * 1000) !== 100000) {
      toast.error("Total payment plan percentage must be exactly 100%.");
      return;
    }

    try {
      setSaving(true);

      // Build payload for CostSheetCreateAPIView
      // const payload = {
      //   project_id: project.id,
      //   lead_id: lead.id,
      //   inventory_id: Number(selectedInventoryId),
      //   project_template_id: template ? template.project_template_id : null,
      //   quotation_no: quotationNo.trim(),

      //   date: quotationDate,
      //   valid_till: validTill,
      //   status: status,
      //   prepared_by: null, 

      //   customer_name: customerName,
      //   customer_contact_person: customerContactPerson,
      //   customer_phone: customerPhone,
      //   customer_email: customerEmail,

      //   project_name: projectName,
      //   tower_name: towerName,
      //   floor_number: floorNumber,
      //   unit_no: unitNo,

      //   base_area_sqft: baseAreaSqft || null,
      //   base_rate_psf: baseRatePsf || null,
      //   base_value: baseValue || null,
      //   discount_percent: discountPercent || null,
      //   discount_amount: discountAmount || null,
      //   net_base_value: netBaseValue || null,

      //   payment_plan_type: paymentPlanType, // MASTER or CUSTOM
      //   payment_plan:
      //     paymentPlanType === "MASTER" ? selectedPlanId || null : null,
      //   custom_payment_plan:
      //     paymentPlanType === "CUSTOM"
      //       ? planRows.map((row) => ({
      //           name: row.name,
      //           percentage: row.percentage,
      //           amount:
      //             netBaseValue && row.percentage
      //               ? (
      //                   (netBaseValue * parseFloat(row.percentage || 0)) /
      //                   100
      //                 ).toFixed(2)
      //               : null,
      //           due_date: row.due_date || null,
      //         }))
      //       : null,

      //   gst_percent: taxes.gst && template ? template.gst_percent : null,
      //   gst_amount: taxes.gst ? gstAmount || null : null,
      //   stamp_duty_percent:
      //     taxes.stampDuty && template ? template.stamp_duty_percent : null,
      //   stamp_duty_amount: taxes.stampDuty ? stampAmount || null : null,
      //   registration_amount: taxes.registration
      //     ? registrationAmountCalc || null
      //     : null,
      //   legal_fee_amount: taxes.legalFees ? legalAmountCalc || null : null,

      //   additional_charges_total: additionalChargesTotal || null,
      //   offers_total: null, // can be filled later when offers applied
      //   net_payable_amount: finalAmount || null,

      //   terms_and_conditions: termsAndConditions,
      //   notes: internalNotes,
      // };

      const payload = {
        // FK inputs – MUST be *_id to match serializer
        lead_id: lead.id,
        project_id: project.id,
        inventory_id: Number(selectedInventoryId),
        project_template_id: template ? template.project_template_id : null,

        quotation_no: quotationNo.trim(),
        date: quotationDate,
        valid_till: validTill,
        status,

        customer_name: customerName,
        customer_contact_person: customerContactPerson,
        customer_phone: customerPhone,
        customer_email: customerEmail,

        project_name: projectName,
        tower_name: towerName,
        floor_number: floorNumber,
        unit_no: unitNo,

        base_area_sqft: baseAreaSqft || null,
        base_rate_psf: baseRatePsf || null,
        base_value: baseValue || null,
        discount_percent: discountPercent || null,
        discount_amount: discountAmount || null,
        net_base_value: netBaseValue || null,

        payment_plan_type: paymentPlanType,
        payment_plan:
          paymentPlanType === "MASTER" ? selectedPlanId || null : null,
        custom_payment_plan:
          paymentPlanType === "CUSTOM"
            ? planRows.map((row) => ({
                name: row.name,
                percentage: row.percentage,
                amount:
                  netBaseValue && row.percentage
                    ? (
                        (netBaseValue * parseFloat(row.percentage || 0)) /
                        100
                      ).toFixed(2)
                    : null,
                due_date: row.due_date || null,
              }))
            : null,

        gst_percent: taxes.gst && template ? template.gst_percent : null,
        gst_amount: taxes.gst ? gstAmount || null : null,
        stamp_duty_percent:
          taxes.stampDuty && template ? template.stamp_duty_percent : null,
        stamp_duty_amount: taxes.stampDuty ? stampAmount || null : null,
        registration_amount: taxes.registration
          ? registrationAmountCalc || null
          : null,
        legal_fee_amount: taxes.legalFees ? legalAmountCalc || null : null,

        additional_charges_total: additionalChargesTotal || null,
        offers_total: null,
        net_payable_amount: finalAmount || null,

        terms_and_conditions: termsAndConditions,
        notes: internalNotes,
      };

      await api.post("/costsheet/cost-sheets/all/", payload);

      toast.success("Cost Sheet created successfully.");
      // navigate if needed
    } catch (err) {
      console.error(err);
      toast.error("Failed to create cost sheet.");
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // RENDER
  // ==============================
  if (loading) {
    return <div className="cs-page">Loading...</div>;
  }

  if (initError) {
    return <div className="cs-page">Error: {initError}</div>;
  }

  return (
    <div className="cs-page">
      <div className="cs-page-inner">
        {/* QUOTATION HEADER */}
        <SectionCard title="Quotation Header">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Quotation No</label>
              <input
                type="text"
                className="cs-input"
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
                placeholder="Enter quotation number"
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Quote Date</label>
              <input
                type="date"
                className="cs-input"
                value={quotationDate}
                onChange={handleQuotationDateChange}
                min={apiToday || undefined}
                max={validTill || validTillLimit || undefined}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Valid Until</label>
              <input
                type="date"
                className="cs-input"
                value={validTill}
                onChange={handleValidTillChange}
                min={apiToday || undefined}
                max={validTillLimit || undefined}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Status</label>
              <select
                className="cs-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="cs-field cs-field--full">
              <label className="cs-label">Prepared By</label>
              <input
                type="text"
                className="cs-input"
                value={preparedBy}
                readOnly
                placeholder="Will be auto set from logged-in user"
              />
            </div>
          </div>
        </SectionCard>

        {/* CUSTOMER & UNIT DETAILS */}
        <SectionCard title="Customer & Unit Details">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Customer Name</label>
              <input
                type="text"
                className="cs-input"
                value={customerName}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Contact Person</label>
              <input
                type="text"
                className="cs-input"
                value={customerContactPerson}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Phone</label>
              <input
                type="text"
                className="cs-input"
                value={customerPhone}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Email</label>
              <input
                type="email"
                className="cs-input"
                value={customerEmail}
                readOnly
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Project</label>
              <input
                type="text"
                className="cs-input"
                value={projectName}
                readOnly
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Tower</label>
              <select
                className="cs-select"
                value={selectedTowerId}
                onChange={handleTowerChange}
              >
                <option value="">Select Tower</option>
                {towers.map((t) => (
                  <option key={t.tower_id} value={t.tower_id}>
                    {t.tower_name || `Tower ${t.tower_id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-field">
              <label className="cs-label">Floor</label>
              <select
                className="cs-select"
                value={selectedFloorId}
                onChange={handleFloorChange}
              >
                <option value="">Select Floor</option>
                {floors.map((f) => (
                  <option key={f.floor_id} value={f.floor_id}>
                    {f.floor_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="cs-field">
              <label className="cs-label">Unit</label>
              <select
                className="cs-select"
                value={selectedInventoryId}
                onChange={handleInventoryChange}
              >
                <option value="">Select Unit</option>
                {inventories.map((inv) => (
                  <option key={inv.inventory_id} value={inv.inventory_id}>
                    {inv.unit_no} ({inv.configuration})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* BASE PRICING */}
        <SectionCard title="Base Pricing">
          <div className="cs-grid-3">
            <div className="cs-field">
              <label className="cs-label">Area Basis</label>
              <select
                className="cs-select"
                value={areaBasis}
                onChange={(e) => setAreaBasis(e.target.value)}
              >
                <option value="RERA">RERA Area</option>
                <option value="CARPET">Carpet Area</option>
                <option value="SALEABLE">Saleable Area</option>
              </select>
            </div>
            <div className="cs-field">
              <label className="cs-label">Area (sq. ft.)</label>
              <input
                type="number"
                className="cs-input"
                value={baseAreaSqft}
                onChange={(e) => setBaseAreaSqft(e.target.value)}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">
                Base Rate/sq. ft.{" "}
                {project?.price_per_sqft && (
                  <span className="cs-hint">
                    (Project: {project.price_per_sqft})
                  </span>
                )}
              </label>
              <input
                type="number"
                className="cs-input"
                value={baseRatePsf}
                onChange={(e) => setBaseRatePsf(e.target.value)}
              />
            </div>

            <div className="cs-field">
              <label className="cs-label">Base Value</label>
              <input
                type="text"
                className="cs-input cs-input--currency"
                value={baseValue ? baseValue.toFixed(2) : ""}
                readOnly
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Discount (%)</label>
              <input
                type="number"
                className="cs-input"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Discount Amount</label>
              <input
                type="text"
                className="cs-input cs-input--currency"
                value={discountAmount ? discountAmount.toFixed(2) : ""}
                readOnly
              />
            </div>

            <div className="cs-field cs-field--full">
              <label className="cs-label">Net Base Value</label>
              <input
                type="text"
                className="cs-input cs-input--currency"
                value={netBaseValue ? netBaseValue.toFixed(2) : ""}
                readOnly
              />
            </div>
          </div>
        </SectionCard>

        {/* PAYMENT PLAN */}
        <SectionCard title="Payment Plan">
          {/* Master vs Custom toggle */}
          <div className="cs-radio-group" style={{ marginBottom: 16 }}>
            <label className="cs-radio">
              <input
                type="radio"
                value="MASTER"
                checked={paymentPlanType === "MASTER"}
                onChange={() => setPaymentPlanType("MASTER")}
              />
              <span>Use Project Payment Plan</span>
            </label>
            <label className="cs-radio">
              <input
                type="radio"
                value="CUSTOM"
                checked={paymentPlanType === "CUSTOM"}
                onChange={() => setPaymentPlanType("CUSTOM")}
              />
              <span>Make Your Own Plan</span>
            </label>
          </div>

          {/* Plan dropdown only for MASTER mode */}
          {paymentPlanType === "MASTER" && (
            <div
              className="cs-field cs-field--full"
              style={{ marginBottom: 16 }}
            >
              <label className="cs-label">Select Payment Plan</label>
              <select
                className="cs-select"
                value={selectedPlanId}
                onChange={handlePlanSelect}
              >
                <option value="">-- Select Plan --</option>
                {paymentPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.code}) – {plan.total_percentage}%
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="cs-table">
            <div className="cs-table-row cs-table-row--5 cs-table-header">
              <div>Installment Name</div>
              <div>Percentage</div>
              <div>Amount</div>
              <div>Due Date</div>
              <div></div> {/* delete column header (empty) */}
            </div>

            {planRows.map((row, index) => {
              const pct = parseFloat(row.percentage) || 0;
              const amount = netBaseValue ? (netBaseValue * pct) / 100 : 0;

              return (
                <div className="cs-table-row cs-table-row--5" key={index}>
                  <div>
                    <input
                      type="text"
                      className="cs-input"
                      value={row.name}
                      onChange={(e) =>
                        handlePlanRowChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      className="cs-input"
                      value={row.percentage}
                      onChange={(e) =>
                        handlePlanRowChange(index, "percentage", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="cs-input cs-input--currency"
                      value={amount ? amount.toFixed(2) : ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      className="cs-input"
                      value={row.due_date}
                      min={apiToday || undefined}
                      onChange={(e) =>
                        handlePlanRowChange(index, "due_date", e.target.value)
                      }
                    />
                  </div>
                  <div className="cs-table-cell-actions">
                    <button
                      type="button"
                      className="cs-icon-button"
                      onClick={() => removeInstallment(index)}
                      aria-label="Remove installment"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show warning ONLY when total % != 100 */}
          {totalPercentage !== 100 && (
            <div className="cs-total-percentage">
              Total Percentage: {totalPercentage.toFixed(3)}% (should be 100%)
            </div>
          )}

          <button
            type="button"
            className="cs-button cs-button-outline"
            onClick={addInstallment}
          >
            + Add Installment
          </button>
        </SectionCard>

        {/* ADDITIONAL CHARGES */}
        <SectionCard title="Additional Charges">
          <div className="cs-table">
            <div className="cs-table-row cs-table-header">
              <div>Charge Name</div>
              <div>Type</div>
              <div>Value</div>
              <div>Amount</div>
            </div>
            {charges.map((row, index) => (
              <div className="cs-table-row" key={index}>
                <div>
                  <input
                    type="text"
                    className="cs-input"
                    value={row.name}
                    onChange={(e) =>
                      handleChargesChange(index, "name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <select
                    className="cs-select"
                    value={row.type}
                    onChange={(e) =>
                      handleChargesChange(index, "type", e.target.value)
                    }
                  >
                    <option>Fixed</option>
                    <option>Percentage</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    className="cs-input"
                    value={row.value}
                    onChange={(e) =>
                      handleChargesChange(index, "value", e.target.value)
                    }
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="cs-input cs-input--currency"
                    value={row.amount}
                    onChange={(e) =>
                      handleChargesChange(index, "amount", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="cs-button cs-button-outline"
            onClick={addCharge}
          >
            + Add New Charge
          </button>

          {/* Final amounts below additional charges */}
          {/* <div className="cs-summary">
            <div className="cs-summary-row">
              <span>Net Base Value</span>
              <span>{netBaseValue ? netBaseValue.toFixed(2) : "0.00"}</span>
            </div>
            <div className="cs-summary-row">
              <span>Additional Charges Total</span>
              <span>
                {additionalChargesTotal
                  ? additionalChargesTotal.toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="cs-summary-row">
              <span>Amount Before Taxes</span>
              <span>
                {amountBeforeTaxes ? amountBeforeTaxes.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="cs-summary-row">
              <span>Final Amount (Incl. Taxes)</span>
              <span>{finalAmount ? finalAmount.toFixed(2) : "0.00"}</span>
            </div>
          </div> */}

          {/* Final amounts below additional charges */}
          <div className="cs-summary-card">
            <div className="cs-summary-row">
              <span>Net Base Value</span>
              <span className="cs-summary-amount">
                {netBaseValue ? netBaseValue.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="cs-summary-row">
              <span>Additional Charges Total</span>
              <span className="cs-summary-amount">
                {additionalChargesTotal
                  ? additionalChargesTotal.toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="cs-summary-row">
              <span>Amount Before Taxes</span>
              <span className="cs-summary-amount">
                {amountBeforeTaxes ? amountBeforeTaxes.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="cs-summary-row cs-summary-row-final">
              <span>Final Amount (Incl. Taxes)</span>
              <span className="cs-summary-amount">
                {finalAmount ? finalAmount.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* TAXES & STATUTORY */}
        <SectionCard title="Taxes & Statutory">
          <div className="cs-taxes-row">
            <div className="cs-taxes-list">
              <label className="cs-checkbox">
                <input
                  type="checkbox"
                  checked={taxes.gst}
                  onChange={() => handleTaxChange("gst")}
                />
                <span>
                  GST ({template?.gst_percent || "–"}% on Amount Before Taxes)
                </span>
              </label>
              <label className="cs-checkbox">
                <input
                  type="checkbox"
                  checked={taxes.stampDuty}
                  onChange={() => handleTaxChange("stampDuty")}
                />
                <span>
                  Stamp Duty ({template?.stamp_duty_percent || "–"}% on Amount
                  Before Taxes)
                </span>
              </label>
              <label className="cs-checkbox">
                <input
                  type="checkbox"
                  checked={taxes.registration}
                  onChange={() => handleTaxChange("registration")}
                />
                <span>
                  Registration Fees ({template?.registration_amount || "–"})
                </span>
              </label>
              <label className="cs-checkbox">
                <input
                  type="checkbox"
                  checked={taxes.legalFees}
                  onChange={() => handleTaxChange("legalFees")}
                />
                <span>Legal Fees ({template?.legal_fee_amount || "–"})</span>
              </label>
            </div>
            <div className="cs-taxes-total">
              <span className="cs-taxes-label">Total Taxes</span>
              <span className="cs-taxes-amount">
                {totalTaxes ? totalTaxes.toFixed(2) : "0.00"}
              </span>
              <div className="cs-final-amount">
                Final Amount (Incl. Taxes):{" "}
                {finalAmount ? finalAmount.toFixed(2) : "0.00"}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* TERMS & NOTES */}
        <SectionCard title="Terms & Notes">
          <div className="cs-grid-3">
            <div className="cs-field cs-field--full">
              <label className="cs-label">Terms and Conditions</label>
              <textarea
                className="cs-textarea"
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
              />
            </div>
            <div className="cs-field cs-field--full">
              <label className="cs-label">Internal Notes</label>
              <textarea
                className="cs-textarea"
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>
          </div>
        </SectionCard>

        {/* ATTACHMENTS (stub) */}
        {/* ATTACHMENTS */}
        <SectionCard title="Attachments">
          <div className="cs-attachments-dropzone" onClick={handleBrowseClick}>
            <div className="cs-attachments-icon">⬆️</div>
            <p className="cs-attachments-text">Drag and drop files here, or</p>
            <button
              type="button"
              className="cs-button cs-button-light"
              onClick={handleBrowseClick}
            >
              Browse Files
            </button>

            {/* Hidden file input actually opening the dialog */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFilesChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Optional: show selected file names */}
          {attachments.length > 0 && (
            <ul className="cs-attachments-list">
              {attachments.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          )}

          <label className="cs-checkbox cs-attachments-checkbox">
            <input type="checkbox" defaultChecked />
            <span>Include attachments in PDF</span>
          </label>
        </SectionCard>

        {/* SAVE BUTTON */}
        <div className="cs-actions">
          <button
            type="button"
            className="cs-button cs-button-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Cost Sheet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostSheetCreate;
