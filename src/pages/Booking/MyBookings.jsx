import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError("");

    axiosInstance
      .get("/book/bookings/my-bookings/")
      .then((res) => {
        setBookings(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load bookings", err);
        setError("Failed to load bookings. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddClick = () => {
    navigate("/booking/form");
  };

  const handleSearchIconClick = () => {
    setSearchOpen((prev) => !prev);
  };

  const handleSearchBlur = () => {
    if (!search.trim()) {
      setSearchOpen(false);
    }
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined) return "";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("en-IN");
  };

  const getStatusLabel = (status) => {
    if (!status) return "-";
    return status
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusColor = (status) => {
    if (!status) return {};
    const statusLower = status.toString().toLowerCase().replace(/_/g, "");
    
    if (statusLower === "booked" || statusLower === "confirmed") {
      return {
        backgroundColor: "#dcfce7", // green-100
        color: "#166534", // green-800
      };
    } else if (statusLower === "draft") {
      return {
        backgroundColor: "#fef3c7", // yellow-100
        color: "#92400e", // yellow-800
      };
    } else if (statusLower === "cancelled" || statusLower === "canceled" || statusLower === "rejected") {
      return {
        backgroundColor: "#fee2e2", // red-100
        color: "#991b1b", // red-800
      };
    }
    
    // Default styling
    return {
      backgroundColor: "#f3f4f6", // gray-100
      color: "#374151", // gray-700
    };
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((b) => {
      const text = [
        b.booking_code,
        b.form_ref_no,
        b.customer_name,
        b.primary_full_name,
        b.project_name,
        b.project,
        b.unit_no,
        b.unit,
        b.tower_name,
        b.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [bookings, search]);

  const rangeLabel =
    bookings.length === 0
      ? "0 of 0"
      : `1-${filtered.length} of ${bookings.length}`;

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        {/* ---------- Header ---------- */}
        <div className="booking-list-header">
          <div className="booking-header-left">
            <button
              type="button"
              className="booking-search-icon-btn"
              onClick={handleSearchIconClick}
              title="Search"
            >
              🔍
            </button>

            {searchOpen && (
              <input
                className="booking-search-input"
                type="text"
                placeholder="Search by customer, project, unit, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={handleSearchBlur}
                autoFocus
              />
            )}
          </div>

          <div className="booking-header-right">
            <span className="booking-count-label">{rangeLabel}</span>
            <button
              type="button"
              className="booking-page-btn"
              disabled
              aria-label="Previous page"
            >
              ‹
            </button>
            <button
              type="button"
              className="booking-page-btn"
              disabled
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>

        {/* ---------- Body ---------- */}
        {loading ? (
          <div className="booking-list-body">
            <div className="booking-list-message">Loading bookings...</div>
          </div>
        ) : error ? (
          <div className="booking-list-body">
            <div className="booking-list-message booking-error">{error}</div>
          </div>
        ) : (
          <div className="booking-list-body">
            <div className="booking-table-wrapper">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Action</th>
                    <th>Booking ID</th>
                    <th>Customer Name</th>
                    <th>Project</th>
                    <th>Unit</th>
                    <th>Advance Amount</th> {/* 🔹 renamed */}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="booking-empty-row">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const bookingId = b.booking_code || b.form_ref_no || b.id;

                      // 🔹 unit label – supports string or object
                      const unitLabel =
                        b.unit_no ||
                        (b.unit && b.unit.unit_no) ||
                        (b.unit && b.unit.name) ||
                        b.unit ||
                        "-";

                      return (
                        <tr key={b.id}>
                          <td className="booking-actions-cell">
                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="Edit booking"
                              onClick={() =>
                                navigate(`/booking/form?booking_id=${b.id}`)
                              }
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="booking-icon-btn"
                              title="View details"
                              onClick={() => navigate(`/booking/${b.id}`)}
                            >
                              👁
                            </button>
                          </td>

                          <td>{bookingId}</td>
                          <td>{b.primary_full_name || "-"}</td>
                          <td>{b.project_name || b.project || "-"}</td>

                          {/* 🔹 show Unit */}
                          <td>{unitLabel}</td>

                          {/* 🔹 show Total Advance as Advance Amount */}
                          <td className="booking-amount-cell">
                            {b.total_advance != null &&
                            b.total_advance !== "" ? (
                              <>
                                <span className="rupee-symbol">₹</span>{" "}
                                {formatAmount(b.total_advance)}
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td>
                            <span
                              className="booking-status-pill"
                              style={getStatusColor(b.status)}
                            >
                              {getStatusLabel(b.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
