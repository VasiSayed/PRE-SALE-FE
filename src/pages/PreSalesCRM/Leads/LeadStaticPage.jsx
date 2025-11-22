import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axiosInstance";
import { toast } from "react-hot-toast";
import "./LeadStaticPage.css";

// helper for datetime-local default
const nowForInput = () => new Date().toISOString().slice(0, 16);

const LeadStaticPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: leadIdFromPath } = useParams();
  const leadId = searchParams.get("lead_id") || leadIdFromPath || null;

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- lookups from /client/setup-bundle/ ----
  const [lookups, setLookups] = useState(null);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // ---- CP dropdown ----
  const [cpOptions, setCpOptions] = useState([]);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpSelected, setCpSelected] = useState("");

  // ---- right-side tabs ----
  const [activeTab, setActiveTab] = useState("activity");

  // ---- activity (updates) ----
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: "",
    info: "",
    event_date: nowForInput(),
  });
  const [savingActivity, setSavingActivity] = useState(false);

  // ---- right-side documents ----
  const fileInputRef = useRef(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");

  // ---- stage change modal ----
  const [stageModal, setStageModal] = useState({
    open: false,
    stage: null,
  });
  const [savingStage, setSavingStage] = useState(false);

  // ---- collapsible sections ----
  const [collapsedSections, setCollapsedSections] = useState({
    cp: false,
    proposal: false,
    interested: false,
    additional: false,
    professional: false,
    address: false,
  });

  // ---- bottom extra info forms ----
  const [cpInfoForm, setCpInfoForm] = useState({
    referral_code: "",
  });

  const [personalForm, setPersonalForm] = useState({
    date_of_birth: "",
    date_of_anniversary: "",
    already_part_of_family: false,
    secondary_email: "",
    alternate_mobile: "",
    alternate_tel_res: "",
    alternate_tel_off: "",
    visiting_on_behalf: "",
    current_residence_ownership: "",
    current_residence_type: "",
    family_size: "",
    possession_desired_in: "",
    facebook: "",
    twitter: "",
    linkedin: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    occupation: "",
    organization_name: "",
    office_location: "",
    office_pincode: "",
    designation: "",
  });

  const [addressForm, setAddressForm] = useState({
    flat_or_building: "",
    area: "",
    pincode: "",
    city: "",
    state: "",
    country: "",
  });

  const [proposalFiles, setProposalFiles] = useState([]);
  const [savingExtra, setSavingExtra] = useState(false);

  // ---- Lead Information inline edit ----
  const [leadInfoForm, setLeadInfoForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    budget: "",
    annual_income: "",
  });
  const [leadInfoEdit, setLeadInfoEdit] = useState(false);
  const [savingLeadInfo, setSavingLeadInfo] = useState(false);
  const [activityFilter, setActivityFilter] = useState("");
  // ---- Interested Inventory (InterestedLeadUnit) ----
  const [interestedUnits, setInterestedUnits] = useState([]);
  const [loadingInterested, setLoadingInterested] = useState(false);
  const [removingInterestedId, setRemovingInterestedId] = useState(null);

  // ---- Add Interested Units ----
  const [availableUnits, setAvailableUnits] = useState([]);
  const [availableUnitsLoading, setAvailableUnitsLoading] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [addingInterested, setAddingInterested] = useState(false);

  // ---- Email logs + send ----
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    body: "",
    cc: "",
    bcc: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailView, setEmailView] = useState("compose");

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [commentForm, setCommentForm] = useState({
    text: "",
    stage_at_time: "",
  });

  // ====================== EFFECTS ======================

  // 8) Load comments when Comment tab active
  useEffect(() => {
    if (activeTab !== "comment" || !leadId) return;

    setLoadingComments(true);
    api
      .get("/sales/lead-comments/", {
        params: { sales_lead: leadId },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setComments(items);
      })
      .catch((err) => {
        console.error("Failed to load comments", err);
        toast.error("Failed to load comments");
      })
      .finally(() => setLoadingComments(false));
  }, [activeTab, leadId]);

  // 9) When comment tab opens, default stage to latest stage_history
  useEffect(() => {
    if (activeTab !== "comment") return;

    // compute latest stage from lead.stage_history
    let defaultStageId = "";

    if (
      lead &&
      Array.isArray(lead.stage_history) &&
      lead.stage_history.length
    ) {
      const sorted = [...lead.stage_history].sort((a, b) => {
        const aKey = a.event_date || a.created_at || "";
        const bKey = b.event_date || b.created_at || "";

        if (aKey < bKey) return -1;
        if (aKey > bKey) return 1;
        return (a.id || 0) - (b.id || 0);
      });

      const latest = sorted[sorted.length - 1];
      defaultStageId = latest.stage || "";
    }

    setCommentForm((prev) => ({
      ...prev,
      // agar pehle se selected hai toh same rehne do, warna latest stage lagao
      stage_at_time: prev.stage_at_time || defaultStageId,
    }));
  }, [activeTab, lead]);

  // 1) Fetch lead detail
  useEffect(() => {
    if (!leadId) {
      setError("Lead id missing in URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    api
      .get(`/sales/sales-leads/${leadId}/`, {
        params: { include_all_stage: true },
      })
      .then((res) => setLead(res.data))
      .catch((err) => {
        console.error("Failed to load lead", err);
        setError("Failed to load lead details.");
      })
      .finally(() => setLoading(false));
  }, [leadId]);

  // 2) When lead is known, load setup-bundle lookups
  useEffect(() => {
    if (!lead || !lead.project) return;

    setLoadingLookups(true);
    api
      .get("/client/setup-bundle/", {
        params: { project_id: lead.project },
      })
      .then((res) => {
        const data = res.data || {};
        setLookups(data.lookups || {});
      })
      .catch((err) => {
        console.error("Failed to load setup bundle", err);
      })
      .finally(() => setLoadingLookups(false));
  }, [lead]);

  // 3) Prefill extra-info + lead-info forms once lead is loaded
  useEffect(() => {
    if (!lead) return;

    const a = lead.address || {};
    setAddressForm({
      flat_or_building: a.flat_or_building || "",
      area: a.area || "",
      pincode: a.pincode || "",
      city: a.city || "",
      state: a.state || "",
      country: a.country || "",
    });

    const cp = lead.cp_info || {};
    setCpInfoForm({
      referral_code: cp.referral_code || "",
    });

    const p = lead.personal_info || {};
    setPersonalForm({
      date_of_birth: p.date_of_birth || "",
      date_of_anniversary: p.date_of_anniversary || "",
      already_part_of_family: !!p.already_part_of_family,
      secondary_email: p.secondary_email || "",
      alternate_mobile: p.alternate_mobile || "",
      alternate_tel_res: p.alternate_tel_res || "",
      alternate_tel_off: p.alternate_tel_off || "",
      visiting_on_behalf:
        (p.visiting_on_behalf && p.visiting_on_behalf.id) ||
        p.visiting_on_behalf ||
        "",
      current_residence_ownership:
        (p.current_residence_ownership && p.current_residence_ownership.id) ||
        p.current_residence_ownership ||
        "",
      current_residence_type: p.current_residence_type || "",
      family_size: (p.family_size && p.family_size.id) || p.family_size || "",
      possession_desired_in:
        (p.possession_desired_in && p.possession_desired_in.id) ||
        p.possession_desired_in ||
        "",
      facebook: p.facebook || "",
      twitter: p.twitter || "",
      linkedin: p.linkedin || "",
    });

    const pr = lead.professional_info || {};
    setProfessionalForm({
      occupation: (pr.occupation && pr.occupation.id) || pr.occupation || "",
      organization_name: pr.organization_name || "",
      office_location: pr.office_location || "",
      office_pincode: pr.office_pincode || "",
      designation:
        (pr.designation && pr.designation.id) || pr.designation || "",
    });

    setCpSelected(lead.channel_partner || "");

    setLeadInfoForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      company: lead.company || "",
      budget: lead.budget ?? "",
      annual_income: lead.annual_income ?? "",
    });
  }, [lead]);

  const handleCommentChange = (field, value) => {
    setCommentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitComment = async () => {
    if (!lead) return;
    if (!commentForm.text.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setSavingComment(true);
    try {
      const payload = {
        sales_lead: lead.id,
        text: commentForm.text.trim(),
        stage_at_time: commentForm.stage_at_time || activeStageId || null,
      };

      const res = await api.post("/sales/lead-comments/", payload);
      const newComment = res.data;

      setComments((prev) => [newComment, ...(prev || [])]);

      setCommentForm({
        text: "",
        stage_at_time: newComment.stage_at_time || activeStageId || "",
      });

      toast.success("Comment added");
    } catch (err) {
      console.error("Failed to save comment", err);
      toast.error("Failed to save comment");
    } finally {
      setSavingComment(false);
    }
  };

  // 4) Load channel partners by source
  useEffect(() => {
    if (!lead || !lead.source) return;

    setCpLoading(true);
    api
      .get(`/channel/partners/by-source/${lead.source}/`)
      .then((res) => {
        const data = res.data || {};
        const results = Array.isArray(data.results) ? data.results : data;
        setCpOptions(results || []);
      })
      .catch((err) => {
        console.error("Failed to load channel partners by source", err);
        setCpOptions([]);
      })
      .finally(() => setCpLoading(false));
  }, [lead]);

  // 5) Load interested units
  useEffect(() => {
    if (!leadId) return;

    setLoadingInterested(true);
    api
      .get("/sales/interested-units/", {
        params: { sales_lead: leadId },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setInterestedUnits(items);
      })
      .catch((err) => {
        console.error("Failed to load interested units", err);
      })
      .finally(() => setLoadingInterested(false));
  }, [leadId]);

  // 6) Load available units when interested section is opened
  useEffect(() => {
    if (!lead || !lead.project) return;
    if (collapsedSections.interested) return;

    setAvailableUnitsLoading(true);
    api
      .get(`/client/projects/${lead.project}/available-units/`)
      .then((res) => {
        let items = res.data || [];
        if (!Array.isArray(items)) {
          items = items.results || [];
        }
        const already = new Set(interestedUnits.map((iu) => iu.unit));
        items = items.filter((u) => !already.has(u.id));
        setAvailableUnits(items);
      })
      .catch((err) => {
        console.error("Failed to load available units", err);
      })
      .finally(() => setAvailableUnitsLoading(false));
  }, [lead, collapsedSections.interested, interestedUnits]);

  // 7) Load email logs when Email tab active
  useEffect(() => {
    if (activeTab !== "email" || !leadId) return;

    setLoadingEmailLogs(true);
    api
      .get("/sales/email-logs/", {
        params: { sales_lead_id: leadId },
      })
      .then((res) => {
        const data = res.data || [];
        const items = Array.isArray(data) ? data : data.results || [];
        setEmailLogs(items);
      })
      .catch((err) => {
        console.error("Failed to load email logs", err);
        toast.error("Failed to load email logs");
      })
      .finally(() => setLoadingEmailLogs(false));
  }, [activeTab, leadId]);

  // ====================== DERIVED DATA ======================

  const fullName =
    lead?.full_name ||
    [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") ||
    "-";

  const ownerName = lead?.current_owner_name || "-";
  const mobile = lead?.mobile_number || "-";
  const email = lead?.email || "-";
  const statusName = lead?.status_name || "-";

  const stages = lead?.lead_stages || [];
  const stageHistory = lead?.stage_history || [];
  const updates = lead?.updates || [];

  // ==== Activity Filtered List ====
  const filteredUpdates =
    activityFilter === ""
      ? updates
      : updates.filter((u) => u.update_type === activityFilter);

  const documents = lead?.documents || [];
  const inventoryDocs = lead?.project_inventory_docs || [];

  const channelPartner = lead?.channel_partner_detail || null;
  const channelPartnerLabel = lead?.channel_partner_name || "-";

  let activeStageId = null;
  if (stageHistory.length > 0) {
    const sorted = [...stageHistory].sort((a, b) => {
      const aKey = a.event_date || a.created_at || "";
      const bKey = b.event_date || b.created_at || "";
      if (aKey < bKey) return -1;
      if (aKey > bKey) return 1;
      return (a.id || 0) - (b.id || 0);
    });
    activeStageId = sorted[sorted.length - 1].stage;
  }

  const activeStageOrder =
    activeStageId && stages.length
      ? stages.find((s) => s.id === activeStageId)?.order ?? null
      : null;

  const toIntOrNull = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  const lookupOptions = (key) => {
    if (!lookups || !lookups[key]) return [];
    return lookups[key].map((item) => ({
      value: item.id,
      label: item.name || item.code || `#${item.id}`,
    }));
  };

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ====================== HANDLERS ======================

  const handleActivityChange = (field, value) => {
    setActivityForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateActivity = async () => {
    if (!lead) return;
    if (!activityForm.title && !activityForm.info) {
      toast.error("Please enter title or info");
      return;
    }

    setSavingActivity(true);
    try {
      const payload = {
        sales_lead: lead.id,
        title: activityForm.title || "Activity",
        info: activityForm.info || "",
        event_date: activityForm.event_date || null,
      };

      const res = await api.post("/sales/sales-lead-updates/", payload);
      const newUpdate = res.data;

      setLead((prev) => ({
        ...prev,
        updates: [newUpdate, ...(prev?.updates || [])],
      }));

      setActivityForm({
        title: "",
        info: "",
        event_date: nowForInput(),
      });
      setShowActivityForm(false);
      toast.success("Activity saved");
    } catch (err) {
      console.error("Failed to create update", err);
      toast.error("Failed to save activity");
    } finally {
      setSavingActivity(false);
    }
  };

  const handleAddDocClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setDocTitle(baseName);
    setDocModalOpen(true);

    e.target.value = "";
  };

  const handleCancelUploadDoc = () => {
    if (uploadingDoc) return;
    setDocModalOpen(false);
    setPendingFile(null);
    setDocTitle("");
  };

  const handleConfirmUploadDoc = async () => {
    if (!pendingFile || !leadId) return;

    const formData = new FormData();
    formData.append("sales_lead", leadId);
    formData.append("title", docTitle || pendingFile.name);
    formData.append("file", pendingFile);

    setUploadingDoc(true);
    try {
      const res = await api.post("/sales/sales-lead-documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newDoc = res.data;
      setLead((prev) => ({
        ...prev,
        documents: [...(prev?.documents || []), newDoc],
      }));
      setDocModalOpen(false);
      setPendingFile(null);
      setDocTitle("");
      toast.success("Document uploaded");
    } catch (err) {
      console.error("Failed to upload document", err);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocClick = (doc) => {
    if (!doc || !doc.file_url) return;
    window.open(doc.file_url, "_blank", "noopener,noreferrer");
  };

  const handleInventoryClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      toast.error("Project is not linked for this lead.");
      return;
    }
    navigate(`/inventory-planning/?project_id=${projectId}`);
  };

  const handleBookFlatClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      toast.error("Project is not linked for this lead.");
      return;
    }
    navigate(`/booking/form/?project_id=${projectId}`);
  };

  const handleQuotationClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      toast.error("Project is not linked for this lead.");
      return;
    }
    navigate(`/cost-sheets/new/${lead.id}`);
  };

  const handleSiteVisitClick = () => {
    if (!lead) return;
    const projectId = lead.project;

    if (!projectId) {
      toast.error("Project is not linked for this lead.");
      return;
    }

    navigate(
      `/sales/lead/site-visit/create?lead_id=${lead.id}&project_id=${projectId}`
    );
  };

  const handleStageClick = (stage) => {
    if (!lead) return;
    if (activeStageId && stage.id === activeStageId) return;

    setStageModal({
      open: true,
      stage,
    });
  };

  const handleCancelStageChange = () => {
    if (savingStage) return;
    setStageModal({ open: false, stage: null });
  };

  const handleConfirmStageChange = async () => {
    if (!lead || !stageModal.stage) return;

    setSavingStage(true);
    try {
      const payload = {
        sales_lead: lead.id,
        stage: stageModal.stage.id,
        status: lead.status || null,
        sub_status: lead.sub_status || null,
        event_date: new Date().toISOString(),
        notes: "",
      };

      const res = await api.post("/sales/sales-lead-stages/", payload);
      const newHistory = res.data;

      setLead((prev) => ({
        ...prev,
        stage_history: [...(prev?.stage_history || []), newHistory],
      }));
      toast.success("Lead stage updated");
    } catch (err) {
      console.error("Failed to change stage", err);
      toast.error("Failed to change stage");
    } finally {
      setSavingStage(false);
      setStageModal({ open: false, stage: null });
    }
  };

  const handleLeadInfoChange = (field, value) => {
    setLeadInfoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLeadInfoSave = async () => {
    if (!lead) return;

    setSavingLeadInfo(true);
    try {
      const payload = {
        first_name: leadInfoForm.first_name || null,
        last_name: leadInfoForm.last_name || null,
        company: leadInfoForm.company || "",
        budget: leadInfoForm.budget === "" ? null : Number(leadInfoForm.budget),
        annual_income:
          leadInfoForm.annual_income === ""
            ? null
            : Number(leadInfoForm.annual_income),
      };

      const res = await api.patch(`/sales/sales-leads/${lead.id}/`, payload);
      setLead(res.data);
      setLeadInfoEdit(false);
      toast.success("Lead information updated");
    } catch (err) {
      console.error("Failed to update lead info", err);
      toast.error("Failed to update lead information");
    } finally {
      setSavingLeadInfo(false);
    }
  };

  const handleLeadInfoCancel = () => {
    if (!lead) return;
    setLeadInfoForm({
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      company: lead.company || "",
      budget: lead.budget ?? "",
      annual_income: lead.annual_income ?? "",
    });
    setLeadInfoEdit(false);
  };

  const handleExtraSubmit = async () => {
    if (!lead) return;

    setSavingExtra(true);
    try {
      if (cpSelected !== (lead.channel_partner || "")) {
        try {
          const patchRes = await api.patch(`/sales/sales-leads/${lead.id}/`, {
            channel_partner: cpSelected || null,
          });
          setLead(patchRes.data);
        } catch (err) {
          console.error("Failed to update channel partner", err);
        }
      }

      const payload = {
        sales_lead_id: lead.id,
        address: {
          flat_or_building: addressForm.flat_or_building || "",
          area: addressForm.area || "",
          pincode: addressForm.pincode || "",
          city: addressForm.city || "",
          state: addressForm.state || "",
          country: addressForm.country || "",
        },
        cp_info: {
          referral_code: cpInfoForm.referral_code || "",
        },
        personal_info: {
          date_of_birth: personalForm.date_of_birth || null,
          date_of_anniversary: personalForm.date_of_anniversary || null,
          already_part_of_family: personalForm.already_part_of_family,
          secondary_email: personalForm.secondary_email || "",
          alternate_mobile: personalForm.alternate_mobile || "",
          alternate_tel_res: personalForm.alternate_tel_res || "",
          alternate_tel_off: personalForm.alternate_tel_off || "",
          visiting_on_behalf: toIntOrNull(personalForm.visiting_on_behalf),
          current_residence_ownership: toIntOrNull(
            personalForm.current_residence_ownership
          ),
          current_residence_type: personalForm.current_residence_type || "",
          family_size: toIntOrNull(personalForm.family_size),
          possession_desired_in: toIntOrNull(
            personalForm.possession_desired_in
          ),
          facebook: personalForm.facebook || "",
          twitter: personalForm.twitter || "",
          linkedin: personalForm.linkedin || "",
        },
        professional_info: {
          occupation: toIntOrNull(professionalForm.occupation),
          organization_name: professionalForm.organization_name || "",
          office_location: professionalForm.office_location || "",
          office_pincode: professionalForm.office_pincode || "",
          designation: toIntOrNull(professionalForm.designation),
        },
      };

      let res;
      if (proposalFiles.length > 0) {
        const formData = new FormData();
        formData.append("sales_lead_id", String(lead.id));
        formData.append("address", JSON.stringify(payload.address));
        formData.append("cp_info", JSON.stringify(payload.cp_info));
        formData.append("personal_info", JSON.stringify(payload.personal_info));
        formData.append(
          "professional_info",
          JSON.stringify(payload.professional_info)
        );
        proposalFiles.forEach((f) => {
          formData.append("proposal_files", f);
        });

        res = await api.post("/sales/sales-leads/extra-info/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/sales/sales-leads/extra-info/", payload);
      }

      const extra = res.data || {};
      setLead((prev) => ({
        ...prev,
        address: extra.address || prev.address,
        cp_info: extra.cp_info || prev.cp_info,
        personal_info: extra.personal_info || prev.personal_info,
        professional_info: extra.professional_info || prev.professional_info,
        proposal_documents: extra.proposal_documents || prev.proposal_documents,
      }));
      setProposalFiles([]);
      toast.success("Details saved successfully");
    } catch (err) {
      console.error("Failed to save extra info", err);
      toast.error("Failed to save additional details");
    } finally {
      setSavingExtra(false);
    }
  };

  const handleRemoveInterested = async (id) => {
    if (!window.confirm("Remove this interested unit from the lead?")) return;

    setRemovingInterestedId(id);
    try {
      await api.delete(`/sales/interested-units/${id}/`);
      setInterestedUnits((prev) => prev.filter((i) => i.id !== id));
      toast.success("Interested unit removed");
    } catch (err) {
      console.error("Failed to remove interested unit", err);
      toast.error("Failed to remove interested unit");
    } finally {
      setRemovingInterestedId(null);
    }
  };

  const handleSaveInterestedUnits = async () => {
    if (!lead) return;
    if (!selectedUnitIds.length) {
      toast.error("Please select at least one unit.");
      return;
    }

    setAddingInterested(true);
    try {
      const payloads = selectedUnitIds.map((unitId) => ({
        sales_lead: lead.id,
        unit: unitId,
      }));

      const responses = await Promise.all(
        payloads.map((p) => api.post("/sales/interested-units/", p))
      );

      const createdItems = responses.map((r) => r.data);
      setInterestedUnits((prev) => [...createdItems, ...prev]);
      setSelectedUnitIds([]);

      toast.success("Interested units added");
    } catch (err) {
      console.error("Failed to add interested units", err);
      toast.error("Failed to add one or more interested units.");
    } finally {
      setAddingInterested(false);
    }
  };

  const handleEmailFormChange = (field, value) => {
    setEmailForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendEmail = async () => {
    if (!lead) return;
    if (!emailForm.subject.trim() && !emailForm.body.trim()) {
      toast.error("Subject or body is required.");
      return;
    }

    setSendingEmail(true);
    try {
      const payload = {
        sales_lead_id: lead.id,
        subject: emailForm.subject || "(no subject)",
        body: emailForm.body || "",
        email_type: "FOLLOWUP",
        cc: emailForm.cc
          ? emailForm.cc
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
        bcc: emailForm.bcc
          ? emailForm.bcc
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      };

      const res = await api.post("/sales/email-logs/send/", payload);
      const newLog = res.data;

      setEmailLogs((prev) => [newLog, ...(prev || [])]);
      setEmailForm({
        subject: "",
        body: "",
        cc: "",
        bcc: "",
      });
      toast.success("Email sent and logged");
    } catch (err) {
      console.error("Failed to send email", err);
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  // ====================== RENDER ======================

  if (loading) {
    return <div className="lead-page">Loading lead...</div>;
  }

  if (error) {
    return (
      <div className="lead-page">
        <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="lead-page">
        <div>No lead data found.</div>
      </div>
    );
  }

  return (
    <div className="lead-page">
      {/* TOP HEADER */}
      <div className="lead-header">
        <div className="lead-header-left">
          <div className="lead-title">{fullName}</div>

          <div className="lead-header-grid">
            <div className="field-compact">
              <label>Lead Owner:</label>
              <input value={ownerName} readOnly />
            </div>
            <div className="field-compact">
              <label>Mobile:</label>
              <input value={mobile} readOnly />
            </div>
            <div className="field-compact">
              <label>Email:</label>
              <input value={email} readOnly />
            </div>
            <div className="field-compact">
              <label>Lead Status:</label>
              <input value={statusName} readOnly />
            </div>
          </div>
        </div>

        <div className="lead-header-right">
          <div className="action-row-top">
            <button className="card-btn" onClick={handleInventoryClick}>
              Inventory
            </button>
            <button className="card-btn" onClick={handleBookFlatClick}>
              Book Flat
            </button>
            <button className="card-btn">Payments</button>
            <button className="card-btn">Payment Link</button>
            <button className="card-btn" onClick={handleQuotationClick}>
              Quotation
            </button>
            <button className="card-btn" onClick={handleSiteVisitClick}>
              Site Visit
            </button>
          </div>
          <div className="action-row-bottom">
            <button className="card-btn small">Send Feedback</button>
            <button className="card-btn small">Save</button>
          </div>
        </div>
      </div>

      {/* STAGE BAR */}
      <div className="lead-stages">
        {stages.length === 0 && (
          <div className="stage-item">
            <span className="stage-label">No stages configured</span>
          </div>
        )}
        {stages.map((stage, idx) => {
          let extraClass = "";

          if (activeStageId) {
            if (stage.id === activeStageId) {
              extraClass = "stage-active";
            } else if (
              activeStageOrder != null &&
              stage.order < activeStageOrder
            ) {
              extraClass = "stage-done";
            } else {
              extraClass = "stage-pending";
            }
          } else {
            extraClass = idx === 0 ? "stage-active" : "stage-pending";
          }

          return (
            <div
              key={stage.id}
              className={`stage-item ${extraClass}`}
              onClick={() => handleStageClick(stage)}
              style={{ cursor: "pointer" }}
            >
              <span className="stage-dot" />
              <span className="stage-label">{stage.name}</span>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="content-split">
        {/* LEFT – Lead Information */}
        <div className="panel panel-left">
          <div className="panel-header">
            <span>Lead Information</span>
            {!leadInfoEdit ? (
              <button
                className="link-btn"
                type="button"
                onClick={() => setLeadInfoEdit(true)}
              >
                Edit
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-primary small"
                  type="button"
                  onClick={handleLeadInfoSave}
                  disabled={savingLeadInfo}
                >
                  {savingLeadInfo ? "Saving..." : "Save"}
                </button>
                <button
                  className="btn-secondary small"
                  type="button"
                  onClick={handleLeadInfoCancel}
                  disabled={savingLeadInfo}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="panel-body">
            <div className="field-compact">
              <label>First Name:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.first_name}
                  onChange={(e) =>
                    handleLeadInfoChange("first_name", e.target.value)
                  }
                />
              ) : (
                <input value={lead.first_name || ""} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Last Name:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.last_name}
                  onChange={(e) =>
                    handleLeadInfoChange("last_name", e.target.value)
                  }
                />
              ) : (
                <input value={lead.last_name || ""} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Company:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.company}
                  onChange={(e) =>
                    handleLeadInfoChange("company", e.target.value)
                  }
                />
              ) : (
                <input value={lead.company || ""} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Budget:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.budget}
                  onChange={(e) =>
                    handleLeadInfoChange("budget", e.target.value)
                  }
                />
              ) : (
                <input value={lead.budget ?? ""} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Annual Income:</label>
              {leadInfoEdit ? (
                <input
                  value={leadInfoForm.annual_income}
                  onChange={(e) =>
                    handleLeadInfoChange("annual_income", e.target.value)
                  }
                />
              ) : (
                <input value={lead.annual_income ?? ""} readOnly />
              )}
            </div>
            <div className="field-compact">
              <label>Project:</label>
              <input value={lead.project_name || `#${lead.project}`} readOnly />
            </div>
            <div className="field-compact">
              <label>Purpose:</label>
              <input value={lead.purpose_name || ""} readOnly />
            </div>
          </div>
        </div>

        {/* RIGHT – Activity / Email / Documents */}
        <div className="panel panel-right">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "activity" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </button>
            <button
              className={`tab ${activeTab === "comment" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("comment")}
            >
              Comment
            </button>
            <button className="tab" type="button" onClick={handleBookFlatClick}>
              Booking
            </button>
            <button
              className={`tab ${activeTab === "email" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("email")}
            >
              Email
            </button>
            <button className="tab tab-locked" type="button">
              SMS <span className="lock-icon">🔒</span>
            </button>
            <button className="tab tab-locked" type="button">
              Zoom <span className="lock-icon">🔒</span>
            </button>
          </div>

          {activeTab === "activity" && (
            <div className="activity-wrapper">
              {/* Filter */}
              <div className="activity-filter">
                <label className="filter-label">Filter by Activity Type</label>
                <select
                  className="filter-select"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="NOTE">Note</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="STATUS_CHANGE">Status Change</option>
                  <option value="CALL">Call</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Add Activity Button */}
              {!showActivityForm && (
                <div
                  className="activity-row add-activity"
                  onClick={() => {
                    setShowActivityForm(true);
                    setActivityForm({
                      title: "",
                      info: "",
                      event_date: nowForInput(),
                    });
                  }}
                >
                  <div className="activity-icon plus">+</div>
                  <div className="activity-strip">
                    <div className="strip-title">Add a new activity</div>
                    <div className="strip-sub">
                      Plan your next action in the deal to never forget about
                      the customer
                    </div>
                  </div>
                </div>
              )}

              {/* Create Activity Form */}
              {showActivityForm && (
                <div className="activity-form-card">
                  <div className="field-full">
                    <label>Activity Type</label>
                    <select
                      value={activityForm.update_type}
                      onChange={(e) =>
                        handleActivityChange("update_type", e.target.value)
                      }
                    >
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="REMINDER">Reminder</option>
                      <option value="NOTE">Note</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                      <option value="STATUS_CHANGE">Status Change</option>
                      <option value="CALL">Call</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="field-full">
                    <label>Title</label>
                    <input
                      className="input-plain"
                      value={activityForm.title}
                      onChange={(e) =>
                        handleActivityChange("title", e.target.value)
                      }
                    />
                  </div>

                  <div className="field-full">
                    <label>Things to do</label>
                    <textarea
                      className="input-plain tall"
                      value={activityForm.info}
                      onChange={(e) =>
                        handleActivityChange("info", e.target.value)
                      }
                    />
                  </div>

                  <div className="field-full">
                    <label>Date</label>
                    <input
                      type="datetime-local"
                      className="input-plain"
                      value={activityForm.event_date}
                      onChange={(e) =>
                        handleActivityChange("event_date", e.target.value)
                      }
                    />
                  </div>

                  <div className="activity-buttons">
                    <button
                      className="btn-primary"
                      onClick={handleCreateActivity}
                      disabled={savingActivity}
                    >
                      {savingActivity ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowActivityForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Filtered Activity List */}
              <div className="activity-list">
                {filteredUpdates.length === 0 ? (
                  <div className="no-activity">
                    <div className="activity-icon info">i</div>
                    <div className="activity-strip">
                      <div className="strip-title">No activities found.</div>
                    </div>
                  </div>
                ) : (
                  filteredUpdates.map((u) => (
                    <div key={u.id} className="activity-row">
                      <div className="activity-icon info">i</div>
                      <div className="activity-strip">
                        <div className="strip-title">{u.title}</div>
                        <div className="strip-sub">{u.info}</div>
                        <div className="strip-sub small">{u.update_type}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "comment" && (
            <div className="comment-wrapper">
              <div className="comment-form">
                <div className="comment-form-row">
                  <div className="field-full">
                    <label>Stage at time of comment</label>
                    <select
                      value={commentForm.stage_at_time || ""}
                      onChange={(e) =>
                        handleCommentChange("stage_at_time", e.target.value)
                      }
                    >
                      <option value="">
                        {stages.length ? "Current stage (default)" : "Select"}
                      </option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.order}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field-full">
                  <label>Comment</label>
                  <textarea
                    className="input-plain tall"
                    placeholder="Add an internal note for this lead..."
                    value={commentForm.text}
                    onChange={(e) =>
                      handleCommentChange("text", e.target.value)
                    }
                  />
                </div>

                <div className="comment-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSubmitComment}
                    disabled={savingComment}
                  >
                    {savingComment ? "Saving..." : "Add Comment"}
                  </button>
                </div>
              </div>

              <div className="comment-list">
                {loadingComments ? (
                  <div className="empty-state small">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="empty-state small">
                    No comments added yet.
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-meta">
                        <span className="comment-author">
                          {c.created_by_name || "Staff"}
                        </span>

                        {c.stage_at_time_name && (
                          <span className="comment-stage-pill">
                            {c.stage_at_time_name}
                          </span>
                        )}

                        {c.created_at && (
                          <span className="comment-time">
                            {new Date(c.created_at).toLocaleString("en-GB")}
                          </span>
                        )}
                      </div>

                      <div className="comment-text">{c.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="email-wrapper">
              <div className="email-toggle-row">
                <button
                  type="button"
                  className={`email-toggle-btn ${
                    emailView === "compose" ? "active" : ""
                  }`}
                  onClick={() => setEmailView("compose")}
                >
                  Compose
                </button>
                <button
                  type="button"
                  className={`email-toggle-btn ${
                    emailView === "history" ? "active" : ""
                  }`}
                  onClick={() => setEmailView("history")}
                >
                  History
                </button>
              </div>

              {emailView === "compose" && (
                <div className="email-form">
                  <div className="field-full">
                    <label>To</label>
                    <input value={email || "-"} readOnly />
                  </div>
                  <div className="field-full">
                    <label>Subject</label>
                    <input
                      value={emailForm.subject}
                      onChange={(e) =>
                        handleEmailFormChange("subject", e.target.value)
                      }
                    />
                  </div>
                  <div className="field-full">
                    <label>Body</label>
                    <textarea
                      className="input-plain tall email-body"
                      value={emailForm.body}
                      onChange={(e) =>
                        handleEmailFormChange("body", e.target.value)
                      }
                    />
                  </div>

                  <div className="email-cc-row">
                    <div className="field-full">
                      <label>CC</label>
                      <input
                        placeholder="cc1@example.com, cc2@example.com"
                        value={emailForm.cc}
                        onChange={(e) =>
                          handleEmailFormChange("cc", e.target.value)
                        }
                      />
                    </div>
                    <div className="field-full">
                      <label>BCC</label>
                      <input
                        placeholder="bcc1@example.com, bcc2@example.com"
                        value={emailForm.bcc}
                        onChange={(e) =>
                          handleEmailFormChange("bcc", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="email-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </div>
              )}

              {emailView === "history" && (
                <div className="email-history">
                  {loadingEmailLogs ? (
                    <div className="email-logs-empty">Loading logs...</div>
                  ) : emailLogs.length === 0 ? (
                    <div className="email-logs-empty">
                      No emails sent yet for this lead.
                    </div>
                  ) : (
                    <div className="email-logs-list">
                      {emailLogs.map((log) => (
                        <div key={log.id} className="email-log-item">
                          <div className="email-log-header">
                            <span className="email-log-subject">
                              {log.subject || "(no subject)"}
                            </span>
                            {log.email_type && (
                              <span className="email-log-chip">
                                {log.email_type}
                              </span>
                            )}
                          </div>

                          {log.body && (
                            <div className="email-log-body">
                              {log.body.length > 120
                                ? log.body.slice(0, 120) + "…"
                                : log.body}
                            </div>
                          )}

                          <div className="email-log-meta">
                            {log.created_at &&
                              new Date(log.created_at).toLocaleString("en-GB")}
                            {log.sent_by_name ? ` • ${log.sent_by_name}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="documents-wrapper">
            <div className="documents-header">
              <span>Documents</span>
            </div>
            <div className="documents-body">
              {inventoryDocs.length > 0 && (
                <>
                  <div className="documents-subtitle">Project Documents</div>
                  <div className="documents-row">
                    {inventoryDocs.map((doc) => {
                      const label =
                        (doc.original_name && doc.original_name.trim()) ||
                        doc.doc_type ||
                        "Document";

                      return (
                        <div
                          key={`inv-${doc.id}`}
                          className="doc-card"
                          onClick={() => handleDocClick(doc)}
                          style={{
                            cursor: doc.file_url ? "pointer" : "default",
                          }}
                        >
                          <div className="doc-icon" />
                          <div className="doc-label">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="documents-subtitle">Lead Documents</div>
              <div className="documents-row">
                {documents.map((doc) => {
                  const label =
                    doc.title && doc.title.trim()
                      ? doc.title.trim()
                      : "Untitled";

                  return (
                    <div
                      key={doc.id}
                      className="doc-card"
                      onClick={() => handleDocClick(doc)}
                      style={{ cursor: doc.file_url ? "pointer" : "default" }}
                    >
                      <div className="doc-icon" />
                      <div className="doc-label">{label}</div>
                    </div>
                  );
                })}

                <button
                  className="doc-card add-doc"
                  onClick={handleAddDocClick}
                  type="button"
                  disabled={uploadingDoc}
                >
                  <span className="add-symbol">{uploadingDoc ? "…" : "+"}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTIONS */}

      {/* CP Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("cp")}
          style={{ cursor: "pointer" }}
        >
          <span>CP Information</span>
          <span className="chevron">{collapsedSections.cp ? "▼" : "▲"}</span>
        </div>
        {!collapsedSections.cp && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Referral Code</label>
                <input
                  value={cpInfoForm.referral_code}
                  onChange={(e) =>
                    setCpInfoForm((prev) => ({
                      ...prev,
                      referral_code: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-full">
                <label>Channel Partner</label>
                <select
                  value={cpSelected || ""}
                  onChange={(e) => setCpSelected(e.target.value)}
                  disabled={cpLoading}
                >
                  <option value="">
                    {cpLoading ? "Loading..." : "Select Channel Partner"}
                  </option>
                  {cpOptions.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.company_name || cp.user_name || `CP #${cp.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="column">
              {channelPartner ? (
                <>
                  <div className="field-full">
                    <label>CP Name / Company</label>
                    <input
                      value={
                        channelPartner.company_name ||
                        channelPartner.user_name ||
                        channelPartnerLabel
                      }
                      readOnly
                    />
                  </div>
                  <div className="field-full">
                    <label>CP Mobile</label>
                    <input
                      value={channelPartner.mobile_masked || "-"}
                      readOnly
                    />
                  </div>
                  <div className="field-full">
                    <label>CP Email</label>
                    <input
                      value={channelPartner.email_masked || "-"}
                      readOnly
                    />
                  </div>
                  <div className="field-full">
                    <label>CP Status</label>
                    <input value={channelPartner.status || "-"} readOnly />
                  </div>
                  <div className="field-full">
                    <label>Onboarding Status</label>
                    <input
                      value={channelPartner.onboarding_status || "-"}
                      readOnly
                    />
                  </div>
                </>
              ) : (
                <div className="field-full">
                  <label>Channel Partner Details</label>
                  <input value="Not linked" readOnly />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Proposal Form */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("proposal")}
          style={{ cursor: "pointer" }}
        >
          <span>Proposal Form</span>
          <span className="chevron">
            {collapsedSections.proposal ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.proposal && (
          <div className="section-body">
            <label>Attachment:</label>
            <div className="proposal-upload-row">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setProposalFiles(files);
                }}
              />
              {proposalFiles.length > 0 && (
                <div className="proposal-file-list">
                  {proposalFiles.map((f) => (
                    <div key={f.name} className="proposal-file-item">
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interested Inventory */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("interested")}
          style={{ cursor: "pointer" }}
        >
          <span>Interested Inventory</span>
          <span className="chevron">
            {collapsedSections.interested ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.interested && (
          <div className="section-body">
            {loadingInterested ? (
              <div className="empty-state">Loading interested units...</div>
            ) : (
              <>
                <div className="interested-units-section">
                  <div className="interested-header">
                    <h4>Current Interested Units</h4>
                  </div>
                  {interestedUnits.length === 0 ? (
                    <div className="empty-state">
                      No interested units linked yet.
                    </div>
                  ) : (
                    <div className="interested-list">
                      {interestedUnits.map((iu) => (
                        <div key={iu.id} className="interested-item">
                          <div className="interested-info">
                            <div className="interested-label">
                              {iu.unit_label || `Unit #${iu.unit}`}
                            </div>
                            <div className="interested-meta">
                              {iu.project_name || `Project #${iu.project_id}`} •{" "}
                              {iu.created_at
                                ? new Date(iu.created_at).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "-"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => handleRemoveInterested(iu.id)}
                            disabled={removingInterestedId === iu.id}
                          >
                            {removingInterestedId === iu.id ? "..." : "×"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="interested-units-section">
                  <div className="interested-header">
                    <h4>Add Interested Units</h4>
                  </div>
                  {availableUnitsLoading ? (
                    <div className="empty-state">
                      Loading available units...
                    </div>
                  ) : availableUnits.length === 0 ? (
                    <div className="empty-state">
                      No available units found for this project.
                    </div>
                  ) : (
                    <>
                      <div className="unit-choices-grid">
                        {availableUnits.map((u) => {
                          const checked = selectedUnitIds.includes(u.id);
                          const label = `${u.tower_name || ""}${
                            u.tower_name ? " / " : ""
                          }${u.floor_number || ""}${
                            u.floor_number ? " / " : ""
                          }${u.unit_no || `Unit #${u.id}`}`;

                          return (
                            <label key={u.id} className="unit-checkbox-item">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedUnitIds((prev) =>
                                    e.target.checked
                                      ? [...prev, u.id]
                                      : prev.filter((id) => id !== u.id)
                                  );
                                }}
                              />
                              <div>
                                <div className="unit-checkbox-label">
                                  {label}
                                </div>
                                <div className="unit-checkbox-meta">
                                  {u.configuration && (
                                    <span>Config: {u.configuration} </span>
                                  )}
                                  {u.carpet_sqft && (
                                    <span>
                                      • Carpet: {u.carpet_sqft} sq.ft{" "}
                                    </span>
                                  )}
                                  {u.agreement_value && (
                                    <span>
                                      • Value: ₹
                                      {Number(u.agreement_value).toLocaleString(
                                        "en-IN"
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <div className="interested-save-row">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleSaveInterestedUnits}
                          disabled={
                            addingInterested ||
                            selectedUnitIds.length === 0 ||
                            availableUnitsLoading
                          }
                        >
                          {addingInterested
                            ? "Saving..."
                            : "Save Selected Units"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("additional")}
          style={{ cursor: "pointer" }}
        >
          <span>Additional Information</span>
          <span className="chevron">
            {collapsedSections.additional ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.additional && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={personalForm.date_of_birth}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Date of Anniversary</label>
                <input
                  type="date"
                  value={personalForm.date_of_anniversary}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      date_of_anniversary: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full checkbox-inline">
                <label>Already a part of the family?</label>
                <input
                  type="checkbox"
                  checked={personalForm.already_part_of_family}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      already_part_of_family: e.target.checked,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Project Name</label>
                <input value={lead.project_name || ""} readOnly />
              </div>

              <div className="field-full">
                <label>Visiting On Behalf</label>
                <select
                  value={personalForm.visiting_on_behalf || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      visiting_on_behalf: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("visiting_half").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Current Residence Ownership</label>
                <select
                  value={personalForm.current_residence_ownership || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      current_residence_ownership: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("residency_ownerships").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Current Residence type</label>
                <input
                  value={personalForm.current_residence_type}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      current_residence_type: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="field-full">
                <label>Family Size</label>
                <select
                  value={personalForm.family_size || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      family_size: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("family_sizes").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-full">
                <label>Possession desired in</label>
                <select
                  value={personalForm.possession_desired_in || ""}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      possession_desired_in: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("possession_designed").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="column">
              <div className="field-full">
                <label>Secondary Email</label>
                <input
                  value={personalForm.secondary_email}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      secondary_email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Alternate Mobile</label>
                <input
                  value={personalForm.alternate_mobile}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      alternate_mobile: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Alternate Tel (Res)</label>
                <input
                  value={personalForm.alternate_tel_res}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      alternate_tel_res: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Alternate Tel (Off)</label>
                <input
                  value={personalForm.alternate_tel_off}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      alternate_tel_off: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Facebook</label>
                <input
                  value={personalForm.facebook}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      facebook: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Twitter</label>
                <input
                  value={personalForm.twitter}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      twitter: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Linkedin</label>
                <input
                  value={personalForm.linkedin}
                  onChange={(e) =>
                    setPersonalForm((prev) => ({
                      ...prev,
                      linkedin: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Professional Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("professional")}
          style={{ cursor: "pointer" }}
        >
          <span>Professional Information</span>
          <span className="chevron">
            {collapsedSections.professional ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.professional && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Occupation</label>
                <select
                  value={professionalForm.occupation || ""}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      occupation: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("occupations").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-full">
                <label>Name of the Organization</label>
                <input
                  value={professionalForm.organization_name}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      organization_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Designation</label>
                <select
                  value={professionalForm.designation || ""}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      designation: e.target.value,
                    }))
                  }
                  disabled={loadingLookups}
                >
                  <option value="">
                    {loadingLookups ? "Loading..." : "Select"}
                  </option>
                  {lookupOptions("designations").map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="column">
              <div className="field-full">
                <label>Office Location</label>
                <input
                  value={professionalForm.office_location}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      office_location: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Pin Code</label>
                <input
                  value={professionalForm.office_pincode}
                  onChange={(e) =>
                    setProfessionalForm((prev) => ({
                      ...prev,
                      office_pincode: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Information */}
      <div className="section dashed-top">
        <div
          className="section-header"
          onClick={() => toggleSection("address")}
          style={{ cursor: "pointer" }}
        >
          <span>Address Information</span>
          <span className="chevron">
            {collapsedSections.address ? "▼" : "▲"}
          </span>
        </div>
        {!collapsedSections.address && (
          <div className="section-body section-grid">
            <div className="column">
              <div className="field-full">
                <label>Flat no. / Building</label>
                <input
                  value={addressForm.flat_or_building}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      flat_or_building: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Area</label>
                <input
                  value={addressForm.area}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      area: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Pin Code</label>
                <input
                  value={addressForm.pincode}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      pincode: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>City</label>
                <input
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="column">
              <div className="field-full">
                <label>State</label>
                <input
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="field-full">
                <label>Country</label>
                <input
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="footer-buttons">
        <button
          className="btn-secondary big"
          type="button"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
        <button
          className="btn-primary big"
          type="button"
          onClick={handleExtraSubmit}
          disabled={savingExtra}
        >
          {savingExtra ? "Saving..." : "Submit"}
        </button>
      </div>

      {/* Stage change modal */}
      {stageModal.open && stageModal.stage && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">
              Move to "{stageModal.stage.name}"?
            </div>
            <div className="modal-body">
              Are you sure you want to move this lead to{" "}
              <strong>{stageModal.stage.name}</strong>?
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleCancelStageChange}
                disabled={savingStage}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleConfirmStageChange}
                disabled={savingStage}
              >
                {savingStage ? "Updating..." : "Yes, move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document title modal */}
      {docModalOpen && pendingFile && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Add Document</div>
            <div className="modal-body">
              <div className="field-full">
                <label>Document Title</label>
                <input
                  className="input-plain"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>
              <div className="field-full" style={{ marginTop: 8 }}>
                <small>File: {pendingFile.name}</small>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleCancelUploadDoc}
                disabled={uploadingDoc}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={handleConfirmUploadDoc}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadStaticPage;
