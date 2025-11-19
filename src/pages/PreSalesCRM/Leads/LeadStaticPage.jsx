// // src/pages/LeadStaticPage.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useSearchParams, useNavigate, useParams } from "react-router-dom";
// import api from "../../../api/axiosInstance";
// import "./LeadStaticPage.css";

// const LeadStaticPage = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const { id: leadIdFromPath } = useParams();
//   const leadId = searchParams.get("lead_id") || leadIdFromPath || null;
//   const [lead, setLead] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // ---- lookups from /client/setup-bundle/ ----
//   const [lookups, setLookups] = useState(null);
//   const [loadingLookups, setLoadingLookups] = useState(false);

//   // ---- right-side tabs ----
//   const [activeTab, setActiveTab] = useState("activity");

//   // ---- activity (updates) ----
//   const [showActivityForm, setShowActivityForm] = useState(false);
//   const [activityForm, setActivityForm] = useState({
//     title: "",
//     info: "",
//     event_date: "",
//   });
//   const [savingActivity, setSavingActivity] = useState(false);

//   // ---- right-side documents ----
//   const fileInputRef = useRef(null);
//   const [uploadingDoc, setUploadingDoc] = useState(false);
//   const [docModalOpen, setDocModalOpen] = useState(false);
//   const [pendingFile, setPendingFile] = useState(null);
//   const [docTitle, setDocTitle] = useState("");

//   // ---- stage change modal ----
//   const [stageModal, setStageModal] = useState({
//     open: false,
//     stage: null,
//   });
//   const [savingStage, setSavingStage] = useState(false);

//   // ---- bottom extra info forms ----
//   const [cpInfoForm, setCpInfoForm] = useState({
//     referral_code: "",
//   });

//   const [personalForm, setPersonalForm] = useState({
//     date_of_birth: "",
//     date_of_anniversary: "",
//     already_part_of_family: false,
//     secondary_email: "",
//     alternate_mobile: "",
//     alternate_tel_res: "",
//     alternate_tel_off: "",
//     visiting_on_behalf: "", // FK id
//     current_residence_ownership: "", // FK id
//     current_residence_type: "",
//     family_size: "", // FK id
//     possession_desired_in: "", // FK id
//     facebook: "",
//     twitter: "",
//     linkedin: "",
//   });

//   const [professionalForm, setProfessionalForm] = useState({
//     occupation: "", // FK id
//     organization_name: "",
//     office_location: "",
//     office_pincode: "",
//     designation: "", // FK id
//   });

//   const [addressForm, setAddressForm] = useState({
//     flat_or_building: "",
//     area: "",
//     pincode: "",
//     city: "",
//     state: "",
//     country: "",
//   });

//   const [proposalFiles, setProposalFiles] = useState([]);
//   const [savingExtra, setSavingExtra] = useState(false);

//   // ====================== EFFECTS ======================

//   // 1) Fetch lead detail
//   useEffect(() => {
//     if (!leadId) {
//       setError("Lead id missing in URL");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError("");

//     api
//       .get(`/sales/sales-leads/${leadId}/`, {
//         params: { include_all_stage: true },
//       })
//       .then((res) => setLead(res.data))
//       .catch((err) => {
//         console.error("Failed to load lead", err);
//         setError("Failed to load lead details.");
//       })
//       .finally(() => setLoading(false));
//   }, [leadId]);

//   // 2) When lead is known, load setup-bundle lookups
//   useEffect(() => {
//     if (!lead || !lead.project) return;

//     setLoadingLookups(true);
//     api
//       .get("/client/setup-bundle/", {
//         params: { project_id: lead.project },
//       })
//       .then((res) => {
//         const data = res.data || {};
//         setLookups(data.lookups || {});
//       })
//       .catch((err) => {
//         console.error("Failed to load setup bundle", err);
//       })
//       .finally(() => setLoadingLookups(false));
//   }, [lead]);

//   // 3) Prefill extra-info forms once lead is loaded
//   useEffect(() => {
//     if (!lead) return;

//     const a = lead.address || {};
//     setAddressForm({
//       flat_or_building: a.flat_or_building || "",
//       area: a.area || "",
//       pincode: a.pincode || "",
//       city: a.city || "",
//       state: a.state || "",
//       country: a.country || "",
//     });

//     const cp = lead.cp_info || {};
//     setCpInfoForm({
//       referral_code: cp.referral_code || "",
//     });

//     const p = lead.personal_info || {};
//     setPersonalForm({
//       date_of_birth: p.date_of_birth || "",
//       date_of_anniversary: p.date_of_anniversary || "",
//       already_part_of_family: !!p.already_part_of_family,
//       secondary_email: p.secondary_email || "",
//       alternate_mobile: p.alternate_mobile || "",
//       alternate_tel_res: p.alternate_tel_res || "",
//       alternate_tel_off: p.alternate_tel_off || "",
//       visiting_on_behalf:
//         (p.visiting_on_behalf && p.visiting_on_behalf.id) ||
//         p.visiting_on_behalf ||
//         "",
//       current_residence_ownership:
//         (p.current_residence_ownership && p.current_residence_ownership.id) ||
//         p.current_residence_ownership ||
//         "",
//       current_residence_type: p.current_residence_type || "",
//       family_size: (p.family_size && p.family_size.id) || p.family_size || "",
//       possession_desired_in:
//         (p.possession_desired_in && p.possession_desired_in.id) ||
//         p.possession_desired_in ||
//         "",
//       facebook: p.facebook || "",
//       twitter: p.twitter || "",
//       linkedin: p.linkedin || "",
//     });

