import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./SiteVisitDetail.css";
import SiteVisitStatusModal from "../SiteVisit/SiteVisitStatusModal";
import { toast } from "react-hot-toast";

const SiteVisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadDetail = async () => {
    try {
      const r = await axiosInstance.get(`sales/site-visits/${id}/`);
      setData(r.data);
    } catch {
      toast.error("Failed to load site visit");
    }
  };

  useEffect(() => {
    loadDetail();
  }, []);

  if (!data) return <div style={{ padding: 24 }}>Loading…</div>;

  const dt = (v) =>
    v
      ? new Date(v).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  return (
    <div className="sv-page">
      {/* Title */}
      <div className="sv-section-header" style={{ marginBottom: 18 }}>
        ➤ Site Visit Details
      </div>

      {/* MAIN CARD */}
      <div className="sv-section">
        <div className="sv-section-body">
          {/* ------------------ ROW 1 ------------------ */}
          <div className="sv-grid">
            <div className="sv-field">
              <label className="sv-label">Lead</label>
              <div className="sv-read">
                {data.lead?.full_name} ({data.lead?.mobile_number})
              </div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Member Name</label>
              <div className="sv-read">{data.member_name || "-"}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Member Mobile</label>
              <div className="sv-read">{data.member_mobile_number || "-"}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Project</label>
              <div className="sv-read">{data.project?.name}</div>
            </div>

            {/* ------------------ UNIT INFO ------------------ */}
            <div className="sv-field">
              <label className="sv-label">Unit Configuration</label>
              <div className="sv-read">{data.unit_config?.name || "-"}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Inventory</label>
              <div className="sv-read">
                {data.inventory
                  ? `${data.inventory.tower_name} / ${data.inventory.floor_number} / ${data.inventory.unit_no}`
                  : "-"}
              </div>
            </div>

            {/* ------------------ DATE & STATUS ------------------ */}
            <div className="sv-field">
              <label className="sv-label">Scheduled At</label>
              <div className="sv-read">{dt(data.scheduled_at)}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Status</label>
              <div className="sv-read">{data.status}</div>
            </div>

            {/* ------------------ COMPLETED / CANCELLED ------------------ */}
            <div className="sv-field">
              <label className="sv-label">Completed At</label>
              <div className="sv-read">{dt(data.completed_at)}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Cancelled At</label>
              <div className="sv-read">{dt(data.cancelled_at)}</div>
            </div>

            {/* ------------------ CANCEL REASON ------------------ */}
            {data.cancelled_reason && (
              <div className="sv-field-full">
                <label className="sv-label">Cancellation Reason</label>
                <div className="sv-read">{data.cancelled_reason}</div>
              </div>
            )}

            {/* ------------------ CREATED BY ------------------ */}
            <div className="sv-field">
              <label className="sv-label">Created By</label>
              <div className="sv-read">{data.created_by_name || "-"}</div>
            </div>
          </div>{" "}
          {/* end sv-grid */}
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="sv-footer">
        <button className="sv-btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>

        <button className="sv-btn-primary" onClick={() => setShowModal(true)}>
          Update Status
        </button>
      </div>

      {showModal && (
        <SiteVisitStatusModal
          id={id}
          currentStatus={data.status}
          onClose={() => setShowModal(false)}
          onUpdated={loadDetail}
        />
      )}
    </div>
  );
};

export default SiteVisitDetail;
