# Smart Banking System

A full-stack, database-driven banking application. React + Vite on the
frontend, Node.js + Express + MongoDB on the backend. No demo users, no
hardcoded balances — every number on screen is read from and written to
MongoDB in real time.

---

## 1. Features

**Authentication & Roles**
- JWT auth with two roles: `member` and `admin`
- Registering as Admin requires a server-side `ADMIN_REGISTRATION_CODE` — the
  frontend can never grant admin access on its own
- Login has a "Login As" selector; the backend verifies it against the
  role actually stored in MongoDB and rejects mismatches
- `AuthContext` manages token/user state, restores sessions on refresh, and
  logs out cleanly

**Core Banking**
- Accounts: create, activate/deactivate, **Credit Money**, **Debit Money**
  (all balance changes are atomic MongoDB transactions with ownership and
  sufficient-balance checks)
- Transactions: full history with search, type filter, sorting, pagination
- Fund Transfers: atomic MongoDB session — ownership, active-status, and
  balance checks; paired transaction records; paired notifications; full
  rollback on any failure

**Money Management**
- Cards: request, activate, block/unblock, masked card numbers
- Loans: apply with live EMI calculation, status tracking
  (Pending/Approved/Rejected/Active/Completed)
- Budget: per-category monthly limits, spend calculated live from real
  transactions, over-budget warnings
- Analytics: pie/bar/line charts (spending by category, top categories,
  monthly income vs. expense trend) — all from MongoDB aggregation
- Reports: monthly/yearly/custom-range reports with CSV export

**AI & Automation**
- AI Financial Advisor & Chatbot: both call `services/aiService.js`, which
  clearly reports "AI service is not configured" if `AI_API_KEY` is empty,
  rather than faking a response. The chatbot still answers basic balance/
  spending/savings/budget questions locally without AI configured.
- Receipt Scanner: manual entry always works; OCR only activates if
  `OCR_API_KEY` is configured (never fakes OCR results)
- Fraud Detection: rule-based (large transactions, rapid transaction bursts,
  high daily spend) — runs automatically after every credit/debit/transfer

**Admin**
- Separate Admin Dashboard (`/admin`, admin-only, guarded both by frontend
  `AdminRoute` and backend `adminMiddleware`)
- Platform stats, user management (search/activate/deactivate), and
  system-wide views of accounts, transactions, transfers, loans (with
  approve/reject), and fraud alerts

**Cross-cutting**
- Every model that stores user data is scoped by `user: ObjectId`, and every
  query filters by `req.user._id` — no cross-user data leakage
- Loading / success / error / empty states on every data page
- Notification system: generated on credit, debit, transfer (both sides),
  account status changes, budget overages, loan status changes
- Responsive layout with collapsible mobile sidebar

---

## 2. Technology Stack

**Frontend:** React, Vite, React Router DOM, Tailwind CSS, Framer Motion, React Icons, Axios, Recharts
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, CORS, dotenv

---

## 3. Prerequisites

1. **Install Node.js** (18+) — https://nodejs.org
2. **Install MongoDB Community Server** — https://www.mongodb.com/try/download/community
3. **Start MongoDB**
   - macOS: `brew services start mongodb-community`
   - Windows: runs automatically as a service after install
   - Linux: `sudo systemctl start mongod`
4. **(Optional) Install MongoDB Compass** to inspect the database visually,
   and connect to `mongodb://127.0.0.1:27017`

---

## 4. Environment Setup

```bash
cp .env.example .env
```

Then edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_banking
JWT_SECRET=<put a long random string here>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

ADMIN_REGISTRATION_CODE=<pick a private code, e.g. a random phrase>

# Leave blank to run without these features - the app degrades gracefully
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AI_API_KEY=
AI_MODEL=
OCR_API_KEY=
```

The server **will not start** if `MONGO_URI`, `JWT_SECRET`, or
`ADMIN_REGISTRATION_CODE` are missing or if `JWT_SECRET` is still the
placeholder value — this is intentional, to catch the classic
`"secretOrPrivateKey must have a value"` failure mode at startup with a
clear message instead of a cryptic crash mid-request.

**Never commit `.env`.** It's already in `.gitignore`.

---

## 5. Installation & Running

```bash
npm install
```

**Terminal 1 — backend:**
```bash
npm run server
```
Expected output:
```
[MongoDB] Connected: 127.0.0.1/smart_banking
[Server] Smart Banking API running on http://localhost:5000
```

**Terminal 2 — frontend:**
```bash
npm run dev
```
Open **http://localhost:5173**.

Backend: `http://localhost:5000` · Frontend: `http://localhost:5173` ·
Database: `smart_banking` at `mongodb://127.0.0.1:27017`

---

## 6. Using the app

**Register a Member:** go to `/register`, keep "Member" selected, fill in
the form. You're logged in immediately with a ₹0 Savings account already
created.

**Register an Admin:** go to `/register`, select "Admin", and enter the
`ADMIN_REGISTRATION_CODE` from your `.env`. Wrong code → "Invalid admin
registration code."

**Login:** `/login`, pick "Login As: Member" or "Admin" — this must match
the account's real role or you'll see "Invalid role for this account."

**Credit / Debit money:** go to Accounts → click **Credit** or **Debit** on
any active account, enter an amount and optional description. Balances
update in MongoDB immediately, a transaction record and notification are
created, and the dashboard reflects the change without a manual refresh.

**Transfer money:** go to Fund Transfer, pick a source account, enter the
recipient's account number and an amount. Fails cleanly with
"Insufficient balance." if you don't have enough, or if the recipient
account doesn't exist / isn't active / is the same account.

**Budget:** go to Budget → Create Budget, pick a category + monthly limit +
month/year. Spent/remaining are calculated live from your expense
transactions in that category and month.