//     const pr = lead.professional_info || {};
//     setProfessionalForm({
//       occupation: (pr.occupation && pr.occupation.id) || pr.occupation || "",
//       organization_name: pr.organization_name || "",
//       office_location: pr.office_location || "",
//       office_pincode: pr.office_pincode || "",
//       designation:
//         (pr.designation && pr.designation.id) || pr.designation || "",
//     });
//   }, [lead]);

//   // ====================== DERIVED DATA ======================

//   const fullName =
//     lead?.full_name ||
//     [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") ||
//     "-";

//   const ownerName = lead?.current_owner_name || "-";
//   const mobile = lead?.mobile_number || "-";
//   const email = lead?.email || "-";
//   const statusName = lead?.status_name || "-";

//   const stages = lead?.lead_stages || [];
//   const stageHistory = lead?.stage_history || [];
//   const updates = lead?.updates || [];
//   const documents = lead?.documents || [];

//   // active stage from history
//   let activeStageId = null;
//   if (stageHistory.length > 0) {
//     const sorted = [...stageHistory].sort((a, b) => {
//       const aKey = a.event_date || a.created_at || "";
//       const bKey = b.event_date || b.created_at || "";
//       if (aKey < bKey) return -1;
//       if (aKey > bKey) return 1;
//       return (a.id || 0) - (b.id || 0);
//     });
//     activeStageId = sorted[sorted.length - 1].stage;
//   }

//   const activeStageOrder =
//     activeStageId && stages.length
//       ? stages.find((s) => s.id === activeStageId)?.order ?? null
//       : null;

//   const toIntOrNull = (val) => {
//     if (val === "" || val === null || val === undefined) return null;
//     const n = Number(val);
//     return Number.isNaN(n) ? null : n;
//   };

//   // options helper for lookups
//   const lookupOptions = (key) => {
//     if (!lookups || !lookups[key]) return [];
//     return lookups[key].map((item) => ({
//       value: item.id,
//       label: item.name || item.code || `#${item.id}`,
//     }));
//   };

//   // ====================== HANDLERS ======================

//   // ---- activity ----
//   const handleActivityChange = (field, value) => {
//     setActivityForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleCreateActivity = async () => {
//     if (!lead) return;
//     if (!activityForm.title && !activityForm.info) {
//       alert("Please enter title or info");
//       return;
//     }

//     setSavingActivity(true);
//     try {
//       const payload = {
//         sales_lead: lead.id,
//         title: activityForm.title || "Activity",
//         info: activityForm.info || "",
//         event_date: activityForm.event_date || null,
//       };

//       const res = await api.post("/sales/sales-lead-updates/", payload);
//       const newUpdate = res.data;

//       setLead((prev) => ({
//         ...prev,
//         updates: [newUpdate, ...(prev?.updates || [])],
//       }));

//       setActivityForm({ title: "", info: "", event_date: "" });
//       setShowActivityForm(false);
//     } catch (err) {
//       console.error("Failed to create update", err);
//       alert("Failed to save activity");
//     } finally {
//       setSavingActivity(false);
//     }
//   };

//   // ---- right-side documents ----
//   const handleAddDocClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setPendingFile(file);
//     const baseName = file.name.replace(/\.[^/.]+$/, "");
//     setDocTitle(baseName);
//     setDocModalOpen(true);

//     e.target.value = "";
//   };

//   const handleCancelUploadDoc = () => {
//     if (uploadingDoc) return;
//     setDocModalOpen(false);
//     setPendingFile(null);
//     setDocTitle("");
//   };

//   const handleConfirmUploadDoc = async () => {
//     if (!pendingFile || !leadId) return;

//     const formData = new FormData();
//     formData.append("sales_lead", leadId);
//     formData.append("title", docTitle || pendingFile.name);
//     formData.append("file", pendingFile);

//     setUploadingDoc(true);
//     try {
//       const res = await api.post("/sales/sales-lead-documents/", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const newDoc = res.data;
//       setLead((prev) => ({
//         ...prev,
//         documents: [...(prev?.documents || []), newDoc],
//       }));
//       setDocModalOpen(false);
//       setPendingFile(null);
//       setDocTitle("");
//     } catch (err) {
//       console.error("Failed to upload document", err);
//       alert("Failed to upload document");
//     } finally {
//       setUploadingDoc(false);
//     }
//   };

//   // ---- inventory navigation ----
//   const handleInventoryClick = () => {
//     if (!lead) return;
//     const projectId = lead.project;
//     if (!projectId) {
//       console.warn("No project id on lead", lead);
//       alert("Project is not linked for this lead.");
//       return;
//     }
//     navigate(`/inventory-planning/?project_id=${projectId}`);
//   };

//   // ---- inventory navigation ----
//   const handleBookFlatClick = () => {
//     if (!lead) return;
//     const projectId = lead.project;
//     if (!projectId) {
//       console.warn("No project id on lead", lead);
//       alert("Project is not linked for this lead.");
//       return;
//     }
//     navigate(`/booking/form/?project_id=${projectId}`);
//   };

//   // ---- stage change ----
//   const handleStageClick = (stage) => {
//     if (!lead) return;
//     if (activeStageId && stage.id === activeStageId) return;

