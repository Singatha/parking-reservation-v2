import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/auth-context.jsx";
import { AppShell } from "./components/layout/app-shell.jsx";
import { AuthPage } from "./pages/auth-page.jsx";
import { ParkingPage } from "./pages/parking-page.jsx";
import { VehiclesPage } from "./pages/vehicles-page.jsx";
import { VehicleFormPage } from "./pages/vehicle-form-page.jsx";
import { ReservationsPage } from "./pages/reservations-page.jsx";
import { ReservationFormPage } from "./pages/reservation-form-page.jsx";
import { InvoicesPage } from "./pages/invoices-page.jsx";
import { InvoiceDetailPage } from "./pages/invoice-detail-page.jsx";
import { ProfilePage } from "./pages/profile-page.jsx";
import { ManageSpacesPage } from "./pages/manage-spaces-page.jsx";
import { SpaceFormPage } from "./pages/space-form-page.jsx";

function ProtectedRoutes() {
  const { user, checkingSession } = useAuth();

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-content-center gap-4 bg-neutral-50 text-center dark:bg-neutral-950">
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-neutral-950 text-sm font-bold text-white dark:bg-white dark:text-neutral-950">P</div>
        <p className="text-sm text-neutral-500">Restoring your session…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/parking" replace />;
}

export default function App() {
  const { user, checkingSession } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!checkingSession && user ? <Navigate to="/parking" replace /> : <AuthPage />}
      />
      <Route element={<ProtectedRoutes />}>
        <Route index element={<Navigate to="/parking" replace />} />
        <Route path="/parking" element={<ParkingPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/new" element={<ReservationFormPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/spaces" element={<AdminRoute><ManageSpacesPage /></AdminRoute>} />
        <Route path="/admin/spaces/new" element={<AdminRoute><SpaceFormPage /></AdminRoute>} />
        <Route path="/admin/spaces/:id/edit" element={<AdminRoute><SpaceFormPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