**Loans:** go to Loans → Apply for Loan, pick a type and amount; EMI is
previewed live before you submit. Admins approve/reject from the Admin
Dashboard → Loans tab.

**Analytics / Reports:** both pull directly from your transaction history.
With no transactions yet, Analytics shows "Not enough financial data to
generate analytics" instead of a fake chart.

**AI Advisor / Chatbot:** if `AI_API_KEY` is unset, both clearly state AI is
not configured. The chatbot still answers a few common questions (balance,
spending, savings, budgets) locally, and says so.

**Receipt Scanner:** works via manual entry always. If `OCR_API_KEY` is set
and `runOCR()` is implemented in `services/receiptService.js`, receipts are
marked as OCR-sourced instead.

**Fraud Alerts:** generated automatically — try crediting/debiting a very
large amount, or doing several transactions quickly, to see one appear.

**Admin Dashboard:** `/admin`, visible in the sidebar only to admins.
Members attempting to visit `/admin` directly are redirected to
`/dashboard`; the backend additionally rejects the API calls with 403.

---

## 7. Folder Structure

```
smart-banking-system/
├── config/{db,validateEnv}.js
├── middleware/{authMiddleware,adminMiddleware,errorMiddleware}.js
├── models/{User,Account,Transaction,Transfer,Card,Loan,Budget,Receipt,FraudAlert,Notification}.js
├── routes/{authRoutes,accountRoutes,transactionRoutes,transferRoutes,
│           dashboardRoutes,cardRoutes,loanRoutes,budgetRoutes,
│           analyticsRoutes,reportsRoutes,profileRoutes,receiptRoutes,
│           fraudRoutes,aiRoutes,notificationRoutes,adminRoutes}.js
├── services/{aiService,fraudService,notificationService,receiptService}.js
├── scripts/makeAdmin.js
├── src/
│   ├── components/{ProtectedRoute,AdminRoute,EmptyState,Loader,ErrorState}.jsx
│   ├── context/{AuthContext,NotificationContext}.jsx
│   ├── layouts/DashboardLayout.jsx
│   ├── pages/ (20 pages — see section 1)
│   ├── services/ (13 API service files, one per feature)
│   ├── App.jsx / App.css / index.css / main.jsx
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

## 8. API Reference

```
AUTH        POST /api/auth/register  POST /api/auth/login  GET /api/auth/me
            PUT /api/auth/profile    PUT /api/auth/password
ACCOUNTS    GET/POST /api/accounts   GET /api/accounts/:id
            POST /api/accounts/:id/credit   POST /api/accounts/:id/debit
            PUT /api/accounts/:id/status
TRANSACTIONS GET /api/transactions   GET /api/transactions/:id
TRANSFERS   GET/POST /api/transfers
DASHBOARD   GET /api/dashboard
CARDS       GET/POST /api/cards      PUT /api/cards/:id/status
LOANS       GET/POST /api/loans      GET /api/loans/:id
BUDGETS     GET/POST /api/budgets    PUT/DELETE /api/budgets/:id
ANALYTICS   GET /api/analytics
REPORTS     GET /api/reports
PROFILE     GET/PUT /api/profile
RECEIPTS    GET/POST /api/receipts   DELETE /api/receipts/:id
FRAUD       GET /api/fraud           PUT /api/fraud/:id/status
AI          POST /api/ai/advisor     POST /api/ai/chat
NOTIFICATIONS GET /api/notifications PUT /api/notifications/:id/read
              PUT /api/notifications/read-all
ADMIN       GET /api/admin/stats     GET/PUT /api/admin/users(/:id/status)
            GET /api/admin/accounts  GET /api/admin/transactions
            GET /api/admin/transfers GET/PUT /api/admin/loans(/:id/status)
            GET /api/admin/fraud
```

All routes above except register/login require `Authorization: Bearer <token>`.
Admin routes additionally require the token's user to have `role: "admin"`
in MongoDB (checked server-side, never trusted from the client).

---

## 9. Admin setup (CLI alternative)

To promote an already-registered member to admin without the registration
code flow:

```bash
node scripts/makeAdmin.js user@example.com
```

---

## 10. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Server exits immediately with `[Startup Error] Missing required environment variables` | Copy `.env.example` to `.env` and fill in `MONGO_URI`, `JWT_SECRET`, `ADMIN_REGISTRATION_CODE` |
| `[MongoDB] Initial connection failed` | `mongod` isn't running, or `MONGO_URI` is wrong |
| "Invalid role for this account." on login | You selected the wrong "Login As" option — check whether the account is actually a member or admin |
| "Invalid admin registration code." | The code entered doesn't match `ADMIN_REGISTRATION_CODE` in `.env` |
| "Insufficient balance." on debit/transfer | Expected behavior — the balance check is enforced server-side and re-verified inside the DB transaction |
| AI Advisor/Chatbot says AI is not configured | Expected without `AI_API_KEY` set — this is by design, not a bug |
| CORS errors in the browser console | Confirm `CLIENT_URL` in `.env` matches the URL you're loading the frontend from |

---

## 11. What's intentionally not "real"

- **AI Advisor/Chatbot**: the AI provider call itself (`callAIProvider` in
  `services/aiService.js`) is a stub that throws until you wire in a real
  provider using your own `AI_API_KEY`/`AI_MODEL`. This avoids bundling a
  specific vendor SDK/key format. Until then, the app is honest about AI
  being unavailable rather than faking a response.
- **OCR**: same pattern in `services/receiptService.js` — `runOCR()` is a
  stub. Manual receipt entry always works regardless.
- **Notification preferences in Settings**: stored in local component state
  only (not persisted to MongoDB), since no dedicated preferences model was
  requested. The page states this.
