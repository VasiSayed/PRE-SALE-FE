// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { SetupAPI } from "../../api/endpoints";
// import api from "../../api/axiosInstance";
// import "./InventoryCreate.css";

// const createEmptyItem = () => ({
//   project: "",
//   tower: "",
//   floor: "",
//   unit: "",
//   unit_type: "",
//   configuration: "",
//   facing: "",
//   unit_status: "",
//   carpet_area: "",
//   build_up_area: "",
//   saleable_area: "",
//   rera_area: "",
//   block_minutes: "",
//   block_days: "",
//   agreement_value: "",
//   development_charges: "",
//   gst_amount: "",
//   stamp_duty_amount: "",
//   registration_charges: "",
//   legal_fee: "",
//   total_cost: "",
//   inventory_description: "",
//   floor_plan_file: null,
//   other_file: null,
//   project_plan_file: null,
// });

// const InventoryCreate = () => {
//   const navigate = useNavigate();

//   const [bundle, setBundle] = useState(null);
//   const [scope, setScope] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [items, setItems] = useState([createEmptyItem()]);

//   // NEW: Excel bulk state
//   const [excelFile, setExcelFile] = useState(null);
//   const [excelUploading, setExcelUploading] = useState(false);

//   // Load setup-bundle + my-scope(include_units)
//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const [b, s] = await Promise.all([
//           SetupAPI.getBundle(),
//           SetupAPI.myScope({ include_units: true }),
//         ]);
//         setBundle(b);
//         setScope(s);
//       } catch (e) {
//         console.error("Failed to load inventory setup", e);
//         setError("Failed to load configuration / scope");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   // Derived data
//   const projects = useMemo(() => scope?.projects ?? [], [scope]);
//   const unitTypes = bundle?.lookups?.unit_types ?? [];
//   const unitConfigs = bundle?.lookups?.unit_configurations ?? [];
//   const facings = bundle?.lookups?.facings ?? [];
//   const unitStatuses =
//     (bundle?.statuses?.unit ?? []).filter((u) =>
//       ["AVAILABLE", "BLOCKED", "SOLD"].includes(u.code)
//     ) ?? [];

//   const getTowers = (item) => {
//     const p = projects.find((p) => String(p.id) === String(item.project));
//     return p?.towers ?? [];
//   };

//   const getFloors = (item) => {
//     const towers = getTowers(item);
//     const t = towers.find((t) => String(t.id) === String(item.tower));
//     return t?.floors ?? [];
//   };

//   const getUnits = (item) => {
//     const floors = getFloors(item);
//     const f = floors.find((f) => String(f.id) === String(item.floor));
//     return f?.units ?? [];
//   };

//   // Handlers
//   const handleItemChange = (index, name, value) => {
//     setItems((prev) =>
//       prev.map((it, i) => {
//         if (i !== index) return it;
//         const next = { ...it, [name]: value };
//         if (name === "project") {
//           next.tower = "";
//           next.floor = "";
//           next.unit = "";
//         } else if (name === "tower") {
//           next.floor = "";
//           next.unit = "";
//         } else if (name === "floor") {
//           next.unit = "";
//         }
//         return next;
//       })
//     );
//   };

//   const handleFileChange = (index, name, file) => {
//     setItems((prev) =>
//       prev.map((it, i) => (i === index ? { ...it, [name]: file } : it))
//     );
//   };

//   const handleAddItem = () => {
//     setItems((prev) => [...prev, createEmptyItem()]);
//   };

//   const handleRemoveItem = (index) => {
//     setItems((prev) =>
//       prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
//     );
//   };

//   const handleCancel = () => {
//     setItems([createEmptyItem()]);
//   };

//   // NEW: Excel handlers
//   const handleExcelFileChange = (e) => {
//     const file = e.target.files?.[0] || null;
//     setExcelFile(file);
//   };

//   const handleExcelUpload = async () => {
//     if (!excelFile) {
//       alert("Please select an Excel (.xlsx) file first.");
//       return;
//     }

//     const fd = new FormData();
//     fd.append("file", excelFile);

