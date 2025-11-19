// src/pages/BookingForm.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingForm.css";
import projectImage from "../../assets/project.webp";

/**
 * IMPORTANT:
 * - axiosInstance baseURL: e.g. "http://127.0.0.1:8000/api"
 * - BOOK_API_PREFIX below = "/book"
 *   => final URLs:
 *      POST   /api/book/kyc-requests/
 *      GET    /api/book/kyc-requests/<id>/
 *      POST   /api/book/bookings/
 */
const BOOK_API_PREFIX = "/book";

/** Collapsible section component */
const Section = ({ id, title, open, onToggle, children }) => (
  <div className="bf-section">
    <button
      type="button"
      className="bf-section-header"
      onClick={() => onToggle(id)}
    >
      <span className="bf-section-title">{title}</span>
      <span className={`bf-chevron ${open ? "bf-chevron-open" : ""}`}>▾</span>
    </button>
    {open && <div className="bf-section-body">{children}</div>}
  </div>
);

const BookingForm = () => {
  const rootRef = useRef(null);

  const [searchParams] = useSearchParams();
  const leadIdFromUrl =
    searchParams.get("lead_id") || searchParams.get("lead") || null;
  const projectIdFromUrl =
    searchParams.get("project_id") || searchParams.get("project");

  // ---------- user + lead ----------
  const [currentUser, setCurrentUser] = useState(null);
  const [leadId] = useState(leadIdFromUrl);

  // ---------- PROJECT SELECTION (Channel Partner style) ----------
  const [scopeProjects, setScopeProjects] = useState([]);
  const [projectId, setProjectId] = useState(
    projectIdFromUrl ||
      localStorage.getItem("ACTIVE_PROJECT_ID") ||
      localStorage.getItem("PROJECT_ID") ||
      null
  );
  const [projectName, setProjectName] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(!projectId);

  // (section/activeItem kept if you later re-enable SalesSubnav)
  const [section] = useState("pre");
  const [activeItem] = useState("booking-form");

  const [openSections, setOpenSections] = useState({
    applicantNames: true,
    contactDetails: true,
    addressProfile: true,
    additionalApplicants: true,
    flatInfo: true,
    taxDetails: true,
    applicantKyc: true,
    paymentSchedule: true,
    funding: true,
    advanceDeposit: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [project, setProject] = useState(null);
  const [towers, setTowers] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);

  // --------- Top booking info ----------
  const [formRefNo, setFormRefNo] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [office, setOffice] = useState("");

  // --------- Primary applicant ----------
  const [primaryTitle, setPrimaryTitle] = useState("Mr.");
  const [primaryFullName, setPrimaryFullName] = useState("");
  const [primaryPanNo, setPrimaryPanNo] = useState("");
  const [primaryAadharNo, setPrimaryAadharNo] = useState("");

  // Contact details
  const [email1, setEmail1] = useState("");
  const [phone1, setPhone1] = useState("");

  // --------- Address & profile ----------
  const [permanentAddress, setPermanentAddress] = useState("");
  const [correspondenceAddress, setCorrespondenceAddress] = useState("");
  const [preferredCorrespondence, setPreferredCorrespondence] =
    useState("PERMANENT");
  const [residentialStatus, setResidentialStatus] = useState("Owned");

  // --------- Flat selection state ----------
  const [selectedTowerId, setSelectedTowerId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const [towerOpen, setTowerOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  // --------- Flat info (auto from inventory but editable) ----------
  const [superBuiltupSqft, setSuperBuiltupSqft] = useState("");
  const [carpetSqft, setCarpetSqft] = useState("");
  const [balconySqft, setBalconySqft] = useState("");
  const [agreementValue, setAgreementValue] = useState("");
  const [agreementValueWords, setAgreementValueWords] = useState("");
  const [agreementDone, setAgreementDone] = useState(false);

  const [parkingRequired, setParkingRequired] = useState("NO"); // YES / NO (UI)
  const [parkingDetails, setParkingDetails] = useState("");
  const [parkingNumber, setParkingNumber] = useState("");

  const [gstNo, setGstNo] = useState("");

  // --------- KYC gating state ----------
  const [requiresKyc, setRequiresKyc] = useState("NO"); // "YES" | "NO"
  const [kycDealAmount, setKycDealAmount] = useState(""); // amount for KYC request
  const [kycRequestId, setKycRequestId] = useState(null); // backend KYC row id
  const [kycRequestStatus, setKycRequestStatus] = useState(null); // PENDING / APPROVED / REJECTED

  // --------- Payment plan ----------
  const [paymentPlanType, setPaymentPlanType] = useState("MASTER"); // MASTER / CUSTOM
  const [selectedPaymentPlanId, setSelectedPaymentPlanId] = useState("");

  const [customPlanName, setCustomPlanName] = useState("");
  const [customSlabs, setCustomSlabs] = useState([
    { name: "", percentage: "", days: "" },
  ]);

  // --------- Funding / advance ----------
  const [loanRequired, setLoanRequired] = useState("NO"); // YES / NO
  const [bookingAmount, setBookingAmount] = useState("");
  const [otherCharges, setOtherCharges] = useState("");

  // Top photo
  const [photoFile, setPhotoFile] = useState(null);

  // --------- Additional applicants (dynamic, UI-only for now) ----------
  const [additionalApplicants, setAdditionalApplicants] = useState([
    { relation: "", dob: "", aadhar: "" },
  ]);

  // --------- All upload files ----------
  const [files, setFiles] = useState({
    primaryPanFront: null,
    primaryPanBack: null,
    primaryAadharFront: null,
    primaryAadharBack: null,

    secondAadharFront: null,
    secondAadharBack: null,
    secondPanFront: null,
    secondPanBack: null,

    thirdAadharFront: null,
    thirdAadharBack: null,
    thirdPanFront: null,
    thirdPanBack: null,

    fourthAadharFront: null,
    fourthAadharBack: null,
    fourthPanFront: null,
    fourthPanBack: null,

    kycPan: null,
    kycAadhar: null,
  });

  const handleFileChange = (key) => (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const totalAdvance =
    Number(bookingAmount || 0) + Number(otherCharges || 0) || "";

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------- Load MY_SCOPE projects (localStorage + API fallback) ----------
  useEffect(() => {
    let projectsFromLS = [];
    try {
      const raw = localStorage.getItem("MY_SCOPE");
      if (raw) {
        const parsed = JSON.parse(raw);
        projectsFromLS = parsed.projects || [];
        setScopeProjects(projectsFromLS);
      }
    } catch (err) {
      console.error("Failed to parse MY_SCOPE from localStorage", err);
    }

    // Fallback: direct API if MY_SCOPE empty
    if (projectsFromLS.length === 0) {
      (async () => {
        try {
          const res = await axiosInstance.get("/client/my-scope/");
          const data = res.data || {};
          const projs = data.projects || [];
          setScopeProjects(projs);
          try {
            localStorage.setItem("MY_SCOPE", JSON.stringify(data));
          } catch {}
        } catch (err) {
          console.error("Failed to load projects from my-scope", err);
        }
      })();
    }
  }, []);

  // ---------- When URL / scopeProjects / projectId change → set selected project ----------
  useEffect(() => {
    const idParam = searchParams.get("project_id");

    if (idParam) {
      const pid = Number(idParam);
      setProjectId(pid);

      localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
      localStorage.setItem("PROJECT_ID", String(pid));

      const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
      const displayName = proj
        ? proj.name || `Project #${proj.id}`
        : `Project #${pid}`;
      setProjectName(displayName);
      setShowProjectModal(false);
    } else if (projectId) {
      const pid = Number(projectId);
      const proj = scopeProjects.find((p) => Number(p.id) === pid) || null;
      const displayName = proj
        ? proj.name || `Project #${proj.id}`
        : `Project #${pid}`;
      setProjectName(displayName);
      setShowProjectModal(false);
    } else {
      setShowProjectModal(true);
    }
  }, [searchParams, scopeProjects, projectId]);

  // ---------- Read user from localStorage ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  const currentProjectLabel =
    projectName || (projectId ? `Project #${projectId}` : "Select a project");

  const handleProjectCardSelect = (proj) => {
    const pid = Number(proj.id);
    setProjectId(pid);
    const displayName = proj.name || `Project #${proj.id}`;
    setProjectName(displayName);

    localStorage.setItem("ACTIVE_PROJECT_ID", String(pid));
    localStorage.setItem("PROJECT_ID", String(pid));

    setShowProjectModal(false);
  };

  // ---------- Fetch booking-setup data whenever projectId changes ----------
  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setTowers([]);
      setPaymentPlans([]);
      setLoading(false);
      return;
    }

    const fetchSetup = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get("/client/booking-setup/", {
          params: { project_id: projectId },
        });
        setProject(res.data.project || null);
        setTowers(res.data.towers || []);
        setPaymentPlans(res.data.payment_plans || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load booking setup. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetup();
  }, [projectId]);

  // ---------- Close dropdowns on outside click ----------
  useEffect(() => {
    const handler = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setTowerOpen(false);
        setUnitOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ---------- Derived tower + unit ----------
  const selectedTower = towers.find(
    (t) => String(t.id) === String(selectedTowerId)
  );

  const towerUnits = useMemo(() => {
    if (!selectedTower) return [];
    const units = [];
    (selectedTower.floors || []).forEach((floor) => {
      (floor.units || []).forEach((u) => {
        units.push({
          ...u,
          floor_number: floor.number,
        });
      });
    });
    return units;
  }, [selectedTower]);

  const selectedUnit = towerUnits.find(
    (u) => String(u.id) === String(selectedUnitId)
  );

  // ---------- KYC status refresh ----------
  const handleRefreshKycStatus = async () => {
    if (!kycRequestId) {
      alert("No KYC request found. Please send KYC request first.");
      return;
    }

    try {
      const res = await axiosInstance.get(
        `${BOOK_API_PREFIX}/kyc-requests/${kycRequestId}/`
      );
      const data = res.data || {};

      setKycRequestStatus(data.status || "PENDING");

      if (data.status === "APPROVED") {
        alert("KYC has been APPROVED. You can proceed with booking.");
      } else if (data.status === "REJECTED") {
        alert("KYC has been REJECTED. Please review with admin.");
      } else {
        // PENDING
        alert("KYC is still pending with admin.");
      }
    } catch (err) {
      console.error("Failed to refresh KYC status", err);
      if (err?.response?.data) {
        alert(
          "Failed to refresh KYC status.\n" +
            JSON.stringify(err.response.data, null, 2)
        );
      } else {
        alert("Failed to refresh KYC status. Please try again.");
      }
    }
  };

  const handleAdditionalApplicantChange = (index, field, value) => {
    setAdditionalApplicants((prev) =>
      prev.map((app, i) => (i === index ? { ...app, [field]: value } : app))
    );
  };

  const handleAddAdditionalApplicant = () => {
    setAdditionalApplicants((prev) => [
      ...prev,
      { relation: "", dob: "", aadhar: "" },
    ]);
  };

  // ---------- KYC request create ----------
  const handleSendKycRequest = async () => {
    if (!selectedUnitId) {
      alert("Please select a unit before sending KYC request.");
      return;
    }
    if (!project?.id) {
      alert("Project is missing – cannot create KYC request.");
      return;
    }
    if (!kycDealAmount || Number(kycDealAmount) <= 0) {
      alert("Please enter a valid deal amount for KYC.");
      return;
    }

    try {
      // backend expects: { project_id, unit_id, amount }
      const payload = {
        project_id: project.id,
        unit_id: selectedUnitId,
        amount: Number(kycDealAmount),
      };

      const res = await axiosInstance.post(
        `${BOOK_API_PREFIX}/kyc-requests/`,
        payload
      );
      const data = res.data || {};

      setKycRequestId(data.id);
      setKycRequestStatus(data.status || "PENDING");

      alert("KYC request sent to project admin.");
    } catch (err) {
      console.error("Failed to create KYC request", err);
      if (err?.response?.data) {
        alert(
          "Failed to send KYC request.\n" +
            JSON.stringify(err.response.data, null, 2)
        );
      } else {
        alert("Failed to send KYC request. Please try again.");
      }
    }
  };

  // Auto-fill KYC deal amount from agreement value if empty
  useEffect(() => {
    if (!kycDealAmount && agreementValue) {
      setKycDealAmount(agreementValue);
    }
  }, [agreementValue, kycDealAmount]);

  // When unit changes → auto-fill areas + agreement value from inventory
  useEffect(() => {
    if (!selectedUnit) {
      setSuperBuiltupSqft("");
      setCarpetSqft("");
      setBalconySqft("");
      setAgreementValue("");
      return;
    }

    const inv = selectedUnit.inventory || {};

    const sb =
      inv.saleable_sqft ||
      inv.builtup_sqft ||
      inv.rera_area_sqft ||
      selectedUnit.agreement_value ||
      "";
    const ca = inv.carpet_sqft || "";
    const agr =
      inv.total_cost ||
      inv.agreement_value ||
      selectedUnit.agreement_value ||
      "";

    setSuperBuiltupSqft(sb || "");
    setCarpetSqft(ca || "");
    setAgreementValue(agr || "");
  }, [selectedUnit]);

  // ---------- Payment plan helpers ----------
  const selectedPaymentPlan = paymentPlans.find(
    (p) => String(p.id) === String(selectedPaymentPlanId)
  );

  const handlePaymentPlanChange = (e) => {
    const value = e.target.value;
    if (value === "__CUSTOM__") {
      setPaymentPlanType("CUSTOM");
      setSelectedPaymentPlanId("");
    } else {
      setPaymentPlanType("MASTER");
      setSelectedPaymentPlanId(value);
    }
  };

  const handleAddCustomSlab = () => {
    setCustomSlabs((prev) => [...prev, { name: "", percentage: "", days: "" }]);
  };

  const handleUpdateCustomSlab = (index, field, value) => {
    setCustomSlabs((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveCustomSlab = (index) => {
    setCustomSlabs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const customTotalPercentage = customSlabs.reduce(
    (sum, row) => sum + Number(row.percentage || 0),
    0
  );

  // ---------- Save Booking ----------
  const handleSaveBooking = async () => {
    if (!selectedUnitId) {
      alert("Please select a tower & flat (unit) before saving.");
      return;
    }
    if (!primaryFullName) {
      alert("Please enter Primary Applicant full name.");
      return;
    }
    if (!bookingDate) {
      alert("Please select Booking Date.");
      return;
    }
    if (!agreementValue) {
      alert("Please enter Agreement Value.");
      return;
    }
    if (
      paymentPlanType === "MASTER" &&
      (!selectedPaymentPlanId || selectedPaymentPlanId === "")
    ) {
      alert("Please select a Payment Plan.");
      return;
    }
    if (paymentPlanType === "CUSTOM" && customTotalPercentage !== 100) {
      alert("Custom payment plan slabs must total 100%.");
      return;
    }

    // SALES users must have a lead (from URL)
    if (currentUser?.role === "SALES" && !leadId) {
      alert(
        "For SALES users, Booking must be linked to a Lead. Please open Booking from the Lead screen (lead_id required)."
      );
      return;
    }

    // 🔹 HARD GATE: If KYC is required, ensure APPROVED before booking
    if (requiresKyc === "YES") {
      if (!kycRequestId) {
        alert("Please send KYC request and wait for approval before booking.");
        return;
      }
      if (kycRequestStatus !== "APPROVED") {
        alert(
          `KYC is ${
            kycRequestStatus || "PENDING"
          }. Booking can be created only after KYC is APPROVED.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const fd = new FormData();

      // Primary IDs
      fd.append("unit_id", selectedUnitId);
      if (leadId) {
        // backend side: Booking.sales_lead FK (you already use sales_lead_id in other APIs)
        fd.append("sales_lead_id", String(leadId));
      }

      // Top info
      fd.append("form_ref_no", formRefNo || "");
      fd.append("booking_date", bookingDate || "");
      fd.append("office_address", office || "");

      // Primary applicant snapshot on Booking
      fd.append("primary_title", primaryTitle || "");
      fd.append("primary_full_name", primaryFullName || "");
      fd.append("primary_email", email1 || "");
      fd.append("primary_mobile_number", phone1 || "");
      fd.append("email_2", "");
      fd.append("phone_2", "");

      // Address & profile
      fd.append("permanent_address", permanentAddress || "");
      fd.append("correspondence_address", correspondenceAddress || "");
      fd.append("preferred_correspondence", preferredCorrespondence);
      fd.append("residential_status", residentialStatus || "");

      // Flat info
      fd.append("super_builtup_sqft", superBuiltupSqft || "");
      fd.append("carpet_sqft", carpetSqft || "");
      fd.append("balcony_sqft", balconySqft || "");
      fd.append("agreement_value", agreementValue || "");
      fd.append("agreement_value_words", agreementValueWords || "");
      fd.append("agreement_done", agreementDone ? "true" : "false");

      fd.append(
        "parking_required",
        parkingRequired === "YES" ? "true" : "false"
      );
      fd.append("parking_details", parkingDetails || "");
      fd.append("parking_number", parkingNumber || "");

      // Tax
      fd.append("gst_no", gstNo || "");

      // Payment / KYC
      fd.append("payment_plan_type", paymentPlanType);

      // If KYC gating is ON and request exists, attach KYC request id for backend validation
      if (requiresKyc === "YES" && kycRequestId) {
        fd.append("kyc_request_id", String(kycRequestId));
      }
      if (paymentPlanType === "MASTER" && selectedPaymentPlanId) {
        fd.append("payment_plan_id", selectedPaymentPlanId);
      }

      if (paymentPlanType === "CUSTOM") {
        const customPlan = {
          name: customPlanName || "",
          slabs: customSlabs.map((s, idx) => ({
            order: idx + 1,
            name: s.name,
            percentage: Number(s.percentage || 0),
            days: s.days === "" ? null : Number(s.days),
          })),
        };
        fd.append("custom_payment_plan", JSON.stringify(customPlan));
      }

      // Funding / advance
      fd.append("loan_required", loanRequired === "YES" ? "true" : "false");
      fd.append("loan_bank_name", "");
      fd.append("loan_amount_expected", "");
      fd.append("booking_amount", bookingAmount || "0");
      fd.append("other_charges", otherCharges || "0");
      // total_advance backend will auto-calc

      // Extra info for primary applicant (for BookingApplicant creation in backend)
      fd.append("primary_pan_no", primaryPanNo || "");
      fd.append("primary_aadhar_no", primaryAadharNo || "");

      // main photo (if you later want to store as attachment)
      if (photoFile) {
        fd.append("photo", photoFile);
      }

      // all other files: PAN/Aadhar etc
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          fd.append(key, file);
        }
      });

      // Additional applicants (UI-only, but sending as JSON for future use)
      fd.append(
        "additional_applicants",
        JSON.stringify(additionalApplicants || [])
      );

      const res = await axiosInstance.post(`${BOOK_API_PREFIX}/bookings/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Booking created:", res.data);
      alert("Booking saved successfully.");
      // TODO: reset form if needed
    } catch (err) {
      console.error("Failed to save booking:", err);
      if (err?.response?.data) {
        alert(
          "Failed to save booking.\n" +
            JSON.stringify(err.response.data, null, 2)
        );
      } else {
        alert(
          "Failed to save booking. Please check console / Network tab for details."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="booking-form-page" ref={rootRef}>
          {loading ? (
            <div className="bf-card">
              <p>Loading booking setup...</p>
            </div>
          ) : error ? (
            <div className="bf-card">
              <p className="bf-error">{error}</p>
            </div>
          ) : (
            <>
              {/* -------- Top booking info -------- */}
              <div className="bf-card">
                {/* Project chip (Channel Partner style) */}
                <div
                  className="cp-project-chip"
                  style={{ marginBottom: "16px" }}
                >
                  <span>
                    Project:&nbsp;
                    <strong>{currentProjectLabel}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(true)}
                  >
                    Change Project
                  </button>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Form Ref No.</label>
                    <input
                      className="bf-input"
                      type="text"
                      placeholder="FB1234567890"
                      value={formRefNo}
                      onChange={(e) => setFormRefNo(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      Booking Date <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Office</label>
                    <textarea
                      className="bf-textarea"
                      rows={3}
                      placeholder="Sales Office, Grand Avenue Towers, Sector 18, Gurgaon"
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Show linked lead from URL (no lead modal now) */}
                {leadId && (
                  <div className="bf-row">
                    <div className="bf-col">
                      <label className="bf-label">Linked Lead</label>
                      <input
                        className="bf-input bf-input-readonly"
                        type="text"
                        value={`Lead ID: ${leadId}`}
                        readOnly
                      />
                    </div>
                  </div>
                )}

                <div className="bf-photo-row">
                  <div className="bf-photo-upload">
                    <div className="bf-photo-circle" />
                    <input
                      id="bookingPhotoInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        if (f) setPhotoFile(f);
                      }}
                    />
                    <label
                      htmlFor="bookingPhotoInput"
                      className="bf-btn-secondary"
                      style={{ cursor: "pointer" }}
                    >
                      Upload Photo
                    </label>
                    {photoFile && (
                      <div className="bf-file-name">
                        Photo: {photoFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Applicant Names */}
              <Section
                id="applicantNames"
                title="Applicant Names"
                open={openSections.applicantNames}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  <div className="bf-row bf-row-applicant">
                    <div className="bf-col bf-col-title">
                      <label className="bf-label">Title</label>
                      <div className="bf-radio-group">
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Mr."
                            checked={primaryTitle === "Mr."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Mr.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Ms."
                            checked={primaryTitle === "Ms."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Ms.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Mrs."
                            checked={primaryTitle === "Mrs."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Mrs.
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="title1"
                            value="Dr."
                            checked={primaryTitle === "Dr."}
                            onChange={(e) => setPrimaryTitle(e.target.value)}
                          />{" "}
                          Dr.
                        </label>
                      </div>
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">
                        Full Name <span className="bf-required">*</span>
                      </label>
                      <input
                        className="bf-input"
                        type="text"
                        placeholder="Rajesh Kumar"
                        value={primaryFullName}
                        onChange={(e) => setPrimaryFullName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* First Applicant PAN with file upload */}
                <div className="bf-row bf-row-upload">
                  <div className="bf-col">
                    <label className="bf-label">
                      First Applicant PAN Number{" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={primaryPanNo}
                      onChange={(e) => setPrimaryPanNo(e.target.value)}
                    />
                  </div>

                  <div className="bf-col bf-upload-btn-group">
                    <span className="bf-label">First Applicant PAN</span>

                    <input
                      id="primaryPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryPanFront")}
                    />
                    <input
                      id="primaryPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="primaryPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="primaryPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>

                    <div className="bf-file-names">
                      {files.primaryPanFront && (
                        <div className="bf-file-name">
                          Front: {files.primaryPanFront.name}
                        </div>
                      )}
                      {files.primaryPanBack && (
                        <div className="bf-file-name">
                          Back: {files.primaryPanBack.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* First Applicant Aadhar with file upload */}
                <div className="bf-row bf-row-upload">
                  <div className="bf-col">
                    <label className="bf-label">
                      First Applicant Aadhar Number{" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={primaryAadharNo}
                      onChange={(e) => setPrimaryAadharNo(e.target.value)}
                    />
                  </div>

                  <div className="bf-col bf-upload-btn-group">
                    <span className="bf-label">First Applicant Aadhar</span>

                    <input
                      id="primaryAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryAadharFront")}
                    />
                    <input
                      id="primaryAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("primaryAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="primaryAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="primaryAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>

                    <div className="bf-file-names">
                      {files.primaryAadharFront && (
                        <div className="bf-file-name">
                          Front: {files.primaryAadharFront.name}
                        </div>
                      )}
                      {files.primaryAadharBack && (
                        <div className="bf-file-name">
                          Back: {files.primaryAadharBack.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Additional Applicants */}
              <Section
                id="additionalApplicants"
                title="Additional Applicants"
                open={openSections.additionalApplicants}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  {additionalApplicants.map((app, idx) => (
                    <div className="bf-row" key={idx}>
                      <div className="bf-col">
                        <label className="bf-label">Relation</label>
                        <input
                          className="bf-input"
                          type="text"
                          placeholder="Spouse"
                          value={app.relation}
                          onChange={(e) =>
                            handleAdditionalApplicantChange(
                              idx,
                              "relation",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="bf-col">
                        <label className="bf-label">Date of Birth</label>
                        <input
                          className="bf-input"
                          type="date"
                          value={app.dob}
                          onChange={(e) =>
                            handleAdditionalApplicantChange(
                              idx,
                              "dob",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="bf-col">
                        <label className="bf-label">Aadhar Number</label>
                        <input
                          className="bf-input"
                          type="text"
                          placeholder="XXXX XXXX 1234"
                          value={app.aadhar}
                          onChange={(e) =>
                            handleAdditionalApplicantChange(
                              idx,
                              "aadhar",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="bf-btn-secondary bf-btn-full"
                    onClick={handleAddAdditionalApplicant}
                  >
                    Add Additional Applicant
                  </button>
                </div>

                {/* Second Applicant uploads */}
                <div className="bf-row bf-row-upload-compact">
                  <div className="bf-col">
                    <span className="bf-label">Second Applicant Aadhar</span>

                    <input
                      id="secondAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondAadharFront")}
                    />
                    <input
                      id="secondAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="secondAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="secondAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">Second Applicant Pan</span>

                    <input
                      id="secondPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondPanFront")}
                    />
                    <input
                      id="secondPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("secondPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="secondPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="secondPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                </div>

                {/* Third Applicant uploads */}
                <div className="bf-row bf-row-upload-compact">
                  <div className="bf-col">
                    <span className="bf-label">Third Applicant Aadhar</span>

                    <input
                      id="thirdAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdAadharFront")}
                    />
                    <input
                      id="thirdAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="thirdAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="thirdAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">Third Applicant Pan</span>

                    <input
                      id="thirdPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdPanFront")}
                    />
                    <input
                      id="thirdPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("thirdPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="thirdPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="thirdPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fourth Applicant uploads */}
                <div className="bf-row bf-row-upload-compact">
                  <div className="bf-col">
                    <span className="bf-label">Fourth Applicant Aadhar</span>

                    <input
                      id="fourthAadharFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthAadharFront")}
                    />
                    <input
                      id="fourthAadharBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthAadharBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="fourthAadharFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="fourthAadharBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">Fourth Applicant Pan</span>

                    <input
                      id="fourthPanFrontInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthPanFront")}
                    />
                    <input
                      id="fourthPanBackInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("fourthPanBack")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="fourthPanFrontInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Front Side
                      </label>
                      <label
                        htmlFor="fourthPanBackInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Back Side
                      </label>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Contact Details */}
              <Section
                id="contactDetails"
                title="Contact Details"
                open={openSections.contactDetails}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Email 1</label>
                    <input
                      className="bf-input"
                      type="email"
                      placeholder="contact@example.com"
                      value={email1}
                      onChange={(e) => setEmail1(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Phone Number 1</label>
                    <input
                      className="bf-input"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* Address & Profile */}
              <Section
                id="addressProfile"
                title="Addresses & Profile"
                open={openSections.addressProfile}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Permanent Address</label>
                    <textarea
                      className="bf-textarea"
                      rows={3}
                      placeholder="123, Gandhi Road, Chennai, Tamil Nadu, India - 600001"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Correspondence Address</label>
                    <textarea
                      className="bf-textarea"
                      rows={3}
                      placeholder="456, Nehru Street, Bangalore, Karnataka, India - 560001"
                      value={correspondenceAddress}
                      onChange={(e) => setCorrespondenceAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      Preferred Correspondence Address
                    </label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="corrPref"
                          value="PERMANENT"
                          checked={preferredCorrespondence === "PERMANENT"}
                          onChange={(e) =>
                            setPreferredCorrespondence(e.target.value)
                          }
                        />{" "}
                        Permanent Address
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="corrPref"
                          value="CORRESPONDENCE"
                          checked={preferredCorrespondence === "CORRESPONDENCE"}
                          onChange={(e) =>
                            setPreferredCorrespondence(e.target.value)
                          }
                        />{" "}
                        Correspondence Address
                      </label>
                    </div>
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      Current Status (Residential)
                    </label>
                    <select
                      className="bf-input"
                      value={residentialStatus}
                      onChange={(e) => setResidentialStatus(e.target.value)}
                    >
                      <option value="Owned">Owned</option>
                      <option value="Rented">Rented</option>
                      <option value="Company Provided">Company Provided</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Flat Information */}
              <Section
                id="flatInfo"
                title="Flat Information"
                open={openSections.flatInfo}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Building Name</label>
                    <input
                      className="bf-input bf-input-readonly"
                      type="text"
                      value={project?.name || ""}
                      readOnly
                    />
                  </div>
                  {/* Wing / Tower dropdown (custom) */}
                  <div className="bf-col">
                    <label className="bf-label">Wing / Tower</label>
                    <div className="bf-dropdown">
                      <button
                        type="button"
                        className="bf-input bf-dropdown-toggle"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTowerOpen((open) => !open);
                        }}
                      >
                        {selectedTower ? selectedTower.name : "Select Tower"}
                      </button>

                      {towerOpen && (
                        <div className="bf-dropdown-menu">
                          {towers.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className="bf-dropdown-item"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedTowerId(String(t.id));
                                setSelectedUnitId("");
                                setTowerOpen(false);
                                setUnitOpen(false);
                              }}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flat / Unit dropdown (custom) */}
                  <div className="bf-col">
                    <label className="bf-label">Flat / Unit</label>
                    <div className="bf-dropdown">
                      <button
                        type="button"
                        className="bf-input bf-dropdown-toggle"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!selectedTowerId) return;
                          setUnitOpen((open) => !open);
                        }}
                        disabled={!selectedTowerId}
                      >
                        {selectedUnit
                          ? `${selectedUnit.unit_no}${
                              selectedUnit.floor_number
                                ? ` (Floor ${selectedUnit.floor_number})`
                                : ""
                            }`
                          : "Select Unit"}
                      </button>

                      {unitOpen && selectedTowerId && (
                        <div className="bf-dropdown-menu">
                          {towerUnits.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              className="bf-dropdown-item"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedUnitId(String(u.id));
                                setUnitOpen(false);
                              }}
                            >
                              {u.unit_no}
                              {u.floor_number
                                ? ` (Floor ${u.floor_number})`
                                : ""}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      Super Built-up Area (Sq. Ft.)
                    </label>
                    <input
                      className="bf-input"
                      type="number"
                      value={superBuiltupSqft}
                      onChange={(e) => setSuperBuiltupSqft(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Carpet Area (Sq. Ft.)</label>
                    <input
                      className="bf-input"
                      type="number"
                      value={carpetSqft}
                      onChange={(e) => setCarpetSqft(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Balcony Area (Sq. Ft.)</label>
                    <input
                      className="bf-input"
                      type="number"
                      value={balconySqft}
                      onChange={(e) => setBalconySqft(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      Agreement Value (In Rupees){" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="number"
                      value={agreementValue}
                      onChange={(e) => setAgreementValue(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">
                      Agreement Value (In Words)
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={agreementValueWords}
                      onChange={(e) => setAgreementValueWords(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Agreement Done</label>
                    <select
                      className="bf-input"
                      value={agreementDone ? "YES" : "NO"}
                      onChange={(e) =>
                        setAgreementDone(e.target.value === "YES")
                      }
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Parking</label>
                    <select
                      className="bf-input"
                      value={parkingRequired}
                      onChange={(e) => setParkingRequired(e.target.value)}
                    >
                      <option value="YES">Yes</option>
                      <option value="NO">No</option>
                    </select>
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Parking Details</label>
                    <input
                      className="bf-input"
                      type="text"
                      value={parkingDetails}
                      onChange={(e) => setParkingDetails(e.target.value)}
                      placeholder="Parking Details"
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Parking Number</label>
                    <input
                      className="bf-input"
                      type="text"
                      value={parkingNumber}
                      onChange={(e) => setParkingNumber(e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* Tax Details */}
              <Section
                id="taxDetails"
                title="Tax Details"
                open={openSections.taxDetails}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      GST <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input"
                      type="text"
                      value={gstNo}
                      onChange={(e) => setGstNo(e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              {/* Applicant KYC (generic docs – separate from gating KYC) */}
              <Section
                id="applicantKyc"
                title="Applicant KYC"
                open={openSections.applicantKyc}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">PAN Number</label>
                    <input
                      className="bf-input"
                      type="text"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Aadhar Number</label>
                    <input
                      className="bf-input"
                      type="text"
                      placeholder="XXXX XXXX 1234"
                    />
                  </div>
                </div>

                <div className="bf-row bf-row-upload">
                  <div className="bf-col">
                    <span className="bf-label">
                      Upload PAN Card (Front &amp; Back)
                    </span>

                    <input
                      id="kycPanInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("kycPan")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="kycPanInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Upload
                      </label>
                    </div>

                    {files.kycPan && (
                      <div className="bf-file-name">
                        PAN: {files.kycPan.name}
                      </div>
                    )}
                  </div>
                  <div className="bf-col">
                    <span className="bf-label">
                      Upload Aadhar Card (Front &amp; Back)
                    </span>

                    <input
                      id="kycAadharInput"
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: "none" }}
                      onChange={handleFileChange("kycAadhar")}
                    />

                    <div className="bf-btn-group">
                      <label
                        htmlFor="kycAadharInput"
                        className="bf-btn-gold"
                        style={{ cursor: "pointer" }}
                      >
                        Upload
                      </label>
                    </div>

                    {files.kycAadhar && (
                      <div className="bf-file-name">
                        Aadhar: {files.kycAadhar.name}
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Payment Schedule & KYC gating */}
              <Section
                id="paymentSchedule"
                title="Payment Schedule & KYC"
                open={openSections.paymentSchedule}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  {/* KYC requirement */}
                  <div className="bf-col">
                    <label className="bf-label">KYC Approval Required?</label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="requiresKyc"
                          value="NO"
                          checked={requiresKyc === "NO"}
                          onChange={(e) => {
                            setRequiresKyc(e.target.value);
                            // reset KYC info if NO
                            if (e.target.value === "NO") {
                              setKycDealAmount("");
                              setKycRequestId(null);
                              setKycRequestStatus(null);
                            }
                          }}
                        />{" "}
                        No
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="requiresKyc"
                          value="YES"
                          checked={requiresKyc === "YES"}
                          onChange={(e) => setRequiresKyc(e.target.value)}
                        />{" "}
                        Yes
                      </label>
                    </div>

                    {requiresKyc === "YES" && (
                      <div className="bf-kyc-box">
                        <div className="bf-row">
                          <div className="bf-col">
                            <label className="bf-label">
                              Deal Amount for KYC
                            </label>
                            <input
                              className="bf-input"
                              type="number"
                              value={kycDealAmount}
                              onChange={(e) => setKycDealAmount(e.target.value)}
                              placeholder="e.g., 12500000"
                            />
                          </div>
                        </div>

                        <div className="bf-row">
                          <div className="bf-col">
                            <button
                              type="button"
                              className="bf-btn-secondary"
                              onClick={handleSendKycRequest}
                              disabled={!selectedUnitId || !kycDealAmount}
                            >
                              {kycRequestId
                                ? "Resend / Update KYC Request"
                                : "Send KYC Request to Admin"}
                            </button>
                          </div>
                        </div>

                        {kycRequestId && (
                          <div className="bf-kyc-status-chip">
                            <div className="bf-kyc-status-main">
                              <span>
                                KYC Request ID: <strong>{kycRequestId}</strong>
                              </span>
                              <span
                                className={`bf-kyc-badge bf-kyc-${(
                                  kycRequestStatus || "PENDING"
                                ).toLowerCase()}`}
                              >
                                Status: {kycRequestStatus || "PENDING"}
                              </span>
                            </div>

                            <div className="bf-kyc-status-actions">
                              <button
                                type="button"
                                className="bf-btn-icon"
                                title="Refresh KYC Status"
                                onClick={handleRefreshKycStatus}
                              >
                                ⟳
                              </button>
                              <small>
                                Booking can be created only after KYC is{" "}
                                <strong>APPROVED</strong>.
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Plan column */}
                  <div className="bf-col">
                    <label className="bf-label">
                      Payment Plan <span className="bf-required">*</span>
                    </label>
                    <select
                      className="bf-input"
                      value={
                        paymentPlanType === "CUSTOM"
                          ? "__CUSTOM__"
                          : selectedPaymentPlanId || ""
                      }
                      onChange={handlePaymentPlanChange}
                    >
                      <option value="">Select Plan</option>
                      {paymentPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.total_percentage}%)
                        </option>
                      ))}
                      <option value="__CUSTOM__">Make Your Own Plan</option>
                    </select>
                  </div>
                </div>

                {paymentPlanType === "MASTER" && selectedPaymentPlan && (
                  <div className="bf-subcard">
                    <div className="bf-row">
                      <div className="bf-col">
                        <strong>Selected Plan:</strong>{" "}
                        {selectedPaymentPlan.name} (
                        {selectedPaymentPlan.total_percentage}%)
                      </div>
                    </div>
                    <div className="bf-plan-table">
                      <div className="bf-plan-header">
                        <span>#</span>
                        <span>Name</span>
                        <span>%</span>
                        <span>Days</span>
                      </div>
                      {selectedPaymentPlan.slabs.map((slab) => (
                        <div key={slab.id} className="bf-plan-row">
                          <span>{slab.order_index}</span>
                          <span>{slab.name}</span>
                          <span>{slab.percentage}</span>
                          <span>{slab.days ?? "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {paymentPlanType === "CUSTOM" && (
                  <div className="bf-subcard">
                    <div className="bf-row">
                      <div className="bf-col">
                        <label className="bf-label">Custom Plan Name</label>
                        <input
                          className="bf-input"
                          type="text"
                          value={customPlanName}
                          onChange={(e) => setCustomPlanName(e.target.value)}
                          placeholder="e.g. Rajesh Custom Plan"
                        />
                      </div>
                    </div>
                    <div className="bf-plan-table">
                      <div className="bf-plan-header">
                        <span>#</span>
                        <span>Name</span>
                        <span>%</span>
                        <span>Days</span>
                        <span />
                      </div>
                      {customSlabs.map((row, idx) => (
                        <div key={idx} className="bf-plan-row">
                          <span>{idx + 1}</span>
                          <span>
                            <input
                              className="bf-input"
                              type="text"
                              value={row.name}
                              onChange={(e) =>
                                handleUpdateCustomSlab(
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="On Booking"
                            />
                          </span>
                          <span>
                            <input
                              className="bf-input"
                              type="number"
                              value={row.percentage}
                              onChange={(e) =>
                                handleUpdateCustomSlab(
                                  idx,
                                  "percentage",
                                  e.target.value
                                )
                              }
                              placeholder="10"
                            />
                          </span>
                          <span>
                            <input
                              className="bf-input"
                              type="number"
                              value={row.days}
                              onChange={(e) =>
                                handleUpdateCustomSlab(
                                  idx,
                                  "days",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                            />
                          </span>
                          <span>
                            {customSlabs.length > 1 && (
                              <button
                                type="button"
                                className="bf-btn-secondary"
                                onClick={() => handleRemoveCustomSlab(idx)}
                              >
                                ✕
                              </button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bf-row">
                      <div className="bf-col">
                        <button
                          type="button"
                          className="bf-btn-secondary"
                          onClick={handleAddCustomSlab}
                        >
                          + Add Slab
                        </button>
                      </div>
                      <div className="bf-col bf-text-right">
                        <strong>Total %:</strong> {customTotalPercentage}%
                      </div>
                    </div>
                  </div>
                )}
              </Section>

              {/* Source of Funding */}
              <Section
                id="funding"
                title="Source of Funding"
                open={openSections.funding}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Loan Required?</label>
                    <div className="bf-radio-group">
                      <label>
                        <input
                          type="radio"
                          name="loan"
                          value="YES"
                          checked={loanRequired === "YES"}
                          onChange={(e) => setLoanRequired(e.target.value)}
                        />{" "}
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="loan"
                          value="NO"
                          checked={loanRequired === "NO"}
                          onChange={(e) => setLoanRequired(e.target.value)}
                        />{" "}
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Advance Deposit */}
              <Section
                id="advanceDeposit"
                title="Advance Deposit"
                open={openSections.advanceDeposit}
                onToggle={toggleSection}
              >
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Booking Amount</label>
                    <input
                      className="bf-input"
                      type="number"
                      placeholder="100000"
                      value={bookingAmount}
                      onChange={(e) => setBookingAmount(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Other Charges</label>
                    <input
                      className="bf-input"
                      type="number"
                      placeholder="50000"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Total Advance</label>
                    <input
                      className="bf-input bf-input-readonly"
                      type="number"
                      value={totalAdvance}
                      readOnly
                    />
                  </div>
                </div>
              </Section>

              <div className="bf-actions">
                <button type="button" className="bf-btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  className="bf-btn-primary"
                  onClick={handleSaveBooking}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Booking"}
                </button>
              </div>
            </>
          )}

          {/* ---------- PROJECT SELECT MODAL (card style, static image + name) ---------- */}
          {showProjectModal && (
            <div className="cp-project-modal-backdrop">
              <div className="cp-project-modal">
                <div className="cp-project-modal-header">
                  <div>
                    <h2 className="cp-project-modal-title">Select Project</h2>
                    <p className="cp-project-modal-subtitle">
                      Choose a project for which you are creating this booking.
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
                    No projects found in your scope. Please contact admin.
                  </div>
                ) : (
                  <div className="cp-project-grid">
                    {scopeProjects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="cp-project-card"
                        onClick={() => handleProjectCardSelect(p)}
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
                          {/* No status / approval here: only static image + name */}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
