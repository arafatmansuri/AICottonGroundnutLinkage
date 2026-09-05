# MASTER DEVELOPMENT PROMPT

# KisanMitra AI — AI-Powered Cotton & Groundnut Market Linkage Platform

You are a senior full-stack architect, software engineer, AI engineer, backend engineer, frontend engineer, database designer, DevOps engineer, and QA engineer.

Your task is to BUILD a complete, production-quality web platform called:

**KisanMitra AI**

This is an **AI-Powered Cotton & Groundnut Market Linkage Platform** for farmers, buyers, and administrators.

The project must not be treated as a simple CRUD website or a simple chatbot.

It must be built as a **complete Agentic AI-powered market intelligence and direct buyer linkage platform** where all frontend components, backend APIs, database operations, AI agents, business logic, authentication, notifications, calculations, and workflows work together correctly.

The original product concept is based on:

**Market Intelligence + AI Advisor + Direct Buyer Marketplace + Quality Assistance + Farmer Income Dashboard**

The platform must help farmers answer:

1. Where should I sell?
2. To whom should I sell?
3. When should I sell?
4. How much should I sell or store?

The core transformation is:

**Information → Intelligence → Action**

---

# 1. IMPORTANT DEVELOPMENT INSTRUCTION

Before writing or modifying code:

1. Inspect the complete existing project structure.
2. Inspect both the frontend and backend folders.
3. Understand all existing files and configurations.
4. Do not blindly overwrite existing working functionality.
5. Reuse existing components and utilities when appropriate.
6. Identify missing features and incomplete implementations.
7. Identify broken APIs, incorrect imports, dead code, inconsistent naming, duplicate logic, and configuration problems.
8. Create a clear implementation plan internally before making major changes.
9. Then implement the complete platform systematically.

The final result must be a **fully working application**, not a UI mockup.

Every button, form, modal, table, filter, API call, chart, authentication flow, AI workflow, calculation, and dashboard action must perform its intended function.

Do not create fake functionality where real application logic is expected.

If an external API or IBM AI service is unavailable during development, implement a clean provider abstraction and realistic mock/demo provider so that the application still works locally without changing the architecture.

---

# 2. PROJECT FOLDER STRUCTURE

The project must have two primary folders:

```text
project-root/
│
├── frontend/
│
└── backend/
```

Do not mix frontend and backend responsibilities.

---

# 3. FRONTEND TECHNOLOGY

Use:

* React
* TypeScript
* Tailwind CSS
* React Query / TanStack Query for server-state and API management
* Redux Toolkit for global client-side state management
* React Router
* Axios or an equivalent clean HTTP client
* Modern reusable React components
* Responsive design

Use TypeScript throughout the frontend.

Avoid unnecessary JavaScript files.

---

# 4. FRONTEND ARCHITECTURE

Create a scalable structure similar to:

```text
frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── api/
│   ├── store/
│   ├── slices/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   ├── routes/
│   ├── assets/
│   ├── i18n/
│   └── App.tsx
│
├── public/
├── package.json
└── ...
```

Use feature-based organization where practical.

Do not create giant components.

Break the application into reusable components.

---

# 5. BACKEND TECHNOLOGY

Use:

* Node.js
* TypeScript
* REST API architecture
* PostgreSQL as the preferred production database
* ORM such as Prisma or another strong TypeScript ORM
* JWT-based authentication
* Role-based authorization
* Validation using Zod/Joi/class-validator or an equivalent robust validation system
* Secure password hashing
* Centralized error handling
* Structured logging
* Environment-based configuration

The backend must be completely TypeScript based.

---

# 6. BACKEND ARCHITECTURE

Use a clean architecture such as:

```text
backend/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── middleware/
│   ├── validators/
│   ├── agents/
│   ├── orchestrator/
│   ├── ai/
│   ├── integrations/
│   ├── utils/
│   ├── jobs/
│   ├── notifications/
│   ├── database/
│   ├── types/
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
├── tests/
├── .env.example
└── package.json
```

Maintain strict separation between:

* Routes
* Controllers
* Business services
* Database/repositories
* AI agents
* AI orchestration
* External integrations

Do not put all business logic inside controllers.

---

# 7. MAIN USER ROLES

Implement three major roles.

## FARMER

Farmer can:

* Register
* Login
* Manage profile
* Add crops
* Add crop quantity
* View crop inventory
* View mandi prices
* Compare markets
* View price trends
* Get price forecasts
* Find buyers
* Compare buyer offers
* Calculate net realization
* Ask AI questions
* Get sell/store recommendations
* Upload crop images
* Receive quality assistance
* Track income
* Track transactions
* Receive notifications
* Use Gujarati/Hindi/English interface
* Use voice assistant where supported

---

# 8. BUYER

Buyer can:

* Register
* Login
* Create buyer profile
* Submit verification information
* Specify crops required
* Specify required quantity
* Specify quality requirements
* Publish purchase offers
* Set offered price
* Set location
* View matching farmer listings
* Send purchase offers
* Contact farmers through supported platform workflow
* Track purchase requests
* Manage active offers
* View transaction history

Buyer verification status must be clearly represented.

Unverified buyers should not receive the same trust level as verified buyers.

---

# 9. ADMIN

Admin can:

* Login
* View platform dashboard
* Manage farmers
* Manage buyers
* Verify/reject buyers
* Manage crops
* Manage mandis
* Manage market prices
* Manage market data
* Monitor transactions
* Monitor AI agent activity
* View system analytics
* Manage complaints
* Monitor suspicious activity
* Manage notifications
* Manage platform settings
* View audit logs

Admin functionality must be protected using proper role-based authorization.

---

# 10. CORE PLATFORM MODULES

Implement the following modules:

1. Authentication
2. Farmer Management
3. Buyer Management
4. Crop Management
5. Mandi Management
6. Market Price Management
7. Price Trend Analysis
8. Mandi Price Forecasting
9. Direct Buyer Marketplace
10. Buyer-Farmer Matching
11. Net Price Intelligence
12. Storage vs Selling Advisor
13. AI Crop Quality Assistance
14. Farmer Income Dashboard
15. AI Assistant
16. Voice Assistant architecture
17. Notifications
18. Transaction Management
19. Admin Dashboard
20. Analytics
21. Audit Logging
22. Multilingual support

