export const BASE_URL = "http://localhost:4000"

// router used for frontend
export const API_PATHS = {
    AUTH: {
        REGISTER: '/register',
        LOGIN: '/login',
        GET_PROFILE: '/profile'
    },
    RESUME: {
        CREATE: '/resume',
        GET_ALL: '/resume',
        GET_BY_ID: (id) => `/resume/${id}`,
        
        UPDATE: (id) => `/resume${id}`,
        DELETE: (id) => `/resume${id}`,
        UPLOAD_IMAGES: (id) => `/resume/${id}/upload-images`,
    },
    image: {
          UPLOAD_IMAGE: '/upload-image'
    }
}