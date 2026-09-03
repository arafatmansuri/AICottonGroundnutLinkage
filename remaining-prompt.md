# MASTER PROMPT — KisanMitra AI

## Production-Grade SaaS Completion, Integration, Bug Fix & Full System Hardening

You are working on an existing software project called:

**KisanMitra AI — AI-Powered Cotton & Groundnut Market Linkage Platform**

Your job is to take the existing codebase, understand it completely, preserve the working functionality, fix all identified issues, complete all missing workflows, strengthen the business logic, and transform the current prototype/MVP into a **fully integrated, production-quality SaaS platform**.

This is NOT a request to rebuild the project from scratch.

You MUST work with the existing codebase and integrate improvements into it safely.

---

# 1. CORE OBJECTIVE

Transform the existing project into a complete SaaS-level platform where:

**Farmer → Crop → Market Intelligence → AI Forecast → Buyer Matching → Net Price → Sell/Store Decision → Buyer Offer → Transaction → Inventory → Income → Notifications → Admin Monitoring**

works as one connected ecosystem.

Every important feature must actually work from frontend to backend to database.

Do NOT create pages that only look functional.

Do NOT create buttons that do nothing.

Do NOT create fake API calls.

Do NOT leave placeholder pages.

Do NOT duplicate existing functionality unnecessarily.

Do NOT replace working modules unless there is a strong technical reason.

---

# 2. FIRST RULE — INSPECT THE EXISTING PROJECT BEFORE MODIFYING IT

Before writing code:

1. Inspect the entire repository.
2. Inspect both:

   * `frontend/`
   * `backend/`
3. Inspect:

   * package.json
   * lock files
   * environment files
   * Prisma schema
   * migrations
   * seed files
   * routes
   * controllers
   * services
   * middleware
   * AI agents
   * orchestrator
   * API clients
   * React pages
   * React components
   * Redux store
   * React Query usage
   * authentication
   * authorization
   * database queries
   * upload handling
   * notifications
   * admin modules
   * tests
   * configuration
4. Understand the existing architecture before making changes.
5. Identify which features are already working.
6. Identify which features are partially implemented.
7. Identify which features are mock/demo only.
8. Identify duplicate or reused components.
9. Identify broken API connections.
10. Identify security vulnerabilities.
11. Identify business-logic problems.

Create an internal implementation plan before changing the code.

### VERY IMPORTANT

Do NOT blindly overwrite existing files.

Prefer:

* modify existing implementation
* reuse existing services
* reuse existing components
* preserve existing API contracts where possible
* create adapters when necessary
* migrate incrementally

The final project must remain runnable during development.

---

# 3. EXISTING TECHNOLOGY STACK

Do NOT replace this stack unless absolutely necessary.

## Frontend

Use:

* React
* TypeScript
* Tailwind CSS
* React Router
* TanStack React Query
* Redux Toolkit
* Axios
* existing UI/component system

Architecture should remain modular and strongly typed.

## Backend

Use:

* Node.js
* TypeScript
* REST APIs
* Prisma
* PostgreSQL
* JWT authentication
* Zod validation
* existing security middleware
* existing logging system

## AI

Use:

* IBM Granite LLM
* IBM Cloud-ready architecture
* specialized AI agents
* deterministic business calculations
* AI orchestration layer

The platform must be designed so that AI providers can be replaced without rewriting the entire application.

---

# 4. GOLDEN ARCHITECTURE

The final architecture should follow:

```text
                 ┌───────────────────────┐
                 │       FRONTEND        │
                 │ React + TypeScript    │
                 │ Tailwind              │
                 │ React Query           │
                 │ Redux Toolkit         │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │      API LAYER        │
                 │ Axios / REST APIs     │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │      BACKEND          │
                 │ Node + TypeScript     │
                 │ Auth / RBAC / Logic   │
                 └───────────┬───────────┘
                             │
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
       PostgreSQL       AI ORCHESTRATOR    File Storage
             │               │
             │       ┌───────┼────────┐
             │       ▼       ▼        ▼
             │     Mandi   Buyer    Storage
             │     Agent   Agent    Agent
             │
             │       ┌───────┼────────┐
             │       ▼       ▼        ▼
             │    Quality  Income   Granite
             │     Agent    Agent     LLM
             │
             └───────────────┬────────────────
                             ▼
                    Business Intelligence
```