---

# 11. AUTHENTICATION SYSTEM

Implement secure authentication.

Required:

* Registration
* Login
* Logout
* Access token
* Refresh token
* Password hashing
* Role-based authorization
* Protected routes
* Session/token handling
* Account status
* Buyer verification status
* Proper validation
* Rate limiting where appropriate

Roles:

```text
FARMER
BUYER
ADMIN
```

Never trust the frontend for authorization.

Every protected backend endpoint must validate authorization.

---

# 12. DATABASE DESIGN

Create a normalized database schema.

At minimum include entities similar to:

```text
User
FarmerProfile
BuyerProfile
AdminProfile
Crop
FarmerCrop
Mandi
MarketPrice
MarketPriceHistory
BuyerRequirement
BuyerOffer
BuyerVerification
Transaction
TransportationCost
StorageOption
QualityAssessment
AIRecommendation
Notification
Conversation
AIRequest
AIResponse
AuditLog
Complaint
```

Use proper relationships.

Example:

```text
User
 ├── FarmerProfile
 ├── BuyerProfile
 └── AdminProfile

FarmerProfile
 └── FarmerCrop

Crop
 ├── FarmerCrop
 ├── BuyerRequirement
 ├── BuyerOffer
 └── MarketPrice

Mandi
 └── MarketPrice

FarmerCrop
 ├── QualityAssessment
 ├── AIRecommendation
 └── Transaction
```

Use foreign keys and constraints.

Avoid duplicated data.

Use timestamps:

* createdAt
* updatedAt

Where appropriate also use:

* deletedAt
* status
* verifiedAt

---

# 13. CROP MANAGEMENT

Supported crops:

## Cotton

## Groundnut

---

# 14. FARMER CROP INVENTORY

A farmer should be able to add:

```text
Crop
Quantity
Unit
Location
Quality
Expected Price
Harvest Date
Available Quantity
Storage Status
```

Example:

```text
Crop: Cotton
Quantity: 100 Quintals
Location: Ahmedabad
Quality: Grade A
Available: 100 Quintals
Storage: Not Stored
```

Validate all quantities.

Do not allow negative quantities.

Do not allow a transaction to sell more quantity than the farmer actually owns.

Inventory must be updated atomically after a successful transaction.

---

# 15. MANDI PRICE MODULE

Create a market intelligence module.

Display:

* Mandi name
* Crop
* Current price
* Minimum price
* Maximum price
* Modal/representative price where available
* Arrival quantity where available
* Date/time
* Price change
* Percentage change
* Trend

Example:

```text
Ahmedabad Mandi
Cotton
₹7,050/quintal

Rajkot Mandi
Cotton
₹7,200/quintal
```

Support filtering by:

* Crop
* Location
* Mandi
* Date
* Price range

---

# 16. MARKET PRICE DATA PIPELINE

Create a clean market-data provider architecture.

Example:

```text
Market Data Source
        ↓
Data Fetcher
        ↓
Validation
        ↓
Normalization
        ↓
Database
        ↓
Market Intelligence Service
        ↓
AI Agents
```

Do not allow malformed market data to directly enter the database.

Validate:

* Crop
* Mandi
* Price
* Date
* Quantity
* Source

If a real market API is unavailable, create a mock provider with realistic demo data.

The provider interface must make it easy to replace mock data with a real provider later.

---

# 17. MANDI PRICE FORECASTING AGENT

Create a dedicated:

**MandiPriceForecastingAgent**

It should analyze:

* Historical prices
* Current prices
* Market arrivals
* Seasonal patterns
* Demand/supply indicators
* Crop
* Location
* Market conditions

Input example:

```json
{
  "crop": "cotton",
  "location": "Ahmedabad",
  "mandiId": "123",
  "historicalDays": 90
}
```

Output should be structured.

Example:

```json
{
  "currentPrice": 7100,
  "forecastRange": {
    "min": 7200,
    "max": 7350
  },
  "trend": "INCREASING",
  "signal": "SELL_PARTIALLY",
  "confidence": 0.78,
  "horizonDays": 7,
  "explanation": "..."
}
```

IMPORTANT:

Never present forecasts as guaranteed future prices.

Always communicate uncertainty.

---

# 18. DIRECT BUYER-FARMER MATCHING AGENT

Create:

**BuyerMatchingAgent**

Input:

```text
Crop
Quantity
Quality
Farmer Location
Expected Price
```

Match buyers using:

* Crop compatibility
* Quantity requirement
* Quality requirement
* Offered price
* Distance
* Transportation cost
* Buyer verification
* Buyer reliability
* Expected net realization

Example:

```text
Buyer A
Offer: ₹7,450
Quantity: 80 quintals
Distance: 45 km
Verified: Yes

Buyer B
Offer: ₹7,350
Quantity: 150 quintals
Distance: 70 km
Verified: Yes
```

Return ranked buyers.

Do not rank only by gross price.

---

# 19. NET PRICE INTELLIGENCE

This is one of the most important features of the platform.

The system must calculate:

```text
Net Realization
=
Gross Selling Value
-
Transportation Cost
-
Storage Cost
-
Applicable Platform/Transaction Cost
-
Other Applicable Costs
```

For per-quintal comparison:

```text
Net Price Per Quintal
=
Offered Price
-
Transport Cost Per Quintal
-
Storage Cost Per Quintal
-
Other Cost Per Quintal
```

Example:

```text
Mandi:
₹7,500
Transport:
₹300

Net:
₹7,200
```

Direct buyer:

```text
₹7,350
Transport:
₹100

Net:
₹7,250
```

The system should therefore identify the direct buyer as the better estimated realization.

The UI must clearly distinguish:

**Gross Price**

from

**Estimated Net Realization**

This logic must be implemented in the backend as the source of truth.

Do not calculate critical financial values only on the frontend.

---

# 20. TRANSPORTATION COST ENGINE

Create a transportation calculation service.

Inputs may include:

* Origin
* Destination
* Distance
* Quantity
* Transport rate
* Vehicle type

