# Khoj

Khoj is a web application that connects students of the Islamic University of Technology (IUT) with homeowners in Board Bazar, Gazipur, who rent rooms near the campus. Owners and listings are verified by an administrator before students can see them, students and owners chat in real time, and only a tenant confirmed by the owner can review a room and its owner.

Developed for SWE 4404: Software Project Lab II, Group 12.

## Features

- Student sign-up with an `@iut-dhaka.edu` e-mail and a one-time password, or with an admission rank for newly admitted students
- Homeowner registration with a Khatian certificate and house photo, approved or rejected by the administrator
- Listings posted by owners or by students, each approved by the administrator before publication
- Search by rent range, utilities and amenities, with results as cards and as pins on a map
- Real-time chat between students and owners, with read receipts and a typing indicator
- Tenant confirmation by the owner, followed by a room review on six categories and an owner rating
- Administrator dashboard for registrations, listings, users and notifications
- Responsive layout with a dark mode

## Technology

| Part | Technology |
|---|---|
| Frontend | React 19, Leaflet.js, Socket.IO client |
| Backend | Node.js, Express 5, Socket.IO, Mongoose, Multer, JSON Web Tokens, bcrypt, Nodemailer, otp-generator |
| Database | MongoDB |
| External services | Cloudinary (images and documents), Gmail SMTP (e-mail using app passwords), Google sign-in |

## Repository structure

```
backend/            Express API and Socket.IO server
  src/
    routes/         URL to middleware and controller
    middleware/     authentication, file upload, input validation
    controllers/    request handling
    services/       business rules
    models/         Mongoose schemas
    socket/         real-time chat
    utils/          shared helpers
    scripts/        one-off data migrations (not needed for a new install)
my-app/             React client
  src/
    pages/          one file per screen
    components/     shared interface components
```

## Prerequisites

- Node.js 18 or later, with npm
- MongoDB 6 or later, running locally or reachable over the network (Atlas works)
- For photo uploads: a Cloudinary account
- For e-mail (OTP and rejection notices): a Gmail account with an app password
- For Google sign-in: a Google OAuth client ID

## Setup

### 1. Install the tools and create the accounts

**Node.js 18 or later (with npm)**

Download the LTS version from nodejs.org, run the installer with the defaults, then open a new terminal and verify:

```
node -v
npm -v
```

**MongoDB 6 or later**

Pick one option. Atlas is easier because there is nothing to install.

*Option A: MongoDB Atlas (cloud)*

1. Sign up at mongodb.com/atlas.
2. Create a free M0 cluster in the region closest to you.
3. Under Database Access, create a database user with a username and password (avoid special characters in the password, or URL-encode them).
4. Under Network Access, click Add IP Address and add your current IP. For quick local testing you can allow `0.0.0.0/0`, but tighten it before going live.
5. Click Connect, then Drivers, and copy the connection string. **Remove the database name and any `?options` from the end**, because the server appends `/Khoj` itself:

```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net
```

Replace `USERNAME` and `PASSWORD` with your own values.

*Option B: Local install*

1. Download MongoDB Community Server (version 6 or higher) from mongodb.com/try/download/community.
2. On Windows, choose "Install as a Service" in the installer; it starts automatically.
3. On macOS: `brew tap mongodb/brew && brew install mongodb-community`, then `brew services start mongodb-community`.
4. Verify it is running with MongoDB Compass (optional GUI) or `mongosh`.
5. Use this connection string (host only, no database name):

```
MONGODB_URI=mongodb://127.0.0.1:27017
```

**Cloudinary account (photo uploads)**

1. Sign up for free at cloudinary.com.
2. Open the Dashboard; the Cloud name is at the top.
3. Go to Settings, then API Keys, to find the API Key and API Secret.

**Gmail with an app password (OTP and rejection e-mails)**

1. Go to myaccount.google.com/security and turn on 2-Step Verification. App passwords do not appear without it.
2. Go to myaccount.google.com/apppasswords.
3. Enter a name such as "backend" and click Create.
4. Copy the 16-character password and remove the spaces. This is `SMTP_PASS`.

**Google OAuth client ID (Google sign-in)**

1. Go to console.cloud.google.com and create a new project.
2. Open APIs & Services, then OAuth consent screen. Choose External, fill in the app name and your e-mail, and save. While in Testing mode, add your own Gmail under Test users, otherwise sign-in is blocked.
3. Open Credentials, then Create Credentials, then OAuth client ID, and choose Web application.
4. Under Authorized JavaScript origins, add `http://localhost:3000`.
5. Click Create and copy the Client ID.

