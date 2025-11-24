import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./SiteVisitStatusModal.css";
import { toast } from "react-hot-toast";

const SiteVisitStatusModal = ({ id, currentStatus, onClose, onUpdated }) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");

  
  const updateStatus = async () => {
    try {
      await axiosInstance.patch(`/sales/site-visits/${id}/update-status/`, {
        status,
        cancelled_reason: reason,
      });

      toast.success("Status updated!");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="svm-backdrop">
      <div className="svm-modal">
        <h3>Update Visit Status</h3>

        <label className="svm-label">Status</label>
        <select
          className="svm-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>

        {status === "CANCELLED" && (
          <>
            <label className="svm-label">Cancel Reason</label>
            <textarea
              className="svm-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </>
        )}

        <div className="svm-actions">
          <button className="svm-btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="svm-btn-primary" onClick={updateStatus}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteVisitStatusModal;
