import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import RoleRedirect from "@/routes/RoleRedirect";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { PATHS } from "@/routes/paths";
import { ROLES } from "@/constants/roles";

// dashboards
import AdminDashboardPage from "@/features/dashboards/admin/AdminDashboardPage";
import OrganizerDashboardPage from "@/features/dashboards/organizer/OrganizerDashboardPage";
import VendorDashboardPage from "@/features/dashboards/vendor/VendorDashboardPage";
import AttendeeDashboardPage from "@/features/dashboards/attendee/AttendeeDashboardPage";

import EventsPage from "@/features/events/EventsPage";
import EventDetailPage from "@/features/events/EventDetailPage";
import CheckoutPage from "@/features/orders/CheckoutPage";
import CheckoutSuccessPage from "@/features/orders/CheckoutSuccessPage";
import ScanPage from "@/features/checkins/ScanPage";
import LiveCheckinsPage from "@/features/checkins/LiveCheckinsPage";
import EventAnalyticsPage from "@/features/analytics/EventAnalyticsPage";
import OrgAnalyticsPage from "@/features/analytics/OrgAnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path={PATHS.home} element={<EventsPage />} />

          <Route path={PATHS.dashboard} element={<RoleRedirect />} />

          {/* Admin */}
          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path={PATHS.admin} element={<AdminDashboardPage />} />
          </Route>

          {/* Organizer */}
          <Route element={<ProtectedRoute roles={[ROLES.ORGANIZER, ROLES.ADMIN]} />}>
            <Route path={PATHS.organizer} element={<OrganizerDashboardPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/analytics" element={<EventAnalyticsPage />} />
            <Route path={PATHS.checkinsLive} element={<LiveCheckinsPage />} />
          </Route>

          {/* Vendor */}
          <Route element={<ProtectedRoute roles={[ROLES.VENDOR, ROLES.ADMIN]} />}>
            <Route path={PATHS.vendor} element={<VendorDashboardPage />} />
            <Route path={PATHS.checkinsScan} element={<ScanPage />} />
          </Route>

          {/* Attendee */}
          <Route element={<ProtectedRoute roles={[ROLES.ATTENDEE, ROLES.ADMIN]} />}>
            <Route path={PATHS.attendee} element={<AttendeeDashboardPage />} />
            <Route path={PATHS.checkout} element={<CheckoutPage />} />
            <Route path={PATHS.checkoutSuccess} element={<CheckoutSuccessPage />} />
          </Route>
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