---

# 5. NON-NEGOTIABLE QUALITY RULE

Every feature must pass this chain:

```text
UI
 ↓
Frontend validation
 ↓
React Query / API client
 ↓
REST API
 ↓
Authentication
 ↓
Authorization
 ↓
Zod validation
 ↓
Controller
 ↓
Service
 ↓
Business logic
 ↓
Database transaction
 ↓
Response DTO
 ↓
React Query cache update
 ↓
UI state update
 ↓
Notification / audit event if required
```

No broken links between these layers.

---

# 6. USER ROLES

Implement proper role-based access control.

## FARMER

Farmer can:

* register
* login
* manage profile
* manage crops
* add crop quantity
* update crop information
* delete crop
* check mandi prices
* view price history
* view price forecast
* ask AI
* find buyers
* compare buyers
* compare net realization
* upload crop images
* receive quality estimation
* decide sell/store
* create/accept relevant transaction actions
* track transactions
* view income
* receive notifications
* manage preferences
* use Gujarati/Hindi/English UI

## BUYER

Buyer can:

* register
* login
* create buyer profile
* submit business information
* verification status
* create crop purchase offers
* specify crop
* quantity
* quality requirements
* price
* location
* expiry
* view farmer listings
* view matching crops
* submit offers
* manage offers
* manage transactions
* accept/reject appropriate transaction actions
* track purchases
* receive notifications

## ADMIN

Admin can:

* view system dashboard
* manage farmers
* manage buyers
* verify buyers
* suspend/reactivate accounts
* manage market data
* inspect market-data freshness
* monitor transactions
* inspect AI requests
* inspect AI failures
* inspect audit logs
* monitor notifications
* monitor platform health
* monitor suspicious activity
* manage configuration
* inspect data providers

---

# 7. AUTHENTICATION & SECURITY

Harden the existing authentication system.

Implement:

* registration
* login
* access token
* refresh token
* logout
* token rotation
* token revocation
* session management
* password hashing
* password validation
* account status
* role-based authorization
* ownership authorization

## CRITICAL OWNERSHIP RULE

A farmer must NEVER be able to access:

* another farmer's crops
* another farmer's quality assessment
* another farmer's recommendation
* another farmer's transactions
* another farmer's private information

Never trust IDs supplied by the frontend.

Every query must be scoped using authenticated user identity.

Example:

```text
authenticatedUserId
       ↓
farmerProfile
       ↓
farmerCrop
```

Do not simply query:

```text
farmerCropId
```

without verifying ownership.

---

# 8. TRANSACTION AUTHORIZATION

Create a strict transaction state machine.

Example:

```text
OFFER_SENT
     ↓
ACCEPTED
     ↓
CONFIRMED
     ↓
IN_PROGRESS
     ↓
COMPLETED
```

Alternative paths:

```text
OFFER_SENT → REJECTED
OFFER_SENT → CANCELLED
ACCEPTED → CANCELLED
CONFIRMED → DISPUTED
IN_PROGRESS → DISPUTED
```

Define exactly:

* who can create
* who can accept
* who can reject
* who can cancel
* who can confirm
* who can mark in progress
* who can complete
* who can dispute
* who can resolve disputes

These permissions MUST be enforced on the backend.

Frontend permissions are only UX.

---

# 9. INVENTORY CONSISTENCY

This is extremely important.

Never allow:

```text
availableQuantity < 0
```

Implement safe inventory reservation.

Example:

```text
totalQuantity = 200

availableQuantity = 200

Transaction reservation = 50

availableQuantity = 150
```

If transaction is cancelled/rejected:

```text
availableQuantity = 200
```

If completed:

```text
soldQuantity += 50
```

Use proper database transactions and atomic/conditional updates.

Handle concurrent requests.

Test:

* two buyers buying same crop simultaneously
* insufficient quantity
* cancellation
* rejection
* completion
* repeated completion
* repeated cancellation
* race conditions

Inventory must remain mathematically correct.

---

# 10. BUYER MARKETPLACE — COMPLETE THE ENTIRE WORKFLOW

The marketplace must become a real working marketplace.

Required flow:

