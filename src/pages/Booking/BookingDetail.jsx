// src/pages/BookingDetail.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingPages.css";

const formatAmount = (value) => {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("en-IN");
};

const niceStatus = (status) => {
  if (!status) return "-";
  return status
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    axiosInstance
      .get(`/book/bookings/${id}/`)
      .then((res) => {
        setBooking(res.data);
      })
      .catch((err) => {
        console.error("Failed to load booking detail", err);
        setError("Failed to load booking details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const header = useMemo(() => {
    if (!booking) return { customer: "", property: "", code: "" };

    const customer =
      booking.customer_name ||
      booking.primary_full_name ||
      booking.primary_name ||
      "-";

    // Property summary – e.g. "2BHK – Tower A-202"
    const parts = [];

    if (booking.flat_type_label) {
      parts.push(booking.flat_type_label);
    } else if (booking.flat_type) {
      parts.push(booking.flat_type);
    }

    if (booking.tower) {
      parts.push(`Tower ${booking.tower}`);
    }

    const unitNo =
      booking.unit_no ||
      (booking.unit && (booking.unit.unit_no || booking.unit.name));

    if (unitNo) {
      parts.push(unitNo);
    }

    const property = parts.length
      ? parts.join(" - ")
      : booking.project_name || "";

    const code =
      booking.booking_code || booking.form_ref_no || `#${booking.id}`;

    return { customer, property, code };
  }, [booking]);

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="booking-detail-card">
            <div className="booking-list-message">Loading booking…</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="setup-page">
        <div className="setup-container">
          <div className="booking-detail-card">
            {error ? (
              <div className="booking-list-message booking-error">{error}</div>
            ) : (
              <div className="booking-list-message">
                Booking not found or no data.
              </div>
            )}
            <div className="booking-detail-footer">
              <button
                type="button"
                className="booking-btn-secondary"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const amount = booking.amount || booking.agreement_value || 0;

  const kycStatus =
    booking.kyc_status ||
    booking.kyc_request_status ||
    booking.kyc_status_display;

  const pan =
    booking.primary_pan_masked ||
    booking.primary_pan_no_masked ||
    booking.primary_pan_no ||
    "-";

  const aadhar =
    booking.primary_aadhar_masked ||
    booking.primary_aadhar_no_masked ||
    booking.primary_aadhar_no ||
    "-";

  const email =
    booking.primary_email ||
    booking.primary_email_address ||
    booking.customer_email ||
    "-";

  const mobile =
    booking.primary_mobile_masked ||
    booking.primary_mobile_number ||
    booking.customer_mobile ||
    "-";

  const dob = booking.primary_dob || booking.date_of_birth || "-";

  const officeAddress = booking.office_address || booking.office || "-";
  const residentAddress =
    booking.permanent_address || booking.correspondence_address || "-";

  const agreementDone = booking.agreement_done ? "Yes" : "No";

  const towerName = booking.tower || (booking.tower && booking.tower.name);
  const unitNo =
    booking.unit || (booking.unit && (booking.unit || booking.unit.name));

  const areaSummary = (() => {
    const superArea = booking.super_builtup_sqft || booking.super_builtup;
    const carpet = booking.carpet_sqft || booking.carpet_area_sqft;
    if (!superArea && !carpet) return "-";
    if (superArea && carpet) {
      return `${superArea} / ${carpet} sq ft`;
    }
    return `${superArea || carpet} sq ft`;
  })();

  const amountWords = booking.agreement_value_words || "-";
  const gst = booking.gst_percent || booking.gst_percentage || booking.gst_no;

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="booking-detail-card">
          {/* Header */}
          <div className="booking-detail-header">
            <div className="booking-detail-header-left">
              <div className="booking-detail-name">{header.customer}</div>
              {header.property && (
                <div className="booking-detail-property">{header.property}</div>
              )}
              <div className="booking-detail-code">{header.code}</div>
            </div>

            <div className="booking-detail-header-right">
              <button
                type="button"
                className="booking-status-chip-main"
                style={{ backgroundColor: "#102a54" }}
              >
                {niceStatus(booking.status)}
              </button>
              <div className="booking-detail-amount">
                <span className="rupee-symbol">₹</span> {formatAmount(amount)}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="booking-section">
            <div className="booking-section-title">Personal Information</div>
            <div className="booking-section-body booking-grid-2">
              <div className="booking-field">
                <span className="booking-field-label">Name:</span>
                <span className="booking-field-value">{header.customer}</span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">Date of Birth:</span>
                <span className="booking-field-value">{dob || "-"}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">PAN:</span>
                <span className="booking-field-value">{pan}</span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">Email:</span>
                <span className="booking-field-value">{email}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Aadhar Number:</span>
                <span className="booking-field-value">{aadhar}</span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">Mobile Number:</span>
                <span className="booking-field-value">{mobile}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Resident Status:</span>
                <span className="booking-field-value">
                  {booking.residential_status || "-"}
                </span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">Resident Address:</span>
                <span className="booking-field-value">{residentAddress}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Office Address:</span>
                <span className="booking-field-value">{officeAddress}</span>
              </div>
            </div>
          </div>

          {/* Flat Info */}
          <div className="booking-section">
            <div className="booking-section-title">Flat Information</div>
            <div className="booking-section-body booking-grid-2">
              <div className="booking-field">
                <span className="booking-field-label">Tower:</span>
                <span className="booking-field-value">{towerName || "-"}</span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">Flat Number:</span>
                <span className="booking-field-value">{unitNo || "-"}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Agreement Amount:</span>
                <span className="booking-field-value">
                  <span className="rupee-symbol">₹</span> {formatAmount(amount)}
                </span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">Amount in Words:</span>
                <span className="booking-field-value">{amountWords}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Area:</span>
                <span className="booking-field-value">{areaSummary}</span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">GST(%):</span>
                <span className="booking-field-value">{gst || "-"}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Agreement Done:</span>
                <span className="booking-field-value">{agreementDone}</span>
              </div>
              <div className="booking-field">
                <span className="booking-field-label">KYC Status:</span>
                <span className="booking-field-value">
                  {niceStatus(kycStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* footer actions */}
          <div className="booking-detail-footer">
            <button
              type="button"
              className="booking-btn-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
