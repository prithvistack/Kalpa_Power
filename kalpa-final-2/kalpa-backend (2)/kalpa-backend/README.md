# Kalpa QR Asset Intelligence System

Production-ready QR asset intelligence prototype for Kalpa Power Ltd. Existing product APIs remain backward-compatible; new auth, scan, admin, seed, import, React, and Capacitor pieces are additive.

## Backend Setup

```powershell
cd "C:\Users\Asus\OneDrive\Desktop\kalpa-backend (2)\kalpa-backend\backend"
copy .env.example .env
pip install -r seed\requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://127.0.0.1:8000`.

## Backend Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `GET /product/{id}`
- `POST /scan`
- `POST /products/search`
- `POST /admin/product`
- `POST /admin/event`
- `POST /admin/generate-qr`

Use `Authorization: Bearer <token>` for protected endpoints.

## Google Sign-In

Create an OAuth 2.0 Client ID in Google Cloud Console:

- Application type: `Web application`
- Authorized JavaScript origins for local dev:
  - `http://127.0.0.1:5173`
  - `http://localhost:5173`
- Add the production origin when deploying, for example `https://kalpa.app`

Set the same client ID in both env files:

```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

The frontend receives a Google ID token, the backend verifies it with Google, then the backend issues the normal Kalpa JWT used by protected routes.

## Seed Demo Data

```powershell
cd "C:\Users\Asus\OneDrive\Desktop\kalpa-backend (2)\kalpa-backend\backend"
python seed\seed.py
```

This creates 420 assets across Transformer, Generator, UPS, Motor, Solar Panel, Cable, and Switchgear, with realistic lifecycle events and tag variation.

## Import Kalpa CSV Data

Place files in `backend\data` with these exact headers:

- `products.csv`: `product_id,qr_code,type,model,location,site,manufacture_year,installation_date,status,warranty_expiry`
- `product_models.csv`: `model,type,power_rating,voltage,efficiency,extra_specs`
- `product_events.csv`: `product_id,event_type,date,description,technician,cost`

Run:

```powershell
cd "C:\Users\Asus\OneDrive\Desktop\kalpa-backend (2)\kalpa-backend\backend"
python importer.py --data-dir data
```

Importer is idempotent by default and skips duplicate `product_id` rows.

## Frontend Setup

```powershell
cd "C:\Users\Asus\OneDrive\Desktop\kalpa-backend (2)\kalpa-backend\frontend"
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`.

Routes:

- `/login`
- `/`
- `/scanner`
- `/product/:id`
- `/admin`

QR deep link flow:

1. QR opens `https://kalpa.app/product/KPL-QR-GEN-0001`
2. App redirects unauthenticated users to `/login`
3. Login returns to the original product URL
4. Product loads through `GET /product/{id}`
5. Page logs `POST /scan`

## APK Build With Capacitor

```powershell
cd "C:\Users\Asus\OneDrive\Desktop\kalpa-backend (2)\kalpa-backend\frontend"
npm install
npm run build
npx cap add android
npx cap copy
npx cap open android
```

In Android Studio, ensure this permission exists in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

Then build the APK from Android Studio with `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
