// src/pages/Booking/KycReview.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingForm.css"; // same styling reuse

const KycReview = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Fetch KYC via magic token ----
  useEffect(() => {
    if (!token) {
      setError("Token missing in URL.");
      setLoading(false);
      return;
    }

    const fetchKyc = async () => {
      try {
        const res = await axiosInstance.get(
          `/book/kyc-requests/one-time/${token}/`
        );
        setKyc(res.data);
      } catch (e) {
        console.error("KYC load error:", e);
        setError(
          e?.response?.data?.detail ||
            "Failed to load KYC request. Link may have expired or already been used."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchKyc();
  }, [token]);

  const handleDecision = async (decision) => {
    if (!kyc || !token) return;

    const confirmText =
      decision === "APPROVED"
        ? "Approve this KYC and allow booking on this amount?"
        : "Reject this KYC?";

    if (!window.confirm(confirmText)) return;

    setDecisionLoading(true);
    try {
      const res = await axiosInstance.post(
        `/book/kyc-requests/${kyc.id}/decision/`,
        {
          decision,
          token,
        }
      );
      setKyc(res.data);
      alert(`KYC ${decision} successfully.`);

      // Optional: redirect to some thank-you or close tab
      // window.location.href = "https://your-company-site.com";
    } catch (e) {
      console.error("KYC decision error:", e);
      alert(
        e?.response?.data?.detail ||
          "Failed to take decision. Maybe link already used?"
      );
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="booking-form-page">
          <div className="bf-card">
            <h2 className="bf-section-title">Booking KYC Review</h2>

            {loading && <p>Loading KYC details...</p>}

            {!loading && error && (
              <p className="bf-error" style={{ whiteSpace: "pre-wrap" }}>
                {error}
              </p>
            )}

            {!loading && !error && kyc && (
              <>
                <div className="bf-subcard">
                  <div className="bf-row">
                    <div className="bf-col">
                      <label className="bf-label">Project</label>
                      <div className="bf-value">{kyc.project_name}</div>
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">Unit</label>
                      <div className="bf-value">{kyc.unit_no}</div>
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">Proposed Amount</label>
                      <div className="bf-value">₹ {kyc.amount}</div>
                    </div>
                  </div>

                  <div className="bf-row">
                    <div className="bf-col">
                      <label className="bf-label">Status</label>
                      <div className="bf-value">{kyc.status}</div>
                    </div>
                    <div className="bf-col">
                      <label className="bf-label">Created At</label>
                      <div className="bf-value">
                        {kyc.created_at
                          ? new Date(kyc.created_at).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                    {kyc.decided_at && (
                      <div className="bf-col">
                        <label className="bf-label">Decided At</label>
                        <div className="bf-value">
                          {new Date(kyc.decided_at).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {kyc.decided_by_name && (
                    <div className="bf-row">
                      <div className="bf-col">
                        <label className="bf-label">Decided By</label>
                        <div className="bf-value">{kyc.decided_by_name}</div>
                      </div>
                    </div>
                  )}

                  {kyc.snapshot && (
                    <>
                      <hr />
                      <h3 className="bf-section-title">Flat Snapshot</h3>
                      <div className="bf-row">
                        <div className="bf-col">
                          <label className="bf-label">Tower</label>
                          <div className="bf-value">
                            {kyc.snapshot.tower_name || "-"}
                          </div>
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">Floor</label>
                          <div className="bf-value">
                            {kyc.snapshot.floor_number || "-"}
                          </div>
                        </div>
                        <div className="bf-col">
                          <label className="bf-label">Carpet Sqft</label>
                          <div className="bf-value">
                            {kyc.snapshot.carpet_sqft || "-"}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {kyc.status === "PENDING" ? (
                  <div className="bf-actions">
                    <button
                      type="button"
                      className="bf-btn-secondary"
                      disabled={decisionLoading}
                      onClick={() => handleDecision("REJECTED")}
                    >
                      {decisionLoading ? "Please wait..." : "Reject"}
                    </button>
                    <button
                      type="button"
                      className="bf-btn-primary"
                      disabled={decisionLoading}
                      onClick={() => handleDecision("APPROVED")}
                    >
                      {decisionLoading ? "Please wait..." : "Approve"}
                    </button>
                  </div>
                ) : (
                  <p style={{ marginTop: 16 }}>
                    This KYC is already <strong>{kyc.status}</strong>
                    {kyc.decided_by_name && (
                      <>
                        {" "}
                        by <strong>{kyc.decided_by_name}</strong>
                      </>
                    )}
                    .
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycReview;
