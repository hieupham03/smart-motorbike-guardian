import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import AppLayout from "./components/layout/AppLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DevicesPage from "./pages/DevicesPage";
import GpsMapPage from "./pages/GpsMapPage";
import AlertsPage from "./pages/AlertsPage";
import CommandHistoryPage from "./pages/CommandHistoryPage";
import UsersPage from "./pages/UsersPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
const TelemetryAnalyticsPage = lazy(
  () => import("./pages/TelemetryAnalyticsPage"),
);
const DeveloperPage = lazy(() => import("./pages/DeveloperPage"));
function Deferred({ children }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="notice notice-info">
          Đang mở trang…
        </p>
      }
    >
      {children}
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="map" element={<GpsMapPage />} />
              <Route
                path="analytics"
                element={
                  <Deferred>
                    <TelemetryAnalyticsPage />
                  </Deferred>
                }
              />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="commands" element={<CommandHistoryPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="developer"
                element={
                  <Deferred>
                    <DeveloperPage />
                  </Deferred>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
