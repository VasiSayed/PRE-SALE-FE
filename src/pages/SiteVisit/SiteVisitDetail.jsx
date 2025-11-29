// src/pages/SiteVisitDetail/SiteVisitDetail.jsx  (path adjust as per your project)

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./SiteVisitDetail.css";
import SiteVisitStatusModal from "../SiteVisit/SiteVisitStatusModal";
import SiteVisitRescheduleModal from "../SiteVisit/SiteVisitRescheduleModal";
import { toast } from "react-hot-toast";
import { toTitleCase } from "../../utils/text";

const SiteVisitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // helper: date-time format
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

  // helper: title case + fallback
  const tc = (value, fallback = "-") => {
    const s = toTitleCase(value);
    return s && s.trim().length ? s : fallback;
  };

  const loadAll = async () => {
    try {
      const [detailRes, histRes] = await Promise.all([
        axiosInstance.get(`/sales/site-visits/${id}/`),
        axiosInstance.get(`/sales/site-visits/${id}/reschedule-history/`),
      ]);

      setData(detailRes.data);

      // API → { visit_id, count, history: [...] }
      const histData = histRes.data;
      let histArray = [];

      if (Array.isArray(histData?.history)) {
        histArray = histData.history;
      } else if (Array.isArray(histData)) {
        histArray = histData;
      }

      setHistory(histArray);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load site visit");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return <div style={{ padding: 24 }}>Loading…</div>;

  const historyList = Array.isArray(history) ? history : [];

  return (
    <div className="sv-page">
      {/* Title */}
      <div className="sv-section-header" style={{ marginBottom: 18 }}>
        ➤ Site Visit Details
      </div>

      {/* MAIN CARD */}
      <div className="sv-section">
        <div className="sv-section-body">
          <div className="sv-grid">
            {/* LEAD INFO */}
            <div className="sv-field">
              <label className="sv-label">Lead</label>
              <div className="sv-read">
                {tc(data.lead?.full_name, "NA")} (
                {data.lead?.mobile_number || "-"})
              </div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Project</label>
              <div className="sv-read">{tc(data.project?.name, "NA")}</div>
            </div>

            {/* MEMBER */}
            <div className="sv-field">
              <label className="sv-label">Member Name</label>
              <div className="sv-read">{tc(data.member_name, "-")}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Member Mobile</label>
              <div className="sv-read">{data.member_mobile_number || "-"}</div>
            </div>

            {/* UNIT INFO */}
            <div className="sv-field">
              <label className="sv-label">Unit Configuration</label>
              <div className="sv-read">
                {data.unit_config
                  ? data.unit_config.code
                    ? `${tc(data.unit_config.name)} (${data.unit_config.code})`
                    : tc(data.unit_config.name)
                  : "NA"}
              </div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Inventory</label>
              <div className="sv-read">
                {data.inventory
                  ? `${tc(data.inventory.tower_name)} / ${
                      data.inventory.floor_number
                    } / ${data.inventory.unit_no}`
                  : "NA"}
              </div>
            </div>

            {/* DATES + STATUS */}
            <div className="sv-field">
              <label className="sv-label">Scheduled At</label>
              <div className="sv-read">{dt(data.scheduled_at)}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Status</label>
              <div className="sv-read">{tc(data.status, "-")}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Completed At</label>
              <div className="sv-read">{dt(data.completed_at)}</div>
            </div>

            <div className="sv-field">
              <label className="sv-label">Cancelled At</label>
              <div className="sv-read">{dt(data.cancelled_at)}</div>
            </div>

            {/* RESCHEDULE COUNT */}
            <div className="sv-field">
              <label className="sv-label">Reschedules</label>
              <div className="sv-read">{data.reschedule_count || 0}</div>
            </div>

            {/* CANCEL REASON */}
            {data.cancelled_reason && (
              <div className="sv-field-full">
                <label className="sv-label">Cancellation Reason</label>
                <div className="sv-read">{tc(data.cancelled_reason, "-")}</div>
              </div>
            )}

            {/* CREATED BY */}
            <div className="sv-field">
              <label className="sv-label">Created By</label>
              <div className="sv-read">{tc(data.created_by_name, "-")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* RESCHEDULE HISTORY SECTION (TABLE STYLE) */}
      <div className="sv-section">
        <div className="sv-section-header">Reschedule History</div>
        <div className="sv-section-body">
          {historyLoading ? (
            <div style={{ color: "#6b7280" }}>Loading history…</div>
          ) : historyList.length === 0 ? (
            <div style={{ color: "#6b7280" }}>
              No reschedules for this visit.
            </div>
          ) : (
            <table className="sv-history-table">
              <thead>
                <tr>
                  <th>Old Date &amp; Time</th>
                  <th>New Date &amp; Time</th>
                  <th>Reason</th>
                  <th>Changed By</th>
                  <th>Logged At</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((row) => (
                  <tr key={row.id}>
                    <td>{dt(row.old_scheduled_at)}</td>
                    <td>{dt(row.new_scheduled_at)}</td>
                    <td>{tc(row.reason, "-")}</td>
                    <td>{tc(row.created_by_name, "-")}</td>
                    <td>{dt(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="sv-footer">
        <button className="sv-btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>

        <button
          className="sv-btn-neutral"
          onClick={() => setShowRescheduleModal(true)}
        >
          Reschedule
        </button>

        <button
          className="sv-btn-primary"
          onClick={() => setShowStatusModal(true)}
        >
          Update Status
        </button>
      </div>

      {showStatusModal && (
        <SiteVisitStatusModal
          id={id}
          currentStatus={data.status}
          onClose={() => setShowStatusModal(false)}
          onUpdated={loadAll} // refresh detail + history
        />
      )}

      {showRescheduleModal && (
        <SiteVisitRescheduleModal
          id={id}
          currentScheduledAt={data.scheduled_at}
          onClose={() => setShowRescheduleModal(false)}
          onRescheduled={loadAll} // refresh after reschedule
        />
      )}
    </div>
  );
};

export default SiteVisitDetail;
