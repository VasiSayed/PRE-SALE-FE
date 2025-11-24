import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import SearchBar from "../../common/SearchBar";
import "./SiteVisitList.css";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function SiteVisitList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        search: opts.q ?? q,
        status: opts.status ?? status,
        project: opts.project ?? project,
        start_date: opts.start_date ?? startDate,
        end_date: opts.end_date ?? endDate,
        page: opts.page ?? page,
      };

      const r = await axiosInstance.get("/sales/site-visits/summary/", {
        params,
      });
      const data = r.data;

      const items = Array.isArray(data) ? data : data.results ?? [];
      setRows(items);
      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);

      // Extract unique projects
      const projectMap = new Map();
      items.forEach((item) => {
        if (item.project && !projectMap.has(item.project)) {
          projectMap.set(item.project, {
            id: item.project,
            name: item.project,
          });
        }
      });
      setProjects(Array.from(projectMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((val) => fetchList({ q: val, page: 1 }), 300),
    []
  );

  useEffect(() => {
    fetchList({ page: 1 });
  }, []);

  const totalPages = Math.max(1, Math.ceil(count / 10));

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

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "NO_SHOW", label: "No Show" },
  ];

  const resetFilters = () => {
    setStatus("");
    setProject("");
    setStartDate("");
    setEndDate("");
    setQ("");
    setModalOpen(false);
    fetchList({
      q: "",
      status: "",
      project: "",
      start_date: "",
      end_date: "",
      page: 1,
    });
  };

  const applyFilters = () => {
    setModalOpen(false);
    fetchList({
      q,
      status,
      project,
      start_date: startDate,
      end_date: endDate,
      page: 1,
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
      {/* Header
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 Site Visits</h1>
          <p className="page-subtitle">Manage and track all site visits</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/sales/lead/site-visit/create")}
        >
          + New Site Visit
        </button>
      </div> */}

      {/* Toolbar */}
      <div className="projects-toolbar">
        <SearchBar
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            debouncedSearch(e.target.value);
          }}
          placeholder="Search by lead name, mobile, project..."
        />

        <button className="filter-btn" onClick={() => setModalOpen(true)}>
          <i className="fa fa-filter" /> Filters
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{count}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Visits</div>
          <div className="stat-value">
            {rows.reduce((sum, r) => sum + (r.total_visits || 0), 0)}
          </div>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="pagination-hint">
        {count
          ? `${(page - 1) * 10 + 1}-${Math.min(page * 10, count)} of ${count}`
          : "0 of 0"}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Actions</th>
              <th>Lead Name</th>
              <th>Mobile</th>
              <th>Project</th>
              <th>Latest Visit</th>
              <th>Status</th>
              <th>Total Visits Secudel</th>
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
                    Loading...
                  </div>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((v) => (
                <tr key={v.lead_id}>
                  <td className="row-actions">
                    <button
                      className="icon-btn icon-btn-view"
                      title="View All Visits"
                      onClick={() =>
                        navigate(`/sales/lead/site-visit/by-lead/${v.lead_id}`)
                      }
                    >
                      <i className="fa fa-eye" />
                    </button>
                  </td>

                  <td>
                    <div className="lead-name">{v.lead_name}</div>
                  </td>
                  <td>
                    <div className="mobile-number">📱 {v.mobile}</div>
                  </td>
                  <td>
                    <div className="project-name">{v.project}</div>
                  </td>
                  <td>{formatDT(v.latest_scheduled_at)}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(v.latest_status)}20`,
                        color: getStatusColor(v.latest_status),
                      }}
                    >
                      {v.latest_status}
                    </span>
                  </td>
                  <td>
                    <span className="visits-count">{v.total_visits}</span>
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
                    No site visits found
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    Try adjusting your filters or search query
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pager">
        <button
          disabled={page <= 1}
          onClick={() => {
            setPage(page - 1);
            fetchList({ page: page - 1 });
          }}
        >
          &lt;
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => {
            setPage(page + 1);
            fetchList({ page: page + 1 });
          }}
        >
          &gt;
        </button>
      </div>

      {/* Filter Modal */}
      {modalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>🔍 Filters</h3>
              <button
                className="filter-close"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              <label className="filter-label">Status</label>
              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <label className="filter-label">Project</label>
              <select
                className="filter-select"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <label className="filter-label">Start Date</label>
              <input
                type="date"
                className="filter-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label className="filter-label">End Date</label>
              <input
                type="date"
                className="filter-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button className="btn-secondary" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn-primary" onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
