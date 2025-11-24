import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ChannelPartnerProfile.css";

export default function ChannelPartnerProfile() {
  const { partnerId } = useParams();
  const navigate = useNavigate();

  // static dummy data for now
  const partner = {
    id: partnerId,
    name: "Mohit Pasi",
    company: "Innovate Solution Inc.",
    phone: "+1 (555) 123-4567",
    email: "evelyn.chen@innovate.com",
    address: "123 Technology Drive, Suite 400, San Francisco, CA 94107",
    notes:
      "Mohit is a key partner for our enterprise accounts. He is proactive, exceeds targets, and is highly responsive to new initiatives.",
  };

  const activities = [
    {
      id: 1,
      type: "Call",
      datetime: "2023-10-26 10:30 AM",
      text: "Discussed Q4 sales targets and upcoming project launch. Confirmed participation in beta program.",
    },
    {
      id: 2,
      type: "Email",
      datetime: "2023-10-25 02:15 PM",
      text: "Shared updated cost sheet and inventory snapshot.",
    },
    {
      id: 3,
      type: "Meeting",
      datetime: "2023-10-24 11:00 AM",
      text: "On-site meeting at client office. Demo of pre-sales dashboard.",
    },
    {
      id: 4,
      type: "Note",
      datetime: "2023-10-23 09:00 AM",
      text: "High potential for long-term strategic partnership.",
    },
  ];

  return (
    <div className="cp-profile-page">
      {/* Top bar / back link */}
      <header className="cp-profile-header">
        <button
          type="button"
          className="cp-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1 className="cp-profile-title">Channel Partner Profile</h1>
      </header>

      <div className="cp-profile-layout">
        {/* LEFT: avatar & basic info */}
        <div className="cp-profile-left">
          <div className="cp-profile-avatar" />
          <div className="cp-profile-basic">
            <div className="cp-profile-name">{partner.name}</div>
            <div className="cp-profile-company">{partner.company}</div>
          </div>

          <section className="cp-card cp-contact-card">
            <h2 className="cp-card-title">Contact Details</h2>
            <ul className="cp-contact-list">
              <li>
                <span className="cp-contact-icon">📞</span>
                <span>{partner.phone}</span>
              </li>
              <li>
                <span className="cp-contact-icon">✉️</span>
                <span>{partner.email}</span>
              </li>
              <li>
                <span className="cp-contact-icon">📍</span>
                <span>{partner.address}</span>
              </li>
            </ul>
          </section>
        </div>

        {/* RIGHT: notes + recent activities */}
        <div className="cp-profile-right">
          <section className="cp-card cp-notes-card">
            <div className="cp-card-header">
              <h2 className="cp-card-title">Notes</h2>
            </div>
            <p className="cp-notes-text">{partner.notes}</p>
          </section>

          <section className="cp-card cp-activities-card">
            <div className="cp-card-header">
              <h2 className="cp-card-title">Recent Activities</h2>
            </div>
            <div className="cp-activities-list">
              {activities.map((a) => (
                <details
                  key={a.id}
                  className="cp-activity-item"
                  open={a.id === 1}
                >
                  <summary className="cp-activity-summary">
                    <span className="cp-activity-type">{a.type}</span>
                    <span className="cp-activity-datetime">{a.datetime}</span>
                  </summary>
                  <p className="cp-activity-text">{a.text}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