//     try {
//       setExcelUploading(true);
//       const res = await api.post("client/inventory/bulk-create/", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("Excel imported successfully.");
//       setExcelFile(null);
//       // optional: after import go back to list
//       navigate("/sales/inventory");
//     } catch (err) {
//       console.error("Excel bulk inventory import failed", err);
//       const detail =
//         err?.response?.data?.detail ||
//         err?.response?.data?.error ||
//         "Failed to import Excel. Please check the template and data.";
//       alert(detail);
//     } finally {
//       setExcelUploading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const fd = new FormData();
//     const payloadItems = [];

//     items.forEach((item, index) => {
//       const hasCore =
//         item.project || item.tower || item.floor || item.unit || item.unit_type;
//       if (!hasCore) return;

//       const docs = [];
//       let docIdx = 0;

//       if (item.floor_plan_file) {
//         const key = `doc_${index}_${docIdx++}`;
//         fd.append(key, item.floor_plan_file);
//         docs.push({ doc_type: "FLOOR_PLAN", file_field: key });
//       }
//       if (item.project_plan_file) {
//         const key = `doc_${index}_${docIdx++}`;
//         fd.append(key, item.project_plan_file);
//         docs.push({ doc_type: "PROJECT_PLAN", file_field: key });
//       }
//       if (item.other_file) {
//         const key = `doc_${index}_${docIdx++}`;
//         fd.append(key, item.other_file);
//         docs.push({ doc_type: "OTHER", file_field: key });
//       }

//       payloadItems.push({
//         project: item.project ? Number(item.project) : null,
//         tower: item.tower ? Number(item.tower) : null,
//         floor: item.floor ? Number(item.floor) : null,
//         unit: item.unit ? Number(item.unit) : null,
//         unit_type: item.unit_type ? Number(item.unit_type) : null,
//         configuration: item.configuration ? Number(item.configuration) : null,
//         facing: item.facing ? Number(item.facing) : null,
//         availability_status: item.unit_status || "AVAILABLE",
//         unit_status: item.unit_status || "AVAILABLE",
//         carpet_area: item.carpet_area || null,
//         build_up_area: item.build_up_area || null,
//         saleable_area: item.saleable_area || null,
//         rera_area: item.rera_area || null,
//         block_minutes: item.block_minutes || null,
//         block_days: item.block_days || null,
//         agreement_value: item.agreement_value || null,
//         development_charges: item.development_charges || null,
//         gst_amount: item.gst_amount || null,
//         stamp_duty_amount: item.stamp_duty_amount || null,
//         registration_charges: item.registration_charges || null,
//         legal_fee: item.legal_fee || null,
//         total_cost: item.total_cost || null,
//         description: item.inventory_description || "",
//         documents: docs,
//       });
//     });

//     if (!payloadItems.length) {
//       alert("Please fill at least one inventory block");
//       return;
//     }

//     fd.append("items", JSON.stringify(payloadItems));

//     try {
//       await api.post("client/inventory/bulk-create/", fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("Inventory created successfully");
//       setItems([createEmptyItem()]);
//       navigate("/sales/inventory");
//     } catch (err) {
//       console.error("Bulk inventory create failed", err);
//       const msg =
//         err?.response?.data?.detail ||
//         "Failed to create inventory. Please check the data.";
//       alert(msg);
//     }
//   };

//   // Render helpers
//   const renderSelect = (
//     label,
//     name,
//     item,
//     index,
//     options,
//     placeholder = "Select"
//   ) => (
//     <div className="form-field">
//       <label className="form-label">{label}</label>
//       <select
//         className="form-input"
//         value={item[name] || ""}
//         onChange={(e) => handleItemChange(index, name, e.target.value)}
//       >
//         <option value="">{placeholder}</option>
//         {options.map((opt) => (
//           <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>
//             {opt.label ?? opt.name}
//           </option>
//         ))}
//       </select>
//     </div>
//   );

//   const renderNumber = (label, name, item, index) => (
//     <div className="form-field">
//       <label className="form-label">{label}</label>
//       <input
//         className="form-input"
//         type="number"
//         value={item[name]}
//         onChange={(e) => handleItemChange(index, name, e.target.value)}
//       />
//     </div>
//   );

//   if (loading) {
//     return (
//       <div className="inventory-page">
//         <div style={{ padding: 24 }}>Loading…</div>
//       </div>
//     );
//   }

