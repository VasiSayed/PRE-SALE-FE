import { useState, useMemo } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import "./SiteVisitModal.css"; // agar same modal CSS use karna ho

function toInputDT(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());

  // `datetime-local` format: "YYYY-MM-DDTHH:MM"
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function SiteVisitRescheduleModal({
  id,
  currentDateTime,
  onClose,
  onRescheduled,
}) {
  const [newDT, setNewDT] = useState(toInputDT(currentDateTime));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const minValue = useMemo(() => {
    // abhi se pehle allow nahi karna (backend bhi check karega)
    return toInputDT(new Date().toISOString());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newDT) {
      toast.error("Please select new date & time");
      return;
    }

    setSaving(true);

    try {
      await axiosInstance.post(`/sales/site-visits/${id}/reschedule/`, {
        new_scheduled_at: newDT, // DRF DateTimeField handle karega
        reason: reason || "",
      });

      toast.success("Site visit rescheduled");
      if (onRescheduled) onRescheduled();
      onClose();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to reschedule, please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sv-modal-backdrop">
      <div className="sv-modal">
        <div className="sv-modal-header">
          <h3>Reschedule Site Visit</h3>
          <button className="sv-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sv-modal-body">
            <div className="sv-field">
              <label className="sv-label">New Date &amp; Time</label>
              <input
                type="datetime-local"
                className="sv-input"
                value={newDT}
                min={minValue}
                onChange={(e) => setNewDT(e.target.value)}
              />
            </div>

            <div className="sv-field">
              <label className="sv-label">Reason (optional)</label>
              <textarea
                className="sv-input"
                rows={3}
                placeholder="Customer requested next day, timing not suitable, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="sv-modal-footer">
            <button
              type="button"
              className="sv-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="sv-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
