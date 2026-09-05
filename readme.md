# KisanMitra AI 🌾

**AI-Powered Cotton & Groundnut Market Linkage Platform**

KisanMitra AI is a full-stack, production-quality web platform that transforms market intelligence into actionable decisions for farmers. It combines real-time mandi price data, agentic AI pipelines, direct buyer-farmer matching, and net price intelligence to help farmers answer:

> **Where should I sell? To whom? When? How much?**

---

## 🏗 Architecture Overview

```
                     KISANMITRA AI
                           │
              ┌────────────┴────────────┐
              │                         │
         FRONTEND                    BACKEND
         React 19 + TS             Node.js + TS
         Tailwind CSS v4            REST APIs
         TanStack Query             Business Logic
         Redux Toolkit              PostgreSQL (Prisma)
              │                         │
              └────────────┬────────────┘
                           │
                     AI ORCHESTRATOR
                     (ReAct Loop — up to 6 iterations)
                           │
         ┌─────────────────┼─────────────────┐
    MandiForecasting   BuyerMatching   StorageAdvisor
    Agent              Agent           Agent
                           │
                     QualityGrading + IncomeAnalysis
                           │
                   IBM Granite (granite-4-h-small)
                   via watsonx.ai Chat API + Tool Calling
                           │
                   Final Recommendation
```

### Data Flow

```
Frontend → API → Zod Validation → Controller → Service →
Business Logic → Database / AI Agent (tool call) → Structured Result →
Granite Reasoning Layer (explanation) → API Response → React Query → UI
```

---

## 📦 Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~6.0 | Type safety |
| Tailwind CSS | v4 | Styling |
| React Router | v7 | Client-side routing |
| TanStack React Query | v5 | Server state / API caching |
| Redux Toolkit | v2 | Client state (auth, language, UI) |
| Axios | v1 | HTTP client |
| Recharts | v3 | Data visualizations |
| React Hot Toast | v2 | Notifications |
| Lucide React | v1 | Icons |
| Vite | v8 | Build tool |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| TypeScript | ^5.9 | Type safety |
| Express.js | ^4.18 | REST API framework |
| Prisma ORM | ^5.7 | Database access layer |
| PostgreSQL | 14+ | Primary database |
| JWT | — | Authentication (access + refresh tokens) |
| bcryptjs | — | Password hashing (cost factor 12) |
| Zod | ^3.22 | Request validation |
| Winston | ^3.11 | Structured JSON logging |
| Helmet + CORS | — | Security headers |
| Express Rate Limit | — | Rate limiting |
| Multer | — | File upload handling |
| Nodemailer | — | Password reset emails |
| node-cron | — | Scheduled jobs |

### AI Stack
| Component | Purpose |
|---|---|
| `MandiPriceForecastingAgent` | Historical trend analysis & price forecast |
| `BuyerMatchingAgent` | Match farmers with ranked buyers by net realization |
| `StorageSellingAdvisorAgent` | Sell vs store decision with risk analysis |
| `QualityGradingAgent` | AI-assisted crop quality assessment |
| `AIOrchestrator` | Intent detection + ReAct multi-agent pipeline |
| `GraniteAIProvider` | IBM watsonx.ai Chat API with tool calling (`granite-4-h-small`) |
| `MockAIProvider` | Deterministic fallback when Granite is unavailable |

---

## 📁 Folder Structure

```
project-root/
│
├── backend/
│   ├── src/
│   │   ├── agents/         # AI agents (forecasting, matching, storage, quality)
│   │   ├── ai/             # AIProvider abstraction (Granite + Mock)
│   │   ├── orchestrator/   # AIOrchestrator — ReAct multi-agent pipeline
│   │   ├── config/         # Environment configuration
│   │   ├── controllers/    # Route handlers (thin)
│   │   ├── routes/         # Express routers
│   │   ├── services/       # Business logic
│   │   ├── middleware/      # Auth, error handling, logging
│   │   ├── validators/     # Zod schemas
│   │   ├── database/       # Prisma client + seed scripts
│   │   ├── utils/          # Logger
│   │   └── server.ts       # Entry point
│   ├── api/
│   │   └── index.ts        # Vercel serverless entry point
│   ├── prisma/
│   │   └── schema.prisma   # Full normalized DB schema
│   ├── tests/
│   │   └── businessLogic.test.ts
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client + all API functions
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # DashboardLayout with sidebar
│   │   ├── pages/
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── farmer/     # All farmer pages
│   │   │   ├── buyer/      # Buyer dashboard + offers
│   │   │   └── admin/      # Admin dashboard
│   │   ├── store/          # Redux store + slices
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Formatting + helper functions
│   │   ├── i18n/           # English / Hindi / Gujarati translations
│   │   └── App.tsx         # Routes + providers
│   ├── vite.config.ts
│   ├── vercel.json
│   └── package.json
│
├── app.json                # App metadata & deployment manifest
└── readme.md
```

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/kisanmitra_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# IBM watsonx.ai — Granite ReAct agent
# AI_PROVIDER=GRANITE enables the full tool-calling loop (up to 6 iterations).
# Falls back to MOCK automatically if the Granite API is unreachable.
IBM_GRANITE_API_KEY=your-ibm-cloud-api-key-here
IBM_GRANITE_ENDPOINT=https://us-south.ml.cloud.ibm.com
IBM_GRANITE_MODEL=ibm/granite-4-h-small
IBM_WATSONX_PROJECT_ID=your-watsonx-project-id-here

