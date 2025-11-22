import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./CostSheetTemplatesList.css";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function CostSheetTemplatesList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const params = { search: opts.q ?? q, page: opts.page ?? page };

      const res = await axiosInstance.get(
        "costsheet/cost-sheet-templates/",
        { params }
      );

      const data = res.data;
      const items = Array.isArray(data) ? data : data.results ?? [];
      setRows(items);
      setCount(Array.isArray(data) ? items.length : data.count ?? items.length);
    } catch (e) {
      console.error("Failed to load cost sheet templates", e);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchList = useMemo(
    () =>
      debounce((val) => {
        fetchList({ q: val, page: 1 });
      }, 350),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    fetchList({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / 10)),
    [count]
  );

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="templates-page">
      {/* Toolbar */}
      <div className="templates-toolbar">
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
            placeholder="Search cost sheet templates…"
            value={q}
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);
              debouncedFetchList(value);
            }}
          />
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/costsheet/templates/new")}
        >
          Add
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
              <th style={{ width: 120, textAlign: "center" }}>Actions</th>
              <th>Header</th>
              <th>Company</th>
              <th>GST %</th>
              <th>Stamp Duty %</th>
              <th>Registration</th>
              <th>Legal Fees</th>
              <th>Validity (days)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading…</td>
              </tr>
            ) : rows.length ? (
              rows.map((t) => (
                <tr key={t.id}>
                  <td className="row-actions" style={{ textAlign: "center" }}>
                    {/* Edit → open template detail (edit mode inside that page) */}
                    <button
                      title="Edit"
                      className="icon-btn"
                      onClick={() => navigate(`/costsheet/templates/${t.id}`)}
                    >
                      <i className="fa fa-edit" />
                    </button>

                    {/* Delete stub (you can wire later) */}
                    <button title="Delete" className="icon-btn">
                      <i className="fa fa-trash" />
                    </button>

                    {/* View → same detail page, you can treat as read-only there */}
                    <button
                      title="View"
                      className="icon-btn"
                      onClick={() => navigate(`/costsheet/templates/${t.id}`)}
                    >
                      <i className="fa fa-eye" />
                    </button>
                  </td>

                  <td>{t.quotation_header || "-"}</td>
                  <td>{t.company_name || "-"}</td>
                  <td>{t.gst_percent ?? "-"}</td>
                  <td>{t.stamp_duty_percent ?? "-"}</td>
                  <td>{formatMoney(t.registration_amount)}</td>
                  <td>{formatMoney(t.legal_fee_amount)}</td>
                  <td>{t.validity_days ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>No templates found</td>
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
    </div>
  );
}