//   return (
//     <div className="inventory-page">
//       <div className="setup-section">
//         <div className="section-content">
//           {error && <div className="error-banner">{error}</div>}

//           {/* 🔹 TOP BAR – same style buttons as earlier */}
//           <div className="inventory-bulk-bar">
//             {/* Download sample Excel – put file in public/static and adjust href */}
//             <a
//               href="/static/inventory_bulk_template.xlsx"
//               className="btn-secondary"
//               download
//             >
//               Download Sample Excel
//             </a>

//             <div className="inventory-bulk-right">
//               <label className="btn-secondary">
//                 Choose Excel
//                 <input
//                   type="file"
//                   accept=".xlsx,.xls"
//                   style={{ display: "none" }}
//                   onChange={handleExcelFileChange}
//                 />
//               </label>
//               <span className="inventory-bulk-file-name">
//                 {excelFile ? excelFile.name : "No file selected"}
//               </span>

//               <button
//                 type="button"
//                 className="btn-primary"
//                 onClick={handleExcelUpload}
//                 disabled={!excelFile || excelUploading}
//               >
//                 {excelUploading ? "Uploading..." : "Upload Excel"}
//               </button>
//             </div>
//           </div>

//           {/* Manual bulk form (as before) */}
//           <form onSubmit={handleSubmit}>
//             {items.map((item, index) => {
//               const towers = getTowers(item);
//               const floors = getFloors(item);
//               const units = getUnits(item);

//               return (
//                 <div className="inventory-block" key={index}>
//                   <div className="inventory-block-header">
//                     <span>Inventory {index + 1}</span>
//                     {items.length > 1 && (
//                       <button
//                         type="button"
//                         className="inventory-block-remove"
//                         onClick={() => handleRemoveItem(index)}
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>

//                   {/* Row 1: Project / Tower / Floor */}
//                   <div className="form-row">
//                     {renderSelect(
//                       "Project Name:",
//                       "project",
//                       item,
//                       index,
//                       projects.map((p) => ({ value: p.id, label: p.name }))
//                     )}

//                     {renderSelect(
//                       "Tower:",
//                       "tower",
//                       item,
//                       index,
//                       towers.map((t) => ({ value: t.id, label: t.name })),
//                       "Select tower"
//                     )}

//                     {renderSelect(
//                       "Floor:",
//                       "floor",
//                       item,
//                       index,
//                       floors.map((f) => ({ value: f.id, label: f.number })),
//                       "Select floor"
//                     )}
//                   </div>

//                   {/* Row 2: Unit / Unit Type / Configuration */}
//                   <div className="form-row">
//                     {renderSelect(
//                       "Unit:",
//                       "unit",
//                       item,
//                       index,
//                       units.map((u) => ({
//                         value: u.id,
//                         label: u.unit_no || `Unit #${u.id}`,
//                       })),
//                       "Select unit"
//                     )}

//                     {renderSelect(
//                       "Unit Type:",
//                       "unit_type",
//                       item,
//                       index,
//                       unitTypes.map((u) => ({ value: u.id, label: u.name }))
//                     )}

//                     {renderSelect(
//                       "Unit Configuration:",
//                       "configuration",
//                       item,
//                       index,
//                       unitConfigs.map((u) => ({ value: u.id, label: u.name }))
//                     )}
//                   </div>

//                   {/* Row 3: Facing / Unit Status */}
//                   <div className="form-row">
//                     {renderSelect(
//                       "Facing:",
//                       "facing",
//                       item,
//                       index,
//                       facings.map((f) => ({ value: f.id, label: f.name }))
//                     )}

//                     {renderSelect(
//                       "Unit Status:",
//                       "unit_status",
//                       item,
//                       index,
//                       unitStatuses.map((u) => ({
//                         value: u.code,
//                         label: u.label,
//                       }))
//                     )}

//                     <div className="form-field" />
//                   </div>

//                   {/* Areas */}
//                   <div className="form-row">
//                     {renderNumber(
//                       "Carpet Area (Sq.ft):",
//                       "carpet_area",
//                       item,
//                       index
//                     )}
//                     {renderNumber(
//                       "Build Up Area (Sq.ft):",
//                       "build_up_area",
//                       item,
//                       index
//                     )}
//                     {renderNumber(
//                       "Saleable Area:",
//                       "saleable_area",
//                       item,
//                       index
//                     )}
//                   </div>