The service should return:

```text
Distance
Estimated Total Transport Cost
Transport Cost Per Quintal
```

If real maps/routing API is unavailable, use a configurable mock distance/cost provider.

Keep the provider abstraction separate.

---

# 21. STORAGE & SELLING TIMING ADVISOR AGENT

Create:

**StorageSellingAdvisorAgent**

The agent must compare:

```text
Current Selling Value

versus

Expected Future Selling Value
-
Storage Cost
-
Additional Transportation Cost
-
Expected Risk
```

Example:

```text
Current Price = ₹7,100

Expected Future Price = ₹7,350

Storage Cost = ₹100

Potential Additional Value = ₹150
```

Potential recommendation:

```text
CONSIDER_STORING
```

Another example:

```text
Current = ₹7,100
Future = ₹7,150
Storage = ₹100
```

Recommendation:

```text
SELL_NOW
```

The decision must consider:

* Forecast confidence
* Storage duration
* Storage cost
* Quality deterioration risk
* Market volatility
* Farmer risk preference

---

# 22. PARTIAL SELLING STRATEGY

The system must support recommendations such as:

```text
SELL_NOW
STORE
SELL_PARTIALLY
WAIT_AND_MONITOR
```

Example:

```text
Total Quantity: 200 quintals

Recommended:
Sell Now: 120 quintals
Consider Storage: 80 quintals
```

Do not create arbitrary percentages.

The recommendation engine must explain why the percentage was selected.

The final recommendation must remain decision support, not a guaranteed financial outcome.

---

# 23. AI QUALITY GRADING ASSISTANCE

Create:

**QualityGradingAgent**

The farmer can upload crop images.

For Cotton, analyze visible characteristics such as:

* Visible contamination
* Color
* Boll appearance
* General visible characteristics

For Groundnut:

* Kernel appearance
* Size
* Uniformity
* Visible damage
* Discoloration
* Mold-like visual indicators

Output:

```json
{
  "crop": "cotton",
  "estimatedGrade": "A",
  "confidence": 0.82,
  "estimatedPriceRange": {
    "min": 7200,
    "max": 7500
  },
  "observations": [],
  "warning": "AI-assisted estimate only"
}
```

IMPORTANT:

Never claim that image analysis is a certified laboratory grade.

Always display:

**AI-assisted estimate — final commercial grading should follow accepted physical/laboratory standards.**

---

# 24. IMAGE PROCESSING PIPELINE

Create a robust pipeline:

```text
Image Upload
      ↓
File Validation
      ↓
File Size Validation
      ↓
File Type Validation
      ↓
Secure Storage
      ↓
Quality Agent
      ↓
Assessment
      ↓
Confidence Calculation
      ↓
Result
      ↓
Database
```

Reject:

* Invalid file types
* Excessively large files
* Corrupt files

Do not expose internal storage paths publicly.

---

# 25. FARMER INCOME DASHBOARD

Create a dashboard that shows:

* Total crop quantity
* Current market value
* Best buyer gross offer
* Transportation cost
* Storage cost
* Estimated net realization
* Potential difference
* Sold quantity
* Remaining quantity
* Transaction history
* Income trends

Example:

```text
Crop: Cotton
Quantity: 100 quintals

Current Mandi Value:
₹7,10,000

Best Buyer Gross:
₹7,45,000

Transport:
₹10,000

Estimated Net:
₹7,35,000

Potential Difference:
₹25,000
```

---

# 26. AI FARMER ASSISTANT

Create an intelligent AI assistant.

The assistant must NOT simply return generic chatbot responses.

It should understand farmer intent and call appropriate backend services/agents.

Example:

```text
Farmer:
"Mara cotton atyare vechvu ke thoda divas rokvu?"
```

The system should determine that this is a:

**SELL VS STORE decision request**

Then invoke the required agents.

---

# 27. AGENTIC AI ORCHESTRATION

Create a central:

**AI Orchestrator**

Architecture:

```text
Farmer Query
      ↓
Intent Detection
      ↓
Context Collection
      ↓
Agent Selection
      ↓
Specialized Agents
      ↓
Agent Results
      ↓
Validation
      ↓
Granite Reasoning Layer
      ↓
Final Recommendation
      ↓
Farmer-Friendly Response
```

The orchestrator should be capable of invoking multiple agents.

Example:

```text
Farmer asks:
"Should I sell my 200 quintals of groundnut now?"
```

Workflow:

```text
Farmer Assistant
       ↓
Intent Detection
       ↓
Mandi Price Agent
       ↓
Forecasting Agent
       ↓
Buyer Matching Agent
       ↓
Storage Agent
       ↓
Income/Net Price Engine
       ↓
Granite Reasoning Layer
       ↓
Final Recommendation
```

---

# 28. AGENT INTERFACE STANDARD

Every AI agent should follow a consistent interface.

Example conceptual interface:

```typescript
interface AIAgent<Input, Output> {
  name: string;

  execute(input: Input): Promise<Output>;

  validateInput(input: Input): boolean;

  getConfidence(output: Output): number;
}
```

Agents must return structured results.

Do not allow agents to communicate only through unstructured text.

Use structured objects internally.

---

# 29. IBM GRANITE INTEGRATION

Integrate IBM Granite as the intelligent reasoning/language layer.

Granite should be responsible for:

* Natural language understanding
* Farmer query understanding
* Context interpretation
* Agent result synthesis
* Explanation generation
* Gujarati/Hindi/English response generation
* Conversational interaction

Do not hardcode the API key.

Use environment variables.

Example:

```env
IBM_GRANITE_API_KEY=
IBM_GRANITE_ENDPOINT=
IBM_GRANITE_MODEL=
```

Create an abstraction:

```text
AIProvider
   ↓
GraniteProvider
   ↓
MockAIProvider
```

This ensures the application can run in development even when the real IBM service is unavailable.

---

# 30. GRANITE SAFETY / RESPONSE RULES

The AI must not:

* Invent market prices
* Invent buyers
* Invent transactions
* Guarantee future prices
* Claim certified crop grading
* Make unsupported financial promises

If required data is missing, the AI should say that data is unavailable instead of hallucinating.

