// // src/components/Payments/PaymentLeadCreateModalKYC.jsx
// import React, { useEffect, useState, useMemo } from "react";
// import { createPaymentLead, createKycPayment } from "../../api/paymentLead";
// import { showToast } from "../../utils/toast";
// import "./PaymentLeadCreateModal.css";

// const PAYMENT_TYPES = [
//   { value: "EOI", label: "EOI" },
//   { value: "BOOKING", label: "Booking" },
// ];

// const PAYMENT_METHODS = [
//   { value: "ONLINE", label: "Online" },
//   { value: "POS", label: "POS" },
//   { value: "DRAFT_CHEQUE", label: "Draft / Cheque" },
//   { value: "NEFT_RTGS", label: "NEFT / RTGS" },
// ];

// const ONLINE_POS_MODES = [
//   { value: "UPI", label: "UPI" },
//   { value: "CREDIT_CARD", label: "Credit Card" },
//   { value: "DEBIT_CARD", label: "Debit Card" },
//   { value: "NET_BANKING", label: "Net Banking" },
//   { value: "WALLET", label: "Wallet" },
// ];

// function formatINR(value) {
//   if (!value) return "";
//   let cleaned = value.toString().replace(/[^0-9.]/g, "");
//   const parts = cleaned.split(".");
//   if (parts.length > 2) {
//     cleaned = parts[0] + "." + parts.slice(1).join("");
//   }
//   const [intPart, decimalPart] = cleaned.split(".");
//   const intDigits = intPart.replace(/\D/g, "");
//   if (!intDigits) return "";
//   const lastThree = intDigits.slice(-3);
//   let rest = intDigits.slice(0, -3);
//   if (rest !== "") {
//     rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
//   }
//   let result = rest ? `${rest},${lastThree}` : lastThree;
//   if (decimalPart !== undefined && decimalPart !== "") {
//     const dec = decimalPart.replace(/\D/g, "").slice(0, 2);
//     if (dec) result += `.${dec}`;
//   }
//   return result;
// }

// export default function PaymentLeadCreateModal({
//   isOpen,
//   onClose,

//   // normal pre-sales payment ke liye
//   leadId,

//   // KYC payment ke liye
//   isKycPayment = false,
//   bookingId,
//   kycRequestId,

//   defaultPaymentType = "EOI",
//   onCreated,
// }) {
//   const [submitting, setSubmitting] = useState(false);

//   const [form, setForm] = useState({
//     payment_type: defaultPaymentType,
//     payment_method: "",
//     amount: "",
//     payment_mode: "",
//     transaction_no: "",
//     cheque_number: "",
//     cheque_date: "",
//     bank_name: "",
//     ifsc_code: "",
//     branch_name: "",
//     neft_rtgs_ref_no: "",
//     notes: "",
//   });

//   const [posSlipFile, setPosSlipFile] = useState(null);
//   const [chequeFile, setChequeFile] = useState(null);

//   useEffect(() => {
//     if (isOpen) {
//       console.log("[MODAL OPEN] props:", {
//         isKycPayment,
//         leadId,
//         bookingId,
//         kycRequestId,
//       });
//       setForm({
//         payment_type: defaultPaymentType,
//         payment_method: "",
//         amount: "",
//         payment_mode: "",
//         transaction_no: "",
//         cheque_number: "",
//         cheque_date: "",
//         bank_name: "",
//         ifsc_code: "",
//         branch_name: "",
//         neft_rtgs_ref_no: "",
//         notes: "",
//       });
//       setPosSlipFile(null);
//       setChequeFile(null);
//     }
//   }, [
//     isOpen,
//     defaultPaymentType,
//     isKycPayment,
//     leadId,
//     bookingId,
//     kycRequestId,
//   ]);

//   const currentMethod = useMemo(
//     () => form.payment_method,
//     [form.payment_method]
//   );