```text
Farmer Crop
 ↓
Buyer Offer
 ↓
Offer Details
 ↓
Quantity Selection
 ↓
Price
 ↓
Transportation Cost
 ↓
Net Realization
 ↓
Farmer Decision
 ↓
Transaction Creation
 ↓
Buyer Notification
 ↓
Buyer Confirmation
 ↓
Transaction Progress
 ↓
Completion
 ↓
Inventory Update
 ↓
Income Update
 ↓
Notifications
 ↓
Audit Log
```

Do not leave the current "View Details" flow as simple navigation.

Implement an actual transaction creation workflow.

---

# 11. NET PRICE INTELLIGENCE

This is one of the most important features of the platform.

Never recommend based only on gross price.

Calculate:

```text
Net Realization =
Gross Sale Value
- Transportation
- Storage
- Handling
- Platform Charges
- Other Applicable Costs
```

Example:

```text
Mandi A
₹7,500/quintal
Transport = ₹300
Net = ₹7,200

Direct Buyer
₹7,350/quintal
Transport = ₹100
Net = ₹7,250
```

Therefore:

```text
Direct Buyer is better
```

The system must explain WHY.

Show:

* gross price
* quantity
* transport
* storage
* other costs
* total realization
* net realization
* difference
* recommendation
* confidence

Never use arbitrary hidden calculations.

---

# 12. MANDI PRICE SYSTEM

Create a proper market-data abstraction.

```text
MarketDataProvider
       │
       ├── MockMarketDataProvider
       │
       └── RealMarketDataProvider
```

Mock mode is allowed for development/demo.

But the UI must clearly indicate:

```text
DEMO / MOCK DATA
```

Never call mock data:

```text
Real-time market price
```

unless it is actually fresh data.

Real provider should support:

* source
* market
* crop
* date
* price
* min price
* max price
* modal price
* arrival quantity if available
* source timestamp
* ingestion timestamp
* freshness
* validation

Implement:

* scheduled ingestion
* retry
* duplicate detection
* stale-data detection
* provider failure handling
* logging
* admin monitoring

---

# 13. PRICE FORECASTING AGENT

Keep the existing forecasting agent but make it robust.

Input:

* historical mandi prices
* market
* crop
* date
* current price
* volatility
* market trend

Output:

```json
{
  "currentPrice": 7250,
  "forecast": {
    "7Days": {
      "low": 7100,
      "expected": 7350,
      "high": 7600
    }
  },
  "trend": "UP",
  "confidence": 0.78,
  "recommendation": "HOLD_PARTIAL",
  "explanation": "..."
}
```

Forecasts are estimates.

Never present forecasts as guaranteed future prices.

Handle:

* insufficient data
* stale data
* volatility
* missing values
* unusual spikes
* confidence

---

# 14. BUYER MATCHING AGENT

Build a proper ranking engine.

Match based on:

* crop
* quantity
* location
* buyer requirements
* quality
* offered price
* transport cost
* verification
* buyer rating
* reliability
* offer freshness
* net realization

Use normalized scoring.

Example:

```text
Price Score: 30%
Distance: 15%
Quantity Match: 15%
Quality Match: 15%
Verification: 10%
Reliability: 10%
Net Realization: 5%
```

Make weights configurable.

Show explainable matching:

```text
Why this buyer?

✓ Best net price
✓ Required quantity matches
✓ Buyer verified
✓ Low transportation cost
✓ Quality requirement matches
```

---

# 15. STORAGE VS SELLING ADVISOR

The system must answer:

> "Should I sell now or store?"

Calculate:

```text
Expected Future Value
- Storage Cost
- Additional Transport
- Handling
- Risk Adjustment
```

Do not hard-code:

```text
₹50
30 days
MODERATE
```

Make these configurable.

Inputs:

* current price
* forecast price
* storage cost
* storage duration
* risk profile
* expected spoilage/loss
* volatility
* transport
* quality degradation risk

Output:

```text
SELL_NOW
HOLD
HOLD_PARTIAL
```

The recommendation must include explanation and confidence.

---

# 16. PARTIAL SELLING STRATEGY

Support recommendations such as:

```text
Sell 60% now
Hold 40% for 15 days
```

Calculate both scenarios.

Example:

```text
Current sale:
120 quintals × ₹7,200 net

Holding:
80 quintals × expected future net price
- storage cost
- risk adjustment
```