//     setStageModal({
//       open: true,
//       stage,
//     });
//   };

//   const handleCancelStageChange = () => {
//     if (savingStage) return;
//     setStageModal({ open: false, stage: null });
//   };

//   const handleConfirmStageChange = async () => {
//     if (!lead || !stageModal.stage) return;

//     setSavingStage(true);
//     try {
//       const payload = {
//         sales_lead: lead.id,
//         stage: stageModal.stage.id,
//         status: lead.status || null,
//         sub_status: lead.sub_status || null,
//         event_date: new Date().toISOString(),
//         notes: "",
//       };

//       const res = await api.post("/sales/sales-lead-stages/", payload);
//       const newHistory = res.data;

//       setLead((prev) => ({
//         ...prev,
//         stage_history: [...(prev?.stage_history || []), newHistory],
//       }));
//     } catch (err) {
//       console.error("Failed to change stage", err);
//       alert("Failed to change stage");
//     } finally {
//       setSavingStage(false);
//       setStageModal({ open: false, stage: null });
//     }
//   };

//   // ---- save extra info (CP + proposal + additional + professional + address) ----
//   const handleExtraSubmit = async () => {
//     if (!lead) return;

//     setSavingExtra(true);
//     try {
//       const payload = {
//         sales_lead_id: lead.id,
//         address: {
//           flat_or_building: addressForm.flat_or_building || "",
//           area: addressForm.area || "",
//           pincode: addressForm.pincode || "",
//           city: addressForm.city || "",
//           state: addressForm.state || "",
//           country: addressForm.country || "",
//         },
//         cp_info: {
//           referral_code: cpInfoForm.referral_code || "",
//         },
//         personal_info: {
//           date_of_birth: personalForm.date_of_birth || null,
//           date_of_anniversary: personalForm.date_of_anniversary || null,
//           already_part_of_family: personalForm.already_part_of_family,
//           secondary_email: personalForm.secondary_email || "",
//           alternate_mobile: personalForm.alternate_mobile || "",
//           alternate_tel_res: personalForm.alternate_tel_res || "",
//           alternate_tel_off: personalForm.alternate_tel_off || "",
//           visiting_on_behalf: toIntOrNull(personalForm.visiting_on_behalf),
//           current_residence_ownership: toIntOrNull(
//             personalForm.current_residence_ownership
//           ),
//           current_residence_type: personalForm.current_residence_type || "",
//           family_size: toIntOrNull(personalForm.family_size),
//           possession_desired_in: toIntOrNull(
//             personalForm.possession_desired_in
//           ),
//           facebook: personalForm.facebook || "",
//           twitter: personalForm.twitter || "",
//           linkedin: personalForm.linkedin || "",
//         },
//         professional_info: {
//           occupation: toIntOrNull(professionalForm.occupation),
//           organization_name: professionalForm.organization_name || "",
//           office_location: professionalForm.office_location || "",
//           office_pincode: professionalForm.office_pincode || "",
//           designation: toIntOrNull(professionalForm.designation),
//         },
//       };

//       let res;
//       if (proposalFiles.length > 0) {
//         const formData = new FormData();
//         formData.append("sales_lead_id", String(lead.id));
//         formData.append("address", JSON.stringify(payload.address));
//         formData.append("cp_info", JSON.stringify(payload.cp_info));
//         formData.append("personal_info", JSON.stringify(payload.personal_info));
//         formData.append(
//           "professional_info",
//           JSON.stringify(payload.professional_info)
//         );
//         proposalFiles.forEach((f) => {
//           formData.append("proposal_files", f);
//         });

//         res = await api.post("/sales/sales-leads/extra-info/", formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       } else {
//         res = await api.post("/sales/sales-leads/extra-info/", payload);
//       }

//       const extra = res.data || {};
//       setLead((prev) => ({
//         ...prev,
//         address: extra.address || prev.address,
//         cp_info: extra.cp_info || prev.cp_info,
//         personal_info: extra.personal_info || prev.personal_info,
//         professional_info: extra.professional_info || prev.professional_info,
//         proposal_documents: extra.proposal_documents || prev.proposal_documents,
//       }));
//       setProposalFiles([]);
//       alert("Details saved successfully");
//     } catch (err) {
//       console.error("Failed to save extra info", err);
//       alert("Failed to save additional details");
//     } finally {
//       setSavingExtra(false);
//     }
//   };

//   // ====================== RENDER ======================

//   if (loading) {
//     return <div className="lead-page">Loading lead...</div>;
//   }

//   if (error) {
//     return (
//       <div className="lead-page">
//         <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
//         <button className="btn-secondary" onClick={() => navigate(-1)}>
//           ← Back
//         </button>
//       </div>
//     );
//   }

//   if (!lead) {
//     return (
//       <div className="lead-page">
//         <div>No lead data found.</div>
//       </div>
//     );
//   }

//   return (
//     <div className="lead-page">
//       {/* ---------------- TOP HEADER ---------------- */}
//       <div className="lead-header">
//         <div className="lead-header-left">
//           <div className="lead-title">{fullName}</div>

