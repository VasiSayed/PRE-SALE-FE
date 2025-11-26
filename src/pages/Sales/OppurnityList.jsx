import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import SearchBar from "../../common/SearchBar";
import "../SiteVisit/SiteVisitList.css"; // same styling reuse

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function OppurnityList() {
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]); // multi
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [summary, setSummary] = useState(null); // total + by_status

  // 🔹 status change modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusChangeValue, setStatusChangeValue] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "NEW", label: "New" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "CONVERTED", label: "Converted" },
    { value: "JUNK", label: "Junk" },
    { value: "DUPLICATE", label: "Duplicate" },
  ];

  // status options for change-status (CONVERTED ko yaha se hata diya)
  const statusChangeOptions = [
    { value: "NEW", label: "New" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "JUNK", label: "Junk" },
    { value: "DUPLICATE", label: "Duplicate" },
  ];

  // ---- helper: build project_ids param from array ----
  const buildProjectIdsParam = (idsArray) => {
    const arr = idsArray || [];
    if (!arr.length) return undefined;
    return arr.join(","); // backend expects comma-separated string
  };

  // ---- main fetch ----
  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const projectIdsFromOpts = opts.project_ids ?? selectedProjectIds;
      const project_ids = buildProjectIdsParam(projectIdsFromOpts);

      const params = {
        search: (opts.q ?? q) || undefined,
        status: (opts.status ?? status) || undefined,
        project_ids, // comma separated ids or undefined
        start_date: (opts.start_date ?? startDate) || undefined,
        end_date: (opts.end_date ?? endDate) || undefined,
        page: opts.page ?? page,
      };

      const res = await axiosInstance.get("/sales/lead-opportunities/", {
        params,
      });
      const data = res.data;

      const items = Array.isArray(data) ? data : data.results ?? [];
      setRows(items);

      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);

      if (!Array.isArray(data) && data.summary) {
        setSummary(data.summary);
      } else {
        setSummary(null);
      }
    } catch (err) {
      console.error("Failed to load opportunities", err);
    } finally {
      setLoading(false);
    }
  };

  // ---- debounced search ----
  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setPage(1);
        fetchList({ q: val, page: 1 });
      }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, selectedProjectIds, startDate, endDate]
  );

  // ---- load my-scope projects + initial fetch ----
  useEffect(() => {
    const loadScopeAndFetch = async () => {
      try {
        const res = await axiosInstance.get("/client/my-scope/");
        const data = res.data || {};

        let scopeProjects = [];

        if (Array.isArray(data.projects)) {
          scopeProjects = data.projects.map((p) => ({
            id: p.id ?? p.project_id,
            name:
              p.name ??
              p.project_name ??
              `Project #${p.id || p.project_id || "?"}`,
          }));
        } else if (Array.isArray(data.accesses)) {
          scopeProjects = data.accesses.map((a) => ({
            id: a.project_id,
            name: a.project_name,
          }));
        }

        scopeProjects = scopeProjects.filter((p) => p.id);
        setProjects(scopeProjects);

        let defaultProjectIds = [];

        if (scopeProjects.length === 1) {
          // only one → auto-select
          defaultProjectIds = [String(scopeProjects[0].id)];
        } else if (scopeProjects.length > 1) {
          // many → select first (can change via filters)
          defaultProjectIds = [String(scopeProjects[0].id)];
        }

        setSelectedProjectIds(defaultProjectIds);

        await fetchList({
          page: 1,
          project_ids: defaultProjectIds,
        });
      } catch (err) {
        console.error("Failed to load my-scope for opportunities", err);
        await fetchList({ page: 1 });
      }
    };

    loadScopeAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getStatusColor = (st) => {
    switch (st) {
      case "NEW":
        return "#3b82f6";
      case "IN_REVIEW":
        return "#6366f1";
      case "CONVERTED":
        return "#059669";
      case "JUNK":
        return "#dc2626";
      case "DUPLICATE":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const handleSearchChange = (val) => {
    setQ(val);
    debouncedSearch(val);
  };

  // ---- multi project toggle ----
  const toggleProject = (id, checked) => {
    setSelectedProjectIds((prev) => {
      const sid = String(id);
      if (checked) {
        if (prev.includes(sid)) return prev;
        return [...prev, sid];
      } else {
        return prev.filter((x) => x !== sid);
      }
    });
  };

  const resetFilters = () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    setQ("");

    // projects ko reset karne ka simple tareeka → sirf first scope project
    let defaultIds = [];
    if (projects.length === 1) {
      defaultIds = [String(projects[0].id)];
    } else if (projects.length > 1) {
      defaultIds = [String(projects[0].id)];
    }
    setSelectedProjectIds(defaultIds);

    setPage(1);
    setModalOpen(false);

    fetchList({
      q: "",
      status: "",
      start_date: "",
      end_date: "",
      project_ids: defaultIds,
      page: 1,
    });
  };

  const applyFilters = () => {
    setModalOpen(false);
    setPage(1);
    fetchList({
      q,
      status,
      project_ids: selectedProjectIds,
      start_date: startDate,
      end_date: endDate,
      page: 1,
    });
  };

  // ---- convert API call ----
  const handleConvert = async (oppId) => {
    if (!window.confirm("Convert this opportunity to Lead?")) return;
    try {
      const res = await axiosInstance.post(
        `/sales/lead-opportunities/${oppId}/convert/`,
        {}
      );
      alert(`Converted! Sales Lead ID: ${res.data.sales_lead_id}`);
      // refresh list
      fetchList({ page });
    } catch (err) {
      console.error("Convert failed", err);
      alert("Failed to convert opportunity.");
    }
  };

  // 🔹 open status change modal
  const openStatusModal = (opp) => {
    setStatusTarget(opp);
    // default current status ya IN_REVIEW
    const current =
      opp.status && opp.status !== "CONVERTED" ? opp.status : "IN_REVIEW";
    setStatusChangeValue(current);
    setStatusComment("");
    setStatusModalOpen(true);
  };

  // 🔹 submit status change
  const submitStatusChange = async () => {
    if (!statusTarget) return;
    if (!statusChangeValue) {
      alert("Please select a status.");
      return;
    }

    try {
      await axiosInstance.post(
        `/sales/lead-opportunities/${statusTarget.id}/change-status/`,
        {
          status: statusChangeValue,
          comment: statusComment,
        }
      );
      alert("Status updated.");
      setStatusModalOpen(false);
      setStatusTarget(null);
      // refresh current page
      fetchList({ page });
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update status.");
    }
  };

  const totalOpp = summary?.total ?? count;
  const byStatus = summary?.by_status || {};

  return (
    <div className="projects-page">
      {/* Toolbar */}
      <div className="projects-toolbar">
        <SearchBar
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, email, mobile..."
        />

        <button className="filter-btn" onClick={() => setModalOpen(true)}>
          <i className="fa fa-filter" /> Filters
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Opportunities</div>
          <div className="stat-value">{totalOpp}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status Breakdown</div>
          <div className="stat-value-small">
            {["NEW", "IN_REVIEW", "CONVERTED", "JUNK", "DUPLICATE"].map(
              (st) => (
                <span
                  key={st}
                  style={{
                    marginRight: "12px",
                    fontSize: "12px",
                    color: getStatusColor(st),
                  }}
                >
                  {st}: {byStatus[st] ?? 0}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Pagination hint */}
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
              <th style={{ width: 140 }}>Actions</th>
              <th>Full Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Source System</th>
              <th>Source Name</th>
              <th>Project</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div className="loading-spinner"></div>
                  <div style={{ marginTop: "12px", color: "#6b7280" }}>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : rows.length ? (
              rows.map((o) => {
                const contact = o.mobile_number || "-";
                const projectName =
                  o.project_name || o.project?.name || o.project || "-";

                return (
                  <tr key={o.id}>
                    <td className="row-actions">
                      {/* Convert */}
                      <button
                        className="icon-btn icon-btn-view"
                        title="Convert to Lead"
                        onClick={() => handleConvert(o.id)}
                      >
                        <i className="fa fa-exchange" />
                      </button>
                      {/* Change Status */}
                      <button
                        className="icon-btn icon-btn-edit"
                        title="Change Status"
                        onClick={() => openStatusModal(o)}
                        style={{ marginLeft: "4px" }}
                      >
                        <i className="fa fa-tag" />
                      </button>
                    </td>
                    <td>{o.full_name || "-"}</td>
                    <td>📱 {contact}</td>
                    <td>{o.email || "-"}</td>
                    <td>{o.source_system}</td>
                    <td>{o.source_name || "-"}</td>
                    <td>{projectName}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: `${getStatusColor(o.status)}20`,
                          color: getStatusColor(o.status),
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>{formatDT(o.created_at)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
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
                    No opportunities found
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
            const newPage = page - 1;
            setPage(newPage);
            fetchList({ page: newPage });
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
            const newPage = page + 1;
            setPage(newPage);
            fetchList({ page: newPage });
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

              {/* Multi project */}
              <label className="filter-label">Projects</label>
              <div className="filter-multi-projects">
                {!projects.length && (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    No projects found in scope.
                  </div>
                )}
                {projects.map((p) => {
                  const idStr = String(p.id);
                  return (
                    <label
                      key={p.id}
                      className="checkbox-label"
                      style={{ display: "block", marginBottom: "4px" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(idStr)}
                        onChange={(e) => toggleProject(idStr, e.target.checked)}
                      />{" "}
                      {p.name}
                    </label>
                  );
                })}
              </div>

              {/* Date range */}
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

      {/* 🔹 Status Change Modal */}
      {statusModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>Change Opportunity Status</h3>
              <button
                className="filter-close"
                onClick={() => setStatusModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="filter-body">
              <div
                style={{
                  fontSize: 13,
                  marginBottom: 8,
                  color: "#4b5563",
                }}
              >
                {statusTarget && (
                  <>
                    <div>
                      <strong>Opportunity:</strong>{" "}
                      {statusTarget.full_name || "-"}
                    </div>
                    <div>
                      <strong>Current Status:</strong> {statusTarget.status}
                    </div>
                  </>
                )}
              </div>

              <label className="filter-label">New Status</label>
              <select
                className="filter-select"
                value={statusChangeValue}
                onChange={(e) => setStatusChangeValue(e.target.value)}
              >
                <option value="">Select status</option>
                {statusChangeOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <label className="filter-label">Comment (optional)</label>
              <textarea
                className="filter-input"
                rows={3}
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Reason / note for this status change"
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="filter-actions">
              <button
                className="btn-secondary"
                onClick={() => setStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={submitStatusChange}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