Never recommend holding the entire inventory automatically.

---

# 17. QUALITY GRADING AI

Current implementation is only a mock.

Do NOT claim it is real image AI until a real image-analysis pipeline is connected.

Build proper architecture:

```text
Upload Image
 ↓
Validation
 ↓
Image Storage
 ↓
Vision Model
 ↓
Quality Features
 ↓
Grade Estimation
 ↓
Price Range
 ↓
Confidence
 ↓
Assessment Record
```

Store:

* image
* crop
* model
* model version
* confidence
* detected indicators
* grade
* estimated price range
* timestamp

Clearly show:

> AI-assisted estimation. Final quality/grade should be confirmed through certified physical/lab inspection where required.

---

# 18. AI ORCHESTRATOR — FIX COMPLETELY

Create explicit intent routing.

Example:

```text
MARKET_PRICE
→ Mandi Agent

FORECAST
→ Forecast Agent

FIND_BUYERS
→ Buyer Matching Agent

STORAGE
→ Forecast + Storage Agent

SELL_VS_STORE
→ Forecast + Storage + Buyer Matching + Net Price

QUALITY
→ Quality Agent

INCOME
→ Income Agent

GENERAL
→ Granite reasoning
```

Do NOT rely on nested if-statements that accidentally skip agents.

Create a structured pipeline registry.

Example:

```text
IntentPipelineRegistry
```

Every agent should return a structured result.

Example:

```json
{
  "agent": "StorageSellingAdvisor",
  "status": "SUCCESS",
  "data": {},
  "confidence": 0.81,
  "durationMs": 420
}
```

If one agent fails:

* capture failure
* continue when safe
* do not corrupt final recommendation
* tell Granite which information is unavailable
* never fabricate missing information

---

# 19. IBM GRANITE

Granite should be the reasoning/explanation/orchestration layer.

Granite should NOT invent:

* market prices
* buyers
* transportation costs
* forecast values
* transaction data

Granite receives structured facts from backend agents and generates a human-friendly explanation.

Example:

```text
Structured Data
       ↓
Agent Results
       ↓
Granite
       ↓
Simple Recommendation
```

Support:

* English
* Hindi
* Gujarati

Add:

* timeout
* retry
* provider health
* model configuration
* fallback handling
* logging
* latency
* error handling

If mock fallback is used:

```text
MOCK_FALLBACK
```

must be distinguishable from:

```text
GRANITE
```

---

# 20. AI AUDITABILITY

Every AI request should record:

* user
* intent
* input summary
* agents executed
* agent status
* execution duration
* model/provider
* recommendation
* confidence
* fallback
* error
* timestamp

Never store unnecessary sensitive data.

This enables the admin AI monitoring system.

---

# 21. FARMER DASHBOARD

Create a professional SaaS dashboard.

Sections:

### Market Snapshot

* Cotton price
* Groundnut price
* trend
* last updated
* source
* freshness

### My Crops

* crop
* quantity
* available
* reserved
* sold

### AI Recommendation

Example:

```text
Your 200 quintals of groundnut:

Recommended:
Sell 120 quintals now
Hold 80 quintals for up to 15 days

Expected advantage:
₹XX,XXX

Confidence:
78%
```

### Quick Actions

* Check Market
* Find Buyers
* Sell / Store
* Check Quality
* Ask AI
* View Income

---

# 22. BUYER DASHBOARD

Include:

* active offers
* pending transactions
* completed purchases
* matching crops
* farmer listings
* purchase analytics
* offer management
* transaction management
* notifications

Do NOT reuse the farmer TransactionsPage for buyers.

Create proper buyer-specific workflows.

---

# 23. TRANSACTION DASHBOARD

Create role-specific transaction pages.

Farmer:

```text
My Sales
```

Buyer:

```text
My Purchases
```

Admin:

```text
All Transactions
```

Include:

* transaction ID
* crop
* quantity
* price
* gross value
* transport
* net value
* buyer/farmer
* status
* timeline
* created date
* actions allowed for current role

---

# 24. INCOME DASHBOARD

Calculate real data from completed transactions.

Show:

* total sales
* completed sales
* total quantity sold
* gross income
* transportation cost
* storage cost
* other cost
* net income
* average realization
* crop-wise income
* monthly trend