//           <div className="lead-header-grid">
//             <div className="field-compact">
//               <label>Lead Owner:</label>
//               <input value={ownerName} readOnly />
//             </div>
//             <div className="field-compact">
//               <label>Mobile:</label>
//               <input value={mobile} readOnly />
//             </div>
//             <div className="field-compact">
//               <label>Email:</label>
//               <input value={email} readOnly />
//             </div>
//             <div className="field-compact">
//               <label>Lead Status:</label>
//               <input value={statusName} readOnly />
//             </div>
//           </div>
//         </div>

//         <div className="lead-header-right">
//           <div className="action-row-top">
//             <button className="card-btn" onClick={handleInventoryClick}>
//               Inventory
//             </button>
//             <button className="card-btn" onClick={handleBookFlatClick}>
//               Book Flat
//             </button>
//             <button className="card-btn">Payments</button>
//             <button className="card-btn">Payment Link</button>
//           </div>
//           <div className="action-row-bottom">
//             <button className="card-btn small">Send Feedback</button>
//             <button className="card-btn small">Save</button>
//           </div>
//         </div>
//       </div>

//       {/* ---------------- STAGE BAR ---------------- */}
//       <div className="lead-stages">
//         {stages.length === 0 && (
//           <div className="stage-item">
//             <span className="stage-label">No stages configured</span>
//           </div>
//         )}
//         {stages.map((stage, idx) => {
//           let extraClass = "";

//           if (activeStageId) {
//             if (stage.id === activeStageId) {
//               extraClass = "stage-active";
//             } else if (
//               activeStageOrder != null &&
//               stage.order < activeStageOrder
//             ) {
//               extraClass = "stage-done";
//             } else {
//               extraClass = "stage-pending";
//             }
//           } else {
//             extraClass = idx === 0 ? "stage-active" : "stage-pending";
//           }

//           return (
//             <div
//               key={stage.id}
//               className={`stage-item ${extraClass}`}
//               onClick={() => handleStageClick(stage)}
//               style={{ cursor: "pointer" }}
//             >
//               <span className="stage-dot" />
//               <span className="stage-label">{stage.name}</span>
//             </div>
//           );
//         })}
//       </div>

//       {/* ---------------- MAIN CONTENT SPLIT ---------------- */}
//       <div className="content-split">
//         {/* LEFT – Lead Information */}
//         <div className="panel panel-left">
//           <div className="panel-header">
//             <span>Lead Information</span>
//             <button className="link-btn">Edit</button>
//           </div>
//           <div className="panel-body blank-area">
//             <div className="field-compact">
//               <label>Project:</label>
//               <input value={lead.project_name || `#${lead.project}`} readOnly />
//             </div>
//             <div className="field-compact">
//               <label>Budget:</label>
//               <input value={lead.budget ?? ""} readOnly />
//             </div>
//             <div className="field-compact">
//               <label>Company:</label>
//               <input value={lead.company || ""} readOnly />
//             </div>
//             <div className="field-compact">
//               <label>Purpose:</label>
//               <input value={lead.purpose_name || ""} readOnly />
//             </div>
//           </div>
//         </div>

//         {/* RIGHT – Activity / Documents */}
//         <div className="panel panel-right">
//           <div className="tabs">
//             <button
//               className={`tab ${activeTab === "activity" ? "active" : ""}`}
//               onClick={() => setActiveTab("activity")}
//             >
//               Activity
//             </button>
//             <button
//               className={`tab ${activeTab === "comment" ? "active" : ""}`}
//               onClick={() => setActiveTab("comment")}
//             >
//               Comment
//             </button>
//             <button className="tab">Booking</button>
//             <button className="tab">SMS</button>
//             <button className="tab">Email</button>
//             <button className="tab">Zoom</button>
//           </div>

//           {activeTab === "activity" && (
//             <>
//               {showActivityForm && (
//                 <div className="activity-wrapper">
//                   <div className="activity-row">
//                     <div className="activity-icon bubble" />
//                     <div className="activity-card">
//                       <div className="field-full">
//                         <label>Title</label>
//                         <input
//                           className="input-plain"
//                           value={activityForm.title}
//                           onChange={(e) =>
//                             handleActivityChange("title", e.target.value)
//                           }
//                         />
//                       </div>
//                       <div className="field-full">
//                         <label>Things to do</label>
//                         <textarea
//                           className="input-plain tall"
//                           value={activityForm.info}
//                           onChange={(e) =>
//                             handleActivityChange("info", e.target.value)
//                           }
//                         />
//                       </div>

//                       <div className="field-full">
//                         <label>Event Date</label>
//                         <input
//                           type="datetime-local"
//                           className="input-plain"
//                           value={activityForm.event_date}
//                           onChange={(e) =>
//                             handleActivityChange(
//                               "event_date",
//                               e.target.value || ""
//                             )
//                           }
//                         />
//                       </div>

//                       <div className="activity-buttons">
//                         <button
//                           type="button"
//                           className="btn-primary"
//                           onClick={handleCreateActivity}
//                           disabled={savingActivity}
//                         >
//                           {savingActivity ? "Saving..." : "Save"}
//                         </button>
//                         <button
//                           type="button"
//                           className="btn-secondary"
//                           onClick={() => {
//                             setShowActivityForm(false);
//                             setActivityForm({
//                               title: "",
//                               info: "",
//                               event_date: "",
//                             });
//                           }}
//                         >
//                           Cancel
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="activity-wrapper">
//                 <div className="activity-row gap-top">
//                   <div className="activity-icon plus">+</div>
//                   <div
//                     className="activity-strip"
//                     onClick={() => setShowActivityForm(true)}
//                     style={{ cursor: "pointer" }}
//                   >
//                     <div className="strip-title">Add a new activity</div>
//                     <div className="strip-sub">
//                       Plan your next action in the deal to never forget about
//                       the customer
//                     </div>
//                   </div>
//                 </div>