# AI Provider (MOCK or GRANITE)
AI_PROVIDER=MOCK

# Market data (MOCK by default)
MARKET_DATA_PROVIDER=MOCK

# File uploads
STORAGE_PROVIDER=LOCAL
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Email (password reset)
MAILER_USER=you@gmail.com
MAILER_PASS=your-gmail-app-password
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

> **IBM Granite note:** `IBM_GRANITE_API_KEY` is an IBM Cloud API key, not a direct Bearer token.
> The backend exchanges it for an IAM access token automatically via `POST https://iam.cloud.ibm.com/identity/token`.
> Use `ibm/granite-4-h-small` (us-south / eu-de only) or `ibm/granite-3-8b-instruct` (all regions).

---

## 🚀 Installation & Running

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set up database

```bash
cd backend

# Copy and configure .env
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed
```

### 3. Run backend

```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

### 4. Run frontend

```bash
cd frontend
npm run dev
# App starts at http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@kisanmitra.ai | admin123 |
| Farmer | ramesh@farmer.com | farmer123 |
| Farmer | suresh@farmer.com | farmer123 |
| Buyer (Verified) | shreeji@buyer.com | buyer123 |
| Buyer (Verified) | gujarat@buyer.com | buyer123 |

---

## 🌐 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register farmer or buyer |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/forgot-password | Send password reset email |
| POST | /auth/reset-password | Reset password via token |
| GET | /auth/me | Get current user |

#### Market Intelligence
| Method | Endpoint | Description |
|---|---|---|
| GET | /market/crops | All crops |
| GET | /market/mandis | All mandis |
| GET | /market/prices/latest | Latest mandi prices |
| GET | /market/prices/history | Price history (30 days) |

#### AI Agents
| Method | Endpoint | Description |
|---|---|---|
| POST | /ai/query | Main AI assistant (orchestrator) |
| GET | /ai/forecast | Price forecast agent |
| POST | /ai/match-buyers | Buyer matching agent |
| POST | /ai/storage-advisor | Sell vs store advisor |
| POST | /ai/quality-grade | AI quality grading (image upload) |
| GET | /ai/recommendations | Historical AI recommendations |

#### Farmer
| Method | Endpoint | Description |
|---|---|---|
| GET | /farmers/crops | Farmer's crop inventory |
| POST | /farmers/crops | Add crop |
| GET | /farmers/income | Income dashboard data |

#### Buyer
| Method | Endpoint | Description |
|---|---|---|
| GET | /buyers/marketplace | Public buyer offers |
| POST | /buyers/offers | Create purchase offer |
| PATCH | /buyers/offers/:id | Update offer |

#### Transactions
| Method | Endpoint | Description |
|---|---|---|
| POST | /transactions | Initiate transaction |
| PATCH | /transactions/:id/status | Update transaction state |

#### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | /admin/stats | Platform statistics |
| GET | /admin/buyers | Manage buyers |
| PATCH | /admin/buyers/:id/verify | Verify/reject buyer |
| GET | /admin/ai-monitoring | AI agent status |
| GET | /admin/audit-logs | Audit trail |

### Health Check
```
GET /health
```

---

## 🤖 AI Architecture

### Intent Detection
The orchestrator detects the farmer's intent from natural language:
- `SELL_VS_STORE` — should I sell or hold?
- `FIND_BUYERS` — find buyers for my crop
- `MARKET_PRICE` — current market prices
- `QUALITY` — crop quality assessment
- `INCOME` — income analysis
- `GENERAL` — general query

### ReAct Agent Pipeline
```
Farmer Query
  → Intent Detection (Granite tool calling / Mock)
  → Context Retrieval (farmer profile, crop, district)
  → [Tool call] MandiPriceForecastingAgent
  → [Tool call] BuyerMatchingAgent  (net price scoring)
  → [Tool call] StorageSellingAdvisorAgent (SELL_NOW / STORE / SELL_PARTIALLY)
  → Structured Results (deterministic)
  → Granite Reasoning Layer (explanation generation)
  → Database (AIRequest + AIRecommendation persisted)
  → Frontend
```

### IBM Granite Integration
Set `AI_PROVIDER=GRANITE` and configure `IBM_GRANITE_*` env vars.
`GraniteAIProvider` calls the watsonx.ai Chat API (`/ml/v1/text/chat`) with three tool definitions.
The ReAct loop runs up to **6 iterations**, invoking specialist agents before synthesising the final answer.
If the Granite API is unreachable, `MockAIProvider` is the automatic fallback — no code changes needed.