Do not use fake hard-coded values.

---

# 25. NOTIFICATION SYSTEM

Implement event-driven notifications.

Events:

```text
New Buyer Offer
Offer Accepted
Offer Rejected
Transaction Created
Transaction Updated
Transaction Completed
Price Alert
Price Drop
Price Increase
AI Recommendation
Quality Assessment Ready
Buyer Match Found
Offer Expiring
Market Data Stale
```

Implement:

* unread count
* mark read
* mark all read
* notification history
* notification preferences

---

# 26. ADMIN DASHBOARD

Create real admin modules.

Required pages:

```text
/admin
/admin/farmers
/admin/buyers
/admin/transactions
/admin/market-data
/admin/ai-monitoring
/admin/audit-logs
/admin/settings
```

Do NOT map all routes to the same AdminDashboard.

Implement dedicated functionality.

## Admin Market Data

Show:

* provider
* last sync
* freshness
* failed sync
* records
* crop
* market
* price

## Admin Audit Logs

Show:

* actor
* action
* entity
* timestamp
* metadata
* IP/device metadata only where appropriate

## Admin AI Monitoring

Show:

* requests
* success rate
* failures
* fallback count
* latency
* agent usage
* model/provider
* recent errors

---

# 27. API DESIGN

Every endpoint must have:

```text
Authentication
Authorization
Validation
Controller
Service
Error Handling
Typed Response
Logging
```

Use consistent response format.

Example:

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid quantity"
  }
}
```

Do not expose stack traces to clients.

---

# 28. VALIDATION

Use Zod consistently.

Validate:

* UUIDs
* enums
* quantities
* prices
* dates
* crop types
* district
* pincode
* phone
* email
* offer expiry
* min/max quantity
* file uploads
* AI inputs

Example:

```text
minQuantity <= maxQuantity
```

must always be enforced.

---

# 29. FILE UPLOAD SECURITY

Harden image upload.

Validate:

* file size
* MIME type
* file signature/magic bytes
* image dimensions
* supported formats
* malicious filenames
* path traversal

Do not trust extension alone.

Use safe generated filenames.

For production:

```text
Object Storage
```

instead of local filesystem.

---

# 30. DATABASE

Review Prisma schema carefully.

Add:

* proper indexes
* unique constraints
* foreign keys
* cascading rules where appropriate
* timestamps
* auditability

Index frequently queried fields such as:

* userId
* farmerProfileId
* buyerProfileId
* cropId
* marketId
* transaction status
* offer status
* createdAt

Do not destroy existing production-compatible data.

Create migrations safely.

---

# 31. TYPESCRIPT QUALITY

Remove unnecessary:

```text
any
```

from critical business logic.

Create shared domain types where appropriate.

Use:

```text
DTOs
Interfaces
Enums
Schemas
Typed API responses
```

Frontend and backend must agree on response structures.

---

# 32. REACT QUERY

Use TanStack Query correctly.

Separate:

```text
Server State
```

from:

```text
Global Client State
```

React Query should handle:

* API fetching
* caching
* mutations
* invalidation
* loading
* errors

Redux Toolkit should handle:

* auth/session UI state
* language
* preferences
* global UI state

Do not store all server data in Redux.

---

# 33. API CACHE INVALIDATION

After mutations:

```text
Create Crop
→ invalidate crops

Create Offer
→ invalidate offers

Create Transaction
→ invalidate transactions
→ invalidate crops
→ invalidate income if required
→ invalidate notifications
```

The UI must update without requiring manual refresh.

---

# 34. ERROR HANDLING

Every page must have:

### Loading state

```text
Loading...
```

### Empty state

```text
No transactions found
```

### Error state

```text
Unable to load data
Retry
```

### Success feedback

```text
Transaction created successfully
```

Do not leave users staring at blank screens.

---

# 35. INTERNATIONALIZATION

Support:

```text
English
Hindi
Gujarati
```

Move hard-coded UI strings into translation files.

Example:

```text
en.json
hi.json
gu.json
```

Add a translation completeness check.

Important farmer actions must be translated.

---

# 36. VOICE ASSISTANT

If the current environment/API supports it, implement:

```text
Gujarati voice
Hindi voice
English voice
```

Flow:

```text
Voice Input
 ↓
