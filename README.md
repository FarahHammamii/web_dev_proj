# Full‑Stack Platform — Backend & Frontend

## Overview

This repository contains a **full‑stack web platform** composed of:

* **Backend**: RESTful API built with Express, MongoDB, and supporting services (authentication, messaging, notifications, job offers, AI integration).
* **Frontend**: Web client that consumes the backend API and provides the user interface.

Both parts live in the **same repository** but must be run **independently** in separate terminals.

---

## Prerequisites

Before starting, make sure you have:

* Node.js
* npm
* MongoDB access (local or cloud)

---

## Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/FarahHammamii/web_dev_proj
```

---

## Backend Setup
Navigate to the backend directory and follow all instructions presented under /backend/README.md

### Backend Verification

Once the backend is running, you can verify it via Swagger API documentation:

```
http://localhost:8081/api-docs/
```

If Swagger loads, the backend is running correctly.
Swagger documentation will give you a better idea about our endpoints , allowing you to test them in a practical way.

---

## Frontend Setup

1. Open a **new terminal window** (keep the backend running).

2. Navigate to the frontend directory

```bash
cd frontend
```

3. Install frontend dependencies:

```bash
npm install
#in case of conflicts it's safe to use audit fix and be left with moderate vulnerabilities that wouldnt affect the workflow
npm audit fix 
```

4. Start the frontend application:

```bash
npm run dev

```

### Frontend Access

Once started, the frontend will be available at:

```
http://localhost:8080
```

---

## Running the Project (Important)

* The **backend and frontend must run simultaneously**.
* Use **two separate terminals**:

  * Terminal 1 → Backend (port 8081)
  * Terminal 2 → Frontend (port 8080)

---

## Notes

* Always start the **backend first** before the frontend.
* Ensure ports `8080` and `8081` are free.
* Never commit sensitive `.env` files.

---

## Project Structure (in a nutshell)

```
/
├── backend/
│   ├── server.js
│   ├── app.js
│   └── ...
│
├── frontend/
│   ├── src/
│   └── ...
└── README.md
```

---

This setup ensures a clean separation between backend services and frontend UI while keeping the project unified in a single repository.
