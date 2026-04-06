RESUME BUILDER

- Backend: `cd backend && npm start` — unit tests: `cd backend && npm test`
- Frontend: `cd frontend && npm run dev`

### Google OAuth / port 8000

If **`php artisan serve`** or another app uses **port 8000**, Node cannot own that port — Google will hit PHP and you get **404** on `/google/callback`. Use **`PORT=8080`** in `backend/.env`, set **`GOOGLE_REDIRECT_URI=http://127.0.0.1:8080/google/callback`**, add that URL in **Google Cloud → OAuth redirect URIs**, and set **`VITE_API_URL=http://127.0.0.1:8080/`** in `frontend/.env.development`.

Sanity check: open **`http://127.0.0.1:<PORT>/health`** — you must see JSON `{"status":"ok",...}` from Node, not an HTML error page.