//                   {/* RERA + block */}
//                   <div className="form-row">
//                     {renderNumber("RERA Area:", "rera_area", item, index)}
//                     {renderNumber(
//                       "Block Period (Minutes):",
//                       "block_minutes",
//                       item,
//                       index
//                     )}
//                     {renderNumber(
//                       "Block Period (Days):",
//                       "block_days",
//                       item,
//                       index
//                     )}
//                   </div>

//                   {/* Money */}
//                   <div className="form-row">
//                     {renderNumber(
//                       "Agreement Value:",
//                       "agreement_value",
//                       item,
//                       index
//                     )}
//                     {renderNumber(
//                       "Development Charges:",
//                       "development_charges",
//                       item,
//                       index
//                     )}
//                     {renderNumber("GST:", "gst_amount", item, index)}
//                   </div>

//                   <div className="form-row">
//                     {renderNumber(
//                       "Stamp Duty Amount:",
//                       "stamp_duty_amount",
//                       item,
//                       index
//                     )}
//                     {renderNumber(
//                       "Registration Charges:",
//                       "registration_charges",
//                       item,
//                       index
//                     )}
//                     {renderNumber("Legal Fee:", "legal_fee", item, index)}
//                   </div>

//                   <div className="form-row">
//                     {renderNumber("Total Cost:", "total_cost", item, index)}
//                     <div className="form-field-full">
//                       <label className="form-label">
//                         Inventory Description:
//                       </label>
//                       <input
//                         className="form-input"
//                         type="text"
//                         value={item.inventory_description}
//                         onChange={(e) =>
//                           handleItemChange(
//                             index,
//                             "inventory_description",
//                             e.target.value
//                           )
//                         }
//                       />
//                     </div>
//                   </div>

//                   {/* Upload row */}
//                   <div className="form-row inventory-upload-row">
//                     <div className="form-field-full">
//                       <label className="form-label">Floor Plans:</label>
//                       <label className="upload-box">
//                         <span className="upload-icon">⬆</span>
//                         <span>
//                           {item.floor_plan_file ? "Change file" : "Upload"}
//                         </span>
//                         <input
//                           type="file"
//                           style={{ display: "none" }}
//                           onChange={(e) =>
//                             handleFileChange(
//                               index,
//                               "floor_plan_file",
//                               e.target.files[0]
//                             )
//                           }
//                         />
//                       </label>
//                     </div>

//                     <div className="form-field-full">
//                       <label className="form-label">Other:</label>
//                       <label className="upload-box">
//                         <span className="upload-icon">⬆</span>
//                         <span>
//                           {item.other_file ? "Change file" : "Upload"}
//                         </span>
//                         <input
//                           type="file"
//                           style={{ display: "none" }}
//                           onChange={(e) =>
//                             handleFileChange(
//                               index,
//                               "other_file",
//                               e.target.files[0]
//                             )
//                           }
//                         />
//                       </label>
//                     </div>

//                     <div className="form-field-full">
//                       <label className="form-label">Project Plans:</label>
//                       <label className="upload-box">
//                         <span className="upload-icon">⬆</span>
//                         <span>
//                           {item.project_plan_file ? "Change file" : "Upload"}
//                         </span>
//                         <input
//                           type="file"
//                           style={{ display: "none" }}
//                           onChange={(e) =>
//                             handleFileChange(
//                               index,
//                               "project_plan_file",
//                               e.target.files[0]
//                             )
//                           }
//                         />
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}

//             {/* Add new inventory block button */}
//             <div className="inventory-add-row">
//               <button
//                 type="button"
//                 className="btn-primary btn-small"
//                 onClick={handleAddItem}
//               >
//                 Add
//               </button>
//             </div>

//             {/* Global Cancel / Submit */}
//             <div className="form-row">
//               <div className="form-field-full">
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "center",
//                     gap: "40px",
//                     marginTop: "40px",
//                     marginBottom: "20px",
//                   }}
//                 >
//                   <button
//                     type="button"
//                     className="btn-secondary"
//                     onClick={handleCancel}
//                   >
//                     Cancel
//                   </button>
//                   <button type="submit" className="btn-primary">
//                     Submit
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InventoryCreate;