### Safety Rules
- AI never invents market prices, buyers, or transactions
- All calculations (net price, transport, storage) are deterministic backend operations
- Granite only synthesizes and explains — it does not compute
- Every recommendation stores a `dataTimestamp` so freshness is auditable

---

## 🌍 Multilingual Support

The platform supports **English**, **Hindi**, and **Gujarati**.

- Language selector in the sidebar
- All navigation labels translated
- AI responses generated in the selected language
- Farmers can ask questions in Gujarati:
  > "મારો કપાસ અત્યારે વેચવો કે થોડા દિવસ રોકવો?"

---

## 🧪 Testing

```bash
cd backend
npm test
```

**16 unit tests** covering:
- Net price calculation (Case 1–2: gross vs net comparison)
- Inventory guard (Case 3: oversell prevention, Case 4: no negative inventory)
- Storage economics (Case 5: sell now, Case 6: store, Case 7: low confidence)
- Buyer trust ranking (Case 8: verified vs unverified)
- Transport cost engine (scaling, same-district, unknown districts)
- State machine (invalid transitions blocked)

---

## 🔒 Security

- **JWT** access + refresh token pair with short expiry (15 min / 7 day)
- **bcrypt** password hashing (cost factor 12)
- **Role-based authorization** — every protected endpoint validates role server-side
- **Zod validation** on all request bodies
- **Rate limiting** — 300 req / 15 min general, 20 req / 15 min auth
- **Helmet** security headers
- **CORS** configured per environment
- **File validation** — type + size enforced before processing
- **SQL injection** prevention via Prisma ORM
- No secrets committed (`.env` in `.gitignore`)

---

## 🏭 Production Build

```bash
# Backend
cd backend
npm run build    # compiles TypeScript → dist/
npm run start    # runs dist/server.js

# Frontend
cd frontend
npm run build    # Vite production build → dist/
npm run preview  # preview production build
```

---

## ☁️ Deployment

Both `frontend/` and `backend/` ship with a `vercel.json` for Vercel deployments:

- **Backend** — served via `@vercel/node` from `api/index.ts` (serverless)
- **Frontend** — SPA rewrites to `index.html` via Vercel Edge Network

For non-Vercel hosts (IBM Code Engine, Railway, Render, etc.) use the standard `npm run build` + `npm run start` flow. The app follows 12-factor principles — all configuration is environment-variable-driven.

---

## 📊 Demo Scenario (Hackathon Judge Flow)

1. **Login as Farmer** (ramesh@farmer.com / farmer123)
2. View **Dashboard** — cotton prices, crop inventory, AI recommendation
3. Go to **Market Prices** — 30-day price chart across mandis
4. Go to **My Crops** — view/add crop inventory
5. Go to **Buyers** — browse verified buyer marketplace
6. Go to **Sell or Store?** — get AI forecast + recommendation
7. Go to **AI Assistant** — ask "Should I sell my cotton now?"
8. Observe **multiple AI agents** working (forecasting, matching, storage advisor)
9. Go to **Quality Check** — upload crop image for AI grading
10. Go to **Income Dashboard** — portfolio value breakdown
11. **Login as Buyer** (shreeji@buyer.com / buyer123) — post purchase offer
12. **Login as Admin** (admin@kisanmitra.ai / admin123)
13. **Admin → Buyers** — verify a pending buyer
14. **Admin → AI Monitor** — view agent execution stats

---

## 🌱 Seed Data Included

- **3 demo farmers** across Ahmedabad, Rajkot, Surendranagar
- **5 demo buyers** (4 verified, 1 pending) across Gujarat
- **7 buyer offers** for Cotton and Groundnut
- **5 mandis** — Ahmedabad, Rajkot, Surendranagar, Bhavnagar, Junagadh
- **31 days** of historical market price data (Cotton + Groundnut)
- **3 farmer crops** with realistic quantities

---

## 🚢 IBM Cloud Readiness

- Environment-based configuration (12-factor app)
- Docker-ready (containerize with standard Node.js Dockerfile)
- Health endpoint: `GET /health`
- Structured JSON logging (Winston)
- IBM Granite integration via `IBM_GRANITE_*` environment variables
- Stateless REST API (scales horizontally)
- IAM token exchange handled automatically inside `GraniteAIProvider`

---

## 📖 Core Value Proposition

| Traditional | KisanMitra AI |
|---|---|
| Farmer checks one mandi price | AI compares all mandis + buyers |
| No transport cost awareness | Net realization calculated automatically |
| No quality guidance | AI-assisted visual quality assessment |
| No sell/store guidance | Sell vs store advisor with risk analysis |
| Language barrier | Gujarati, Hindi, English support |
| Manual buyer search | Verified buyer marketplace with ranking |

**Information → Intelligence → Action**

---

*Built for farmers, powered by AI, trusted through transparency.*
