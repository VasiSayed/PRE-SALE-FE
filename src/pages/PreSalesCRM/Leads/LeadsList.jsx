import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LeadAPI } from "../../../api/endpoints";
import "./LeadsList.css";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function LeadsList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    source: "",
    project: "",
  });

  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const params = { 
        search: opts.q ?? q, 
        page: opts.page ?? page,
        status: opts.status ?? filters.status,
        source: opts.source ?? filters.source,
        project: opts.project ?? filters.project,
      };

      const data = await LeadAPI.list(params);

      const items = Array.isArray(data) ? data : data.results ?? [];
      setRows(items);
      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);
    } catch (e) {
      console.error("Failed to load leads", e);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((val) => fetchList({ q: val, page: 1 }), 350),
    []
  );

  useEffect(() => {
    fetchList({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 10)), [count]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) {
      return;
    }

    try {
      await LeadAPI.delete(id);
      alert("Lead deleted successfully!");
      fetchList();
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert("Failed to delete lead");
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower.includes("new") || statusLower.includes("fresh")) return "badge-new";
    if (statusLower.includes("contact") || statusLower.includes("working")) return "badge-contacted";
    if (statusLower.includes("qualified")) return "badge-qualified";
    if (statusLower.includes("won") || statusLower.includes("converted")) return "badge-converted";
    if (statusLower.includes("lost")) return "badge-lost";
    return "badge-default";
  };

  return (
    <div className="leads-list-page">
      <div className="leads-list-container">
        {/* Header */}
        <div className="list-header">
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search leads by name, email, phone..."
                value={q}
                onChange={(e) => {
                  const value = e.target.value;
                  setQ(value);
                  debouncedSearch(value);
                }}
                className="search-input"
              />
            </div>

            {/* Filters */}
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => {
                const newFilters = { ...filters, status: e.target.value };
                setFilters(newFilters);
                fetchList({ ...newFilters, page: 1 });
              }}
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            <button className="btn-add" onClick={() => navigate("/leads/new")}>
              Add Lead
            </button>
          </div>

          <div className="pagination-info">
            {count > 0 ? (
              <>
                {(page - 1) * 10 + 1}-{Math.min(page * 10, count)} of {count}
              </>
            ) : (
              "No results"
            )}
            <button
              className="pagination-btn"
              onClick={() => {
                const newPage = page - 1;
                setPage(newPage);
                fetchList({ page: newPage });
              }}
              disabled={page === 1}
            >
              ❮
            </button>
            <button
              className="pagination-btn"
              onClick={() => {
                const newPage = page + 1;
                setPage(newPage);
                fetchList({ page: newPage });
              }}
              disabled={page >= totalPages}
            >
              ❯
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Loading leads...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Actions</th>
                  <th>Lead ID</th>
                  <th>Lead Name</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((lead) => {
                    const leadId = lead.lead_code || lead.code || `L-${lead.id}`;
                    const leadName =
                      lead.lead_name ||
                      [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
                      "-";
                    const contact =
                      lead.mobile_number ||
                      lead.contact_number ||
                      lead.phone ||
                      "-";
                    const email = lead.email || "-";
                    const source =
                      lead.source_name ||
                      lead.lead_source_name ||
                      lead.source?.name ||
                      "-";
                    const project = 
                      lead.project_name || 
                      lead.project?.name || 
                      lead.project_lead?.project?.name ||
                      "-";
                    const budget =
                      lead.budget != null
                        ? `₹${Number(lead.budget).toLocaleString()}`
                        : "-";
                    const status =
                      lead.status_name ||
                      lead.status?.name ||
                      lead.stage_name ||
                      lead.sub_status?.name ||
                      "New";
                    const assignedTo =
                      lead.assigned_to_name ||
                      lead.assign_to?.name ||
                      lead.current_owner?.name ||
                      "-";

                    return (
                      <tr key={lead.id}>
                        <td className="row-actions">
                          <button
                            title="View"
                            className="action-btn view-btn"
                            onClick={() => navigate(`/leads/${lead.id}`)}
                          >
                            👁️
                          </button>
                          <button
                            title="Edit"
                            className="action-btn edit-btn"
                            onClick={() => navigate(`/leads/${lead.id}/edit`)}
                          >
                            ✏️
                          </button>
                          <button
                            title="Delete"
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(lead.id)}
                          >
                            🗑️
                          </button>
                        </td>
                        <td>{leadId}</td>
                        <td className="lead-name">{leadName}</td>
                        <td>{contact}</td>
                        <td className="email-cell">{email}</td>
                        <td>{source}</td>
                        <td>{project}</td>
                        <td>{budget}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td>{assignedTo}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="empty-state">
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}