//   if (!isOpen) return null;

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleAmountChange = (e) => {
//     const raw = e.target.value || "";
//     const withoutCommas = raw.replace(/,/g, "");
//     const formatted = formatINR(withoutCommas);
//     setForm((prev) => ({
//       ...prev,
//       amount: formatted,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     console.log("[SUBMIT] isKycPayment:", isKycPayment, {
//       leadId,
//       bookingId,
//       kycRequestId,
//       form,
//     });

//     // 🔹 Context validation
//     if (isKycPayment) {
//       if (!bookingId) {
//         showToast(
//           "error",
//           "Booking is required for KYC payment (bookingId missing)."
//         );
//         return;
//       }
//       if (!kycRequestId) {
//         showToast(
//           "error",
//           "KYC request is required for this payment (kycRequestId missing)."
//         );
//         return;
//       }
//     } else {
//       if (!leadId) {
//         showToast("error", "Lead is required for payment.");
//         return;
//       }
//     }

//     if (!form.payment_type) {
//       showToast("error", "Please select Payment Type.");
//       return;
//     }

//     if (!form.payment_method) {
//       showToast("error", "Please select Payment Method.");
//       return;
//     }

//     const numericAmountStr = (form.amount || "").toString().replace(/,/g, "");
//     if (!numericAmountStr) {
//       showToast("error", "Amount is required.");
//       return;
//     }
//     if (isNaN(Number(numericAmountStr))) {
//       showToast("error", "Invalid amount.");
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const payload = {
//         payment_type: form.payment_type,
//         payment_method: form.payment_method,
//         amount: numericAmountStr,
//         notes: form.notes,
//       };

//       if (!isKycPayment) {
//         payload.lead = leadId;
//       }

//       if (currentMethod === "ONLINE" || currentMethod === "POS") {
//         payload.payment_mode = form.payment_mode || "";
//         payload.transaction_no = form.transaction_no || "";
//       }

//       if (currentMethod === "POS" && posSlipFile) {
//         payload.pos_slip_image = posSlipFile;
//       }

//       if (currentMethod === "DRAFT_CHEQUE") {
//         payload.cheque_number = form.cheque_number || "";
//         payload.cheque_date = form.cheque_date || "";
//         payload.bank_name = form.bank_name || "";
//         payload.ifsc_code = form.ifsc_code || "";
//         payload.branch_name = form.branch_name || "";
//         if (chequeFile) {
//           payload.cheque_image = chequeFile;
//         }
//       }

//       if (currentMethod === "NEFT_RTGS") {
//         payload.neft_rtgs_ref_no = form.neft_rtgs_ref_no || "";
//       }

//       console.log("[SUBMIT PAYLOAD]", { isKycPayment, payload });

//       let created;
//       if (isKycPayment) {
//         created = await createKycPayment(bookingId, kycRequestId, payload);
//       } else {
//         created = await createPaymentLead(payload);
//       }

//       console.log("[SUBMIT SUCCESS] created payment:", created);

//       showToast("success", "Payment created successfully.");
//       if (onCreated) onCreated(created);
//       onClose();
//     } catch (error) {
//       console.error("Failed to create payment:", error);
//       console.error("Error response data:", error?.response?.data);

//       let message = "Failed to create payment.";

//       const data = error?.response?.data;
//       if (!error.response) {
//         // JS / network level error
//         message = `Network/JS error: ${error.message}`;
//       } else if (data) {
//         if (typeof data === "string") {
//           message = data;
//         } else if (data.detail) {
//           message = data.detail;
//         } else {
//           const parts = [];
//           Object.entries(data).forEach(([field, errors]) => {
//             if (Array.isArray(errors)) {
//               parts.push(`${field}: ${errors.join(", ")}`);
//             } else {
//               parts.push(`${field}: ${errors}`);
//             }
//           });
//           if (parts.length) {
//             message = parts.join(" | ");
//           }
//         }
//       }

//       showToast("error", message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const renderMethodFields = () => {
//     if (!currentMethod) return null;

//     if (currentMethod === "ONLINE") {
//       return (
//         <>
//           <div className="form-group">
//             <label>Payment Mode</label>
//             <select
//               name="payment_mode"
//               value={form.payment_mode}
//               onChange={handleChange}
//             >
//               <option value="">Select</option>
//               {ONLINE_POS_MODES.map((m) => (
//                 <option key={m.value} value={m.value}>
//                   {m.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>
//               Transaction No. <span className="required">*</span>
//             </label>
//             <input
//               type="text"
//               name="transaction_no"
//               value={form.transaction_no}
//               onChange={handleChange}
//             />
//           </div>
//         </>
//       );
//     }

//     if (currentMethod === "POS") {
//       return (
//         <>
//           <div className="form-group">
//             <label>Payment Mode</label>
//             <select
//               name="payment_mode"
//               value={form.payment_mode}
//               onChange={handleChange}
//             >
//               <option value="">Select</option>
//               {ONLINE_POS_MODES.map((m) => (
//                 <option key={m.value} value={m.value}>
//                   {m.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>
//               Transaction No. <span className="required">*</span>
//             </label>
//             <input
//               type="text"
//               name="transaction_no"
//               value={form.transaction_no}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-group">
//             <label>Image Upload</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) => {
//                 const file = e.target.files?.[0] || null;
//                 setPosSlipFile(file);
//               }}
//             />
//           </div>
//         </>
//       );
//     }

//     if (currentMethod === "DRAFT_CHEQUE") {
//       return (
//         <>
//           <div className="form-group">
//             <label>
//               Cheque Number <span className="required">*</span>
//             </label>
//             <input
//               type="text"
//               name="cheque_number"
//               value={form.cheque_number}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-group">
//             <label>
//               Cheque Date <span className="required">*</span>
//             </label>
//             <input
//               type="date"
//               name="cheque_date"
//               value={form.cheque_date}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-group">
//             <label>
//               Bank Name <span className="required">*</span>
//             </label>
//             <input
//               type="text"
//               name="bank_name"
//               value={form.bank_name}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-group">
//             <label>
//               IFSC Code <span className="required">*</span>
//             </label>
//             <input
//               type="text"
//               name="ifsc_code"
//               value={form.ifsc_code}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-group">
//             <label>
//               Branch Name <span className="required">*</span>
//             </label>
//             <input
//               type="text"
//               name="branch_name"
//               value={form.branch_name}
//               onChange={handleChange}
//             />
//           </div>

//           <div className="form-group">
//             <label>Cheque Image</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) => {
//                 const file = e.target.files?.[0] || null;
//                 setChequeFile(file);
//               }}
//             />
//           </div>
//         </>
//       );
//     }

//     if (currentMethod === "NEFT_RTGS") {
//       return (
//         <div className="form-group">
//           <label>
//             NEFT / RTGS Ref.No <span className="required">*</span>
//           </label>
//           <input
//             type="text"
//             name="neft_rtgs_ref_no"
//             value={form.neft_rtgs_ref_no}
//             onChange={handleChange}
//           />
//         </div>
//       );
//     }

//     return null;
//   };

//   return (
//     <div className="payment-modal-overlay">
//       <div className="payment-modal">
//         <div className="payment-modal-header">
//           <h3>{isKycPayment ? "Add KYC Payment" : "Add Payment (Pre-Sale)"}</h3>

//           <button
//             type="button"
//             className="close-btn"
//             onClick={onClose}
//             disabled={submitting}
//           >
//             ✕
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="payment-modal-body">
//           {/* Payment Type */}
//           <div className="form-group">
//             <label>
//               Payment Type <span className="required">*</span>
//             </label>
//             <div className="pill-group">
//               {PAYMENT_TYPES.map((pt) => {
//                 const active = form.payment_type === pt.value;
//                 return (
//                   <button
//                     key={pt.value}
//                     type="button"
//                     className={
//                       "pill-option-btn" +
//                       (active ? " pill-option-btn-active" : "")
//                     }
//                     onClick={() =>
//                       setForm((prev) => ({
//                         ...prev,
//                         payment_type: pt.value,
//                       }))
//                     }
//                   >
//                     {pt.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Payment Method */}
//           <div className="form-group">
//             <label>
//               Payment Method <span className="required">*</span>
//             </label>
//             <div className="pill-group pill-group-wrap">
//               {PAYMENT_METHODS.map((pm) => {
//                 const active = form.payment_method === pm.value;
//                 return (
//                   <button
//                     key={pm.value}
//                     type="button"
//                     className={
//                       "pill-option-btn" +
//                       (active ? " pill-option-btn-active" : "")
//                     }
//                     onClick={() =>
//                       setForm((prev) => ({
//                         ...prev,
//                         payment_method: pm.value,
//                       }))
//                     }
//                   >
//                     {pm.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Amount */}
//           <div className="form-group">
//             <label>
//               Amount <span className="required">*</span>
//             </label>
//             <div className="amount-input-wrapper">
//               <span className="amount-prefix">₹</span>
//               <input
//                 type="text"
//                 name="amount"
//                 value={form.amount}
//                 onChange={handleAmountChange}
//                 placeholder="0"
//               />
//             </div>
//           </div>

//           {/* Method-specific fields */}
//           {renderMethodFields()}

//           {/* Notes */}
//           <div className="form-group">
//             <label>Notes</label>
//             <textarea
//               name="notes"
//               value={form.notes}
//               onChange={handleChange}
//               rows={3}
//             />
//           </div>

//           <div className="payment-modal-footer">
//             <button
//               type="button"
//               className="btn-secondary"
//               onClick={onClose}
//               disabled={submitting}
//             >
//               Cancel
//             </button>
//             <button type="submit" className="btn-primary" disabled={submitting}>
//               {submitting ? "Saving..." : "Save Payment"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// src/components/Payments/PaymentLeadCreateModalKYC.jsx
import React, { useEffect, useState, useMemo } from "react";
import { createPaymentLead, createKycPayment } from "../../api/paymentLead";
import { showToast } from "../../utils/toast";
import "./PaymentLeadCreateModal.css";

const PAYMENT_TYPES = [
  { value: "EOI", label: "EOI" },
  { value: "BOOKING", label: "Booking" },
];

const PAYMENT_METHODS = [
  { value: "ONLINE", label: "Online" },
  { value: "POS", label: "POS" },
  { value: "DRAFT_CHEQUE", label: "Draft / Cheque" },
  { value: "NEFT_RTGS", label: "NEFT / RTGS" },
];

const ONLINE_POS_MODES = [
  { value: "UPI", label: "UPI" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "WALLET", label: "Wallet" },
];

function formatINR(value) {
  if (value === null || value === undefined || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function rawFormatINR(value) {
  if (!value) return "";
  let cleaned = value.toString().replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  const [intPart, decimalPart] = cleaned.split(".");
  const intDigits = intPart.replace(/\D/g, "");
  if (!intDigits) return "";
  const lastThree = intDigits.slice(-3);
  let rest = intDigits.slice(0, -3);
  if (rest !== "") {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  }
  let result = rest ? `${rest},${lastThree}` : lastThree;
  if (decimalPart !== undefined && decimalPart !== "") {
    const dec = decimalPart.replace(/\D/g, "").slice(0, 2);
    if (dec) result += `.${dec}`;
  }
  return result;
}

export default function PaymentLeadCreateModal({
  isOpen,
  onClose,

  // normal pre-sales payment
  leadId,

  // KYC payment
  isKycPayment = false,
  bookingId,
  kycRequestId,
  maxAmount,              // 🔴 pending amount (limit for KYC)

  defaultPaymentType = "EOI",
  onCreated,
}) {
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    payment_type: defaultPaymentType,
    payment_method: "",
    amount: "",
    payment_mode: "",
    transaction_no: "",
    cheque_number: "",
    cheque_date: "",
    bank_name: "",
    ifsc_code: "",
    branch_name: "",
    neft_rtgs_ref_no: "",
    notes: "",
  });

  const [posSlipFile, setPosSlipFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        payment_type: defaultPaymentType,
        payment_method: "",
        amount: "",
        payment_mode: "",
        transaction_no: "",
        cheque_number: "",
        cheque_date: "",
        bank_name: "",
        ifsc_code: "",
        branch_name: "",
        neft_rtgs_ref_no: "",
        notes: "",
      });
      setPosSlipFile(null);
      setChequeFile(null);
    }
  }, [isOpen, defaultPaymentType]);

  const currentMethod = useMemo(
    () => form.payment_method,
    [form.payment_method]
  );

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value || "";
    const withoutCommas = raw.replace(/,/g, "");
    const formatted = rawFormatINR(withoutCommas);
    setForm((prev) => ({
      ...prev,
      amount: formatted,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("[SUBMIT] isKycPayment:", isKycPayment, {
      leadId,
      bookingId,
      kycRequestId,
      maxAmount,
      form,
    });

    if (isKycPayment) {
      if (!bookingId) {
        showToast("error", "Booking is required for KYC payment.");
        return;
      }
      if (!kycRequestId) {
        showToast("error", "KYC request is required for this payment.");
        return;
      }
    } else {
      if (!leadId) {
        showToast("error", "Lead is required for payment.");
        return;
      }
    }

    if (!form.payment_type) {
      showToast("error", "Please select Payment Type.");
      return;
    }

    if (!form.payment_method) {
      showToast("error", "Please select Payment Method.");
      return;
    }

    const numericAmountStr = (form.amount || "").toString().replace(/,/g, "");
    if (!numericAmountStr) {
      showToast("error", "Amount is required.");
      return;
    }

    const numericAmount = Number(numericAmountStr);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      showToast("error", "Invalid amount.");
      return;
    }

    // 🔴 KYC: amount cannot be more than pending
    const safeMax = maxAmount !== undefined && maxAmount !== null
      ? Number(maxAmount)
      : null;

    if (
      isKycPayment &&
      safeMax !== null &&
      !Number.isNaN(safeMax) &&
      numericAmount > safeMax
    ) {
      showToast(
        "error",
        `Amount cannot be more than pending amount (₹ ${formatINR(safeMax)}).`
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        payment_type: form.payment_type,
        payment_method: form.payment_method,
        amount: numericAmountStr,
        notes: form.notes,
      };

      if (!isKycPayment) {
        payload.lead = leadId;
      }

      if (currentMethod === "ONLINE" || currentMethod === "POS") {
        payload.payment_mode = form.payment_mode || "";
        payload.transaction_no = form.transaction_no || "";
      }

      if (currentMethod === "POS" && posSlipFile) {
        payload.pos_slip_image = posSlipFile;
      }

      if (currentMethod === "DRAFT_CHEQUE") {
        payload.cheque_number = form.cheque_number || "";
        payload.cheque_date = form.cheque_date || "";
        payload.bank_name = form.bank_name || "";
        payload.ifsc_code = form.ifsc_code || "";
        payload.branch_name = form.branch_name || "";
        if (chequeFile) {
          payload.cheque_image = chequeFile;
        }
      }

      if (currentMethod === "NEFT_RTGS") {
        payload.neft_rtgs_ref_no = form.neft_rtgs_ref_no || "";
      }

      let created;
      if (isKycPayment) {
        created = await createKycPayment(bookingId, kycRequestId, payload);
      } else {
        created = await createPaymentLead(payload);
      }

      showToast("success", "Payment created successfully.");
      if (onCreated) onCreated(created);
      onClose();
    } catch (error) {
      console.error("❌ Failed to create payment:", error);
      if (error?.response) {
        console.error("❌ Error response status:", error.response.status);
        console.error("❌ Error response data:", error.response.data);
      }

      let message = "Failed to create payment.";
      const data = error?.response?.data;

      if (data) {
        if (typeof data === "string") {
          message = data;
        } else if (data.detail) {
          message = data.detail;
        } else {
          const parts = [];
          Object.entries(data).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              parts.push(`${field}: ${errors.join(", ")}`);
            } else {
              parts.push(`${field}: ${errors}`);
            }
          });
          if (parts.length) {
            message = parts.join(" | ");
          }
        }
      }

      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderMethodFields = () => {
    if (!currentMethod) return null;

    if (currentMethod === "ONLINE") {
      return (
        <>
          <div className="form-group">
            <label>Payment Mode</label>
            <select
              name="payment_mode"
              value={form.payment_mode}
              onChange={handleChange}
            >
              <option value="">Select</option>
              {ONLINE_POS_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Transaction No. <span className="required">*</span>
            </label>
            <input
              type="text"
              name="transaction_no"
              value={form.transaction_no}
              onChange={handleChange}
            />
          </div>
        </>
      );
    }

    if (currentMethod === "POS") {
      return (
        <>
          <div className="form-group">
            <label>Payment Mode</label>
            <select
              name="payment_mode"
              value={form.payment_mode}
              onChange={handleChange}
            >
              <option value="">Select</option>
              {ONLINE_POS_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Transaction No. <span className="required">*</span>
            </label>
            <input
              type="text"
              name="transaction_no"
              value={form.transaction_no}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Image Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPosSlipFile(file);
              }}
            />
          </div>
        </>
      );
    }

    if (currentMethod === "DRAFT_CHEQUE") {
      return (
        <>
          <div className="form-group">
            <label>
              Cheque Number <span className="required">*</span>
            </label>
            <input
              type="text"
              name="cheque_number"
              value={form.cheque_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Cheque Date <span className="required">*</span>
            </label>
            <input
              type="date"
              name="cheque_date"
              value={form.cheque_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Bank Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              IFSC Code <span className="required">*</span>
            </label>
            <input
              type="text"
              name="ifsc_code"
              value={form.ifsc_code}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Branch Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="branch_name"
              value={form.branch_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Cheque Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setChequeFile(file);
              }}
            />
          </div>
        </>
      );
    }

    if (currentMethod === "NEFT_RTGS") {
      return (
        <div className="form-group">
          <label>
            NEFT / RTGS Ref.No <span className="required">*</span>
          </label>
          <input
            type="text"
            name="neft_rtgs_ref_no"
            value={form.neft_rtgs_ref_no}
            onChange={handleChange}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <div>
            <h3>
              {isKycPayment ? "Add KYC Payment" : "Add Payment (Pre-Sale)"}
            </h3>
            {isKycPayment && maxAmount !== undefined && maxAmount !== null && (
              <div className="payment-modal-sub">
                Pending Amount:&nbsp;
                <strong>₹ {formatINR(maxAmount)}</strong>
              </div>
            )}
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="payment-modal-body">
          {/* Payment Type */}
          <div className="form-group">
            <label>
              Payment Type <span className="required">*</span>
            </label>
            <div className="pill-group">
              {PAYMENT_TYPES.map((pt) => {
                const active = form.payment_type === pt.value;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    className={
                      "pill-option-btn" +
                      (active ? " pill-option-btn-active" : "")
                    }
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        payment_type: pt.value,
                      }))
                    }
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label>
              Payment Method <span className="required">*</span>
            </label>
            <div className="pill-group pill-group-wrap">
              {PAYMENT_METHODS.map((pm) => {
                const active = form.payment_method === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    className={
                      "pill-option-btn" +
                      (active ? " pill-option-btn-active" : "")
                    }
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        payment_method: pm.value,
                      }))
                    }
                  >
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>
              Amount <span className="required">*</span>
            </label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">₹</span>
              <input
                type="text"
                name="amount"
                value={form.amount}
                onChange={handleAmountChange}
                placeholder="0"
              />
            </div>
          </div>

          {/* Method-specific fields */}
          {renderMethodFields()}

          {/* Notes */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="payment-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
