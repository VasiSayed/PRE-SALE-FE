import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import SearchBar from "../../common/SearchBar";

// import "../CostSheetList.css";

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function CostSheetList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const fetchList = async (opts = {}) => {
    setLoading(true);
    try {
      const searchParam = typeof opts.q === "string" ? opts.q : q || undefined;
      const pageParam =
        typeof opts.page === "number" && opts.page > 0 ? opts.page : page || 1;

      const params = {
        search: searchParam,
        page: pageParam,
      };

      const res = await axiosInstance.get(
        "/costsheet/cost-sheets/my-quotations/",
        { params }
      );

      const data = res.data;

      let items = [];
      let totalCount = 0;

      if (Array.isArray(data)) {
        // non-paginated array
        items = data;
        totalCount = data.length;
      } else if (data && typeof data === "object") {
        // DRF paginated response: { count, results, ... }
        if (Array.isArray(data.results)) {
          items = data.results;
        }
        if (typeof data.count === "number") {
          totalCount = data.count;
        } else {
          totalCount = items.length;
        }
      }

      setRows(items);
      setCount(totalCount);
    } catch (e) {
      console.error("Failed to load quotations", e);
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchList = useMemo(
    () =>
      debounce((val) => {
        setPage(1);
        fetchList({ q: val, page: 1 });
      }, 350),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );


  
  const handleSearchChange = (value) => {
    setQ(value);
    debouncedFetchList(value);
  };


  useEffect(() => {
    fetchList({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / 10)), [count]);

  return (
    <div className="templates-page">
      {/* Toolbar */}
      <div className="templates-toolbar">
        
        <SearchBar
          value={q}
          onChange={handleSearchChange}
          placeholder="Search quotations…"
        />

        {/* <div className="search-wrap">
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
            placeholder="Search quotations…"
            value={q}
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);
              debouncedFetchList(value);
            }}
          />
        </div> */}

        {/* <button
          className="btn-primary"
          // if later you want select lead first, change this route
          onClick={() => navigate("/costsheet/new")}
        >
          Add
        </button> */}
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
              <th style={{ width: 120, textAlign: "center" }}>Action</th>
              <th>Quotation No</th>
              <th>Customer Name</th>
              <th>Project Name</th>
              <th>Sales Executive</th>
              <th>Validity Date</th>
              <th style={{ textAlign: "center" }}>Attachments</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            ) : rows.length ? (
              rows.map((t) => (
                <tr key={t.id}>
                  {/* ACTIONS */}
                  <td className="row-actions" style={{ textAlign: "center" }}>
                    <button
                      title="Edit"
                      className="icon-btn"
                      onClick={() => navigate(`/costsheet/${t.id}/edit`)}
                    >
                      <i className="fa fa-edit" />
                    </button>

                    <button
                      title="View"
                      className="icon-btn"
                      onClick={() => navigate(`/costsheet/${t.id}`)}
                    >
                      <i className="fa fa-eye" />
                    </button>

                    <button
                      title="Delete"
                      className="icon-btn"
                      onClick={() => {
                        console.log("delete id", t.id);
                        // later -> call DELETE /costsheet/cost-sheets/:id/
                      }}
                    >
                      <i className="fa fa-trash" />
                    </button>
                  </td>

                  {/* QUOTATION NO */}
                  <td>{t.quotation_no || "-"}</td>

                  {/* CUSTOMER NAME */}
                  <td>{t.customer_name || "-"}</td>

                  {/* PROJECT NAME */}
                  <td>{t.project_name || t.project?.name || "-"}</td>

                  {/* SALES EXECUTIVE */}
                  <td>
                    {t.prepared_by_name ||
                      t.prepared_by_username ||
                      t.prepared_by ||
                      "-"}
                  </td>

                  {/* VALIDITY DATE */}
                  <td>{t.valid_till || t.validity_date || "-"}</td>

                  {/* ATTACHMENTS COUNT */}
                  <td style={{ textAlign: "center" }}>
                    {typeof t.attachments_count === "number"
                      ? t.attachments_count === 0
                        ? "-"
                        : `${t.attachments_count} file${
                            t.attachments_count > 1 ? "s" : ""
                          }`
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No quotations found</td>
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
