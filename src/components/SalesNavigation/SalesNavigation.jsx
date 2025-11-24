// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import "./SalesNavigation.css";

// export default function SalesNavigation() {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [activeSection, setActiveSection] = useState("pre-sales");
//   const [activeTab, setActiveTab] = useState("dashboard");


//   const sections = [
//     { id: "pre-sales", label: "Pre Sales" },
//     { id: "post-sales", label: "Post Sales" },
//   ];

//   // Navigation items based on role
//   const getNavigationItems = () => {
//     const userRole = user?.role || "SALES";

//     // ADMIN gets full access (all items EXCEPT "Leads")
//     if (userRole === "ADMIN") {
//       return [
//         { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
//         { id: "master-setup", label: "Master Setup", route: "/setup", section: "pre-sales" },
//         { id: "inventory", label: "Inventory Tracking", route: "/sales/inventory", section: "pre-sales" },
//         { id: "lead-setup", label: "Lead Setup", route: "/lead-setup", section: "pre-sales" },
//         { id: "channel-partner", label: "Channel Partner Setup", route: "/channel-partner-setup", section: "pre-sales" },
//         { id: "sales-executive", label: "Sales Executive Setup", route: "/sales/executives", section: "pre-sales" },
//         { id: "cost-quotation", label: "Cost Sheet Quotation Setup", route: "/costsheet/templates", section: "pre-sales" },
//         { id: "document-setup", label: "Document Setup", route: "/sales/documents", section: "pre-sales" },
        
//       ]; 
//     }

//     // SALES gets limited access
//     if (userRole === "SALES") {
//       return [
//         {
//           id: "dashboard",
//           label: "Dashboard",
//           route: "/dashboard",
//           section: "pre-sales",
//         },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         {
//           id: "quotation",
//           label: "Quotation",
//           route: "/sales/quotations",
//           section: "pre-sales",
//         },
//         {
//           id: "booking",
//           label: "Booking",
//           route: "/booking/list",
//           section: "pre-sales",
//         },
//         {
//           id: "inventory",
//           label: "Inventory",
//           route: "/sales/inventory",
//           section: "pre-sales",
//         },
//         // {
//         //   id: "document",
//         //   label: "Document",
//         //   route: "/sales/documents",
//         //   section: "pre-sales",
//         // },
//         // {
//         //   id: "channel-partner",
//         //   label: "Channel Partner",
//         //   route: "/channel-partner-add",
//         //   section: "pre-sales",
//         // },
//         // {
//         //   id: "profile",
//         //   label: "Profile",
//         //   route: "/profile",
//         //   section: "pre-sales",
//         // },
//       ];
//     }

//     // RECEPTION gets specific access
//     if (userRole === "RECEPTION") {
//       return [
//         { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
//       ];
//     }

//     // CHANNEL PARTNER gets specific access
//     if (userRole === "CHANNEL PATNER") {
//       return [
//         { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
//         { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
//         { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
//         { id: "channel-partner", label: "Channel Partner Setup", route: "/channel-partner-setup", section: "pre-sales" },
//       ];
//     }

//     // Default fallback
//     return [
//       { id: "dashboard", label: "Dashboard", route: "/dashboard", section: "pre-sales" },
//       { id: "profile", label: "Profile", route: "/profile", section: "pre-sales" },
//     ];
//   };

//   const navigationItems = getNavigationItems();

//   // Filter items based on active section
//   const filteredItems = activeSection === "dashboard" 
//     ? [] 
//     : navigationItems.filter(item => item.section === activeSection);

//   const handleSectionClick = (sectionId, route) => {
//     setActiveSection(sectionId);
//     if (route) {
//       navigate(route);
//       setActiveTab("dashboard");
//     }
//   };

//   const handleTabClick = (itemId, route) => {
//     setActiveTab(itemId);
//     navigate(route);
//   };

//   return (
//     <nav className="sales-navigation">
//       {/* Primary Tabs: Dashboard / Pre/Post Sales */}
//       <div className="sales-navigation__primary">
//         {sections.map((section) => (
//           <button
//             key={section.id}
//             type="button"
//             className={`nav-section-btn ${
//               activeSection === section.id ? "active" : ""
//             }`}
//             onClick={() => handleSectionClick(section.id, section.route)}
//           >
//             {section.label}
//           </button>
//         ))}
//       </div>

