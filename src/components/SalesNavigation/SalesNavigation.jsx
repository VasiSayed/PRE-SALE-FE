import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SalesNavigation.css";

export default function SalesNavigation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("pre-sales");
  const [activeTab, setActiveTab] = useState("dashboard");


  const sections = [
    { id: "pre-sales", label: "Pre Sales" },
    { id: "post-sales", label: "Post Sales" },
  ];

  // Navigation items based on role
  const getNavigationItems = () => {
    const userRole = user?.role || "SALES";

    // ADMIN gets full access (all items EXCEPT "Leads")
    if (userRole === "ADMIN") {
      return [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "master-setup", label: "Master Setup", route: "/setup", section: "pre-sales" },
        { id: "inventory", label: "Inventory Tracking", route: "/sales/inventory", section: "pre-sales" },
        { id: "lead-setup", label: "Lead Setup", route: "/lead-setup", section: "pre-sales" },
        { id: "channel-partner", label: "Channel Partner Setup", route: "/channel-partner-setup", section: "pre-sales" },
        { id: "sales-executive", label: "Sales Executive Setup", route: "/sales/executives", section: "pre-sales" },
        { id: "cost-quotation", label: "Cost Sheet Quotation Setup", route: "/sales/quotations", section: "pre-sales" },
        { id: "document-setup", label: "Document Setup", route: "/sales/documents", section: "pre-sales" },
      ]; 
    }

    // SALES gets limited access
    if (userRole === "SALES") {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "quotation",
          label: "Quotation",
          route: "/sales/quotations",
          section: "pre-sales",
        },
        {
          id: "booking",
          label: "Booking",
          route: "/booking/list",
          section: "pre-sales",
        },
        {
          id: "inventory",
          label: "Inventory",
          route: "/sales/inventory",
          section: "pre-sales",
        },
        // {
        //   id: "document",
        //   label: "Document",
        //   route: "/sales/documents",
        //   section: "pre-sales",
        // },
        // {
        //   id: "channel-partner",
        //   label: "Channel Partner",
        //   route: "/channel-partner-add",
        //   section: "pre-sales",
        // },
        // {
        //   id: "profile",
        //   label: "Profile",
        //   route: "/profile",
        //   section: "pre-sales",
        // },
      ];
    }

    // RECEPTION gets specific access
    if (userRole === "RECEPTION") {
      return [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
      ];
    }

    // CHANNEL PARTNER gets specific access
    if (userRole === "CHANNEL PATNER") {
      return [
        { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
        { id: "channel-partner", label: "Channel Partner Setup", route: "/channel-partner-setup", section: "pre-sales" },
      ];
    }

    // Default fallback
    return [
      { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
      { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
    ];
  };

  const navigationItems = getNavigationItems();

  // Filter items based on active section
  const filteredItems = activeSection === "dashboard" 
    ? [] 
    : navigationItems.filter(item => item.section === activeSection);

  const handleSectionClick = (sectionId, route) => {
    setActiveSection(sectionId);
    if (route) {
      navigate(route);
      setActiveTab("dashboard");
    }
  };

  const handleTabClick = (itemId, route) => {
    setActiveTab(itemId);
    navigate(route);
  };

  return (
    <nav className="sales-navigation">
      {/* Primary Tabs: Dashboard / Pre/Post Sales */}
      <div className="sales-navigation__primary">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`nav-section-btn ${
              activeSection === section.id ? "active" : ""
            }`}
            onClick={() => handleSectionClick(section.id, section.route)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Secondary Tabs: Only show when Pre/Post Sales is active */}
      {activeSection === "pre-sales" && (
        <div className="sales-navigation__secondary">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleTabClick(item.id, item.route)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}