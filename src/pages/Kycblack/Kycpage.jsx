import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import PaymentReceiptModal from "../../components/Payments/PaymentLeadCreateModalKYC";

// --- Type Definitions (Converted to comments for pure JSX) ---
/*
interface Snapshot {
  unit_no: string;
  tower_name: string;
  carpet_sqft: string;
  floor_number: string;
  project_name: string;
  saleable_sqft: string;
  agreement_value_suggested: string;
}

interface KYCRecord {
  id: number;
  status: string;
  amount: string;
  snapshot: Snapshot;
  project_name: string;
  unit_no: string;
  created_at: string;
  decided_at: string | null;
  decided_by_name: string | null;
  decision_remarks: string;
  paid_amount: string;
  is_fully_paid: string;
  booking_id?: number | null;
}
*/
// -----------------------------------------------------------

export default function KYCTeamRequests() {
  const [kycList, setKycList] = useState([]); // Removed : KYCRecord[]
  const [loading, setLoading] = useState(false);

  // Payment Modal
  const [selectedRecordForPayment, setSelectedRecordForPayment] =
    useState(null); // Removed : KYCRecord | null
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Removed : Promise<void>
  async function getData() {
    try {
      setLoading(true);
      const res = await api.get("/book/kyc-requests/kyc-team/");
      setKycList(res.data); // Removed type assertion 'as KYCRecord[]'
    } catch (err) {
      console.error(err);
      // alert("Error while fetching KYC data"); // Removed alert to keep function clean
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  // open payment modal
  function handleAddPaymentClick(
    item, // Removed : KYCRecord
    e // Removed : React.MouseEvent<HTMLButtonElement>
  ) {
    e.stopPropagation();
    setSelectedRecordForPayment(item);
    setShowPaymentModal(true);
  }

  // close payment modal
  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedRecordForPayment(null);
  }

  /**
   * 🔥 FORM SUBMIT HAPPENS HERE
   * formData comes from PaymentReceiptModal
   */
  async function handlePaymentSubmit(formDataObj) { // Removed : any
    try {
      if (!selectedRecordForPayment) return;

      const bookingId =
        selectedRecordForPayment.booking_id ??
        selectedRecordForPayment.id;

      // Convert to FormData for image support
      const fd = new FormData();
      // Changed Object.entries(formDataObj) to a safer iteration for JSX
      for (const key in formDataObj) {
        if (formDataObj.hasOwnProperty(key)) {
            const value = formDataObj[key];
            if (value !== "" && value !== null && value !== undefined) {
              fd.append(key, value); // Removed 'as any'
            }
        }
      }

      await api.post(
        `/book/bookings/${bookingId}/kyc-payment/`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Payment saved successfully");

      closePaymentModal();
      getData();
    } catch (err) {
      console.error(err);
      alert("Failed to save payment");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "8px" }}>KYC Requests</h2>

      {loading && <p>Loading...</p>}

      {!loading && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={th}>ID</th>
              <th style={th}>Unit</th>
              <th style={th}>Project</th>
              <th style={th}>Amount</th>
              <th style={th}>Paid</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {kycList.map((item) => (
              <tr key={item.id} style={{ cursor: "default" }}>
                <td style={td}>{item.id}</td>
                <td style={td}>{item.unit_no}</td>
                <td style={td}>{item.project_name}</td>
                <td style={td}>{item.amount}</td>
                <td style={td}>{item.paid_amount}</td>
                <td style={td}>{item.status}</td>

                <td style={td}>
                  <button
                    onClick={(e) => handleAddPaymentClick(item, e)}
                    style={btn}
                  >
                    Add Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRecordForPayment && (
        <PaymentReceiptModal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          leadId={
            selectedRecordForPayment.booking_id ??
            selectedRecordForPayment.id
          }
          /**
           * 📌 VERY IMPORTANT
           * formData comes here
           */
          onCreated={handlePaymentSubmit}
        />
      )}
    </div>
  );
}

// Inline styles
const th = {
  padding: "8px",
  border: "1px solid #ddd",
};

const td = {
  padding: "8px",
  border: "1px solid #ddd",
};

const btn = {
  padding: "4px 12px",
  borderRadius: "4px",
  backgroundColor: "#19376d",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: "12px",
};