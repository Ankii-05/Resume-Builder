import React from "react";
import { Routes, Route } from "react-router-dom";
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
