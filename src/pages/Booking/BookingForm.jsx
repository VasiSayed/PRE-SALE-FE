import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingForm.css";
import projectImage from "../../assets/project.webp";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const BOOK_API_PREFIX = "/book";

// ✅ ADD ALL THESE FUNCTIONS HERE (BEFORE Section component)
// Validation functions
const validatePAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

const validateAadhar = (aadhar) => {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar.replace(/\s/g, ""));
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ""));
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};



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
  // --------- Discount (in Flat Information) ----------
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [searchParams] = useSearchParams();
  const leadIdFromUrl =
    searchParams.get("lead_id") || searchParams.get("lead") || null;
  const [primaryDob, setPrimaryDob] = useState("");
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
    costSummary: true,
    taxesStatutory: true,
    paymentSchedule: true,
    funding: true,
    advanceDeposit: true,
    applicantSummary: true,
  });

  const handleFileChange = (key) => (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  // ✅ ADD THESE 4 NEW FUNCTIONS
  // PAN validation with toast
  const handlePrimaryPanChange = (value) => {
    setPrimaryPanNo(value.toUpperCase());
    if (value.length === 10 && !validatePAN(value)) {
      toast.error("Invalid PAN format. Expected: ABCDE1234F");
    }
  };

  // Aadhar validation with toast
  const handlePrimaryAadharChange = (value) => {
    const cleaned = value.replace(/\s/g, "");
    setPrimaryAadharNo(cleaned);
    if (cleaned.length === 12 && !validateAadhar(cleaned)) {
      toast.error("Invalid Aadhar format. Must be 12 digits.");
    }
  };

  // Email validation
  const handleEmailChange = (value) => {
    setEmail1(value);
    if (value && !validateEmail(value)) {
      toast.warn("Please enter a valid email address");
    }
  };

  // Phone validation
  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setPhone1(cleaned);
    if (cleaned.length === 10 && !validatePhone(cleaned)) {
      toast.error("Invalid phone number. Must be 10 digits.");
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [project, setProject] = useState(null);
  const [towers, setTowers] = useState([]);
  const [paymentPlans, setPaymentPlans] = useState([]);

  // --------- Top booking info ----------
  const [formRefNo, setFormRefNo] = useState("");
  const [bookingDate, setBookingDate] = useState(getTodayDate()); // ✅ Auto-set today
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

  // --------- Cost Summary & Offers ----------
  const [costTemplate, setCostTemplate] = useState(null);
  const [offers, setOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [selectedOfferData, setSelectedOfferData] = useState(null);

  // Computed cost values
  const [gstAmount, setGstAmount] = useState(0);
  const [stampDutyAmount, setStampDutyAmount] = useState(0);
  const [totalTaxes, setTotalTaxes] = useState(0);
  const [offerDiscountValue, setOfferDiscountValue] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

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

  // --------- Additional Charges (dynamic) ----------
  const [additionalCharges, setAdditionalCharges] = useState([
    { name: "", type: "FIXED", value: "", amount: 0 }, // FIXED or PERCENTAGE
  ]);

  // Tax checkboxes (to enable/disable taxes)
  const [gstEnabled, setGstEnabled] = useState(true);
  const [stampDutyEnabled, setStampDutyEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [legalFeeEnabled, setLegalFeeEnabled] = useState(true);

  // Computed values for display
  const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
  const [amountBeforeTaxes, setAmountBeforeTaxes] = useState(0);

  // ---------- Calculate additional charges total ----------
  useEffect(() => {
    const total = additionalCharges.reduce((sum, charge) => {
      return sum + (Number(charge.amount) || 0);
    }, 0);
    setAdditionalChargesTotal(total);
  }, [additionalCharges]);

  // ---------- Calculate amount before taxes ----------
  useEffect(() => {
    const baseValue = Number(agreementValue) || 0;
    const additionalTotal = Number(additionalChargesTotal) || 0;
    setAmountBeforeTaxes(baseValue + additionalTotal);
  }, [agreementValue, additionalChargesTotal]);

  // ---------- Calculate taxes based on amount before taxes ----------
  useEffect(() => {
    if (!costTemplate) {
      setGstAmount(0);
      setStampDutyAmount(0);
      setTotalTaxes(0);
      return;
    }

    const baseValue = Number(amountBeforeTaxes) || 0;
    const gstPercent = Number(costTemplate.gst_percent) || 0;
    const stampPercent = Number(costTemplate.stamp_duty_percent) || 0;
    const regAmount = Number(costTemplate.registration_amount) || 0;
    const legalAmount = Number(costTemplate.legal_fee_amount) || 0;

    const calcGst = gstEnabled ? (baseValue * gstPercent) / 100 : 0;
    const calcStamp = stampDutyEnabled ? (baseValue * stampPercent) / 100 : 0;
    const calcReg = registrationEnabled ? regAmount : 0;
    const calcLegal = legalFeeEnabled ? legalAmount : 0;

    const calcTotal = calcGst + calcStamp + calcReg + calcLegal;

    setGstAmount(calcGst);
    setStampDutyAmount(calcStamp);
    setTotalTaxes(calcTotal);
  }, [
    amountBeforeTaxes,
    costTemplate,
    gstEnabled,
    stampDutyEnabled,
    registrationEnabled,
    legalFeeEnabled,
  ]);

  // ---------- Calculate offer discount and final amount ----------
  useEffect(() => {
    const beforeDiscount = Number(amountBeforeTaxes) || 0;
    const taxes = Number(totalTaxes) || 0;
    const totalWithTaxes = beforeDiscount + taxes;

    let discount = 0;

    if (selectedOfferData) {
      if (selectedOfferData.percentage) {
        discount =
          (totalWithTaxes * Number(selectedOfferData.percentage)) / 100;
      } else if (selectedOfferData.amount) {
        discount = Number(selectedOfferData.amount);
      }
    }

    setOfferDiscountValue(discount);
    setFinalAmount(totalWithTaxes - discount);
  }, [amountBeforeTaxes, totalTaxes, selectedOfferData]);

  // ---------- Calculate additional charge amounts based on type ----------
  useEffect(() => {
    const baseValue = Number(agreementValue) || 0;

    setAdditionalCharges((prev) =>
      prev.map((charge) => {
        if (!charge.value) return { ...charge, amount: 0 };

        if (charge.type === "PERCENTAGE") {
          const amount = (baseValue * Number(charge.value)) / 100;
          return { ...charge, amount };
        } else {
          // FIXED
          return { ...charge, amount: Number(charge.value) || 0 };
        }
      })
    );
  }, [agreementValue]);
  // --------- Funding / advance ----------
  const [loanRequired, setLoanRequired] = useState("NO"); // YES / NO
  const [bookingAmount, setBookingAmount] = useState("");
  const [otherCharges, setOtherCharges] = useState("");

  // Top photo
  const [photoFile, setPhotoFile] = useState(null);

  // --------- Additional applicants (dynamic, UI-only for now) ----------
  const [additionalApplicants, setAdditionalApplicants] = useState([
    { full_name: "", relation: "", dob: "", aadhar: "", pan: "" },
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

  // const handleFileChange = (key) => (e) => {
  //   const file = e.target.files && e.target.files[0];
  //   if (!file) return;
  //   setFiles((prev) => ({ ...prev, [key]: file }));
  // };

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

  // ---------- Fetch cost template & offers when leadId is available ----------
  useEffect(() => {
    if (!leadId) {
      setCostTemplate(null);
      setOffers([]);
      return;
    }

    const fetchCostData = async () => {
      try {
        const res = await axiosInstance.get(`/costsheet/lead/${leadId}/init/`);
        const data = res.data || {};

        // Store template data
        const template = data.template || {};
        setCostTemplate({
          gst_percent: template.gst_percent || 0,
          stamp_duty_percent: template.stamp_duty_percent || 0,
          registration_amount: template.registration_amount || 0,
          legal_fee_amount: template.legal_fee_amount || 0,
        });

        // Store offers
        setOffers(data.offers || []);

        // Optional: Update payment plans if different from project-level
        if (data.payment_plans && data.payment_plans.length > 0) {
          setPaymentPlans(data.payment_plans);
        }
      } catch (err) {
        console.error("Failed to fetch cost template & offers:", err);
        // Don't block form if this fails
      }
    };

    fetchCostData();
  }, [leadId]);

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
      { full_name: "", relation: "", dob: "", aadhar: "", pan: "" }, // ✅ Include all fields
    ]);
  };

  const handleAddAdditionalCharge = () => {
    setAdditionalCharges((prev) => [
      ...prev,
      { name: "", type: "FIXED", value: "", amount: 0 },
    ]);
  };

  const handleUpdateAdditionalCharge = (index, field, value) => {
    setAdditionalCharges((prev) =>
      prev.map((charge, idx) => {
        if (idx !== index) return charge;

        const updated = { ...charge, [field]: value };

        // Recalculate amount when value or type changes
        if (field === "value" || field === "type") {
          const baseValue = Number(agreementValue) || 0;
          const chargeValue = field === "value" ? value : charge.value;
          const chargeType = field === "type" ? value : charge.type;

          if (chargeType === "PERCENTAGE") {
            updated.amount = (baseValue * Number(chargeValue || 0)) / 100;
          } else {
            updated.amount = Number(chargeValue || 0);
          }
        }

        return updated;
      })
    );
  };

  const handleRemoveAdditionalCharge = (index) => {
    if (additionalCharges.length === 1) return;
    setAdditionalCharges((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ---------- KYC request create ----------
  const handleSendKycRequest = async () => {
    if (!selectedUnitId) {
      toast.error("Please select a unit before sending KYC request.");
      return;
    }
    if (!project?.id) {
      toast.error("Project is missing – cannot create KYC request.");
      return;
    }
    if (!kycDealAmount || Number(kycDealAmount) <= 0) {
      toast.error("Please enter a valid deal amount for KYC.");
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

  // ---------- Calculate costs whenever agreementValue or template changes ----------
  useEffect(() => {
    if (!agreementValue || !costTemplate) {
      setGstAmount(0);
      setStampDutyAmount(0);
      setTotalTaxes(0);
      return;
    }

    const baseValue = Number(agreementValue) || 0;
    const gstPercent = Number(costTemplate.gst_percent) || 0;
    const stampPercent = Number(costTemplate.stamp_duty_percent) || 0;
    const regAmount = Number(costTemplate.registration_amount) || 0;
    const legalAmount = Number(costTemplate.legal_fee_amount) || 0;

    const calcGst = (baseValue * gstPercent) / 100;
    const calcStamp = (baseValue * stampPercent) / 100;
    const calcTotal = calcGst + calcStamp + regAmount + legalAmount;

    setGstAmount(calcGst);
    setStampDutyAmount(calcStamp);
    setTotalTaxes(calcTotal);
  }, [agreementValue, costTemplate]);

  // ---------- Calculate offer discount and final amount ----------
  useEffect(() => {
    const baseValue = Number(agreementValue) || 0;
    const taxes = Number(totalTaxes) || 0;
    const amountBeforeDiscount = baseValue + taxes;

    let discount = 0;

    if (selectedOfferData) {
      if (selectedOfferData.percentage) {
        // Percentage-based discount
        discount =
          (amountBeforeDiscount * Number(selectedOfferData.percentage)) / 100;
      } else if (selectedOfferData.amount) {
        // Flat amount discount
        discount = Number(selectedOfferData.amount);
      }
    }

    setOfferDiscountValue(discount);
    setFinalAmount(amountBeforeDiscount - discount);
  }, [agreementValue, totalTaxes, selectedOfferData]);

  // ---------- Update selected offer data when offer changes ----------
  useEffect(() => {
    if (!selectedOfferId) {
      setSelectedOfferData(null);
      return;
    }
    const offer = offers.find((o) => String(o.id) === String(selectedOfferId));
    setSelectedOfferData(offer || null);
  }, [selectedOfferId, offers]);

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
      setAgreementValueWords("");
      return;
    }

    const inv = selectedUnit.inventory || {};

    // Auto-fill area fields
    const sb =
      inv.saleable_sqft ||
      inv.builtup_sqft ||
      inv.rera_area_sqft ||
      selectedUnit.saleable_sqft ||
      "";
    const ca = inv.carpet_sqft || "";
    const ba = inv.balcony_sqft || "";

    setSuperBuiltupSqft(sb || "");
    setCarpetSqft(ca || "");
    setBalconySqft(ba || "");

    // Calculate agreement value with discount
    const baseAgr =
      inv.total_cost ||
      inv.agreement_value ||
      selectedUnit.agreement_value ||
      "";

    if (baseAgr) {
      const baseAmount = Number(baseAgr);
      const discount = Number(discountAmount) || 0;
      const finalAmount = baseAmount - discount;

      setAgreementValue(finalAmount);
      setAgreementValueWords(numberToWords(Math.floor(finalAmount)));
    } else {
      setAgreementValue("");
      setAgreementValueWords("");
    }
  }, [selectedUnit, discountAmount]);

  // Auto-generate agreement value in words
  useEffect(() => {
    if (agreementValue) {
      const words = numberToWords(Math.floor(Number(agreementValue)));
      setAgreementValueWords(words);
    } else {
      setAgreementValueWords("");
    }
  }, [agreementValue]);

  // Calculate discount amount from percentage or vice versa
  useEffect(() => {
    if (!selectedUnit) return;

    const inv = selectedUnit.inventory || {};
    const basePrice = Number(
      inv.total_cost || inv.agreement_value || selectedUnit.agreement_value || 0
    );

    if (discountPercent && !discountAmount) {
      // Calculate amount from percentage
      const calculatedAmount = (basePrice * Number(discountPercent)) / 100;
      setDiscountAmount(calculatedAmount.toFixed(2));
    } else if (discountAmount && !discountPercent) {
      // Calculate percentage from amount
      const calculatedPercent = (Number(discountAmount) / basePrice) * 100;
      setDiscountPercent(calculatedPercent.toFixed(2));
    }
  }, [discountPercent, discountAmount, selectedUnit]);
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

  // Helper function to convert number to words (Indian format)
  const numberToWords = (num) => {
    if (!num || num === 0) return "Zero Rupees Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
      );
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = "";
    if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
    if (thousand > 0)
      result += convertLessThanThousand(thousand) + " Thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim() + " Rupees Only";
  };


  // ✅ ADD THIS ENTIRE BLOCK
// Calculate all applicants (including primary)
const allApplicants = useMemo(() => {
  const applicants = [
    {
      sequence: 1,
      title: primaryTitle,
      full_name: primaryFullName,
      dob: primaryDob,
      pan: primaryPanNo,
      aadhar: primaryAadharNo,
      email: email1,
      phone: phone1,
      isPrimary: true,
    },
  ];

  additionalApplicants.forEach((app, idx) => {
    if (app.full_name && app.full_name.trim()) {
      applicants.push({
        sequence: idx + 2,
        title: "Mr.",
        full_name: app.full_name,
        relation: app.relation,
        dob: app.dob,
        pan: app.pan,
        aadhar: app.aadhar,
        isPrimary: false,
      });
    }
  });

  return applicants;
}, [
  primaryTitle,
  primaryFullName,
  primaryDob,
  primaryPanNo,
  primaryAadharNo,
  email1,
  phone1,
  additionalApplicants,
]);



  // ---------- Save Booking ----------
  const handleSaveBooking = async () => {
    // ---------- VALIDATIONS ----------
if (!selectedUnitId) {
  toast.error("Please select a tower & flat (unit) before saving.");
  return;
}

  if (!primaryPanNo || !validatePAN(primaryPanNo)) {
    toast.error("Please enter a valid PAN number for primary applicant.");
    return;
  }
  if (!primaryAadharNo || !validateAadhar(primaryAadharNo)) {
    toast.error("Please enter a valid Aadhar number for primary applicant.");
    return;
  }
  if (email1 && !validateEmail(email1)) {
    toast.error("Please enter a valid email address.");
    return;
  }
  if (phone1 && !validatePhone(phone1)) {
    toast.error("Please enter a valid 10-digit phone number.");
    return;
  }
  if (!bookingDate) {
    toast.error("Please select Booking Date.");
    return;
  }
  if (!agreementValue) {
    toast.error("Please enter Agreement Value.");
    return;
  }
  if (paymentPlanType === "MASTER" && !selectedPaymentPlanId) {
    toast.error("Please select a Payment Plan.");
    return;
  }
  if (paymentPlanType === "CUSTOM" && customTotalPercentage !== 100) {
    toast.error("Custom payment plan slabs must total 100%.");
    return;
  }



    if (!primaryFullName) {
      toast.error("Please enter Primary Applicant full name.");
      return;
    }
    if (!bookingDate) {
      toast.error("Please select Booking Date.");
      return;
    }
    if (!agreementValue) {
      toast.error("Please enter Agreement Value.");
      return;
    }
    if (paymentPlanType === "MASTER" && !selectedPaymentPlanId) {
      toast.error("Please select a Payment Plan.");
      return;
    }
    if (paymentPlanType === "CUSTOM" && customTotalPercentage !== 100) {
      toast.error("Custom payment plan slabs must total 100%.");
      return;
    }

      for (let i = 0; i < additionalApplicants.length; i++) {
        const app = additionalApplicants[i];
        if (app.full_name && app.full_name.trim()) {
          if (app.pan && !validatePAN(app.pan)) {
            toast.error(`Invalid PAN for applicant ${i + 2}: ${app.full_name}`);
            return;
          }
          if (app.aadhar && !validateAadhar(app.aadhar)) {
            toast.error(
              `Invalid Aadhar for applicant ${i + 2}: ${app.full_name}`
            );
            return;
          }
        }
      }

    // Sales user constraint
    if (currentUser?.role === "SALES" && !leadId) {
      toast.error("SALES user must link a lead. Open booking via Lead screen.");
      return;
    }

    // KYC validation
    if (requiresKyc === "YES") {
      if (!kycRequestId) {
        toast.error(
          "Please generate KYC and wait for approval before booking."
        );
        return;
      }
      if (kycRequestStatus !== "APPROVED") {
        alert(
          `KYC is ${kycRequestStatus}. Booking allowed only after APPROVED.`
        );
        return;
      }
    }

    setSaving(true);
    toast.info("Submitting booking...");

    try {
      const fd = new FormData();

      // ==================================================
      // BASIC INFO
      // ==================================================
      fd.append("unit_id", selectedUnitId);
      if (leadId) fd.append("sales_lead_id", String(leadId));

      fd.append("form_ref_no", formRefNo || "");
      fd.append("booking_date", bookingDate || "");
      fd.append("office_address", office || "");

      // ==================================================
      // PRIMARY APPLICANT SNAPSHOT (Booking model)
      // ==================================================
      fd.append("primary_title", primaryTitle || "Mr.");
      fd.append("primary_full_name", primaryFullName || "");
      fd.append("primary_email", email1 || "");
      fd.append("primary_mobile_number", phone1 || "");
      fd.append("email_2", "");
      fd.append("phone_2", "");

      // ==================================================
      // ADDRESSES
      // ==================================================
      fd.append("permanent_address", permanentAddress || "");
      fd.append("correspondence_address", correspondenceAddress || "");
      fd.append("preferred_correspondence", preferredCorrespondence || "");
      fd.append("residential_status", residentialStatus || "");

      // ==================================================
      // FLAT INFO
      // ==================================================
      fd.append("super_builtup_sqft", superBuiltupSqft || "");
      fd.append("carpet_sqft", carpetSqft || "");
      fd.append("balcony_sqft", balconySqft || "");
      fd.append("agreement_value", agreementValue || "");
      fd.append("agreement_value_words", agreementValueWords || "");

      fd.append("agreement_done", agreementDone);
      fd.append("parking_required", parkingRequired === "YES");

      fd.append("parking_details", parkingDetails || "");
      fd.append("parking_number", parkingNumber || "");

      // ==================================================
      // TAXES & DISCOUNTS
      // ==================================================
      fd.append("gst_no", gstNo || "");
      fd.append("discount_percent", discountPercent || "0");
      fd.append("discount_amount", discountAmount || "0");

      fd.append("additional_charges", JSON.stringify(additionalCharges));
      fd.append("additional_charges_total", additionalChargesTotal.toFixed(2));
      fd.append("amount_before_taxes", amountBeforeTaxes.toFixed(2));

      // ==================================================
      // COST TEMPLATE
      // ==================================================
      if (costTemplate) {
        fd.append("gst_percent", costTemplate.gst_percent || "0");
        fd.append("gst_enabled", gstEnabled);
        fd.append("gst_amount", gstAmount.toFixed(2));

        fd.append("stamp_duty_percent", costTemplate.stamp_duty_percent || "0");
        fd.append("stamp_duty_enabled", stampDutyEnabled);
        fd.append("stamp_duty_amount", stampDutyAmount.toFixed(2));

        fd.append(
          "registration_amount",
          costTemplate.registration_amount || "0"
        );
        fd.append("registration_enabled", registrationEnabled);
        fd.append("legal_fee_amount", costTemplate.legal_fee_amount || "0");
        fd.append("legal_fee_enabled", legalFeeEnabled);
      }

      // ==================================================
      // OFFER / TOTALS
      // ==================================================
      if (selectedOfferId) fd.append("offer_id", selectedOfferId);
      fd.append("offer_discount", offerDiscountValue.toFixed(2));
      fd.append("total_taxes", totalTaxes.toFixed(2));
      fd.append("final_amount", finalAmount.toFixed(2));

      // ==================================================
      // PAYMENT PLAN
      // ==================================================
      fd.append("payment_plan_type", paymentPlanType);

      if (requiresKyc === "YES" && kycRequestId)
        fd.append("kyc_request_id", String(kycRequestId));

      if (paymentPlanType === "MASTER" && selectedPaymentPlanId)
        fd.append("payment_plan_id", selectedPaymentPlanId);

      if (paymentPlanType === "CUSTOM") {
        fd.append(
          "custom_payment_plan",
          JSON.stringify({
            name: customPlanName || "",
            slabs: customSlabs.map((s, idx) => ({
              order_index: idx + 1,
              name: s.name,
              percentage: Number(s.percentage || 0),
              days: s.days === "" ? null : Number(s.days),
            })),
          })
        );
      }

      // ==================================================
      // FUNDING
      // ==================================================
      fd.append("loan_required", loanRequired === "YES" ? "true" : "false");
      fd.append("loan_bank_name", "");
      fd.append("loan_amount_expected", "");
      fd.append("booking_amount", bookingAmount || "0");
      fd.append("other_charges", otherCharges || "0");

      // ==================================================
      // MAIN PHOTO
      // ==================================================
      if (photoFile) fd.append("photo", photoFile);

      // ==================================================
      // APPLICANTS — BRACKET NOTATION (FIXED)
      // ==================================================

      // PRIMARY APPLICANT (index 0)
      fd.append("applicants[0][is_primary]", true);
      fd.append("applicants[0][sequence]", "1");
      fd.append("applicants[0][title]", primaryTitle || "Mr.");
      fd.append("applicants[0][full_name]", primaryFullName || "");
      fd.append("applicants[0][relation]", "");
      if (primaryDob) {
        fd.append("applicants[0][date_of_birth]", primaryDob);
      }
      fd.append("applicants[0][email]", email1 || "");
      fd.append("applicants[0][mobile_number]", phone1 || "");
      fd.append("applicants[0][pan_no]", primaryPanNo || "");
      fd.append("applicants[0][aadhar_no]", primaryAadharNo || "");

      if (files.primaryPanFront)
        fd.append("applicants[0][pan_front]", files.primaryPanFront);
      if (files.primaryPanBack)
        fd.append("applicants[0][pan_back]", files.primaryPanBack);
      if (files.primaryAadharFront)
        fd.append("applicants[0][aadhar_front]", files.primaryAadharFront);
      if (files.primaryAadharBack)
        fd.append("applicants[0][aadhar_back]", files.primaryAadharBack);

      // ADDITIONAL APPLICANTS
      let applicantIndex = 1;

      additionalApplicants.forEach((app, idx) => {
        if (app.full_name && app.full_name.trim()) {
          fd.append(`applicants[${applicantIndex}][is_primary]`, "false");
          fd.append(
            `applicants[${applicantIndex}][sequence]`,
            String(applicantIndex + 1)
          );
          fd.append(`applicants[${applicantIndex}][title]`, "Mr.");
          fd.append(
            `applicants[${applicantIndex}][full_name]`,
            app.full_name.trim()
          );
          fd.append(
            `applicants[${applicantIndex}][relation]`,
            app.relation || ""
          );
          if (app.dob && app.dob.trim()) {
            fd.append(`applicants[${applicantIndex}][date_of_birth]`, app.dob);
          }
          fd.append(`applicants[${applicantIndex}][email]`, "");
          fd.append(`applicants[${applicantIndex}][mobile_number]`, "");
          fd.append(`applicants[${applicantIndex}][pan_no]`, app.pan || "");
          fd.append(
            `applicants[${applicantIndex}][aadhar_no]`,
            app.aadhar || ""
          );

          // files
          const filePrefix = ["second", "third", "fourth"][idx];

          if (files[`${filePrefix}PanFront`])
            fd.append(
              `applicants[${applicantIndex}][pan_front]`,
              files[`${filePrefix}PanFront`]
            );
          if (files[`${filePrefix}PanBack`])
            fd.append(
              `applicants[${applicantIndex}][pan_back]`,
              files[`${filePrefix}PanBack`]
            );
          if (files[`${filePrefix}AadharFront`])
            fd.append(
              `applicants[${applicantIndex}][aadhar_front]`,
              files[`${filePrefix}AadharFront`]
            );
          if (files[`${filePrefix}AadharBack`])
            fd.append(
              `applicants[${applicantIndex}][aadhar_back]`,
              files[`${filePrefix}AadharBack`]
            );

          applicantIndex++;
        }
      });

      // ==================================================
      // ATTACHMENTS — BRACKET NOTATION (FIXED)
      // ==================================================
      let attachmentIndex = 0;

      if (files.kycAadhar) {
        fd.append(`attachments[${attachmentIndex}][label]`, "KYC Aadhar");
        fd.append(`attachments[${attachmentIndex}][doc_type]`, "AADHAR");
        fd.append(`attachments[${attachmentIndex}][file]`, files.kycAadhar);
        attachmentIndex++;
      }

      if (files.kycPan) {
        fd.append(`attachments[${attachmentIndex}][label]`, "KYC PAN");
        fd.append(`attachments[${attachmentIndex}][doc_type]`, "PAN");
        fd.append(`attachments[${attachmentIndex}][file]`, files.kycPan);
        attachmentIndex++;
      }

      // ==================================================
      // DEBUG LOGGING
      // ==================================================
      console.log("=== BOOKING SUBMISSION ===");
      for (let pair of fd.entries()) {
        if (pair[1] instanceof File)
          console.log(pair[0], "→ FILE:", pair[1].name);
        else console.log(pair[0], "→", pair[1]);
      }

      // ==================================================
      // SUBMIT
      // ==================================================
      const res = await axiosInstance.post(`${BOOK_API_PREFIX}/bookings/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

    toast.success("Booking saved successfully! 🎉"); // ✅ REPLACE alert
    console.log("BOOKING CREATED:", res.data);
    } catch (err) {
    console.error("❌ Booking save failed:", err);
    const errorMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Unknown error occurred";
    toast.error(`Booking Failed: ${errorMsg}`); // ✅ REPLACE alert
  
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
                      onChange={(e) => handlePrimaryPanChange(e.target.value)}
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      style={{ textTransform: "uppercase" }}
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
                      onChange={(e) =>
                        handlePrimaryAadharChange(e.target.value)
                      }
                      maxLength={12}
                      placeholder="123456789012"
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
                    <div
                      key={idx}
                      style={{
                        marginBottom: "24px",
                        paddingBottom: "24px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">Full Name</label>
                          <input
                            className="bf-input"
                            type="text"
                            placeholder="Priya Kumar"
                            value={app.full_name || ""}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "full_name",
                                e.target.value
                              )
                            }
                          />
                        </div>
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
                            max={getTodayDate()}
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
                      </div>
                      <div className="bf-row">
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
                        <div className="bf-col">
                          <label className="bf-label">PAN Number</label>
                          <input
                            className="bf-input"
                            type="text"
                            placeholder="ABCDE1234F"
                            value={app.pan || ""}
                            onChange={(e) =>
                              handleAdditionalApplicantChange(
                                idx,
                                "pan",
                                e.target.value
                              )
                            }
                          />
                        </div>
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

                {/* Rest of the file upload sections remain the same */}

                {/* Rest of the file upload sections remain the same */}

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
                      onChange={(e) => handleEmailChange(e.target.value)}
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Phone Number 1</label>
                    <input
                      className="bf-input"
                      type="tel"
                      placeholder="9876543210"
                      value={phone1}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
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

                  {/* Flat / Unit dropdown (custom) - ENHANCED */}
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
                          {towerUnits.map((u) => {
                            // ✅ Determine unit status
                            const unitStatus = u.status || "NOT_RELEASED";
                            const inventoryStatus =
                              u.inventory?.availability_status ||
                              u.inventory?.unit_status;

                            // Check if unit is BOOKED or BLOCKED
                            const isBooked =
                              unitStatus === "BOOKED" ||
                              inventoryStatus === "BOOKED";
                            const isBlocked =
                              unitStatus === "BLOCKED" ||
                              inventoryStatus === "BLOCKED" ||
                              inventoryStatus === "BLOCKED_BY_ADMIN";
                            const isAvailable =
                              !isBooked &&
                              !isBlocked &&
                              (unitStatus === "RELEASED" ||
                                inventoryStatus === "AVAILABLE");

                            // Determine background color
                            let bgColor = "#ffffff"; // default white
                            let textColor = "#374151"; // default dark gray
                            let cursor = "pointer";
                            let opacity = 1;

                            if (isBooked) {
                              bgColor = "#fee2e2"; // red-100
                              textColor = "#991b1b"; // red-800
                              cursor = "not-allowed";
                              opacity = 0.6;
                            } else if (isBlocked) {
                              bgColor = "#fef3c7"; // yellow-100
                              textColor = "#92400e"; // yellow-800
                              cursor = "not-allowed";
                              opacity = 0.6;
                            } else if (!isAvailable) {
                              bgColor = "#f3f4f6"; // gray-100
                              textColor = "#6b7280"; // gray-500
                              cursor = "not-allowed";
                              opacity = 0.6;
                            }

                            return (
                              <button
                                key={u.id}
                                type="button"
                                className="bf-dropdown-item"
                                disabled={!isAvailable}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // Prevent selection if not available
                                  if (!isAvailable) {
                                    if (isBooked) {
                                      toast.error(
                                        `Unit ${u.unit_no} is already BOOKED`
                                      );
                                    } else if (isBlocked) {
                                      toast.warn(
                                        `Unit ${u.unit_no} is BLOCKED`
                                      );
                                    } else {
                                      toast.warn(
                                        `Unit ${u.unit_no} is not available for booking`
                                      );
                                    }
                                    return;
                                  }

                                  setSelectedUnitId(String(u.id));
                                  setUnitOpen(false);
                                }}
                                style={{
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  cursor: cursor,
                                  opacity: opacity,
                                  fontWeight:
                                    isBooked || isBlocked ? "600" : "400",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  {u.unit_no}
                                  {u.floor_number
                                    ? ` (Floor ${u.floor_number})`
                                    : ""}
                                </span>
                                {isBooked && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#dc2626",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    BOOKED
                                  </span>
                                )}
                                {isBlocked && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#f59e0b",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    BLOCKED
                                  </span>
                                )}
                                {!isAvailable && !isBooked && !isBlocked && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      backgroundColor: "#6b7280",
                                      color: "white",
                                      borderRadius: "4px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    NOT AVAILABLE
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ ADD THIS LEGEND */}
                  {selectedTowerId && (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        gap: "12px",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#fee2e2",
                            border: "1px solid #991b1b",
                            borderRadius: "2px",
                          }}
                        />
                        <span>Booked</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#fef3c7",
                            border: "1px solid #92400e",
                            borderRadius: "2px",
                          }}
                        />
                        <span>Blocked</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #6b7280",
                            borderRadius: "2px",
                          }}
                        />
                        <span>Not Available</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #059669",
                            borderRadius: "2px",
                          }}
                        />
                        <span>Available</span>
                      </div>
                    </div>
                  )}
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

                {/* Discount Row */}
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">Discount (%)</label>
                    <input
                      className="bf-input"
                      type="number"
                      value={discountPercent}
                      onChange={(e) => {
                        setDiscountPercent(e.target.value);
                        setDiscountAmount(""); // Clear amount when % changes
                      }}
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div className="bf-col">
                    <label className="bf-label">Discount Amount</label>
                    <input
                      className="bf-input"
                      type="number"
                      value={discountAmount}
                      onChange={(e) => {
                        setDiscountAmount(e.target.value);
                        setDiscountPercent(""); // Clear % when amount changes
                      }}
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                {/* Agreement Value Row */}
                <div className="bf-row">
                  <div className="bf-col">
                    <label className="bf-label">
                      Agreement Value (In Rupees){" "}
                      <span className="bf-required">*</span>
                    </label>
                    <input
                      className="bf-input bf-input-readonly"
                      type="number"
                      value={agreementValue}
                      readOnly
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
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>
                  {parkingRequired === "YES" && (
                    <>
                      <div className="bf-col">
                        <label className="bf-label">Parking Details</label>
                        <input
                          className="bf-input"
                          type="text"
                          value={parkingDetails}
                          onChange={(e) => setParkingDetails(e.target.value)}
                          placeholder="Covered/Open, Type"
                        />
                      </div>
                      <div className="bf-col">
                        <label className="bf-label">Parking Number</label>
                        <input
                          className="bf-input"
                          type="text"
                          value={parkingNumber}
                          onChange={(e) => setParkingNumber(e.target.value)}
                          placeholder="P-123"
                        />
                      </div>
                    </>
                  )}
                </div>
              </Section>

              {/* Additional Charges */}
              <Section
                id="costSummary"
                title="Additional Charges"
                open={openSections.costSummary}
                onToggle={toggleSection}
              >
                {!leadId ? (
                  <div className="bf-subcard">
                    <p style={{ color: "#6b7280" }}>
                      Cost summary is only available when booking is linked to a
                      lead.
                    </p>
                  </div>
                ) : !costTemplate ? (
                  <div className="bf-subcard">
                    <p style={{ color: "#6b7280" }}>Loading cost template...</p>
                  </div>
                ) : (
                  <>
                    <div className="bf-subcard">
                      <div style={{ marginBottom: "16px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            gap: "12px",
                            marginBottom: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          <div>Charge Name</div>
                          <div>Type</div>
                          <div>Value</div>
                          <div>Amount</div>
                        </div>

                        {additionalCharges.map((charge, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                              gap: "12px",
                              marginBottom: "12px",
                              alignItems: "center",
                            }}
                          >
                            <input
                              className="bf-input"
                              type="text"
                              placeholder="e.g., Amenity Charges"
                              value={charge.name}
                              onChange={(e) =>
                                handleUpdateAdditionalCharge(
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                            />

                            <select
                              className="bf-input"
                              value={charge.type}
                              onChange={(e) =>
                                handleUpdateAdditionalCharge(
                                  idx,
                                  "type",
                                  e.target.value
                                )
                              }
                            >
                              <option value="FIXED">Fixed</option>
                              <option value="PERCENTAGE">Percentage</option>
                            </select>

                            <input
                              className="bf-input"
                              type="number"
                              placeholder={
                                charge.type === "PERCENTAGE" ? "%" : "Amount"
                              }
                              value={charge.value}
                              onChange={(e) =>
                                handleUpdateAdditionalCharge(
                                  idx,
                                  "value",
                                  e.target.value
                                )
                              }
                            />

                            <input
                              className="bf-input bf-input-readonly"
                              type="number"
                              value={charge.amount.toFixed(2)}
                              readOnly
                            />

                            {additionalCharges.length > 1 && (
                              <button
                                type="button"
                                className="bf-btn-secondary"
                                onClick={() =>
                                  handleRemoveAdditionalCharge(idx)
                                }
                                style={{ padding: "6px 12px" }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          className="bf-btn-secondary"
                          onClick={handleAddAdditionalCharge}
                          style={{ marginTop: "8px" }}
                        >
                          + Add New Charge
                        </button>
                      </div>

                      {/* Summary - WITHOUT Final Amount */}
                      <div
                        style={{
                          borderTop: "1px solid #e5e7eb",
                          paddingTop: "16px",
                          marginTop: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            color: "#6b7280",
                          }}
                        >
                          <span>Net Base Value</span>
                          <span>₹{Number(agreementValue || 0).toFixed(2)}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            color: "#6b7280",
                          }}
                        >
                          <span>Additional Charges Total</span>
                          <span>₹{additionalChargesTotal.toFixed(2)}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            paddingTop: "12px",
                            borderTop: "2px solid #e5e7eb",
                            fontWeight: "600",
                            fontSize: "15px",
                          }}
                        >
                          <span>Amount Before Taxes</span>
                          <span>₹{amountBeforeTaxes.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Offer Selection */}
                      {offers.length > 0 && (
                        <div style={{ marginTop: "16px" }}>
                          <label className="bf-label">
                            Apply Offer (Optional)
                          </label>
                          <select
                            className="bf-input"
                            value={selectedOfferId}
                            onChange={(e) => setSelectedOfferId(e.target.value)}
                          >
                            <option value="">No Offer</option>
                            {offers.map((offer) => (
                              <option key={offer.id} value={offer.id}>
                                {offer.name}
                                {offer.percentage &&
                                  ` (${offer.percentage}% off)`}
                                {offer.amount && ` (₹${offer.amount} off)`}
                              </option>
                            ))}
                          </select>
                          {offerDiscountValue > 0 && (
                            <div
                              style={{
                                marginTop: "8px",
                                color: "#059669",
                                fontWeight: "600",
                              }}
                            >
                              Offer Discount: -₹{offerDiscountValue.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Section>

              {/* Taxes & Statutory */}
              <Section
                id="taxesStatutory"
                title="Taxes & Statutory"
                open={openSections.taxesStatutory}
                onToggle={toggleSection}
              >
                {!leadId || !costTemplate ? (
                  <div className="bf-subcard">
                    <p style={{ color: "#6b7280" }}>
                      Tax details will be available after Additional Charges
                      section loads.
                    </p>
                  </div>
                ) : (
                  <div className="bf-subcard">
                    <div style={{ display: "flex", gap: "24px" }}>
                      {/* Left side - Tax checkboxes */}
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: "12px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={gstEnabled}
                              onChange={(e) => setGstEnabled(e.target.checked)}
                            />
                            <span>
                              GST ({costTemplate.gst_percent}% on Amount Before
                              Taxes)
                            </span>
                          </label>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={stampDutyEnabled}
                              onChange={(e) =>
                                setStampDutyEnabled(e.target.checked)
                              }
                            />
                            <span>
                              Stamp Duty ({costTemplate.stamp_duty_percent}% on
                              Amount Before Taxes)
                            </span>
                          </label>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={registrationEnabled}
                              onChange={(e) =>
                                setRegistrationEnabled(e.target.checked)
                              }
                            />
                            <span>
                              Registration Fees (₹
                              {Number(costTemplate.registration_amount).toFixed(
                                2
                              )}
                              )
                            </span>
                          </label>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={legalFeeEnabled}
                              onChange={(e) =>
                                setLegalFeeEnabled(e.target.checked)
                              }
                            />
                            <span>
                              Legal Fees (₹
                              {Number(costTemplate.legal_fee_amount).toFixed(2)}
                              )
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Right side - Tax summary */}
                      <div
                        style={{
                          minWidth: "300px",
                          padding: "16px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            marginBottom: "8px",
                            color: "#6b7280",
                          }}
                        >
                          Total Taxes
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            marginBottom: "16px",
                          }}
                        >
                          ₹{totalTaxes.toFixed(2)}
                        </div>
                        <div
                          style={{
                            paddingTop: "12px",
                            borderTop: "1px solid #e5e7eb",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              marginBottom: "6px",
                            }}
                          >
                            Final Amount (Incl. Taxes):
                          </div>
                          <div
                            style={{
                              fontSize: "24px",
                              fontWeight: "700",
                              color: "#059669",
                            }}
                          >
                            ₹{finalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

                    {/* Same grid format as custom plan */}
                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr",
                          gap: "12px",
                          marginBottom: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        <div>Installment Name</div>
                        <div>Percentage</div>
                        <div>Amount</div>
                        <div>Due Date (Days)</div>
                      </div>

                      {selectedPaymentPlan.slabs.map((slab) => (
                        <div
                          key={slab.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            gap: "12px",
                            marginBottom: "12px",
                            alignItems: "center",
                            padding: "8px",
                            backgroundColor: "#f9fafb",
                            borderRadius: "4px",
                          }}
                        >
                          <div style={{ fontSize: "14px" }}>{slab.name}</div>
                          <div style={{ fontSize: "14px", fontWeight: "500" }}>
                            {slab.percentage}%
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: "500" }}>
                            ₹
                            {(
                              (Number(agreementValue || 0) * slab.percentage) /
                              100
                            ).toFixed(2)}
                          </div>
                          <div style={{ fontSize: "14px" }}>
                            {slab.days !== null ? `${slab.days} days` : "-"}
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          marginTop: "12px",
                          padding: "8px",
                          backgroundColor: "#f0fdf4",
                          borderRadius: "4px",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        Total: {selectedPaymentPlan.total_percentage}%
                      </div>
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

                    {/* Updated grid layout matching screenshot */}
                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr",
                          gap: "12px",
                          marginBottom: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        <div>Installment Name</div>
                        <div>Percentage</div>
                        <div>Amount</div>
                        <div>Due Date</div>
                      </div>

                      {customSlabs.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                            gap: "12px",
                            marginBottom: "12px",
                            alignItems: "center",
                          }}
                        >
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
                            placeholder="e.g., On Booking"
                          />

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

                          <input
                            className="bf-input bf-input-readonly"
                            type="number"
                            value={
                              row.percentage
                                ? (
                                    (Number(agreementValue || 0) *
                                      Number(row.percentage)) /
                                    100
                                  ).toFixed(2)
                                : "0.00"
                            }
                            readOnly
                          />

                          <input
                            className="bf-input"
                            type="date"
                            value={row.days || ""}
                            onChange={(e) =>
                              handleUpdateCustomSlab(
                                idx,
                                "days",
                                e.target.value
                              )
                            }
                            placeholder="dd-mm-yyyy"
                          />

                          {customSlabs.length > 1 && (
                            <button
                              type="button"
                              className="bf-btn-secondary"
                              onClick={() => handleRemoveCustomSlab(idx)}
                              style={{ padding: "6px 12px" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      <div
                        style={{
                          marginTop: "12px",
                          color: "#dc2626",
                          fontSize: "14px",
                        }}
                      >
                        Total Percentage: {customTotalPercentage.toFixed(2)}%
                        (should be 100%)
                      </div>

                      <button
                        type="button"
                        className="bf-btn-secondary"
                        onClick={handleAddCustomSlab}
                        style={{ marginTop: "8px" }}
                      >
                        + Add Installment
                      </button>
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

              {/* Applicant Summary */}
              <Section
                id="applicantSummary"
                title={`Applicant Summary (${allApplicants.length} Total)`}
                open={openSections.applicantSummary}
                onToggle={toggleSection}
              >
                <div className="bf-subcard">
                  {allApplicants.map((applicant, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "20px",
                        padding: "16px",
                        backgroundColor: applicant.isPrimary
                          ? "#f0f9ff"
                          : "#f9fafb",
                        borderRadius: "8px",
                        border: applicant.isPrimary
                          ? "2px solid #3b82f6"
                          : "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "600",
                            color: applicant.isPrimary ? "#1e40af" : "#374151",
                          }}
                        >
                          {applicant.isPrimary ? "🔑 " : ""}
                          Applicant #{applicant.sequence}: {applicant.title}{" "}
                          {applicant.full_name}
                        </h4>
                        {applicant.isPrimary && (
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "12px",
                        }}
                      >
                        {applicant.relation && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Relation:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.relation}
                            </div>
                          </div>
                        )}
                        {applicant.dob && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Date of Birth:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.dob}
                            </div>
                          </div>
                        )}
                        <div>
                          <strong
                            style={{ fontSize: "12px", color: "#6b7280" }}
                          >
                            PAN Number:
                          </strong>
                          <div
                            style={{
                              fontSize: "14px",
                              fontFamily: "monospace",
                              color: applicant.pan ? "#059669" : "#9ca3af",
                            }}
                          >
                            {applicant.pan || "Not provided"}
                          </div>
                        </div>
                        <div>
                          <strong
                            style={{ fontSize: "12px", color: "#6b7280" }}
                          >
                            Aadhar Number:
                          </strong>
                          <div
                            style={{
                              fontSize: "14px",
                              fontFamily: "monospace",
                              color: applicant.aadhar ? "#059669" : "#9ca3af",
                            }}
                          >
                            {applicant.aadhar
                              ? `XXXX XXXX ${applicant.aadhar.slice(-4)}`
                              : "Not provided"}
                          </div>
                        </div>
                        {applicant.email && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Email:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.email}
                            </div>
                          </div>
                        )}
                        {applicant.phone && (
                          <div>
                            <strong
                              style={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              Phone:
                            </strong>
                            <div style={{ fontSize: "14px" }}>
                              {applicant.phone}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Show uploaded documents */}
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <strong style={{ fontSize: "12px", color: "#6b7280" }}>
                          Documents Uploaded:
                        </strong>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          {(() => {
                            const docs = [];
                            const prefix = [
                              "primary",
                              "second",
                              "third",
                              "fourth",
                            ][idx];
                            if (files[`${prefix}PanFront`])
                              docs.push("PAN Front");
                            if (files[`${prefix}PanBack`])
                              docs.push("PAN Back");
                            if (files[`${prefix}AadharFront`])
                              docs.push("Aadhar Front");
                            if (files[`${prefix}AadharBack`])
                              docs.push("Aadhar Back");

                            return docs.length > 0 ? (
                              docs.map((doc, i) => (
                                <span
                                  key={i}
                                  style={{
                                    padding: "4px 8px",
                                    backgroundColor: "#d1fae5",
                                    color: "#065f46",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                  }}
                                >
                                  ✓ {doc}
                                </span>
                              ))
                            ) : (
                              <span
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                No documents uploaded
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
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

export default BookingForm
