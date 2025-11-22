// src/pages/CostSheet/QuotationPreview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./QuotationPreview.css";

function fmt(val) {
  if (val === null || val === undefined || val === "") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

const QuotationPreview = () => {
  const { id } = useParams();
  const [qdata, setQdata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axiosInstance.get(
          `/costsheet/cost-sheets/${id}/deep/`
        );
        setQdata(res.data);
      } catch (e) {
        console.error("Failed to load quotation", e);
        setError("Failed to load quotation details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const paymentRows = useMemo(() => {
    if (!qdata) return [];

    const netBase = Number(qdata.net_base_value || 0) || 0;

    // MASTER plan → slabs from payment_plan_detail.slabs
    if (
      qdata.payment_plan_type === "MASTER" &&
      qdata.payment_plan_detail &&
      Array.isArray(qdata.payment_plan_detail.slabs)
    ) {
      return qdata.payment_plan_detail.slabs.map((slab) => {
        const pct = Number(slab.percentage || 0) || 0;
        const amount = netBase ? (netBase * pct) / 100 : 0;
        return {
          key: slab.id || slab.order_index,
          name: slab.name,
          percentage: pct,
          amount,
          due: slab.days != null ? `${slab.days} days` : "-",
        };
      });
    }

    // CUSTOM plan → custom_payment_plan array
    if (
      qdata.payment_plan_type === "CUSTOM" &&
      Array.isArray(qdata.custom_payment_plan)
    ) {
      return qdata.custom_payment_plan.map((row, idx) => {
        const pct = Number(row.percentage || 0) || 0;
        const amount =
          row.amount != null && row.amount !== ""
            ? Number(row.amount)
            : netBase
            ? (netBase * pct) / 100
            : 0;
        return {
          key: idx,
          name: row.name,
          percentage: pct,
          amount,
          due: row.due_date || "-",
        };
      });
    }

    return [];
  }, [qdata]);

  if (loading) {
    return (
      <div className="qp-page">
        <div className="qp-inner qp-inner-loading">Loading…</div>
      </div>
    );
  }

  if (error || !qdata) {
    return (
      <div className="qp-page">
        <div className="qp-inner qp-inner-loading">
          {error || "Quotation not found."}
        </div>
      </div>
    );
  }

  const {
    quotation_no,
    date,
    valid_till,
    prepared_by_name,
    prepared_by_username,

    customer_name,
    customer_contact_person,
    customer_phone,
    customer_email,

    project_name,
    tower_name,
    floor_number,
    unit_no,

    base_area_sqft,
    base_rate_psf,
    base_value,
    discount_amount,
    net_base_value,

    additional_charges_total,
    additional_charges_detail,
    gst_percent,
    gst_amount,
    stamp_duty_percent,
    stamp_duty_amount,
    registration_amount,
    legal_fee_amount,

    net_payable_amount,
    terms_and_conditions,
  } = qdata;

  const charges = Array.isArray(additional_charges_detail)
    ? additional_charges_detail
    : [];

  const taxRows = [
    gst_amount
      ? {
          label: `GST (${gst_percent || "-"}%)`,
          amount: gst_amount,
        }
      : null,
    stamp_duty_amount
      ? {
          label: `Stamp Duty (${stamp_duty_percent || "-"}%)`,
          amount: stamp_duty_amount,
        }
      : null,
    registration_amount
      ? {
          label: "Registration Fees",
          amount: registration_amount,
        }
      : null,
    legal_fee_amount
      ? {
          label: "Legal Fees",
          amount: legal_fee_amount,
        }
      : null,
  ].filter(Boolean);

  const termsLines = (terms_and_conditions || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const preparedDisplay = prepared_by_name || prepared_by_username || "-";

  // ---- totals for summary card ----
  const nbv = Number(net_base_value || 0) || 0;
  const addTotal = Number(additional_charges_total || 0) || 0;

  const amountBeforeTaxes = nbv + addTotal;

  const totalTaxes =
    (Number(gst_amount || 0) || 0) +
    (Number(stamp_duty_amount || 0) || 0) +
    (Number(registration_amount || 0) || 0) +
    (Number(legal_fee_amount || 0) || 0);

  // prefer backend net_payable_amount, else compute
  const finalAmountToShow =
    net_payable_amount != null
      ? Number(net_payable_amount)
      : amountBeforeTaxes + totalTaxes;

  return (
    <div className="qp-page">
      <div className="qp-inner">
        {/* ============= HEADER ============= */}
        <section className="qp-section qp-section-header">
          <h1 className="qp-title">Quotation Details</h1>

          <div className="qp-header-row">
            <div className="qp-header-left">
              <div className="qp-meta-line">
                <span className="qp-meta-label">Quote ID:&nbsp;</span>
                <span className="qp-meta-value">
                  {quotation_no || `#${qdata.id}`}
                </span>
              </div>
              <div className="qp-meta-line">
                <span className="qp-meta-label">Date:&nbsp;</span>
                <span className="qp-meta-value">{date || "-"}</span>
              </div>
              <div className="qp-meta-line">
                <span className="qp-meta-label">Valid Until:&nbsp;</span>
                <span className="qp-meta-value">{valid_till || "-"}</span>
              </div>
            </div>

            <div className="qp-header-right">
              <span className="qp-meta-label">Prepared By:&nbsp;</span>
              <span className="qp-meta-value">
                {preparedDisplay !== "-"
                  ? `Sales Executive: ${preparedDisplay}`
                  : "-"}
              </span>
            </div>
          </div>
        </section>

        {/* ============= CUSTOMER & UNIT ============= */}
        <section className="qp-section">
          <h2 className="qp-section-title">Customer &amp; Unit</h2>

          <div className="qp-panel qp-panel-soft">
            <div className="qp-cust-name">
              {customer_name || customer_contact_person || "-"}
            </div>
            <div className="qp-cust-address">
              {customer_phone || customer_email
                ? `${customer_phone || ""}${
                    customer_phone && customer_email ? " • " : ""
                  }${customer_email || ""}`
                : "Contact details not available"}
            </div>

            <div className="qp-cust-grid">
              <div className="qp-cust-col">
                <div className="qp-label-value">
                  <span className="qp-label">Project:&nbsp;</span>
                  <span className="qp-value">{project_name || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Unit No:&nbsp;</span>
                  <span className="qp-value">{unit_no || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Base Area:&nbsp;</span>
                  <span className="qp-value">
                    {base_area_sqft ? `${fmt(base_area_sqft)} sq. ft.` : "-"}
                  </span>
                </div>
              </div>

              <div className="qp-cust-col qp-cust-col-right">
                <div className="qp-label-value">
                  <span className="qp-label">Tower:&nbsp;</span>
                  <span className="qp-value">{tower_name || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Floor:&nbsp;</span>
                  <span className="qp-value">{floor_number || "-"}</span>
                </div>
                <div className="qp-label-value">
                  <span className="qp-label">Carpet Area:&nbsp;</span>
                  <span className="qp-value">
                    {/* if later you have separate carpet, replace this */}
                    {base_area_sqft ? `${fmt(base_area_sqft)} sq. ft.` : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============= PRICING BREAKDOWN ============= */}
        <section className="qp-section">
          <h2 className="qp-section-title">Pricing Breakdown</h2>

          <div className="qp-panel">
            <table className="qp-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="qp-align-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Base Rate{" "}
                    {base_area_sqft && base_rate_psf
                      ? `(${fmt(base_area_sqft)} sq. ft. @ ₹ ${fmt(
                          base_rate_psf
                        )}/sq. ft.)`
                      : ""}
                  </td>
                  <td className="qp-align-right">
                    {base_value ? fmt(base_value) : "-"}
                  </td>
                </tr>

                {discount_amount ? (
                  <tr>
                    <td>Discount</td>
                    <td className="qp-align-right">({fmt(discount_amount)})</td>
                  </tr>
                ) : null}

                {charges.map((ch) => (
                  <tr key={ch.id}>
                    <td>{ch.name}</td>
                    <td className="qp-align-right">
                      {ch.amount ? fmt(ch.amount) : "-"}
                    </td>
                  </tr>
                ))}

                <tr className="qp-row-net">
                  <td className="qp-net-label">Net Base Value</td>
                  <td className="qp-align-right qp-net-amount">
                    {net_base_value ? fmt(net_base_value) : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ============= TAXES & STATUTORY + SUMMARY ============= */}
        <section className="qp-section">
          <h2 className="qp-section-title">Taxes &amp; Statutory</h2>

          <div className="qp-panel">
            <table className="qp-table">
              <thead>
                <tr>
                  <th>Tax Type</th>
                  <th className="qp-align-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {taxRows.length ? (
                  taxRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.label}</td>
                      <td className="qp-align-right">{fmt(row.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="qp-align-right">
                      No taxes applied
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ONE SINGLE SUMMARY CARD – includes Total Taxes + Final Amount */}
          <div className="qp-summary-card">
            <div className="qp-summary-row">
              <span>Net Base Value</span>
              <span className="qp-summary-amount">
                {nbv ? fmt(nbv) : "0.00"}
              </span>
            </div>

            <div className="qp-summary-row">
              <span>Additional Charges Total</span>
              <span className="qp-summary-amount">
                {addTotal ? fmt(addTotal) : "0.00"}
              </span>
            </div>

            <div className="qp-summary-row">
              <span>Amount Before Taxes</span>
              <span className="qp-summary-amount">
                {amountBeforeTaxes ? fmt(amountBeforeTaxes) : "0.00"}
              </span>
            </div>

            <div className="qp-summary-row">
              <span>Total Taxes</span>
              <span className="qp-summary-amount">
                {totalTaxes ? fmt(totalTaxes) : "0.00"}
              </span>
            </div>

            <div className="qp-summary-row qp-summary-row-final">
              <span>Final Amount (Incl. Taxes)</span>
              <span className="qp-summary-amount">
                {finalAmountToShow ? fmt(finalAmountToShow) : "0.00"}
              </span>
            </div>
          </div>
        </section>

        {/* ============= PAYMENT PLAN SCHEDULE ============= */}
        <section className="qp-section">
          <h2 className="qp-section-title">Payment Plan Schedule</h2>

          <div className="qp-panel">
            <table className="qp-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th className="qp-align-right">Percentage</th>
                  <th className="qp-align-right">Amount (INR)</th>
                  <th className="qp-align-right">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.length ? (
                  paymentRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.name}</td>
                      <td className="qp-align-right">
                        {row.percentage != null ? `${row.percentage}%` : "-"}
                      </td>
                      <td className="qp-align-right">{fmt(row.amount)}</td>
                      <td className="qp-align-right">{row.due}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="qp-align-right">
                      No payment plan defined
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============= TERMS & CONDITIONS ============= */}
        <section className="qp-section qp-last-section">
          <h2 className="qp-section-title">Terms &amp; Conditions</h2>

          <div className="qp-panel qp-panel-terms">
            {termsLines.length ? (
              <ul className="qp-terms-list">
                {termsLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>No terms &amp; conditions provided.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuotationPreview;