//                 {updates.map((u) => (
//                   <div key={u.id} className="activity-row">
//                     <div className="activity-icon info">i</div>
//                     <div className="activity-strip">
//                       <div className="strip-title">{u.title}</div>
//                       <div className="strip-sub">{u.info}</div>
//                       {u.event_date && (
//                         <div className="strip-sub small">
//                           Event: {u.event_date}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}

//                 {updates.length === 0 && (
//                   <div className="activity-row">
//                     <div className="activity-icon info">i</div>
//                     <div className="activity-strip">
//                       <div className="strip-title">
//                         No activities yet for this lead.
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}

//           {/* Right side documents (SalesLeadDocument) */}
//           <div className="documents-wrapper">
//             <div className="documents-header">
//               <span>Documents</span>
//             </div>
//             <div className="documents-body">
//               <div className="documents-row">
//                 {documents.map((doc) => {
//                   const label =
//                     doc.title && doc.title.trim()
//                       ? doc.title.trim()
//                       : "Untitled";

//                   return (
//                     <div key={doc.id} className="doc-card">
//                       <div className="doc-icon" />
//                       <div className="doc-label">
//                         {doc.file_url ? (
//                           <a
//                             href={doc.file_url}
//                             target="_blank"
//                             rel="noreferrer"
//                           >
//                             {label}
//                           </a>
//                         ) : (
//                           label
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}

//                 <button
//                   className="doc-card add-doc"
//                   onClick={handleAddDocClick}
//                   type="button"
//                   disabled={uploadingDoc}
//                 >
//                   <span className="add-symbol">{uploadingDoc ? "…" : "+"}</span>
//                 </button>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   style={{ display: "none" }}
//                   onChange={handleFileChange}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ================= BOTTOM SECTIONS ================= */}

//       {/* CP Information */}
//       <div className="section dashed-top">
//         <div className="section-header">
//           <span>CP Information</span>
//           <button className="icon-round">+</button>
//         </div>
//         <div className="section-body section-grid">
//           <div className="column">
//             <div className="field-full">
//               <label>Referral Code</label>
//               <input
//                 value={cpInfoForm.referral_code}
//                 onChange={(e) =>
//                   setCpInfoForm((prev) => ({
//                     ...prev,
//                     referral_code: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Proposal Form */}
//       <div className="section dashed-top">
//         <div className="section-header">
//           <span>Proposal Form</span>
//           <button className="icon-round">+</button>
//         </div>
//         <div className="section-body">
//           <label>Attachment:</label>
//           <div className="proposal-upload-row">
//             <input
//               type="file"
//               multiple
//               onChange={(e) => {
//                 const files = Array.from(e.target.files || []);
//                 setProposalFiles(files);
//               }}
//             />
//             {proposalFiles.length > 0 && (
//               <div className="proposal-file-list">
//                 {proposalFiles.map((f) => (
//                   <div key={f.name} className="proposal-file-item">
//                     {f.name}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Additional Information */}
//       <div className="section dashed-top">
//         <div className="section-header">
//           <span>Additional Information</span>
//           <button className="icon-round">+</button>
//         </div>
//         <div className="section-body section-grid">
//           <div className="column">
//             <div className="field-full">
//               <label>Date of Birth</label>
//               <input
//                 type="date"
//                 value={personalForm.date_of_birth}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     date_of_birth: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Date of Anniversary</label>
//               <input
//                 type="date"
//                 value={personalForm.date_of_anniversary}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     date_of_anniversary: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full checkbox-inline">
//               <label>Already a part of the family?</label>
//               <input
//                 type="checkbox"
//                 checked={personalForm.already_part_of_family}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     already_part_of_family: e.target.checked,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Project Name</label>
//               <input value={lead.project_name || ""} readOnly />
//             </div>

//             {/* Visiting On Behalf */}
//             <div className="field-full">
//               <label>Visiting On Behalf</label>
//               <select
//                 value={personalForm.visiting_on_behalf || ""}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     visiting_on_behalf: e.target.value,
//                   }))
//                 }
//                 disabled={loadingLookups}
//               >
//                 <option value="">
//                   {loadingLookups ? "Loading..." : "Select"}
//                 </option>
//                 {lookupOptions("visiting_half").map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Current Residence Ownership */}
//             <div className="field-full">
//               <label>Current Residence Ownership</label>
//               <select
//                 value={personalForm.current_residence_ownership || ""}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     current_residence_ownership: e.target.value,
//                   }))
//                 }
//                 disabled={loadingLookups}
//               >
//                 <option value="">
//                   {loadingLookups ? "Loading..." : "Select"}
//                 </option>
//                 {lookupOptions("residency_ownerships").map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="field-full">
//               <label>Current Residence type</label>
//               <input
//                 value={personalForm.current_residence_type}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     current_residence_type: e.target.value,
//                   }))
//                 }
//               />
//             </div>

