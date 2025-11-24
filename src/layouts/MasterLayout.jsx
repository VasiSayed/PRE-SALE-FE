import Navbar from "../features/Header/Navbar";
import Footer from "../features/Footer/Footer";
import SalesNavigation from "../components/SalesNavigation/SalesNavigation";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MasterLayout() {
  const { logout, user } = useAuth(); 

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar currentUser={user} onLogout={logout} /> {/* ✅ */}
      <SalesNavigation />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