Speech-to-Text
 ↓
AI Intent Detection
 ↓
Agent Pipeline
 ↓
Granite
 ↓
Text Response
 ↓
Optional Text-to-Speech
```

If real voice integration cannot be safely implemented with available infrastructure, create a clean provider abstraction and clearly mark it as pending rather than faking it.

---

# 37. UX REQUIREMENTS

The website must look like a professional SaaS product.

Requirements:

* responsive
* mobile friendly
* tablet friendly
* desktop friendly
* consistent spacing
* professional typography
* accessible contrast
* clear CTA
* meaningful loading states
* empty states
* error states
* toast notifications
* modal confirmation for destructive actions
* skeleton loading where appropriate
* responsive tables
* charts
* filters
* search
* pagination
* sorting

Do not redesign working pages unnecessarily.

Improve them incrementally.

---

# 38. ROUTING

Verify every route.

No:

```text
404
```

No incorrect role page.

No route should render an unrelated component.

Protect:

```text
/farmer/*
/buyer/*
/admin/*
```

based on role.

Unauthorized users must be redirected correctly.

---

# 39. SECURITY HARDENING

Review:

* JWT
* refresh tokens
* CORS
* Helmet
* rate limiting
* password hashing
* input validation
* SQL injection protection
* XSS
* CSRF strategy
* file uploads
* path traversal
* authorization
* object ownership
* secrets
* environment variables

Never commit:

```text
API keys
JWT secrets
database passwords
IBM credentials
```

Fail safely if required production secrets are missing.

---

# 40. OBSERVABILITY

Implement:

* structured logging
* request IDs
* error IDs
* API latency
* AI latency
* database errors
* provider errors
* audit logs

Create:

```text
/health
```

and preferably:

```text
/ready
```

Health checks should reflect actual dependencies where practical.

Do NOT hard-code:

```text
AI Service = Healthy
```

when the service is not actually checked.

---

# 41. MOCK MODE

Create an explicit development/demo mode.

Example:

```text
APP_MODE=development
MARKET_DATA_PROVIDER=mock
AI_PROVIDER=mock
```

The UI/admin panel should clearly show:

```text
Demo Mode
```

Mock data must never silently appear as production data.

---

# 42. REAL DATA PROVIDER ARCHITECTURE

Design provider interfaces so the application can switch:

```text
MOCK
REAL
```

without changing business logic.

Example:

```text
IMarketDataProvider
```

Business services should depend on the interface, not a specific provider.

---

# 43. AUDIT LOGGING

Log important operations:

* login
* logout
* registration
* buyer verification
* crop creation
* offer creation
* transaction creation
* transaction status changes
* quality assessment
* AI request
* admin changes

Do not log passwords or sensitive tokens.

---

# 44. TESTING

Create proper tests.

## Backend

Test:

* authentication
* authorization
* ownership
* crop CRUD
* buyer offers
* marketplace
* transactions
* inventory
* market prices
* forecasting
* buyer matching
* storage advisor
* AI orchestrator
* notifications
* admin

## Frontend

Test:

* routing
* protected routes
* forms
* marketplace
* transactions
* dashboard
* loading states
* errors
* role-based UI

## E2E

At minimum test:

### Farmer Flow

```text
Register
→ Login
→ Add Crop
→ Check Market
→ Find Buyer
→ Compare Net Price
→ Create Transaction
→ Track Transaction
→ Complete
→ Check Income
```

### Buyer Flow

```text
Register
→ Login
→ Create Offer
→ Find Matching Farmer
→ Accept Transaction
→ Update Status
→ Complete Purchase
```

### Admin Flow

```text
Login
→ Verify Buyer
→ View Market Data
→ View Transactions
→ View AI Monitoring
→ View Audit Logs
```

---

# 45. CRITICAL BUSINESS LOGIC TESTS

Must test:

```text
Farmer A cannot access Farmer B crop
```

```text
Buyer A cannot modify Buyer B offer
```

```text
Transaction cannot use expired offer
```

```text
Transaction cannot exceed available quantity
```

```text
Inventory cannot become negative
```

```text
Transaction cannot complete twice
```

```text
Cancelled transaction cannot be completed
```

```text
Rejected transaction cannot be completed
```

```text
Completed transaction cannot be cancelled
```

```text
Unauthorized user cannot change transaction status
```

```text
Mock market data cannot be presented as real-time
```

```text
Failed AI agent cannot silently fabricate result
```

---

# 46. PERFORMANCE

Optimize:

* database queries
* pagination
* indexes
* React rendering
* API caching
* image handling
* AI calls
* large datasets

Never load thousands of records unnecessarily.

Use server-side pagination for large datasets.

---

# 47. DATABASE TRANSACTIONS

Use Prisma/database transactions for operations involving multiple dependent changes.

Example:

```text
Create Transaction
+
Reserve Inventory
+
Create Audit Log
+
Create Notification
```

should be handled safely.

If the critical transaction fails:

```text
rollback
```

Do not leave partial state.

---

# 48. IDEMPOTENCY

Important operations should be safe against duplicate requests.

Especially:

* transaction creation
* payment-like actions if added later
* inventory reservation
* completion
* notifications

Prevent accidental double-click from creating duplicate transactions.

---

# 49. PAYMENT ARCHITECTURE

Do not add fake payment success.

If payment is required later, create a provider abstraction:

```text
IPaymentProvider
```

with:

```text
MockPaymentProvider
RealPaymentProvider
```

Do not claim payment is real unless it is actually integrated.

---

# 50. DATA FRESHNESS

Every market price should have:

```text
source
sourceTimestamp
ingestedAt
```

Show:

```text
Updated 12 minutes ago
```

instead of blindly saying:

```text
Live
```

If data is too old:

```text
STALE DATA
```

and reduce recommendation confidence.

---

# 51. AI SAFETY & TRUST

AI recommendations must be explainable.

Every recommendation should show:

```text
Recommendation
Why
Data Used
Confidence
Risks
```

Example:

```text
Recommendation:
Sell 60%, Hold 40%

Why:
Current buyer offers are strong and forecast indicates moderate upside.

Risk:
Forecast confidence is 72%.

Data:
Mandi price updated 20 minutes ago.
```

Never give guaranteed financial outcomes.

---

# 52. ADMIN CONFIGURATION

Where reasonable, allow admins to configure:

* market-data provider
* storage assumptions
* matching weights
* price-alert thresholds
* notification preferences
* AI provider
* AI fallback
* platform settings

Sensitive credentials must remain in environment/secret storage.

---

# 53. ENVIRONMENT CONFIGURATION

Create clear:

```text
.env.example
```

for:

```text
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
IBM_GRANITE_API_KEY
IBM_GRANITE_ENDPOINT
MARKET_DATA_PROVIDER
AI_PROVIDER
APP_MODE
CORS_ORIGIN
PORT
```

Never commit actual credentials.

---

# 54. DOCUMENTATION

Update README with:

* architecture
* setup
* environment variables
* database setup
* migration
* seed
* development
* production build
* API overview
* AI architecture
* agent architecture
* mock mode
* real provider configuration
* testing
* deployment

Include:

```text
frontend/
backend/
```

architecture.

---

# 55. DO NOT BREAK EXISTING CODE

Before every major refactor:

1. Understand current behavior.
2. Preserve compatible APIs.
3. Add migration if schema changes.
4. Update frontend and backend together.
5. Run type checks.
6. Run tests.
7. Verify affected workflows.

Do not randomly rename existing APIs.

Do not delete working components just because a new implementation is cleaner.

---

# 56. DEVELOPMENT PHASES

Implement in this order.

## PHASE 1

Project audit + dependency repair.

Fix:

* package installation
* TypeScript errors
* build errors
* environment configuration
* database setup

## PHASE 2

Security + authentication.

Fix:

* ownership
* RBAC
* refresh tokens
* JWT configuration
* account status

## PHASE 3

Transaction + inventory system.

Fix:

* state machine
* permissions
* inventory reservation
* concurrency
* idempotency

## PHASE 4

Marketplace.

Implement:

* offer details
* comparison
* net realization
* transaction creation
* buyer workflow

## PHASE 5

AI orchestration.

Fix:

* intent routing
* agent execution
* agent failure handling
* structured outputs
* Granite integration

## PHASE 6

Market intelligence.

Implement:

* provider abstraction
* mock provider
* real provider adapter
* freshness
* forecasting

## PHASE 7

Quality AI.

Implement actual image analysis or provider abstraction.

## PHASE 8

Admin.

Implement:

* market data
* audit logs
* AI monitoring
* user management
* transactions

## PHASE 9

Notifications + multilingual + voice.

## PHASE 10

Testing + performance + production hardening.

---

# 57. FINAL SYSTEM TEST

Before declaring the project complete, perform a full audit.

Run:

```text
npm install
```

for both frontend and backend.

Then:

```text
typecheck
lint
test
build
```

where available.

Start:

```text
backend
frontend
postgresql
```

Then verify actual browser workflows.

Do not say "working" because the code compiles.

Actually test the workflows.

---

# 58. FINAL ACCEPTANCE CHECKLIST

The project can only be considered complete when:

### Frontend

* [ ] No broken routes
* [ ] No placeholder pages
* [ ] No dead buttons
* [ ] No major TypeScript errors
* [ ] Responsive UI
* [ ] Loading states
* [ ] Error states
* [ ] Empty states
* [ ] Proper role-based navigation
* [ ] React Query cache updates
* [ ] Redux state works

### Backend

* [ ] All APIs reachable
* [ ] Validation implemented
* [ ] Authorization implemented
* [ ] Ownership checks implemented
* [ ] Centralized error handling
* [ ] Logging
* [ ] Security middleware
* [ ] Database transactions
* [ ] Concurrency safety
* [ ] Idempotency

### Database

* [ ] Schema valid
* [ ] Migrations valid
* [ ] Indexes
* [ ] Constraints
* [ ] Referential integrity
* [ ] Seed data
* [ ] No accidental destructive migration

### AI

* [ ] All intended agents execute
* [ ] Orchestrator routes correctly
* [ ] Granite integration works
* [ ] Fallback is transparent
* [ ] AI results are structured
* [ ] Confidence exists
* [ ] AI audit logs exist
* [ ] No hallucinated business data
* [ ] Quality AI is clearly labeled if still demo

### Marketplace

* [ ] Buyer offers
* [ ] Offer expiry
* [ ] Buyer verification
* [ ] Matching
* [ ] Net price
* [ ] Transaction creation
* [ ] Transaction status
* [ ] Inventory
* [ ] Completion
* [ ] Income
* [ ] Notifications

### Admin

* [ ] Farmers
* [ ] Buyers
* [ ] Verification
* [ ] Transactions
* [ ] Market data
* [ ] AI monitoring
* [ ] Audit logs
* [ ] System health

---

# 59. FINAL RULE — DO NOT FAKE COMPLETION

This is extremely important.

Never tell me:

```text
Everything is working
```

unless you actually verified it.

If a feature cannot be fully implemented because an external API, IBM service, voice provider, market-data provider, or vision model credential is unavailable:

1. Build the correct provider abstraction.
2. Implement a safe mock/demo provider if appropriate.
3. Clearly mark it as MOCK/DEMO.
4. Document exactly what external configuration is required.
5. Do not pretend it is production functionality.

---

# 60. FINAL DELIVERABLE

At the end, provide a final engineering report containing:

```text
1. What was already working
2. What was broken
3. What you changed
4. What files were changed
5. What database changes were made
6. What APIs were added/changed
7. What AI agents were fixed
8. What security problems were fixed
9. What tests were added
10. What tests passed
11. What tests failed
12. What external credentials/services are required
13. What remains MOCK/DEMO
14. How to run frontend
15. How to run backend
16. How to run database
17. Production deployment instructions
18. Final readiness percentage
19. Remaining risks
```

Do NOT hide failures.

---

# 61. MOST IMPORTANT INSTRUCTION

Treat this project as a **real SaaS product**, not a college CRUD project.

The final goal is:

```text
Reliable
+
Secure
+
Scalable
+
Maintainable
+
Tested
+
Observable
+
AI-powered
+
Business-logic correct
+
Production-ready
```

The frontend, backend, database, AI agents, marketplace, transaction engine, notifications and admin system must operate as **one integrated platform**.

Start by inspecting the existing repository.

Do not rebuild blindly.

Fix existing problems first.

Then implement missing workflows.

Then integrate everything.

Then test everything.

Then perform a final production-readiness audit.

**Do not stop after making the UI look complete.**

The actual business logic and end-to-end data flow are the highest priority.