//             {/* Family Size */}
//             <div className="field-full">
//               <label>Family Size</label>
//               <select
//                 value={personalForm.family_size || ""}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     family_size: e.target.value,
//                   }))
//                 }
//                 disabled={loadingLookups}
//               >
//                 <option value="">
//                   {loadingLookups ? "Loading..." : "Select"}
//                 </option>
//                 {lookupOptions("family_sizes").map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Possession desired in */}
//             <div className="field-full">
//               <label>Possession desired in</label>
//               <select
//                 value={personalForm.possession_desired_in || ""}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     possession_desired_in: e.target.value,
//                   }))
//                 }
//                 disabled={loadingLookups}
//               >
//                 <option value="">
//                   {loadingLookups ? "Loading..." : "Select"}
//                 </option>
//                 {lookupOptions("possession_designed").map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="column">
//             <div className="field-full">
//               <label>Secondary Email</label>
//               <input
//                 value={personalForm.secondary_email}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     secondary_email: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Alternate Mobile</label>
//               <input
//                 value={personalForm.alternate_mobile}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     alternate_mobile: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Alternate Tel (Res)</label>
//               <input
//                 value={personalForm.alternate_tel_res}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     alternate_tel_res: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Alternate Tel (Off)</label>
//               <input
//                 value={personalForm.alternate_tel_off}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     alternate_tel_off: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Facebook</label>
//               <input
//                 value={personalForm.facebook}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     facebook: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Twitter</label>
//               <input
//                 value={personalForm.twitter}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     twitter: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Linkedin</label>
//               <input
//                 value={personalForm.linkedin}
//                 onChange={(e) =>
//                   setPersonalForm((prev) => ({
//                     ...prev,
//                     linkedin: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Professional Information */}
//       <div className="section dashed-top">
//         <div className="section-header">
//           <span>Professional Information</span>
//           <button className="icon-round">+</button>
//         </div>
//         <div className="section-body section-grid">
//           <div className="column">
//             <div className="field-full">
//               <label>Occupation</label>
//               <select
//                 value={professionalForm.occupation || ""}
//                 onChange={(e) =>
//                   setProfessionalForm((prev) => ({
//                     ...prev,
//                     occupation: e.target.value,
//                   }))
//                 }
//                 disabled={loadingLookups}
//               >
//                 <option value="">
//                   {loadingLookups ? "Loading..." : "Select"}
//                 </option>
//                 {lookupOptions("occupations").map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="field-full">
//               <label>Name of the Organization</label>
//               <input
//                 value={professionalForm.organization_name}
//                 onChange={(e) =>
//                   setProfessionalForm((prev) => ({
//                     ...prev,
//                     organization_name: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Designation</label>
//               <select
//                 value={professionalForm.designation || ""}
//                 onChange={(e) =>
//                   setProfessionalForm((prev) => ({
//                     ...prev,
//                     designation: e.target.value,
//                   }))
//                 }
//                 disabled={loadingLookups}
//               >
//                 <option value="">
//                   {loadingLookups ? "Loading..." : "Select"}
//                 </option>
//                 {lookupOptions("designations").map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           <div className="column">
//             <div className="field-full">
//               <label>Office Location</label>
//               <input
//                 value={professionalForm.office_location}
//                 onChange={(e) =>
//                   setProfessionalForm((prev) => ({
//                     ...prev,
//                     office_location: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Pin Code</label>
//               <input
//                 value={professionalForm.office_pincode}
//                 onChange={(e) =>
//                   setProfessionalForm((prev) => ({
//                     ...prev,
//                     office_pincode: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Address Information */}
//       <div className="section dashed-top">
//         <div className="section-header">
//           <span>Address Information</span>
//           <button className="icon-round">+</button>
//         </div>
//         <div className="section-body section-grid">
//           <div className="column">
//             <div className="field-full">
//               <label>Flat no. / Building</label>
//               <input
//                 value={addressForm.flat_or_building}
//                 onChange={(e) =>
//                   setAddressForm((prev) => ({
//                     ...prev,
//                     flat_or_building: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Area</label>
//               <input
//                 value={addressForm.area}
//                 onChange={(e) =>
//                   setAddressForm((prev) => ({
//                     ...prev,
//                     area: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Pin Code</label>
//               <input
//                 value={addressForm.pincode}
//                 onChange={(e) =>
//                   setAddressForm((prev) => ({
//                     ...prev,
//                     pincode: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>City</label>
//               <input
//                 value={addressForm.city}
//                 onChange={(e) =>
//                   setAddressForm((prev) => ({
//                     ...prev,
//                     city: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//           </div>
//           <div className="column">
//             <div className="field-full">
//               <label>State</label>
//               <input
//                 value={addressForm.state}
//                 onChange={(e) =>
//                   setAddressForm((prev) => ({
//                     ...prev,
//                     state: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//             <div className="field-full">
//               <label>Country</label>
//               <input
//                 value={addressForm.country}
//                 onChange={(e) =>
//                   setAddressForm((prev) => ({
//                     ...prev,
//                     country: e.target.value,
//                   }))
//                 }
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer buttons */}
//       <div className="footer-buttons">
//         <button
//           className="btn-secondary big"
//           type="button"
//           onClick={() => navigate(-1)}
//         >
//           Cancel
//         </button>
//         <button
//           className="btn-primary big"
//           type="button"
//           onClick={handleExtraSubmit}
//           disabled={savingExtra}
//         >
//           {savingExtra ? "Saving..." : "Submit"}
//         </button>
//       </div>