The AI recommendation must be based on structured backend data.

---

# 31. AI RECOMMENDATION OBJECT

Store recommendations in a structured format.

Example:

```json
{
  "decision": "SELL_PARTIALLY",
  "recommendedSellQuantity": 120,
  "recommendedHoldQuantity": 80,
  "confidence": 0.76,
  "reasoning": [
    "Current buyer offers are favorable",
    "Market trend is moderately increasing",
    "Storage has additional cost",
    "Forecast contains uncertainty"
  ],
  "dataTimestamp": "...",
  "createdAt": "..."
}
```

Always store the data timestamp used for the recommendation.

This is important because market data changes.

---

# 32. FARMER DASHBOARD

Create a clean, professional, farmer-friendly dashboard.

Sections:

### Today's Market

```text
Cotton
₹7,250 ↑

Groundnut
₹6,850 ↑
```

### My Crops

```text
Cotton — 100 quintals
Groundnut — 50 quintals
```

### AI Recommendation

Example:

```text
Cotton prices are currently showing an upward trend.

Compare direct buyers before selling.
```

### Quick Actions

* Check Market Prices
* Find Buyers
* Sell or Store?
* Check Crop Quality
* My Income
* Ask AI

---

# 33. BUYER MARKETPLACE

Create a marketplace where farmers can discover verified buyers.

Each buyer card should show:

* Buyer name
* Verification badge
* Crop required
* Required quantity
* Offered price
* Location
* Distance
* Estimated transportation
* Estimated net realization
* Quality requirement
* Offer expiry
* Buyer rating/reliability if implemented

Add:

**Compare Buyers**

function.

---

# 34. OFFER COMPARISON

Farmers must be able to compare multiple offers.

Example table:

| Buyer   | Gross Price | Transport | Storage | Net Price | Verification |
| ------- | ----------: | --------: | ------: | --------: | ------------ |
| Buyer A |      ₹7,450 |      ₹150 |      ₹0 |    ₹7,300 | Verified     |
| Buyer B |      ₹7,350 |      ₹100 |      ₹0 |    ₹7,250 | Verified     |

Highlight the best estimated net realization.

---

# 35. TRANSACTION WORKFLOW

Implement a proper transaction state machine.

Example:

```text
OFFER_CREATED
      ↓
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

Possible failure/cancellation states:

```text
REJECTED
CANCELLED
EXPIRED
DISPUTED
```

Do not allow invalid state transitions.

For example:

A completed transaction must not go directly back to pending.

---

# 36. INVENTORY CONSISTENCY

This is critical.

Suppose farmer owns:

```text
100 quintals
```

and sells:

```text
40 quintals
```

The system must update:

```text
Available = 60 quintals
Sold = 40 quintals
```

Use database transactions for critical operations.

Prevent:

* Overselling
* Duplicate transaction processing
* Race conditions
* Negative inventory

---

# 37. NOTIFICATION SYSTEM

Implement notifications for:

### Price Alert

```text
Cotton prices in Rajkot increased.
A verified buyer is offering ₹X/quintal.
```

### Market Alert

```text
Groundnut prices are showing increased volatility.
```

### Buyer Alert

```text
A verified buyer is looking for 100 quintals of cotton.
```

Support notification types such as:

```text
PRICE_ALERT
BUYER_MATCH
MARKET_ALERT
TRANSACTION_UPDATE
AI_RECOMMENDATION
SYSTEM
```

---

# 38. MULTILINGUAL SUPPORT

Support:

* English
* Hindi
* Gujarati

The frontend should have a language selector.

Do not hardcode all visible text directly inside components.

Use an internationalization architecture.

Example:

```text
English
Hindi
Gujarati
```

AI responses should also be able to respond in the selected language.

---

# 39. VOICE ASSISTANT ARCHITECTURE

Design the system so voice support can be integrated cleanly.

Flow:

```text
Voice Input
    ↓
Speech-to-Text
    ↓
Intent Detection
    ↓
AI Orchestrator
    ↓
Agents
    ↓
Granite
    ↓
Response
    ↓
Text-to-Speech
```

Examples:

```text
"મારો કપાસ અત્યારે વેચવો કે રાખવો?"