Note: Google does not accept a bare IP address as an authorized origin, so Google sign-in works on `localhost` but not when the app is opened from another device at `http://<IP>:3000`. Everything else works over the LAN.

### 2. Generate the token secrets

`ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are long random strings used by `jsonwebtoken` to sign tokens. Run this twice, once for each secret, and paste the output into `backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never paste a real secret into a website such as jwt.io.

### 3. Backend environment

Copy the template and fill in the values:

```
cp backend/.env.sample backend/.env
```

| Variable | Purpose |
|---|---|
| `PORT` | API port, normally `8000` |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB **host only**, for example `mongodb://127.0.0.1:27017`. The database name `Khoj` (case-sensitive) is added by the server, so do not include one. |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY` | Signing secret and lifetime of the access token, for example `1d` |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY` | Signing secret and lifetime of the refresh token, for example `10d` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials, needed for photo and document uploads (house registration, creating a post). Login, browsing and chat work with these blank. |
| `CLIENT_ID` | Google OAuth client ID |
| `ADMIN_KEY` | The key the administrator uses to log in |
| `SMTP_USER`, `SMTP_PASS` | Gmail address and app password for OTP and rejection e-mails. Not yet listed in `.env.sample`; add them manually. |
| `CORS_ORIGIN` | Optional. Comma-separated extra origins allowed to call the API. Local and private network addresses are always allowed. Not yet listed in `.env.sample`. |

### 4. Frontend environment

```
cp my-app/.env.sample my-app/.env
```

| Variable | Purpose |
|---|---|
| `REACT_APP_GOOGLE_CLIENT_ID` | Same value as `CLIENT_ID` in the backend |
| `REACT_APP_API_URL` | Optional. Origin of the API (no trailing slash, no `/api`) if it is not on the same host as the client. By default the client uses port 8000 on the host it was loaded from. Not yet listed in `.env.sample`. |

Restart the frontend after changing `my-app/.env`; Create React App reads it only at start-up.

## Build and run

### Start MongoDB first

**Atlas (cloud):** Nothing to start. The cluster is always running. Just make sure your current IP is allowed under Network Access.

**Local install (Windows):** If you chose "Install as a Service" in the installer, MongoDB is already running and starts automatically with Windows. To check or start it, open PowerShell as Administrator:

```
net start MongoDB
```

### Start the backend and frontend

Then, in two terminals:

```
cd backend
npm install
npm run dev
```

The API and the chat server listen on port 8000.

```
cd my-app
npm install
npm start
```

The application opens at `http://localhost:3000`. Other devices on the same network can open `http://<this-computer's-IP>:3000`; the client finds the API on the same host automatically.

To build the client for deployment:

```
cd my-app
npm run build
```

The output is written to `my-app/build/`.

## First use

1. Open the login page, choose Admin and enter the `ADMIN_KEY`.
2. Register a homeowner from the owner registration page. Approve it from the administrator dashboard.
3. Log in as the owner with the Khatian number and password, and post a listing. Approve it from the dashboard.
4. Sign up as a student with an IUT e-mail. The listing now appears on the student dashboard and map.

## Testing

There are no automated tests in the repository yet. `npm test` in `my-app` starts the Create React App test runner, which finds no test files.

The system was tested manually through the interface in each role:

1. Student sign-up with OTP, including a wrong and an expired code
2. Owner registration, then approval and rejection by the administrator (the rejected owner receives the reason by e-mail)
3. Owner listing and student listing, then approval
4. Filters by rent, utilities and amenities, and the map view
5. Chat between a student and the owner in two browsers or on two devices
6. Owner marks the listing Rented and selects the student who messaged; that student writes a room and owner review; a second student cannot
7. Invalid input: phone numbers, coordinates, rent ranges, file types and sizes

The API was also checked with 35 scripted HTTP requests against a separate test database; the results are in the final report (Appendix C).

## Known issues

- The administrator routes under `/api/admin` do not yet require the administrator token.
- Google sign-in trusts the e-mail sent by the browser; the Google ID token is not yet verified on the server.
- An owner whose registration is pending or rejected can still log in.
- The filter API answers HTTP 404 instead of an empty list when nothing matches (the dashboard shows an empty result).

## Team

| Name | Student ID |
|---|---|
| Talha Zubayer | 230042119 |
| Ayman Rahman Bhuiyan | 230042140 |
| Md Nadid Hasan Khan | 230042146 |

## Licence

No open-source licence. All rights reserved by the team.
