import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/userContext";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { landingPageStyles } from "../assets/dummystyle";

const ERROR_MESSAGES = {
  google_auth_failed: "Google sign-in was cancelled or failed.",
  token_error: "Could not complete sign-in. Please try again.",
  google_not_configured:
    "Google sign-in is not set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.",
  database_unavailable:
    "The server could not reach MongoDB. Check MONGODB_URI in backend/.env, Atlas Network Access (allow your IP), and that your cluster hostname is correct.",
  session: "Your session could not be loaded. Please sign in again.",
};

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);
  const [status, setStatus] = useState("Signing you in…");

  const token = searchParams.get("token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      const msg = ERROR_MESSAGES[error] || "Something went wrong.";
      setStatus(msg);
      const t = setTimeout(
        () => navigate(`/?authError=${encodeURIComponent(error)}`),
        2200
      );
      return () => clearTimeout(t);
    }

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        localStorage.setItem("token", token);
        const { data } = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        if (cancelled) return;
        updateUser({ ...data, token });
        setStatus("Success! Redirecting…");
        navigate("/dashboard", { replace: true });
      } catch {
        if (cancelled) return;
        localStorage.removeItem("token");
        setStatus("Session could not be loaded. Redirecting…");
        setTimeout(() => navigate("/?authError=session"), 2000);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, error, navigate, updateUser]);

  return (
    <div className={landingPageStyles.container}>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700 text-center max-w-sm">
          {status}
        </p>
      </div>
    </div>
  );
}
