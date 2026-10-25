# EHRJ MADRASHA ERP — PHASE 26 RUN & RELEASE GUIDE
**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP  
**Target Environment:** Local Development, Staging & Production Readiness  
**Document Revision:** 2.0 (Phase 26 Controlled Release)  

---

## 1. Local Application Execution & Active Services

The application environment is pre-configured and currently active with the following local services:

### Active Local Endpoints

1. **Development Web Server:**
   - **Local URL:** `http://localhost:3000`
   - **Service Command:** `npm run dev`
   - **Active Process:** PID `7304` (Listening on port 3000)
   - **Target Database:** Local SQLite (`prisma/dev.db`, read-only safe)
   - **Access Steps:** Open any web browser and navigate to `http://localhost:3000`

2. **Isolated Staging Web Server:**
   - **Local URL:** `http://localhost:3001`
   - **Service Command:** `npm run start:staging` (Uses `.next_staging` directory)
   - **Active Process:** PID `3936` (Listening on port 3001)
   - **Target Database:** PostgreSQL 18.4 Staging Database on port 5432
   - **Access Steps:** Navigate to `http://localhost:3001`

3. **Staging Database Engine:**
   - **Port:** `5432`
   - **Process:** PID `11392` (`postgres.exe`)
   - **Credentials:** Sourced safely from `.env.staging` (Redacted)

---

## 2. Default Access Personas (Local & Staging)

For local evaluation, the following pre-seeded test personas are available in the staging environment:

| Role | Username / Identifier | Access Route | Functional Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `/admin` | Complete 43-tab administrative command center |
| **Principal** | `principal` | `/principal` | Institutional oversight, staff review, approvals |
| **Teacher** | `teacher1` | `/teacher` | Attendance recording, examination marks entry |
| **Guardian / Student**| `guardian1` | `/portal` | Academic results, student fees, notice receipts |
| **General Public** | Unauthenticated | `/`, `/academic`, `/results` | Public website, admissions, result search, verification |

---

## 3. Flutter Mobile Application Execution Guide

To run or build the Flutter mobile client:

### Running on Android Emulator / Physical Device
```powershell
cd "d:\Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication\ehrj_flutter_app"
flutter pub get
flutter run
```

### Building Debug APK
```powershell
flutter build apk --debug
```
*Note: Debug APK will be output to `ehrj_flutter_app/build/app/outputs/flutter-apk/app-debug.apk`.*

### Production Android Release Checklist (Institutional)
To build the official signed production Android App Bundle (AAB):
1. **Keystore Generation:** Generate an official institutional keystore file (e.g. `ehrj-release.keystore`) on an offline secure machine:
   ```bash
   keytool -genkey -v -keystore ehrj-release.keystore -alias ehrj-madrasha -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Key Properties:** Configure `key.properties` inside `ehrj_flutter_app/android/` with the keystore path and passwords. *Never commit this file to Git.*
3. **Build Bundle:**
   ```bash
   flutter build appbundle --release
   ```

---

## 4. Production Web Deployment Checklist

Before initiating production cutover to public domains:

1. **Environment Configuration:**
   - Create production `.env.production` containing production PostgreSQL credentials, production JWT secrets, and production base URL.
2. **Reverse Proxy & TLS:**
   - Configure Nginx or Caddy with Let's Encrypt automated TLS certificates for `https://ehrjmadrasha.edu.bd` (or institutional domain).
3. **Process Supervision:**
   - Use PM2 or systemd unit to supervise the Next.js production process:
     ```bash
     pm2 start npm --name "ehrj-erp" -- run start
     ```
4. **External Gateways (Owner Action Required):**
   - Acquire and input live merchant credentials for bKash, Nagad, and Rocket.
   - Acquire and configure live Bangladeshi SMS gateway API credentials for parent notifications.
