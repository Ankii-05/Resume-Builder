export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://resume-builder-backend-5ye0.onrender.com/";

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
    },
    image: {
        UPLOAD_IMAGE: "api/auth/upload-image",
    },
};