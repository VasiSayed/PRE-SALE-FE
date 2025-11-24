import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./SiteVisitList.css";

export default function SiteVisitsByLead() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadInfo, setLeadInfo] = useState(null);

  useEffect(() => {
    fetchVisits();
  }, [leadId]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/sales/site-visits/by-lead/${leadId}/`
      );
      setVisits(res.data || []);

      // Extract lead info from first visit
      if (res.data && res.data.length > 0) {
        const firstVisit = res.data[0];
        setLeadInfo({
          name: firstVisit.member_name || firstVisit.lead?.full_name,
          mobile:
            firstVisit.member_mobile_number || firstVisit.lead?.mobile_number,
          project: firstVisit.project?.name,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDT = (v) => {
    if (!v) return "-";
    return new Date(v).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "#3b82f6";
      case "COMPLETED":
        return "#059669";
      case "CANCELLED":
        return "#dc2626";
      case "NO_SHOW":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="projects-page">
      {/* Back Button */}
      {/* Header + Back Button */}
      <div className="visit-header">
        <h1 className="visit-title">📋 Visit History</h1>

        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <p className="visit-subtitle">All site visits for this lead</p>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Actions</th>
              <th>Visit Date</th>
              <th>Project</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Feedback</th>
              <th>Next Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div className="loading-spinner"></div>
                  <div style={{ marginTop: "12px", color: "#6b7280" }}>
                    Loading visits...
                  </div>
                </td>
              </tr>
            ) : visits.length ? (
              visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="row-actions">
                    <button
                      className="icon-btn icon-btn-view"
                      title="View Details"
                      onClick={() =>
                        navigate(`/sales/lead/site-visit/${visit.id}`)
                      }
                    >
                      <i className="fa fa-eye" />
                    </button>
                    <button
                      className="icon-btn icon-btn-edit"
                      title="Edit"
                      onClick={() =>
                        navigate(`/sales/lead/site-visit/${visit.id}/edit`)
                      }
                    >
                      <i className="fa fa-edit" />
                    </button>
                  </td>

                  <td>{formatDT(visit.scheduled_at)}</td>
                  <td>{visit.project?.name}</td>
                  <td>
                    {visit.inventory
                      ? `${visit.inventory.tower_name} / ${visit.inventory.floor_number} / ${visit.inventory.unit_no}`
                      : "-"}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(visit.status)}20`,
                        color: getStatusColor(visit.status),
                      }}
                    >
                      {visit.status}
                    </span>
                  </td>
                  <td>
                    <div className="feedback-cell">{visit.feedback || "-"}</div>
                  </td>
                  <td>
                    <div className="next-action-cell">
                      {visit.next_action || "-"}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                    📭
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    No visits found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