//       {/* Secondary Tabs: Only show when Pre/Post Sales is active */}
//       {activeSection === "pre-sales" && (
//         <div className="sales-navigation__secondary">
//           {filteredItems.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               className={`nav-tab-btn ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => handleTabClick(item.id, item.route)}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       )}
//     </nav>
//   );
// }


import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SalesNavigation.css";

export default function SalesNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState("pre-sales");
  const [activeTab, setActiveTab] = useState("");

  const sections = [
    { id: "pre-sales", label: "Pre Sales", route: "/dashboard" },
    { id: "post-sales", label: "Post Sales", route: "/post-sales" }, // future
  ];

  const getNavigationItems = () => {
    const userRole = user?.role || "SALES";

    if (userRole === "ADMIN") {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        {
          id: "master-setup",
          label: "Master Setup",
          route: "/setup",
          section: "pre-sales",
        },
        {
          id: "inventory",
          label: "Inventory Tracking",
          route: "/sales/inventory",
          section: "pre-sales",
        },
        {
          id: "lead-setup",
          label: "Lead Setup",
          route: "/lead-setup",
          section: "pre-sales",
        },
        {
          id: "channel-partner",
          label: "Channel Partner Setup",
          route: "/channel-partner-setup",
          section: "pre-sales",
        },
        {
          id: "sales-executive",
          label: "Sales Executive Setup",
          route: "/sales/executives",
          section: "pre-sales",
        },
        {
          id: "cost-quotation",
          label: "Cost Sheet Quotation Setup",
          route: "/costsheet/templates",
          section: "pre-sales",
        },
        {
          id: "document-setup",
          label: "Document Setup",
          route: "/sales/documents",
          section: "pre-sales",
        },
      ];
    }

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
          id: "site-visit",
          label: "Site Visit",
          route: "/sales/lead/site-visit",
          section: "pre-sales",
        },
        {
          id: "Documents",
          label: "Documents",
          route: "/documents",
          section: "pre-sales",
        },
        {
          id: "quotation",
          label: "Quotation",
          route: "/costsheet",
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
      ];
    }

    if (userRole === "RECEPTION") {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "profile",
          label: "Profile",
          route: "/profile",
          section: "pre-sales",
        },
      ];
    }

    if (userRole === "CHANNEL PATNER") {
      return [
        {
          id: "dashboard",
          label: "Dashboard",
          route: "/dashboard",
          section: "pre-sales",
        },
        { id: "leads", label: "Leads", route: "/leads", section: "pre-sales" },
        {
          id: "profile",
          label: "Profile",
          route: "/profile",
          section: "pre-sales",
        },
        {
          id: "channel-partner",
          label: "Channel Partner Setup",
          route: "/channel-partner-setup",
          section: "pre-sales",
        },
      ];
    }

    return [
      {
        id: "dashboard",
        label: "Dashboard",
        route: "/dashboard",
        section: "pre-sales",
      },
      {
        id: "profile",
        label: "Profile",
        route: "/profile",
        section: "pre-sales",
      },
    ];
  };

  const navigationItems = useMemo(() => getNavigationItems(), [user?.role]);

  const filteredItems = navigationItems.filter(
    (item) => item.section === activeSection
  );

  const handleSectionClick = (sectionId, route) => {
    setActiveSection(sectionId);
    if (route) navigate(route);
  };

  const handleTabClick = (itemId, route) => {
    setActiveTab(itemId);
    navigate(route);
  };

  // 🔹 keep active tab in sync with current URL
  useEffect(() => {
    const path = location.pathname;

    // right now everything you showed is in pre-sales
    setActiveSection("pre-sales");

    const match = navigationItems.find((item) => {
      if (path === item.route) return true;

      if (item.id === "leads" && path.startsWith("/leads")) return true;
      if (item.id === "booking" && path.startsWith("/booking")) return true;
      if (item.id === "inventory" && path.startsWith("/sales/inventory"))
        return true;
      if (item.id === "quotation" && path.startsWith("/sales/quotations"))
        return true;

      return false;
    });

    if (match) {
      setActiveTab(match.id);
    } else if (path === "/" || path.startsWith("/dashboard")) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("");
    }
  }, [location.pathname, navigationItems]);

  return (
    <nav className="sales-navigation">
      {/* Primary: Pre / Post Sales */}
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

      {/* Secondary tabs */}
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
