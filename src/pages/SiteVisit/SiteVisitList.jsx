import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
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

      const r = await axiosInstance.get("/sales/site-visits/", { params });
      const data = r.data;

      const items = Array.isArray(data) ? data : data.results ?? [];

      setRows(items);
      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);

      // Build project list from response
      const seen = new Set();
      const projList = [];
      items.forEach((v) => {
        if (v.project && !seen.has(v.project.id)) {
          seen.add(v.project.id);
          projList.push(v.project);
        }
      });
      setProjects(projList);
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

  // Reset Filters
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

  return (
    <div className="projects-page">
      {/* Toolbar */}
      <div className="projects-toolbar">
        {/* Search */}
        <div className="search-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path
              d="M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <input
            className="search-input"
            placeholder="Search visitor, mobile, project…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
        </div>

        {/* FILTER Icon */}
        <button className="filter-btn" onClick={() => setModalOpen(true)}>
          <i className="fa fa-filter" /> Filters
        </button>
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
              <th style={{ width: 120 }}>Actions</th>
              <th>Visitor</th>
              <th>Mobile</th>
              <th>Project</th>
              <th>Unit</th>
              <th>Expected Visit</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            ) : rows.length ? (
              rows.map((v) => (
                <tr key={v.id}>
                  <td className="row-actions">
                    <button
                      className="icon-btn"
                      title="View"
                      onClick={() => navigate(`/sales/lead/site-visit/${v.id}`)}
                    >
                      <i className="fa fa-eye" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() =>
                        navigate(`/sales/lead/site-visit/${v.id}/edit`)
                      }
                    >
                      <i className="fa fa-edit" />
                    </button>
                  </td>

                  <td>{v.member_name || v.lead?.full_name}</td>
                  <td>{v.member_mobile_number || v.lead?.mobile_number}</td>
                  <td>{v.project?.name}</td>

                  <td>
                    {v.inventory
                      ? `${v.inventory.tower_name} / ${v.inventory.floor_number} / ${v.inventory.unit_no}`
                      : "-"}
                  </td>

                  <td>{formatDT(v.scheduled_at)}</td>

                  <td className={`status-badge status-${v.status}`}>
                    {v.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No site visits found</td>
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

      {/* ------------------ FILTER MODAL ------------------ */}
      {modalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <h3>Filters</h3>

            {/* Status */}
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

            {/* Project */}
            <label className="filter-label">Project</label>
            <select
              className="filter-select"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Date Range */}
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

            {/* Buttons */}
            <div className="filter-actions">
              <button className="btn-secondary" onClick={resetFilters}>
                Reset
              </button>
              <button className="btn-primary" onClick={applyFilters}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
