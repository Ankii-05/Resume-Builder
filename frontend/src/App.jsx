import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from "./pages/Dashboard";
import ATSChecker from "./pages/ATSChecker";
import AuthCallback from "./pages/AuthCallback";
import EditResume from "./components/EditResume";
import ProtectedRoute from "./components/ProtectedRoute";
import UserProvider from "./context/userContext";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminResumes from "./pages/admin/AdminResumes";
import AdminResumeDetail from "./pages/admin/AdminResumeDetail";
import AdminAtsLogs from "./pages/admin/AdminAtsLogs";
import AdminAtsDomains from "./pages/admin/AdminAtsDomains";

const authShell = "min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center p-4";

const App = () => {
  return (
    <UserProvider>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <div className={authShell}>
                <Login />
              </div>
            }
          />
          <Route
            path="/signUp"
            element={
              <div className={authShell}>
                <SignUp />
              </div>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ats-checker"
            element={
              <ProtectedRoute>
                <ATSChecker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/:resumeId"
            element={
              <ProtectedRoute>
                <EditResume />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetail />} />
              <Route path="resumes" element={<AdminResumes />} />
              <Route path="resumes/:id" element={<AdminResumeDetail />} />
              <Route path="ats-domains" element={<AdminAtsDomains />} />
              <Route path="ats-logs" element={<AdminAtsLogs />} />
            </Route>
          </Route>
        </Routes>
      </div>
      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "13px",
          },
        }}
      />
    </UserProvider>
  );
};

export default App;