import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupAPI } from "../../api/endpoints";
import api from "../../api/axiosInstance";
import "./InventoryCreate.css";

const createEmptyItem = () => ({
  project: "",
  tower: "",
  floor: "",
  unit: "",
  unit_type: "",
  configuration: "",
  facing: "",
  unit_status: "",
  carpet_area: "",
  build_up_area: "",
  saleable_area: "",
  rera_area: "",
  block_minutes: "",
  block_days: "",
  agreement_value: "",
  development_charges: "",
  gst_amount: "",
  stamp_duty_amount: "",
  registration_charges: "",
  legal_fee: "",
  total_cost: "",
  inventory_description: "",
  floor_plan_file: null,
  other_file: null,
  project_plan_file: null,
});

const InventoryCreate = () => {
  const navigate = useNavigate();

  const [bundle, setBundle] = useState(null);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [items, setItems] = useState([createEmptyItem()]);

  // Excel state
  const [excelFile, setExcelFile] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);

  // Load setup-bundle + my-scope(include_units)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [b, s] = await Promise.all([
          SetupAPI.getBundle(),
          SetupAPI.myScope({ include_units: true }),
        ]);
        setBundle(b);
        setScope(s);
      } catch (e) {
        console.error("Failed to load inventory setup", e);
        setError("Failed to load configuration / scope");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derived data
  const projects = useMemo(() => scope?.projects ?? [], [scope]);
  const unitTypes = bundle?.lookups?.unit_types ?? [];
  const unitConfigs = bundle?.lookups?.unit_configurations ?? [];
  const facings = bundle?.lookups?.facings ?? [];
  const unitStatuses =
    (bundle?.statuses?.unit ?? []).filter((u) =>
      ["AVAILABLE", "BLOCKED", "SOLD"].includes(u.code)
    ) ?? [];

  const getTowers = (item) => {
    const p = projects.find((p) => String(p.id) === String(item.project));
    return p?.towers ?? [];
  };

  const getFloors = (item) => {
    const towers = getTowers(item);
    const t = towers.find((t) => String(t.id) === String(item.tower));
    return t?.floors ?? [];
  };

  const getUnits = (item) => {
    const floors = getFloors(item);
    const f = floors.find((f) => String(f.id) === String(item.floor));
    return f?.units ?? [];
  };

  // Handlers
  const handleItemChange = (index, name, value) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, [name]: value };
        if (name === "project") {
          next.tower = "";
          next.floor = "";
          next.unit = "";
        } else if (name === "tower") {
          next.floor = "";
          next.unit = "";
        } else if (name === "floor") {
          next.unit = "";
        }
        return next;
      })
    );
  };

  const handleFileChange = (index, name, file) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [name]: file } : it))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  const handleCancel = () => {
    setItems([createEmptyItem()]);
  };

  // Excel upload (auto upload after picking file)
  const uploadExcelFile = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
      setExcelUploading(true);
      const res = await api.post("client/inventory/bulk-create/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Excel imported successfully.");
      setExcelFile(null);
      // go back to inventory list or refresh
      navigate("/sales/inventory");
    } catch (err) {
      console.error("Excel bulk inventory import failed", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Failed to import Excel. Please check the template and data.";
      alert(detail);
    } finally {
      setExcelUploading(false);
    }
  };

  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    await uploadExcelFile(file);
    // allow selecting same file again if needed
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    const payloadItems = [];

    items.forEach((item, index) => {
      const hasCore =
        item.project || item.tower || item.floor || item.unit || item.unit_type;
      if (!hasCore) return;

      const docs = [];
      let docIdx = 0;

      if (item.floor_plan_file) {
        const key = `doc_${index}_${docIdx++}`;
        fd.append(key, item.floor_plan_file);
        docs.push({ doc_type: "FLOOR_PLAN", file_field: key });
      }
      if (item.project_plan_file) {
        const key = `doc_${index}_${docIdx++}`;
        fd.append(key, item.project_plan_file);
        docs.push({ doc_type: "PROJECT_PLAN", file_field: key });
      }
      if (item.other_file) {
        const key = `doc_${index}_${docIdx++}`;
        fd.append(key, item.other_file);
        docs.push({ doc_type: "OTHER", file_field: key });
      }

      payloadItems.push({
        project: item.project ? Number(item.project) : null,
        tower: item.tower ? Number(item.tower) : null,
        floor: item.floor ? Number(item.floor) : null,
        unit: item.unit ? Number(item.unit) : null,
        unit_type: item.unit_type ? Number(item.unit_type) : null,
        configuration: item.configuration ? Number(item.configuration) : null,
        facing: item.facing ? Number(item.facing) : null,
        availability_status: item.unit_status || "AVAILABLE",
        unit_status: item.unit_status || "AVAILABLE",
        carpet_area: item.carpet_area || null,
        build_up_area: item.build_up_area || null,
        saleable_area: item.saleable_area || null,
        rera_area: item.rera_area || null,
        block_minutes: item.block_minutes || null,
        block_days: item.block_days || null,
        agreement_value: item.agreement_value || null,
        development_charges: item.development_charges || null,
        gst_amount: item.gst_amount || null,
        stamp_duty_amount: item.stamp_duty_amount || null,
        registration_charges: item.registration_charges || null,
        legal_fee: item.legal_fee || null,
        total_cost: item.total_cost || null,
        description: item.inventory_description || "",
        documents: docs,
      });
    });

    if (!payloadItems.length) {
      alert("Please fill at least one inventory block");
      return;
    }

    fd.append("items", JSON.stringify(payloadItems));

    try {
      await api.post("client/inventory/bulk-create/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Inventory created successfully");
      setItems([createEmptyItem()]);
      navigate("/sales/inventory");
    } catch (err) {
      console.error("Bulk inventory create failed", err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to create inventory. Please check the data.";
      alert(msg);
    }
  };

  // Render helpers
  const renderSelect = (
    label,
    name,
    item,
    index,
    options,
    placeholder = "Select"
  ) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <select
        className="form-input"
        value={item[name] || ""}
        onChange={(e) => handleItemChange(index, name, e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>
            {opt.label ?? opt.name}
          </option>
        ))}
      </select>
    </div>
  );

  const renderNumber = (label, name, item, index) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type="number"
        value={item[name]}
        onChange={(e) => handleItemChange(index, name, e.target.value)}
      />
    </div>
  );

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

          {/* 🔹 HEADER: Same style as Milestone Plan form */}
          <div className="project-form-container">
            <div className="form-header">
              <h3>Create Inventory</h3>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {/* Optional: sample download link (small, subtle) */}
                {/* <a
                  href="/static/inventory_bulk_template.xlsx"
                  download
                  style={{ fontSize: "0.85rem", textDecoration: "underline" }}
                >
                  Download Sample
                </a> */}

                <button
                  type="button"
                  className="btn-import"
                  onClick={() =>
                    document.getElementById("inventory-excel-input").click()
                  }
                  disabled={excelUploading}
                >
                  <span className="import-icon">📄</span>
                  {excelUploading ? "IMPORTING..." : "IMPORT EXCEL"}
                </button>
              </div>
            </div>

            {/* Hidden file input for Excel */}
            <input
              id="inventory-excel-input"
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleExcelFileChange}
            />

            {excelFile && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                Selected file: <strong>{excelFile.name}</strong>
              </div>
            )}
          </div>

          {/* 🔹 Manual bulk form (unchanged) */}
          <form onSubmit={handleSubmit}>
            {items.map((item, index) => {
              const towers = getTowers(item);
              const floors = getFloors(item);
              const units = getUnits(item);

              return (
                <div className="inventory-block" key={index}>
                  <div className="inventory-block-header">
                    <span>Inventory {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="inventory-block-remove"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Row 1: Project / Tower / Floor */}
                  <div className="form-row">
                    {renderSelect(
                      "Project Name:",
                      "project",
                      item,
                      index,
                      projects.map((p) => ({ value: p.id, label: p.name }))
                    )}

                    {renderSelect(
                      "Tower:",
                      "tower",
                      item,
                      index,
                      towers.map((t) => ({ value: t.id, label: t.name })),
                      "Select tower"
                    )}

                    {renderSelect(
                      "Floor:",
                      "floor",
                      item,
                      index,
                      floors.map((f) => ({ value: f.id, label: f.number })),
                      "Select floor"
                    )}
                  </div>

                  {/* Row 2: Unit / Unit Type / Configuration */}
                  <div className="form-row">
                    {renderSelect(
                      "Unit:",
                      "unit",
                      item,
                      index,
                      units.map((u) => ({
                        value: u.id,
                        label: u.unit_no || `Unit #${u.id}`,
                      })),
                      "Select unit"
                    )}

                    {renderSelect(
                      "Unit Type:",
                      "unit_type",
                      item,
                      index,
                      unitTypes.map((u) => ({ value: u.id, label: u.name }))
                    )}

                    {renderSelect(
                      "Unit Configuration:",
                      "configuration",
                      item,
                      index,
                      unitConfigs.map((u) => ({ value: u.id, label: u.name }))
                    )}
                  </div>

                  {/* Row 3: Facing / Unit Status */}
                  <div className="form-row">
                    {renderSelect(
                      "Facing:",
                      "facing",
                      item,
                      index,
                      facings.map((f) => ({ value: f.id, label: f.name }))
                    )}

                    {renderSelect(
                      "Unit Status:",
                      "unit_status",
                      item,
                      index,
                      unitStatuses.map((u) => ({
                        value: u.code,
                        label: u.label,
                      }))
                    )}

                    <div className="form-field" />
                  </div>

                  {/* Areas */}
                  <div className="form-row">
                    {renderNumber(
                      "Carpet Area (Sq.ft):",
                      "carpet_area",
                      item,
                      index
                    )}
                    {renderNumber(
                      "Build Up Area (Sq.ft):",
                      "build_up_area",
                      item,
                      index
                    )}
                    {renderNumber(
                      "Saleable Area:",
                      "saleable_area",
                      item,
                      index
                    )}
                  </div>

                  {/* RERA + block */}
                  <div className="form-row">
                    {renderNumber("RERA Area:", "rera_area", item, index)}
                    {renderNumber(
                      "Block Period (Minutes):",
                      "block_minutes",
                      item,
                      index
                    )}
                    {renderNumber(
                      "Block Period (Days):",
                      "block_days",
                      item,
                      index
                    )}
                  </div>

                  {/* Money */}
                  <div className="form-row">
                    {renderNumber(
                      "Agreement Value:",
                      "agreement_value",
                      item,
                      index
                    )}
                    {renderNumber(
                      "Development Charges:",
                      "development_charges",
                      item,
                      index
                    )}
                    {renderNumber("GST:", "gst_amount", item, index)}
                  </div>

                  <div className="form-row">
                    {renderNumber(
                      "Stamp Duty Amount:",
                      "stamp_duty_amount",
                      item,
                      index
                    )}
                    {renderNumber(
                      "Registration Charges:",
                      "registration_charges",
                      item,
                      index
                    )}
                    {renderNumber("Legal Fee:", "legal_fee", item, index)}
                  </div>

                  <div className="form-row">
                    {renderNumber("Total Cost:", "total_cost", item, index)}
                    <div className="form-field-full">
                      <label className="form-label">
                        Inventory Description:
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        value={item.inventory_description}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "inventory_description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Upload row */}
                  <div className="form-row inventory-upload-row">
                    <div className="form-field-full">
                      <label className="form-label">Floor Plans:</label>
                      <label className="upload-box">
                        <span className="upload-icon">⬆</span>
                        <span>
                          {item.floor_plan_file ? "Change file" : "Upload"}
                        </span>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            handleFileChange(
                              index,
                              "floor_plan_file",
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-field-full">
                      <label className="form-label">Other:</label>
                      <label className="upload-box">
                        <span className="upload-icon">⬆</span>
                        <span>
                          {item.other_file ? "Change file" : "Upload"}
                        </span>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            handleFileChange(
                              index,
                              "other_file",
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="form-field-full">
                      <label className="form-label">Project Plans:</label>
                      <label className="upload-box">
                        <span className="upload-icon">⬆</span>
                        <span>
                          {item.project_plan_file ? "Change file" : "Upload"}
                        </span>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            handleFileChange(
                              index,
                              "project_plan_file",
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new inventory block button */}
            <div className="inventory-add-row">
              <button
                type="button"
                className="btn-primary btn-small"
                onClick={handleAddItem}
              >
                Add
              </button>
            </div>

            {/* Global Cancel / Submit */}
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
    </div>
  );
};

export default InventoryCreate;
