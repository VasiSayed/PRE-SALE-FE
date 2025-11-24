import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChannelPartnerChat.css";

const dummyPartners = [
  { id: 1, name: "Mohit Pasi", status: "Online" },
  { id: 2, name: "Evelyn Chen", status: "Offline" },
  { id: 3, name: "Rahul Mehta", status: "Online" },
];

const dummyMessages = [
  {
    id: 1,
    from: "partner",
    text: "Hi, can you share the latest inventory sheet?",
  },
  { id: 2, from: "me", text: "Sure, I’ll send it across in a minute." },
  { id: 3, from: "partner", text: "Great, thank you!" },
];

export default function ChannelPartnerChat() {
  const navigate = useNavigate();
  const [selectedPartner, setSelectedPartner] = useState(dummyPartners[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  const handleProfileClick = () => {
    if (!selectedPartner) return;
    navigate(`/channel-partners/${selectedPartner.id}/profile`);
  };

  return (
    <div className="cp-chat-page">
      {/* LEFT SIDEBAR */}
      <aside className="cp-sidebar">
        <h2 className="cp-sidebar-title">Channel Partners</h2>

        <div className="cp-search-wrapper">
          <input type="text" placeholder="Search" className="cp-search-input" />
        </div>

        <div className="cp-partner-list">
          {dummyPartners.map((p) => {
            const isActive = selectedPartner?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`cp-partner-item ${isActive ? "active" : ""}`}
                onClick={() => setSelectedPartner(p)}
              >
                <div className="cp-avatar-square" />
                <div className="cp-partner-meta">
                  <span className="cp-partner-name">{p.name}</span>
                  <span
                    className={`cp-status-dot ${
                      p.status === "Online" ? "online" : "offline"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <section className="cp-chat-main">
        {/* CHAT HEADER */}
        <header className="cp-chat-header">
          <div className="cp-chat-header-left">
            <div className="cp-avatar-circle" />
            <div>
              <div className="cp-chat-name">{selectedPartner?.name}</div>
              <div className="cp-chat-status">
                {selectedPartner?.status || "Offline"}
              </div>
            </div>
          </div>

          <div className="cp-chat-header-right">
            <div className="cp-menu-wrapper">
              <button
                type="button"
                className="cp-menu-trigger"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                ⋮
              </button>

              {isMenuOpen && (
                <div className="cp-menu">
                  <button type="button" className="cp-menu-item">
                    Send E-mail
                  </button>
                  <button type="button" className="cp-menu-item">
                    Send SMS
                  </button>
                  <button
                    type="button"
                    className="cp-menu-item cp-menu-item--disabled"
                    disabled
                  >
                    Direct WhatsApp Message 🔒
                  </button>
                  <button
                    type="button"
                    className="cp-menu-item"
                    onClick={handleProfileClick}
                  >
                    Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CHAT BODY */}
        <div className="cp-chat-body">
          {dummyMessages.map((m) => (
            <div
              key={m.id}
              className={`cp-message ${
                m.from === "me"
                  ? "cp-message--outgoing"
                  : "cp-message--incoming"
              }`}
            >
              <div className="cp-message-bubble">{m.text}</div>
            </div>
          ))}
        </div>

        {/* CHAT FOOTER */}
        <footer className="cp-chat-footer">
          <button type="button" className="cp-attach-btn" title="Attach">
            📎
          </button>
          <input
            type="text"
            className="cp-message-input"
            placeholder="Type your message here..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button
            type="button"
            className="cp-send-btn"
            onClick={() => setMessageInput("")}
          >
            ➤
          </button>
        </footer>
      </section>
    </div>
  );
}