//       {/* ---------- Stage change modal ---------- */}
//       {stageModal.open && stageModal.stage && (
//         <div className="modal-backdrop">
//           <div className="modal">
//             <div className="modal-title">
//               Move to "{stageModal.stage.name}"?
//             </div>
//             <div className="modal-body">
//               Are you sure you want to move this lead to{" "}
//               <strong>{stageModal.stage.name}</strong>?
//             </div>
//             <div className="modal-actions">
//               <button
//                 className="btn-secondary"
//                 type="button"
//                 onClick={handleCancelStageChange}
//                 disabled={savingStage}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn-primary"
//                 type="button"
//                 onClick={handleConfirmStageChange}
//                 disabled={savingStage}
//               >
//                 {savingStage ? "Updating..." : "Yes, move"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ---------- Document title modal ---------- */}
//       {docModalOpen && pendingFile && (
//         <div className="modal-backdrop">
//           <div className="modal">
//             <div className="modal-title">Add Document</div>
//             <div className="modal-body">
//               <div className="field-full">
//                 <label>Document Title</label>
//                 <input
//                   className="input-plain"
//                   value={docTitle}
//                   onChange={(e) => setDocTitle(e.target.value)}
//                 />
//               </div>
//               <div className="field-full" style={{ marginTop: 8 }}>
//                 <small>File: {pendingFile.name}</small>
//               </div>
//             </div>
//             <div className="modal-actions">
//               <button
//                 className="btn-secondary"
//                 type="button"
//                 onClick={handleCancelUploadDoc}
//                 disabled={uploadingDoc}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn-primary"
//                 type="button"
//                 onClick={handleConfirmUploadDoc}
//                 disabled={uploadingDoc}
//               >
//                 {uploadingDoc ? "Uploading..." : "Upload"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LeadStaticPage;


// src/pages/LeadStaticPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./LeadStaticPage.css";

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

  // ---- right-side tabs ----
  const [activeTab, setActiveTab] = useState("activity");

  // ---- activity (updates) ----
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: "",
    info: "",
    event_date: "",
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
    visiting_on_behalf: "", // FK id
    current_residence_ownership: "", // FK id
    current_residence_type: "",
    family_size: "", // FK id
    possession_desired_in: "", // FK id
    facebook: "",
    twitter: "",
    linkedin: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    occupation: "", // FK id
    organization_name: "",
    office_location: "",
    office_pincode: "",
    designation: "", // FK id
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

  // ---- document preview (project + lead docs) ----
  const [previewDoc, setPreviewDoc] = useState(null);

  // ====================== EFFECTS ======================

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

  // 3) Prefill extra-info forms once lead is loaded
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
  }, [lead]);

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
  const documents = lead?.documents || [];

  // project-level inventory docs (from backend serializer)
  const inventoryDocs = lead?.project_inventory_docs || [];

  // channel partner detail block from serializer
  const channelPartner = lead?.channel_partner_detail || null;
  const channelPartnerLabel = lead?.channel_partner_name || "-";

  // active stage from history
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

  // options helper for lookups
  const lookupOptions = (key) => {
    if (!lookups || !lookups[key]) return [];
    return lookups[key].map((item) => ({
      value: item.id,
      label: item.name || item.code || `#${item.id}`,
    }));
  };

  // ====================== HANDLERS ======================

  // ---- activity ----
  const handleActivityChange = (field, value) => {
    setActivityForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateActivity = async () => {
    if (!lead) return;
    if (!activityForm.title && !activityForm.info) {
      alert("Please enter title or info");
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

      setActivityForm({ title: "", info: "", event_date: "" });
      setShowActivityForm(false);
    } catch (err) {
      console.error("Failed to create update", err);
      alert("Failed to save activity");
    } finally {
      setSavingActivity(false);
    }
  };

  // ---- right-side documents ----
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
    } catch (err) {
      console.error("Failed to upload document", err);
      alert("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  // ---- inventory navigation ----
  const handleInventoryClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      alert("Project is not linked for this lead.");
      return;
    }
    navigate(`/inventory-planning/?project_id=${projectId}`);
  };

  const handleBookFlatClick = () => {
    if (!lead) return;
    const projectId = lead.project;
    if (!projectId) {
      console.warn("No project id on lead", lead);
      alert("Project is not linked for this lead.");
      return;
    }
    navigate(`/booking/form/?project_id=${projectId}`);
  };

  // ---- stage change ----
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
    } catch (err) {
      console.error("Failed to change stage", err);
      alert("Failed to change stage");
    } finally {
      setSavingStage(false);
      setStageModal({ open: false, stage: null });
    }
  };

  // ---- save extra info (CP + proposal + additional + professional + address) ----
  const handleExtraSubmit = async () => {
    if (!lead) return;

    setSavingExtra(true);
    try {
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
      alert("Details saved successfully");
    } catch (err) {
      console.error("Failed to save extra info", err);
      alert("Failed to save additional details");
    } finally {
      setSavingExtra(false);
    }
  };

