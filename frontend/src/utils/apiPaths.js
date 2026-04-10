/** Production API (Render). Override with VITE_API_URL in .env / Vercel env for previews. */
const PRODUCTION_API = "https://resumexpert-04tt.onrender.com/";

export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API : "http://127.0.0.1:8080/");

//utils/apiPath.js
export const API_PATHS = {

    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GET_PROFILE: "/api/auth/profile",
        VERIFY: "/api/auth/verify",
        LOGOUT: "/api/auth/logout",
        GOOGLE: "/api/auth/google",
    },
    RESUME: {
        CREATE: "/api/resume",
        GET_ALL: "/api/resume",
        GET_BY_ID: (id) => `/api/resume/${id}`,
        UPDATE: (id) => `/api/resume/${id}`,
        DELETE: (id) => `/api/resume/${id}`,
        UPLOAD_IMAGES: (id) => `/api/resume/${id}/upload-images`,
    },
    ATS: {
        CHECK: "/api/ats/check",
        DOMAINS: "/api/ats/domains",
    },
    ADMIN: {
        STATS: "/api/admin/stats",
        STATS_MONTHLY: "/api/admin/stats/monthly",
        STATS_RECENT_ATS: "/api/admin/stats/recent-ats",
        STATS_RECENT_RESUMES: "/api/admin/stats/recent-resumes",
        STATS_DOMAIN_USAGE: "/api/admin/stats/domain-usage",
        USERS: "/api/admin/users",
        USER_CREATE: "/api/admin/users/create",
        USER: (id) => `/api/admin/users/${id}`,
        RESUMES: "/api/admin/resumes",
        RESUME: (id) => `/api/admin/resumes/${id}`,
        ATS_LOGS: "/api/admin/ats-logs",
        ATS_DOMAINS: "/api/admin/ats-domains",
        ATS_DOMAIN: (id) => `/api/admin/ats-domains/${id}`,
    },
    RESUME_DOWNLOAD: (id) => `/api/resume/${id}/download`,
    image: {
        UPLOAD_IMAGE: "api/auth/upload-image",
    },
};