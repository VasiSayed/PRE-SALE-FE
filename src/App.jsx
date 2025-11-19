import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MasterLayout from "./layouts/MasterLayout";
import ProjectsList from "./pages/Setup/ProjectsList";
import SetupPage from "./pages/Setup/SetupPage";
import LeadSetupPage from "./pages/LeadSetup/LeadSetupPage";
import Auth from "./features/auth/Auth";
import Dashboard from "./pages/Dashboard/Dashboard";

import MyBookings from "./pages/Booking/MyBookings";
import BookingDetail from "./pages/Booking/BookingDetail";

import LeadsList from "./pages/PreSalesCRM/Leads/LeadsList";
import LeadStaticPage from "./pages/PreSalesCRM/Leads/LeadStaticPage";
import SaleAddLead from "./pages/PreSalesCRM/Leads/SaleAddLead";
import KycReview from "./pages/Booking/KycReview";

import InventoryList from "./pages/Inventory/InventoryList";
import InventoryCreate from "./pages/Inventory/InventoryCreate";
import InventoryPlanning from "./pages/Inventory/InventoryPlanning";
import InventoryUnitDetail from "./pages/Inventory/InventoryUnitDetail";
import ChannelPartnerPage from "./pages/ChannelPartner/ChannelPartnerPage";
import ChannelPartnerRegistration from "./pages/ChannelPartner/ChannelPartnerRegistration";
import BookingForm from "./pages/Booking/BookingForm";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Auth />} />
          <Route path="/booking/kyc-review" element={<KycReview />} />

          {/* Protected Routes with MasterLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MasterLayout />}>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Projects */}
              <Route path="/sales/projects" element={<ProjectsList />} />

              {/* Master Setup */}
              <Route path="/setup" element={<SetupPage />} />

              {/* Lead Setup */}
              <Route path="/lead-setup" element={<LeadSetupPage />} />

              <Route path="/leads/:id" element={<LeadStaticPage />} />
              <Route path="/leads/new" element={<SaleAddLead />} />
              <Route path="/leads" element={<LeadsList />} />

              <Route path="/sales/inventory" element={<InventoryList />} />
              <Route
                path="/sales/inventory/new"
                element={<InventoryCreate />}
              />

              <Route
                path="/inventory-planning"
                element={<InventoryPlanning />}
              />

              <Route
                path="/inventory/unit/:unitId"
                element={<InventoryUnitDetail />}
              />

              <Route
                path="/channel-partner-setup"
                element={<ChannelPartnerPage />}
              />

              <Route
                path="/channel-partner-add"
                element={<ChannelPartnerRegistration />}
              />

              <Route path="/booking/form" element={<BookingForm />} />
              <Route path="/booking/list" element={<MyBookings />} />
              <Route path="/booking/:id" element={<BookingDetail />} />
              <Route path="/booking/form" element={<BookingForm />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