const handleDocClick = (doc) => {
  if (!doc || !doc.file_url) return;
  window.open(doc.file_url, "_blank", "noopener,noreferrer");
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
      {/* ---------------- TOP HEADER ---------------- */}
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
          </div>
          <div className="action-row-bottom">
            <button className="card-btn small">Send Feedback</button>
            <button className="card-btn small">Save</button>
          </div>
        </div>
      </div>

      {/* ---------------- STAGE BAR ---------------- */}
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

      {/* ---------------- MAIN CONTENT SPLIT ---------------- */}
      <div className="content-split">
        {/* LEFT – Lead Information */}
        <div className="panel panel-left">
          <div className="panel-header">
            <span>Lead Information</span>
            <button className="link-btn">Edit</button>
          </div>
          <div className="panel-body blank-area">
            <div className="field-compact">
              <label>Project:</label>
              <input value={lead.project_name || `#${lead.project}`} readOnly />
            </div>
            <div className="field-compact">
              <label>Budget:</label>
              <input value={lead.budget ?? ""} readOnly />
            </div>
            <div className="field-compact">
              <label>Company:</label>
              <input value={lead.company || ""} readOnly />
            </div>
            <div className="field-compact">
              <label>Purpose:</label>
              <input value={lead.purpose_name || ""} readOnly />
            </div>
          </div>
        </div>

        {/* RIGHT – Activity / Documents */}
        <div className="panel panel-right">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </button>
            <button
              className={`tab ${activeTab === "comment" ? "active" : ""}`}
              onClick={() => setActiveTab("comment")}
            >
              Comment
            </button>
            <button className="tab">Booking</button>
            <button className="tab">SMS</button>
            <button className="tab">Email</button>
            <button className="tab">Zoom</button>
          </div>

          {activeTab === "activity" && (
            <>
              {showActivityForm && (
                <div className="activity-wrapper">
                  <div className="activity-row">
                    <div className="activity-icon bubble" />
                    <div className="activity-card">
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
                        <label>Event Date</label>
                        <input
                          type="datetime-local"
                          className="input-plain"
                          value={activityForm.event_date}
                          onChange={(e) =>
                            handleActivityChange(
                              "event_date",
                              e.target.value || ""
                            )
                          }
                        />
                      </div>

                      <div className="activity-buttons">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleCreateActivity}
                          disabled={savingActivity}
                        >
                          {savingActivity ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setShowActivityForm(false);
                            setActivityForm({
                              title: "",
                              info: "",
                              event_date: "",
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="activity-wrapper">
                <div className="activity-row gap-top">
                  <div className="activity-icon plus">+</div>
                  <div
                    className="activity-strip"
                    onClick={() => setShowActivityForm(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="strip-title">Add a new activity</div>
                    <div className="strip-sub">
                      Plan your next action in the deal to never forget about
                      the customer
                    </div>
                  </div>
                </div>

                {updates.map((u) => (
                  <div key={u.id} className="activity-row">
                    <div className="activity-icon info">i</div>
                    <div className="activity-strip">
                      <div className="strip-title">{u.title}</div>
                      <div className="strip-sub">{u.info}</div>
                      {u.event_date && (
                        <div className="strip-sub small">
                          Event: {u.event_date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {updates.length === 0 && (
                  <div className="activity-row">
                    <div className="activity-icon info">i</div>
                    <div className="activity-strip">
                      <div className="strip-title">
                        No activities yet for this lead.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Right side documents (Project Inventory + SalesLeadDocument) */}
          <div className="documents-wrapper">
            <div className="documents-header">
              <span>Documents</span>
            </div>
            <div className="documents-body">
              {/* Project-level documents from Inventory (floor plan / project plan) */}
              {inventoryDocs.length > 0 && (
                <>
                  <div className="documents-subtitle">Project Documents</div>
                  <div className="documents-row">
                    {/* Project Documents */}
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

              {/* Lead-specific documents */}
              <div className="documents-subtitle">Lead Documents</div>
              <div className="documents-row">
                {/* Lead Documents */}
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

      {/* ================= BOTTOM SECTIONS ================= */}

      {/* CP Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>CP Information</span>
          <button className="icon-round">+</button>
        </div>
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
              <label>Channel Partner (from Lead)</label>
              <input value={channelPartnerLabel} readOnly />
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
                  <input value={channelPartner.mobile_masked || "-"} readOnly />
                </div>
                <div className="field-full">
                  <label>CP Email</label>
                  <input value={channelPartner.email_masked || "-"} readOnly />
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
      </div>

      {/* Proposal Form */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Proposal Form</span>
          <button className="icon-round">+</button>
        </div>
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
      </div>

      {/* Additional Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Additional Information</span>
          <button className="icon-round">+</button>
        </div>
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

            {/* Visiting On Behalf */}
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

            {/* Current Residence Ownership */}
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

            {/* Family Size */}
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

            {/* Possession desired in */}
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
      </div>

      {/* Professional Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Professional Information</span>
          <button className="icon-round">+</button>
        </div>
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
      </div>

      {/* Address Information */}
      <div className="section dashed-top">
        <div className="section-header">
          <span>Address Information</span>
          <button className="icon-round">+</button>
        </div>
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

      {/* ---------- Stage change modal ---------- */}
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

      {previewDoc && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">
              {previewDoc.title ||
                previewDoc.original_name ||
                "Document preview"}
            </div>
            <div className="modal-body">
              {previewDoc.file_url ? (
                <iframe
                  src={previewDoc.file_url}
                  title="Document preview"
                  style={{ width: "100%", height: "60vh", border: "none" }}
                />
              ) : (
                <div>No preview available for this document.</div>
              )}
            </div>
            <div className="modal-actions">
              {previewDoc.file_url && (
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Open in new tab
                </a>
              )}
              <button
                className="btn-primary"
                type="button"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Document title modal ---------- */}
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