"મારા માટે સારો ખરીદદાર શોધો."
```

If external speech services are not configured, keep the UI and service abstraction ready without breaking the rest of the application.

---

# 40. ADMIN DASHBOARD

Admin dashboard should include:

### Platform Statistics

* Total farmers
* Total buyers
* Verified buyers
* Active crops
* Active offers
* Completed transactions
* Total market records
* AI requests
* Pending complaints

### Charts

* Transactions over time
* Crop distribution
* Buyer activity
* Market price trends
* Platform activity

### Management

* Farmers
* Buyers
* Verification
* Market data
* Crops
* Transactions
* Complaints
* Notifications
* AI monitoring

---

# 41. API DESIGN

Create clean REST APIs.

Example:

```text
/api/auth/*
/api/farmers/*
/api/buyers/*
/api/crops/*
/api/mandis/*
/api/market-prices/*
/api/forecast/*
/api/matching/*
/api/storage-advisor/*
/api/quality/*
/api/income/*
/api/transactions/*
/api/notifications/*
/api/ai/*
/api/admin/*
```

Use proper HTTP methods:

```text
GET
POST
PUT/PATCH
DELETE
```

Use consistent response structures.

Example:

```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": {}
  }
}
```

---

# 42. API VALIDATION

Validate every request.

Never trust:

* User input
* Query parameters
* URL parameters
* Uploaded files
* AI output
* External API responses

Validate on the backend.

Frontend validation is useful for UX but backend validation is mandatory.

---

# 43. ERROR HANDLING

Create centralized backend error handling.

Handle:

* Validation errors
* Authentication errors
* Authorization errors
* Database errors
* External API errors
* AI service errors
* File upload errors
* Timeout errors
* Rate limit errors
* Not found errors
* Conflict errors

The application should never crash because of a normal API failure.

---

# 44. FRONTEND API MANAGEMENT

Use React Query / TanStack Query for:

* Fetching
* Caching
* Refetching
* Mutations
* Loading states
* Error states
* Optimistic updates where safe

Use Redux Toolkit for client/global state such as:

* Auth state
* User information
* Language
* UI preferences
* Notifications state where appropriate

Do NOT put every API response into Redux.

Server state belongs in React Query.

---

# 45. FRONTEND UX

The application should feel modern and professional.

Use:

* Responsive layouts
* Clean cards
* Tables
* Charts
* Filters
* Search
* Pagination
* Modals
* Toast notifications
* Loading skeletons
* Empty states
* Error states
* Confirmation dialogs

The farmer interface should be simple.

Do not make the farmer dashboard look like a complicated enterprise admin panel.

---

# 46. RESPONSIVE DESIGN

The platform must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

The farmer experience should be especially mobile-friendly.

Avoid:

* Overflowing tables
* Broken cards
* Tiny buttons
* Unusable forms
* Horizontal scrolling where unnecessary

---

# 47. SECURITY

Implement:

* Password hashing
* JWT security
* Refresh token handling
* Role-based access
* Input validation
* File validation
* Rate limiting
* CORS configuration
* Secure headers
* SQL injection protection through ORM
* XSS protection
* Proper environment variables
* No secrets committed to Git
* Audit logs for sensitive operations

Never expose:

* API keys
* Database credentials
* Secret tokens
* Internal error stack traces

to the frontend.

---

# 48. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

Include placeholders such as:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

IBM_GRANITE_API_KEY=
IBM_GRANITE_ENDPOINT=
IBM_GRANITE_MODEL=

MARKET_DATA_API_URL=
MARKET_DATA_API_KEY=

STORAGE_PROVIDER=
```

Never hardcode secrets.

---

# 49. MOCK DATA / DEMO MODE

Because this is also a hackathon project, create a realistic demo mode.

Include realistic data for:

### Mandis

* Ahmedabad
* Rajkot
* Surendranagar
* Other relevant markets

### Crops

* Cotton
* Groundnut

### Buyers

Create realistic demo buyer profiles.

Clearly mark demo data internally.

The architecture must allow demo data to be replaced with real data later.

---

# 50. REAL DATA VS MOCK DATA

Create provider interfaces.

Example:

```typescript
interface MarketDataProvider {
  getCurrentPrices(): Promise<MarketPrice[]>;
  getHistoricalPrices(): Promise<MarketPrice[]>;
}
```

Implement:

```text
MockMarketDataProvider
RealMarketDataProvider
```

Then configure which provider is active using environment/configuration.

Do the same pattern for:

* AI
* Maps
* Voice
* Notifications
* External market data

---

# 51. AI DATA PIPELINE

Never let the LLM directly determine critical numerical values.

Correct architecture:

```text
Database
   ↓
Business Logic
   ↓
Calculations
   ↓
Structured Agent Results
   ↓
Granite
   ↓
Explanation
```

Not:

```text
Database
   ↓
LLM
   ↓
Random Calculation
```

All important calculations such as:

* Net price
* Transport
* Storage cost
* Quantity
* Income
* Forecast values
* Inventory

must be calculated by deterministic backend services where possible.

Granite should explain and synthesize those results.

---

# 52. RECOMMENDATION ENGINE

Create a deterministic recommendation layer.

Inputs:

```text
Current Price
Forecast
Forecast Confidence
Buyer Offers
Transport Cost
Storage Cost
Risk
Farmer Quantity
Farmer Risk Preference
```

Output:

```text
SELL_NOW
STORE
SELL_PARTIALLY
WAIT_AND_MONITOR
```

Then send the structured result to Granite for human-friendly explanation.

This ensures robust logic.

---

# 53. RISK MANAGEMENT

Every recommendation should consider uncertainty.

For example:

```text
Forecast Confidence: 52%
```

should produce a different recommendation from:

```text
Forecast Confidence: 90%
```

Do not recommend aggressive storage strategies when forecast confidence is low unless the farmer's selected risk preference supports it.

Provide risk labels:

```text
LOW
MEDIUM
HIGH
```

---

# 54. DATA FRESHNESS

Market recommendations must display when data was last updated.

Example:

```text
Market data updated:
Today, 10:35 AM
```

If data becomes stale, show:

```text
Market data may be outdated.
```

Do not silently present old market prices as real-time data.

---

# 55. AI AUDITABILITY

For important AI recommendations, store:

* User ID
* Query
* Agent(s) used
* Input context
* Data timestamp
* Agent outputs
* Final recommendation
* Confidence
* AI explanation
* Created timestamp

This allows administrators to understand why a recommendation was generated.

---

# 56. OBSERVABILITY

Add logging for:

* API requests
* API errors
* AI requests
* AI failures
* Agent execution
* Transaction failures
* Authentication failures
* External service failures

Do not log sensitive information such as passwords or tokens.

---

# 57. TESTING

Do not consider the project complete without testing.

Create:

### Unit tests

For:

* Net price calculations
* Storage calculations
* Transport calculations
* Forecast processing
* Buyer matching
* Inventory calculations
* Recommendation engine

### API integration tests

Test:

* Login
* Registration
* Crop creation
* Market prices
* Buyer offers
* Matching
* Transactions
* AI endpoints

### Frontend tests

Test:

* Forms
* Protected routes
* Dashboard rendering
* API loading/error states
* Buyer comparison
* Recommendation display

---

# 58. CRITICAL BUSINESS LOGIC TEST CASES

At minimum test:

### Case 1

Gross buyer price is high but transport cost is high.

System should correctly calculate lower net realization.

### Case 2

Lower gross buyer price but lower transport cost.

System should correctly identify higher net realization.

### Case 3

Farmer has 100 quintals.

Attempt to sell 120.

System must reject the transaction.

### Case 4

Two users attempt to purchase the same farmer inventory.

Prevent overselling using proper transaction handling.

### Case 5

Storage expected profit is lower than storage cost.

Recommendation:

```text
SELL_NOW
```

### Case 6

Expected future value significantly exceeds current value and storage cost.

Recommendation may be:

```text
CONSIDER_STORING
```

### Case 7

Forecast confidence is very low.

Recommendation should reflect uncertainty.

### Case 8

Buyer is unverified.

Do not give the buyer the same ranking/trust treatment as a verified buyer.

---

# 59. API FAILURE BEHAVIOR

If market API fails:

Do not crash.

Return:

```text
Market data temporarily unavailable.
```

If Granite fails:

The platform should still work.

Use a fallback response based on structured agent data where possible.

If a buyer matching service fails:

The farmer should still be able to view existing buyer listings.

If image analysis fails:

Show a clear retry message.

The system must degrade gracefully.

---

# 60. LOADING / ERROR / EMPTY STATES

Every API-driven page must handle:

### Loading

Show skeleton/spinner.

### Success

Show data.

### Empty

Example:

```text
No buyers currently match your requirements.
```

### Error

Example:

```text
Unable to load market prices.
Please try again.
```

Never leave the user with a blank screen.

---

# 61. FRONTEND ROUTING

Create protected routes.

Example:

```text
/
 /login
 /register

 /farmer/dashboard
 /farmer/crops
 /farmer/market
 /farmer/buyers
 /farmer/compare
 /farmer/storage-advisor
 /farmer/quality
 /farmer/income
 /farmer/ai-assistant
 /farmer/transactions
 /farmer/notifications

 /buyer/dashboard
 /buyer/profile
 /buyer/requirements
 /buyer/offers
 /buyer/farmers
 /buyer/transactions

 /admin/dashboard
 /admin/farmers
 /admin/buyers
 /admin/verification
 /admin/market-data
 /admin/transactions
 /admin/analytics
 /admin/complaints
 /admin/ai-monitoring
```

Users must not be able to access another role's dashboard by manually changing the URL.

---

# 62. DASHBOARD COMPONENTS

Create reusable components such as:

```text
MarketPriceCard
CropCard
BuyerCard
BuyerComparisonTable
NetRealizationCard
AIRecommendationCard
ForecastCard
StorageAdvisorCard
QualityAssessmentCard
IncomeSummaryCard
NotificationCard
TransactionStatus
PriceTrendChart
MarketTable
```

Do not duplicate these components across pages.

---

# 63. CHARTS AND ANALYTICS

Use charts for:

* Price trends
* Historical market prices
* Income
* Crop distribution
* Buyer offers
* Transaction trends

Charts must use real API data.

Do not create decorative charts that display unrelated hardcoded values after the backend is connected.

---

# 64. SEARCH AND FILTERING

Implement useful filtering.

Market:

```text
Crop
Location
Mandi
Date
Price
```

Buyers:

```text
Crop
Quantity
Location
Quality
Price
Verification
Distance
```

Transactions:

```text
Status
Crop
Date
Buyer
```

---

# 65. PAGINATION

Do not return thousands of records in one API response.

Implement backend pagination.

Example:

```text
?page=1&limit=20
```

Frontend should display:

* Current page
* Total pages
* Next
* Previous

---

# 66. DATABASE INDEXING

Add indexes to frequently queried fields.

Examples:

```text
User.email
User.role
MarketPrice.cropId
MarketPrice.mandiId
MarketPrice.date
BuyerOffer.cropId
BuyerOffer.status
Transaction.farmerId
Transaction.buyerId
Notification.userId
```

Optimize queries.

Avoid N+1 database problems.

---

# 67. TRANSACTIONAL OPERATIONS

Use database transactions for:

* Creating transactions
* Updating inventory
* Accepting offers
* Completing sales
* Buyer/farmer quantity updates
* Critical financial calculations

If one step fails, rollback the complete operation.

---

# 68. API DOCUMENTATION

Document all APIs.

Create an API documentation system such as:

```text
Swagger / OpenAPI
```

Document:

* Endpoint
* Method
* Authentication
* Request
* Response
* Error cases

---

# 69. CODE QUALITY

Follow these principles:

* DRY
* SOLID
* Separation of concerns
* Strong typing
* Reusable services
* Reusable components
* Clear naming
* No unnecessary duplication
* No giant files
* No hidden business logic
* No hardcoded secrets
* No random magic numbers

Avoid:

```text
any
```

unless absolutely necessary.

Use proper TypeScript types.

---

# 70. FRONTEND DESIGN LANGUAGE

Create a professional agricultural technology visual identity.

The UI should communicate:

* Trust
* Agriculture
* Technology
* Transparency
* Simplicity

Use a clean design system.

Prioritize accessibility.

Buttons and actions must be easy to understand.

---

# 71. FARMER-FIRST UX

The most important user is the farmer.

The farmer should be able to quickly understand:

```text
Current Price
Best Buyer
Net Price
Market Trend
Sell/Store Recommendation
```

Avoid overwhelming farmers with technical AI terminology.

Instead of:

```text
Multi-Agent Market Optimization Pipeline
```

show:

```text
AI Recommendation
```

The technical agent architecture can exist behind the scenes.

---

# 72. AI EXPLANATION UX

Do not only show:

```text
SELL
```

Show:

```text
AI Recommendation:
Sell 60% now and consider storing 40%.

Why?

• Current verified buyer offers are strong.
• Market trend is moderately increasing.
• Storage has additional cost.
• Forecast confidence is moderate.

Estimated Net Realization:
₹7,300/quintal
```

This makes the AI recommendation understandable.

---

# 73. COMPLETE USER JOURNEY

Implement this complete farmer journey:

```text
Register
   ↓
Login
   ↓
Create Profile
   ↓
Add Crop
   ↓
Enter Quantity
   ↓
View Market Prices
   ↓
Compare Mandis
   ↓
View Forecast
   ↓
Find Buyers
   ↓
Compare Offers
   ↓
Calculate Net Realization
   ↓
Check Sell vs Store Recommendation
   ↓
Optional Quality Assessment
   ↓
Select Buyer
   ↓
Create/Accept Offer
   ↓
Transaction
   ↓
Inventory Update
   ↓
Income Dashboard
   ↓
Notifications
```

Every step must actually connect to the backend.

---

# 74. COMPLETE AI JOURNEY

Implement:

```text
Farmer Question
      ↓
Intent Detection
      ↓
Context Extraction
      ↓
Required Data Collection
      ↓
Agent Selection
      ↓
Agent Execution
      ↓
Structured Results
      ↓
Business Logic Validation
      ↓
Granite Reasoning
      ↓
Recommendation
      ↓
Explanation
      ↓
Store AI Interaction
```

---

# 75. EXAMPLE AI FLOW

Farmer:

```text
"I have 200 quintals of groundnut. Should I sell now?"
```

System should:

1. Identify crop = groundnut.
2. Identify quantity = 200 quintals.
3. Retrieve farmer location.
4. Retrieve current mandi prices.
5. Retrieve historical prices.
6. Run forecasting agent.
7. Search verified buyers.
8. Calculate transportation.
9. Calculate buyer net realization.
10. Calculate storage economics.
11. Evaluate risk.
12. Generate structured recommendation.
13. Send context to Granite.
14. Generate simple response.
15. Save recommendation.
16. Display result to farmer.

---

# 76. RECOMMENDATION EXAMPLE

Possible output:

```text
Based on the latest available market information:

Current market price:
₹7,100/quintal

Best verified buyer:
₹7,400/quintal

Estimated transport:
₹100/quintal

Estimated net realization:
₹7,300/quintal

Market trend:
Moderately increasing

Recommendation:
Consider selling 120 quintals now and evaluating short-term storage for the remaining 80 quintals.

Reason:
Current verified buyer offers are attractive, while the forecast indicates a moderate upward trend. However, future prices are uncertain and storage has additional cost and risk.
```

The exact values must come from the system's current data, not hardcoded text.

---

# 77. IBM CLOUD READINESS

Structure the project so it can be deployed to IBM Cloud.

Keep:

* Environment configuration
* Containerization readiness
* Production build scripts
* Database configuration
* Health endpoints
* Logging
* Error monitoring
* Scalable API architecture

Create:

```text
/health
```

endpoint.

It should verify basic backend availability and optionally dependency health.

---

# 78. DEPLOYMENT

Prepare:

```text
frontend/
backend/
```

for independent deployment.

Backend should have:

```text
npm run dev
npm run build
npm run start
npm run test
```

Frontend should have:

```text
npm run dev
npm run build
npm run preview
npm run test
```

Provide a clear README.

---

# 79. README REQUIREMENTS

Create a professional README containing:

* Project overview
* Problem statement
* Features
* Architecture
* Folder structure
* Technology stack
* Environment variables
* Installation
* Database setup
* Running frontend
* Running backend
* API documentation
* AI architecture
* Mock mode
* IBM Granite integration
* Testing
* Deployment
* Demo credentials if applicable

---

# 80. SEED DATA

Create database seed scripts.

Seed:

### Admin

One demo admin.

### Farmers

Several demo farmers.

### Buyers

Several verified/unverified buyers.

### Crops

Cotton and Groundnut.

### Mandis

Multiple Gujarat mandis.

### Market prices

Historical and current demo market prices.

### Offers

Multiple buyer offers.

### Transactions

Some demo transaction records.

The seed data should demonstrate the complete application.

---

# 81. DEMO SCENARIO

The application must be demo-ready.

A hackathon judge should be able to:

1. Login as farmer.
2. See dashboard.
3. Add/view cotton.
4. View mandi prices.
5. View market trend.
6. Ask AI.
7. See multiple agents working.
8. Compare buyers.
9. See net realization.
10. See storage recommendation.
11. Upload crop image.
12. View quality assistance.
13. View income dashboard.
14. Login as buyer.
15. Create offer.
16. Login as admin.
17. Verify buyer.
18. Monitor transactions and AI activity.

---

# 82. AGENT MONITORING PAGE

Create an admin AI monitoring page.

Show:

```text
Agent
Status
Last Execution
Execution Time
Success Rate
Confidence
Recent Requests
```

Agents:

```text
Mandi Price Forecasting Agent
Buyer Matching Agent
Storage & Selling Agent
Quality Grading Agent
Income Analysis Agent
AI Orchestrator
```

This helps demonstrate the Agentic AI architecture during the hackathon.

---

# 83. DO NOT BUILD A FAKE AI SYSTEM

The system should not simply display:

```text
AI says sell now.
```

without actual processing.

At minimum, the AI workflow must:

```text
Input
→ Data retrieval
→ Agent execution
→ Structured analysis
→ Business logic
→ Recommendation
→ Explanation
```

If using mock AI, the mock provider must still follow the same interface.

This makes it easy to replace the mock implementation with IBM Granite.

---

# 84. DO NOT HARD-CODE BUSINESS RESULTS

Do not hardcode:

```text
Best Buyer = Buyer A
Price = ₹7,400
Recommendation = SELL
```

These should be dynamically calculated from database/API data.

Hardcoded values are allowed only for seed/demo data.

---

# 85. DO NOT CREATE DISCONNECTED PAGES

Every page must connect to the actual system.

For example:

If the dashboard displays:

```text
100 quintals cotton
```

that value must come from the authenticated farmer's actual crop data.

If a buyer changes an offer:

The farmer marketplace must reflect the updated offer.

If a farmer sells 20 quintals:

The farmer's inventory and income must update.

If admin verifies a buyer:

The buyer should become verified in marketplace results.

---

# 86. STATE SYNCHRONIZATION

After mutations:

* Invalidate relevant React Query caches.
* Update UI appropriately.
* Avoid stale information.
* Handle optimistic updates only when safe.

Example:

After accepting an offer:

```text
Offer status
+
Inventory
+
Transaction
+
Notifications
+
Income
```

must remain consistent.

---

# 87. BACKEND SOURCE OF TRUTH

The backend is the authoritative source for:

* User permissions
* Inventory
* Transactions
* Prices
* Buyer verification
* Financial calculations
* AI recommendation input data

The frontend is only the presentation and interaction layer.

Never trust frontend-calculated values for critical operations.

---

# 88. FINAL QUALITY AUDIT

Before considering the project complete, perform a complete audit.

Check:

### Frontend

* No broken routes
* No console errors
* No broken imports
* No unused critical components
* Responsive design
* API states handled
* Forms validated
* Authentication works

### Backend

* All routes work
* Validation works
* Authentication works
* Authorization works
* Database relationships work
* Transactions are atomic
* Error handling works
* AI providers work
* Mock providers work

### Database

* Migrations work
* Seed works
* Foreign keys work
* Indexes exist
* No obvious duplication

### AI

* Agents execute
* Orchestrator works
* Structured results work
* Granite provider works/configures correctly
* Mock AI fallback works
* Recommendations are explainable

### Business Logic

* Net price calculation works
* Transport calculation works
* Storage calculation works
* Inventory cannot become negative
* Buyer matching works
* Transaction state transitions work

---

# 89. FIX EVERYTHING YOU FIND

Do not simply report problems.

If you find:

* Broken code
* TypeScript errors
* API errors
* Database errors
* UI bugs
* Incorrect calculations
* Routing problems
* State management issues
* Authentication problems
* AI integration problems

fix them.

After fixing, run the relevant tests/build again.

Continue until the project is stable.

---

# 90. NO PLACEHOLDER IMPLEMENTATION

Do not leave things like:

```text
TODO
Coming Soon
Implement later
Fake button
Temporary alert
```

for core functionality.

If an external dependency is unavailable, create a proper abstraction and working mock implementation.

The application must remain functional.

---

# 91. DEVELOPMENT PRIORITY

Build in this order:

## Phase 1 — Foundation

* Project setup
* Frontend
* Backend
* Database
* Authentication
* Roles
* API architecture

## Phase 2 — Core Market System

* Crops
* Farmers
* Mandis
* Market prices
* Market history
* Market dashboard

## Phase 3 — Buyer Marketplace

* Buyers
* Verification
* Requirements
* Offers
* Matching
* Comparison

## Phase 4 — Financial Intelligence

* Net price
* Transportation
* Income
* Inventory
* Transactions

## Phase 5 — AI Agents

* Forecasting Agent
* Buyer Matching Agent
* Storage Agent
* Quality Agent
* Income Agent
* AI Orchestrator
* Granite integration

## Phase 6 — Advanced UX

* Notifications
* Multilingual
* Voice architecture
* Charts
* Analytics

## Phase 7 — Admin

* Admin dashboard
* Verification
* Market management
* AI monitoring
* Analytics
* Complaints
* Audit logs

## Phase 8 — QA

* Testing
* Bug fixing
* Performance
* Security
* Responsive testing
* Final build

---

# 92. FINAL EXPECTED ARCHITECTURE

The final system should conceptually look like:

```text
                    KISANMITRA AI
                          │
             ┌────────────┴────────────┐
             │                         │
        FRONTEND                    BACKEND
             │                         │
       React + TS              Node.js + TS
       Tailwind                REST APIs
       React Query             Business Logic
       Redux Toolkit           PostgreSQL
             │                         │
             └────────────┬────────────┘
                          │
                    AI ORCHESTRATOR
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Mandi Agent       Buyer Agent       Storage Agent
        │                 │                 │
        ├────────────┬────┴────┬────────────┤
                     │
              Quality Agent
                     │
               Income Agent
                     │
              Granite LLM
                     │
              Final Recommendation
```

---

# 93. CORE VALUE PROPOSITION

The final platform must clearly demonstrate:

### Traditional approach

```text
Price → Farmer
```

### KisanMitra AI

```text
Price
 ↓
Analysis
 ↓
Forecast
 ↓
Buyer Matching
 ↓
Transportation Calculation
 ↓
Net Price
 ↓
Storage Analysis
 ↓
Risk Analysis
 ↓
AI Recommendation
 ↓
Farmer Decision
```

The platform should transform:

**Information → Intelligence → Action**

---

# 94. FINAL ACCEPTANCE CRITERIA

Consider the project complete only when:

* Frontend starts successfully.
* Backend starts successfully.
* Database connects successfully.
* Migrations execute successfully.
* Seed data works.
* Authentication works.
* Role-based access works.
* Farmer workflow works.
* Buyer workflow works.
* Admin workflow works.
* Market price workflow works.
* Buyer matching works.
* Net realization calculation works.
* Storage recommendation works.
* Inventory management works.
* Transaction workflow works.
* AI agent orchestration works.
* Granite integration is configurable.
* Mock AI fallback works.
* Quality image workflow works.
* Notifications work.
* Multilingual architecture works.
* API error handling works.
* Frontend loading/error/empty states work.
* Tests pass.
* Production build succeeds.
* No critical console errors remain.
* No critical TypeScript errors remain.
* No secrets are hardcoded.
* README is complete.
* Hackathon demo flow works from beginning to end.

---

# 95. MOST IMPORTANT INSTRUCTION

Do not focus only on making the UI look beautiful.

The priority is:

**ROBUST BUSINESS LOGIC + CORRECT DATA FLOW + WORKING APIs + AGENTIC AI PIPELINE + DATABASE CONSISTENCY + RELIABLE USER EXPERIENCE**

Every feature must have this complete flow:

```text
Frontend
   ↓
API
   ↓
Validation
   ↓
Controller
   ↓
Service
   ↓
Business Logic
   ↓
Database / AI Agent / External Service
   ↓
Validation
   ↓
API Response
   ↓
React Query
   ↓
UI Update
```

For AI features:

```text
User
 ↓
Frontend
 ↓
AI API
 ↓
Intent Detection
 ↓
Context Retrieval
 ↓
Agent Orchestrator
 ↓
Specialized Agents
 ↓
Deterministic Business Calculations
 ↓
Structured Agent Results
 ↓
IBM Granite
 ↓
Final Recommendation
 ↓
Database / Audit Log
 ↓
Frontend
```

Build the system so that these pipelines work reliably and predictably.

Do not create disconnected modules.

Do not create fake functionality.

Do not use hardcoded business logic where dynamic logic is required.

Do not put critical calculations only on the frontend.

Do not allow invalid transactions.

Do not allow unauthorized access.

Do not allow AI to invent market information.

Do not treat forecasts as guarantees.

Do not treat AI image grading as certified grading.

The final result should be a **complete, scalable, robust, production-quality and hackathon-demo-ready KisanMitra AI platform**.

Start by inspecting the existing `frontend` and `backend` folders, understanding what is already implemented, and then proceed with the implementation systematically.
