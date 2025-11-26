// src/pages/Booking/BookingDetail.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import "./BookingDetail.css";

const formatAmount = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

const niceStatus = (status) => {
  if (!status) return "-";
  return status
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const toTitleCase = (value) => {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const niceLabel = (text) => {
  if (!text) return "-";
  return text
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const isImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".avif")
  );
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

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
    if (!booking) {
      return {
        customer: "",
        project: "",
        property: "",
        code: "",
      };
    }

    const rawCustomer =
      booking.customer_name ||
      booking.primary_full_name ||
      booking.primary_name ||
      "-";

    const customer = toTitleCase(rawCustomer);

    const projectName = booking.project || "";
    const towerName = booking.tower || "";
    const unitName = booking.unit || "";

    const projectDisplay = projectName ? toTitleCase(projectName) : "";

    // Property: Project / Tower - Unit (thoda readable)
    const parts = [];
    if (projectDisplay) parts.push(projectDisplay);
    if (towerName) parts.push(towerName);
    if (unitName) parts.push(unitName);

    let property = "";
    if (parts.length > 0) {
      property = parts[0];
      if (parts[1]) property = `${property} / ${parts[1]}`;
      if (parts[2]) property = `${property} - ${parts[2]}`;
    }

    const code =
      booking.booking_code ||
      booking.form_ref_no ||
      (booking.id ? `#${booking.id}` : "");

    return {
      customer,
      project: projectDisplay,
      property,
      code,
    };
  }, [booking]);

  const handleDownload = async () => {
    if (!printRef.current) return;

    const element = printRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = 10;
    if (imgHeight < pageHeight - 20) {
      y = (pageHeight - imgHeight) / 2;
    }

    pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight);
    pdf.save(header.code ? `${header.code}.pdf` : "booking-summary.pdf");
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-card loading-card">
          <div className="booking-loading-text">Loading booking…</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="booking-page">
        <div className="booking-card">
          <div className="booking-error-text">
            {error || "Booking not found or no data."}
          </div>
          <div className="booking-card-footer">
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
    );
  }

  const amount =
    booking.amount || booking.agreement_value || booking.total_amount || 0;

  const kycStatus =
    booking.kyc_status ||
    booking.kyc_request_status ||
    booking.kyc_status_display;

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

  const residentAddress =
    booking.permanent_address || booking.correspondence_address || "-";

  const officeAddress = booking.office_address || booking.office || "-";

  const agreementDone = booking.agreement_done ? "Yes" : "No";
  const bookingStatus = booking.status || "-";
  const isDraft = bookingStatus === "DRAFT";

  const areaSummary = (() => {
    const superArea = booking.super_builtup_sqft || booking.super_builtup;
    const carpet = booking.carpet_sqft || booking.carpet_area_sqft;
    const balcony = booking.balcony_sqft;
    const parts = [];
    if (superArea) parts.push(`${superArea} Sq Ft (Super Built-Up)`);
    if (carpet) parts.push(`${carpet} Sq Ft (Carpet)`);
    if (balcony) parts.push(`${balcony} Sq Ft (Balcony)`);
    if (!parts.length) return "-";
    return parts.join(" · ");
  })();

  const gstLabel =
    booking.gst_no || booking.gst_percent || booking.gst_percentage;

  return (
    <div className="booking-page">
      <div className="booking-card" ref={printRef}>
        {/* HEADER */}
        <header className="booking-card-header">
          <div className="booking-header-left">
            <div className="booking-header-project">
              {header.project || "Booking Summary"}
            </div>
            <div className="booking-header-customer">{header.customer}</div>
            {header.property && (
              <div className="booking-header-property">{header.property}</div>
            )}
            {header.code && (
              <div className="booking-header-code">Ref: {header.code}</div>
            )}
          </div>

          <div className="booking-header-right">
            <div className="booking-header-status-row">
              <span className="booking-status-chip-main">
                {niceStatus(bookingStatus)}
              </span>
              {kycStatus && (
                <span className="booking-status-chip-kyc">
                  KYC: {niceStatus(kycStatus)}
                </span>
              )}
            </div>

            <div className="booking-header-amount">
              <span className="rupee-symbol">₹</span>
              <span>{formatAmount(amount)}</span>
            </div>

            <div className="booking-header-meta">
              <div>
                <span className="booking-header-label">Booking Date: </span>
                <span className="booking-header-value">
                  {booking.booking_date || "-"}
                </span>
              </div>
              <div>
                <span className="booking-header-label">Status: </span>
                <span className="booking-header-value">
                  {niceStatus(bookingStatus)}
                </span>
              </div>
            </div>

            {isDraft && (
              <div className="booking-draft-note">
                This is a draft copy. Confirmation is pending.
              </div>
            )}
          </div>
        </header>

        {/* BODY */}
        <div className="booking-card-body">
          {/* PERSONAL */}
          <section className="booking-section">
            <div className="booking-section-title">Personal Information</div>
            <div className="booking-section-body booking-grid-2">
              <div className="booking-field">
                <span className="booking-field-label">Name</span>
                <span className="booking-field-value">
                  {header.customer || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Email</span>
                <span className="booking-field-value">{email}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Mobile Number</span>
                <span className="booking-field-value">{mobile}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">
                  Preferred Correspondence
                </span>
                <span className="booking-field-value">
                  {niceLabel(booking.preferred_correspondence) || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Resident Status</span>
                <span className="booking-field-value">
                  {niceLabel(booking.residential_status) || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Secondary Email</span>
                <span className="booking-field-value">
                  {booking.email_2 || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Secondary Phone</span>
                <span className="booking-field-value">
                  {booking.phone_2 || "-"}
                </span>
              </div>

              <div className="booking-field booking-field-full">
                <span className="booking-field-label">Resident Address</span>
                <span className="booking-field-value">{residentAddress}</span>
              </div>

              <div className="booking-field booking-field-full">
                <span className="booking-field-label">Office Address</span>
                <span className="booking-field-value">{officeAddress}</span>
              </div>
            </div>
          </section>

          {/* FLAT INFO */}
          <section className="booking-section">
            <div className="booking-section-title">Flat Information</div>
            <div className="booking-section-body booking-grid-2">
              <div className="booking-field">
                <span className="booking-field-label">Project</span>
                <span className="booking-field-value">
                  {header.project || booking.project || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Tower</span>
                <span className="booking-field-value">
                  {booking.tower || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Floor</span>
                <span className="booking-field-value">
                  {booking.floor || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Flat Number</span>
                <span className="booking-field-value">
                  {booking.unit || "-"}
                </span>
              </div>

              <div className="booking-field booking-field-full">
                <span className="booking-field-label">Area Details</span>
                <span className="booking-field-value">{areaSummary}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Agreement Value</span>
                <span className="booking-field-value">
                  <span className="rupee-symbol">₹</span>{" "}
                  {formatAmount(booking.agreement_value)}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Amount In Words</span>
                <span className="booking-field-value">
                  {booking.agreement_value_words || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Agreement Done</span>
                <span className="booking-field-value">{agreementDone}</span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Parking Required</span>
                <span className="booking-field-value">
                  {booking.parking_required ? "Yes" : "No"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Parking Number</span>
                <span className="booking-field-value">
                  {booking.parking_number || "-"}
                </span>
              </div>

              <div className="booking-field booking-field-full">
                <span className="booking-field-label">Parking Details</span>
                <span className="booking-field-value">
                  {booking.parking_details || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">GST</span>
                <span className="booking-field-value">{gstLabel || "-"}</span>
              </div>
            </div>
          </section>

          {/* FINANCIAL */}
          <section className="booking-section">
            <div className="booking-section-title">Financial Details</div>
            <div className="booking-section-body booking-grid-2">
              <div className="booking-field">
                <span className="booking-field-label">Booking Amount</span>
                <span className="booking-field-value">
                  <span className="rupee-symbol">₹</span>{" "}
                  {formatAmount(booking.booking_amount)}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Other Charges</span>
                <span className="booking-field-value">
                  <span className="rupee-symbol">₹</span>{" "}
                  {formatAmount(booking.other_charges)}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Total Advance</span>
                <span className="booking-field-value">
                  <span className="rupee-symbol">₹</span>{" "}
                  {formatAmount(booking.total_advance)}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Payment Plan Type</span>
                <span className="booking-field-value">
                  {niceLabel(booking.payment_plan_type) || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Loan Required</span>
                <span className="booking-field-value">
                  {booking.loan_required ? "Yes" : "No"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">Loan Bank Name</span>
                <span className="booking-field-value">
                  {booking.loan_bank_name || "-"}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">
                  Loan Amount Expected
                </span>
                <span className="booking-field-value">
                  {booking.loan_amount_expected ? (
                    <>
                      <span className="rupee-symbol">₹</span>{" "}
                      {formatAmount(booking.loan_amount_expected)}
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              </div>

              <div className="booking-field">
                <span className="booking-field-label">KYC Status</span>
                <span className="booking-field-value">
                  {kycStatus ? niceStatus(kycStatus) : "-"}
                </span>
              </div>
            </div>
          </section>

          {/* APPLICANTS */}
          {booking.applicants && booking.applicants.length > 0 && (
            <section className="booking-section">
              <div className="booking-section-title">Applicants</div>
              <div className="booking-section-body booking-applicants-grid">
                {booking.applicants.map((app) => {
                  const isPrimary = !!app.is_primary;
                  const hasPanDoc = app.pan_front || app.pan_back;
                  const hasAadharDoc = app.aadhar_front || app.aadhar_back;

                  return (
                    <div
                      className="booking-applicant-card"
                      key={app.id || app.sequence}
                    >
                      <div className="booking-applicant-header">
                        <div className="booking-applicant-name">
                          {toTitleCase(
                            `${app.title || ""} ${app.full_name || ""}`.trim()
                          ) || "-"}
                        </div>
                        <div className="booking-applicant-tags">
                          <span className="booking-chip applicant-chip">
                            {isPrimary ? "Primary Applicant" : "Co-Applicant"}
                          </span>
                          {app.relation && (
                            <span className="booking-chip applicant-chip">
                              {niceLabel(app.relation)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="booking-applicant-body">
                        <div className="booking-field">
                          <span className="booking-field-label">Email</span>
                          <span className="booking-field-value">
                            {app.email || "-"}
                          </span>
                        </div>
                        <div className="booking-field">
                          <span className="booking-field-label">
                            Mobile Number
                          </span>
                          <span className="booking-field-value">
                            {app.mobile_number || "-"}
                          </span>
                        </div>
                        <div className="booking-field">
                          <span className="booking-field-label">PAN</span>
                          <span className="booking-field-value">
                            {app.pan_no || "-"}
                          </span>
                        </div>
                        <div className="booking-field">
                          <span className="booking-field-label">
                            Aadhar Number
                          </span>
                          <span className="booking-field-value">
                            {app.aadhar_no || "-"}
                          </span>
                        </div>

                        {(hasPanDoc || hasAadharDoc) && (
                          <div className="booking-applicant-docs">
                            {hasPanDoc && (
                              <div className="booking-applicant-doc-group">
                                <span className="booking-field-label">
                                  PAN Docs
                                </span>
                                <div className="booking-doc-thumbs">
                                  {app.pan_front &&
                                    isImageUrl(app.pan_front) && (
                                      <div className="booking-doc-thumb">
                                        <img
                                          src={app.pan_front}
                                          alt="PAN Front"
                                        />
                                      </div>
                                    )}
                                  {app.pan_back && isImageUrl(app.pan_back) && (
                                    <div className="booking-doc-thumb">
                                      <img src={app.pan_back} alt="PAN Back" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {hasAadharDoc && (
                              <div className="booking-applicant-doc-group">
                                <span className="booking-field-label">
                                  Aadhar Docs
                                </span>
                                <div className="booking-doc-thumbs">
                                  {app.aadhar_front &&
                                    isImageUrl(app.aadhar_front) && (
                                      <div className="booking-doc-thumb">
                                        <img
                                          src={app.aadhar_front}
                                          alt="Aadhar Front"
                                        />
                                      </div>
                                    )}
                                  {app.aadhar_back &&
                                    isImageUrl(app.aadhar_back) && (
                                      <div className="booking-doc-thumb">
                                        <img
                                          src={app.aadhar_back}
                                          alt="Aadhar Back"
                                        />
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ATTACHMENTS */}
          {booking.attachments && booking.attachments.length > 0 && (
            <section className="booking-section">
              <div className="booking-section-title">Attachments</div>
              <div className="booking-section-body booking-attachments-list">
                {booking.attachments.map((att, idx) => {
                  const docNice = niceLabel(att.doc_type);
                  const typeUpper = (att.doc_type || "").toUpperCase();
                  const isPan = typeUpper === "PAN";
                  const isAadhar = typeUpper === "AADHAR";
                  const showThumb = isImageUrl(att.file);

                  return (
                    <div className="booking-attachment-row" key={att.id || idx}>
                      <div className="booking-attachment-main">
                        <span className="booking-attachment-label">
                          {att.label || docNice || "-"}
                        </span>

                        <span className="booking-attachment-type">
                          {docNice}
                        </span>

                        <div className="booking-attachment-tags">
                          {isPan && (
                            <span className="booking-chip small-chip">
                              Pan Document
                            </span>
                          )}
                          {isAadhar && (
                            <span className="booking-chip small-chip">
                              Aadhar Document
                            </span>
                          )}
                        </div>
                      </div>

                      {showThumb && (
                        <div className="booking-attachment-preview">
                          <div className="booking-doc-thumb">
                            <img
                              src={att.file}
                              alt={att.label || att.doc_type || "Attachment"}
                            />
                          </div>
                        </div>
                      )}

                      <div className="booking-attachment-action">
                        <a
                          href={att.file}
                          target="_blank"
                          rel="noreferrer"
                          className="booking-btn-link"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* FOOTER */}
        <footer className="booking-card-footer">
          <button
            type="button"
            className="booking-btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            type="button"
            className="booking-btn-primary"
            onClick={handleDownload}
          >
            Download Summary
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BookingDetail;
