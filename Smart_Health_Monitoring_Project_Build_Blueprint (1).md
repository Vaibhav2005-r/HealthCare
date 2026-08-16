# Smart Community Health Monitoring & Early Warning System

## Project Creation & App Structure Blueprint

> **Purpose:** This document explains what the team needs to build, what
> screens are required, how the mobile and web apps connect, and the
> recommended order for implementation.
>
> The project should be built around one core journey:
>
> **ASHA report → offline instant triage → local queue → sync → official
> monitoring dashboard**

------------------------------------------------------------------------

# 1. Product Goal

The system is designed for ASHA/frontline health workers working in
areas with unreliable connectivity.

The mobile app allows an ASHA worker to:

1.  Record a patient's symptoms.
2.  Receive an immediate Green / Amber / Red triage result even without
    internet.
3.  Save the report locally.
4.  Automatically queue the report for synchronization.
5.  Sync the report when connectivity returns.
6.  Access grounded clinical guidance where available.

The official web dashboard allows health officials to:

1.  Monitor incoming cases.
2.  View geographic risk through a map.
3.  Filter cases by district, disease, risk, and date.
4.  Drill into villages/health centers.
5.  View predicted outbreak risk for the next 7--14 days.
6.  Review case details and trends.

For the prototype, the official dashboard is **monitoring/view-only**.
It does not need real response-team assignment or field-alert dispatch.

The source blueprint identifies ASHA workers as the primary mobile users
and health officials as the dashboard users, with the core ASHA journey
being symptom logging → offline triage → queued sync → synchronization.

------------------------------------------------------------------------

# 2. The Main Product Journey

This is the journey the entire project should be designed around.

``` text
ASHA opens mobile app
        ↓
New Report
        ↓
Enter symptoms
        ↓
Enter duration / onset / basic information
        ↓
Run offline triage
        ↓
Green / Amber / Red
        ↓
Show immediate guidance
        ↓
Save report locally
        ↓
"Queued for Sync"
        ↓
Internet unavailable?
        │
        ├── YES → Keep report safely in local queue
        │
        └── NO  → Upload immediately
                         ↓
                    Backend API
                         ↓
                    PostgreSQL
                         ↓
                Official Dashboard
                         ↓
                  Case / Risk Map
```

## Critical principle

The mobile app must never make the ASHA worker wonder:

> "Did my report actually get saved?"

Every report must have an explicit state:

-   Draft
-   Triaged
-   Saved Locally
-   Queued
-   Syncing
-   Synced
-   Sync Failed

------------------------------------------------------------------------

# 3. Two Applications

The system should be treated as two connected products rather than one
web application squeezed into mobile.

``` text
PROJECT
│
├── mobile/
│   └── ASHA Worker App
│
├── web/
│   └── Health Official Dashboard
│
├── backend/
│   └── API + Business Logic
│
├── ai/
│   ├── Offline Triage
│   ├── RAG Clinical Assistant
│   └── Outbreak Forecast
│
├── database/
│   └── PostgreSQL + PostGIS
│
└── shared/
    └── Types / Constants / Risk Definitions
```

------------------------------------------------------------------------

# 4. Mobile App --- ASHA Worker

## 4.1 Main purpose

The mobile application is a **field reporting and triage tool**.

It should prioritize:

-   Speed
-   Large touch targets
-   Clear language
-   High contrast
-   Minimal information density
-   Offline functionality
-   Obvious sync status

Do not design it like the official dashboard.

------------------------------------------------------------------------

# 5. Mobile Navigation

Use a simple bottom navigation:

``` text
┌─────────────────────────────────────────────┐
│                                             │
│              Current Screen                 │
│                                             │
├─────────────────────────────────────────────┤
│  Report  │ Assistant │  Sync  │  Profile   │
└─────────────────────────────────────────────┘
```

## Tabs

### 1. Report

Primary workflow.

Contains:

-   New Report
-   Recent Reports
-   Report status

The main CTA should be:

**+ New Report**

------------------------------------------------------------------------

### 2. Assistant

Clinical guidance interface.

Contains:

-   Question input
-   Suggested questions
-   RAG answer
-   Source document/page
-   Offline/cached state

The assistant is secondary to reporting.

------------------------------------------------------------------------

### 3. Sync

Shows synchronization status.

Contains:

-   Pending reports
-   Syncing reports
-   Successfully synced reports
-   Failed reports
-   Last synchronization time
-   Retry button

This screen is important because offline reliability is one of the
project's main differentiators.

------------------------------------------------------------------------

### 4. Profile

Contains:

-   ASHA worker ID
-   Name
-   Assigned health center
-   District
-   Language
-   Reports this week
-   App information
-   Logout

------------------------------------------------------------------------

# 6. Mobile Screen Structure

``` text
Mobile App
│
├── Login
│
├── Main App
│   │
│   ├── Report
│   │   ├── Report Home
│   │   ├── New Report
│   │   │   ├── Patient Basics
│   │   │   ├── Symptoms
│   │   │   ├── Duration / Onset
│   │   │   ├── Review
│   │   │   └── Triage Result
│   │   │
│   │   └── Report Saved
│   │
│   ├── Assistant
│   │   ├── Chat
│   │   ├── Answer
│   │   └── Source Reference
│   │
│   ├── Sync
│   │   ├── Pending
│   │   ├── Syncing
│   │   ├── Synced
│   │   └── Failed
│   │
│   └── Profile
│       ├── Worker Details
│       ├── Language
│       ├── Settings
│       └── Logout
│
└── Global States
    ├── Offline
    ├── Loading
    ├── Error
    └── Empty
```

------------------------------------------------------------------------

# 7. New Report Flow

This is the most important mobile feature.

Do NOT make one giant form.

Use a short sequence of screens.

``` text
New Report
    ↓
Patient Basics
    ↓
Symptoms
    ↓
Duration / Onset
    ↓
Review
    ↓
Triage
    ↓
Result
    ↓
Save
    ↓
Sync Queue
```

## Screen: Patient Basics

Show only information required for the prototype.

Possible fields:

-   Age
-   Sex, if required
-   Health center
-   Optional patient/reference ID

Avoid collecting unnecessary personally identifiable information.

------------------------------------------------------------------------

## Screen: Symptoms

Use large selectable cards/buttons.

Example:

``` text
What symptoms are present?

[ High Fever ]       [ Diarrhea ]

[ Vomiting ]         [ Dehydration ]

[ Other ]
```

Selected symptoms should be visually obvious.

------------------------------------------------------------------------

## Screen: Duration / Onset

Example:

``` text
When did symptoms start?

[ Today ]
[ 1–2 days ago ]
[ 3–5 days ago ]
[ More than 5 days ]
```

Keep the interaction simple.

------------------------------------------------------------------------

# 8. Triage Result

This is the most important screen in the mobile application.

The result should be visually dominant.

``` text
             TRIAGE RESULT

                RED

             HIGH RISK

      Immediate attention required

---------------------------------------

Detected indicators

• High fever
• Persistent vomiting
• Dehydration

---------------------------------------

[ View Clinical Guidance ]

[ Save Report ]
```

The risk states must always have the same meaning:

``` text
GREEN  = Low Risk
AMBER  = Medium Risk
RED    = High Risk
```

Use the same risk taxonomy on mobile and web.

The original technical blueprint defines the offline classifier around
symptom flags such as high fever, persistent vomiting, dehydration, and
duration, producing Green/Amber/Red tags without network dependency.

------------------------------------------------------------------------

# 9. Offline Architecture

The mobile app must work when the internet is completely unavailable.

``` text
                    MOBILE
                       │
             ┌─────────┴─────────┐
             │                   │
        Local Database       Triage Model
             │                   │
        Report Queue          TFLite
             │                   │
             └─────────┬─────────┘
                       │
                 Connectivity
                     Check
                       │
              ┌────────┴────────┐
              │                 │
            Offline           Online
              │                 │
        Keep in Queue       Upload Report
                                │
                                ▼
                             Backend
```

## Local report lifecycle

``` text
CREATE
  ↓
TRIAGE
  ↓
SAVE LOCAL
  ↓
QUEUED
  ↓
SYNCING
  ↓
SYNCED
```

If synchronization fails:

``` text
SYNCING
   ↓
FAILED
   ↓
RETRY
```

Never delete the local copy until successful server acknowledgement.

------------------------------------------------------------------------

# 10. Language Support

The mobile app should have a visible language toggle.

Prototype languages can be:

-   English
-   Hindi

The architecture should make adding Assamese/Bengali later
straightforward.

Example:

``` text
Profile
   ↓
Language
   ├── English
   └── Hindi
```

All UI strings should come from localization files rather than being
hard-coded inside screens.

------------------------------------------------------------------------

# 11. Official Web Dashboard

## Main purpose

The dashboard is for monitoring and understanding the epidemiological
situation.

It should be **data-dense**, unlike the mobile application.

Primary areas:

``` text
Dashboard
Cases
Forecasts
Assistant
Settings
```

No response-team dispatch workflow is required for this prototype.

------------------------------------------------------------------------

# 12. Web Navigation

Use a desktop sidebar.

``` text
┌──────────────────────┬──────────────────────────────┐
│                      │                              │
│  HEALTH MONITOR      │          Main Content        │
│                      │                              │
│  Dashboard           │                              │
│  Cases               │                              │
│  Forecasts           │                              │
│  Assistant           │                              │
│                      │                              │
│  ───────────────     │                              │
│  Settings            │                              │
│                      │                              │
│  Profile             │                              │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

------------------------------------------------------------------------

# 13. Dashboard Home

The dashboard home is centered around the map.

``` text
┌─────────────────────────────────────────────────────┐
│ Header: District | Date Range | Search | Profile   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  KPI 1       KPI 2        KPI 3                    │
│  Active      Cases        High Risk                 │
│  Alerts      This Week    Areas                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│                RISK HEATMAP                         │
│                                                     │
│       Green / Amber / Red regions                   │
│                                                     │
│                         ┌─────────────────────┐      │
│                         │ Filters             │      │
│                         │ District            │      │
│                         │ Disease             │      │
│                         │ Risk                │      │
│                         └─────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The existing product plan also places the Leaflet heatmap at the center
of the dashboard, with KPIs and floating filters around it.

------------------------------------------------------------------------

# 14. Cases Page

Purpose:

Allow officials to inspect submitted reports.

``` text
Cases
│
├── Search
├── District Filter
├── Disease Filter
├── Risk Filter
├── Date Filter
│
└── Case Table
      ├── Report ID
      ├── Date
      ├── Location
      ├── Symptoms
      ├── Risk
      └── Status
```

Clicking a case opens a detail drawer.

Do not force the user away from the table/map unnecessarily.

------------------------------------------------------------------------

# 15. Case Detail

Show:

``` text
Case Details

Risk
RED

Location
Village / Health Center

Symptoms
High Fever
Vomiting
Dehydration

Reported
Date + Time

ASHA Worker
Worker ID

Triage
Risk classification + relevant guidance
```

The dashboard is view-only, so avoid unnecessary action buttons such as:

-   Assign Team
-   Dispatch Team
-   Send Alert
-   Change Patient Status

------------------------------------------------------------------------

# 16. Forecast Page

Purpose:

Show predicted outbreak risk for a village or cluster.

Flow:

``` text
Forecasts
    ↓
Select District
    ↓
Select Village / Cluster
    ↓
Select Disease
    ↓
View 7–14 Day Forecast
```

Display:

-   Risk probability
-   Risk category
-   Historical trend
-   Forecast line
-   Confidence band if available
-   Contributing factors

Possible contributing factors:

-   Rainfall
-   Temperature
-   Humidity
-   Recent symptom incidence

The blueprint specifies a 7--14 day village/cluster forecast and
identifies symptom counts plus precipitation, temperature, and humidity
as the major feature inputs.

------------------------------------------------------------------------

# 17. RAG Clinical Assistant

Available on both platforms, but secondary.

``` text
Assistant
   ↓
User asks question
   ↓
Retrieve relevant medical guideline
   ↓
Generate grounded answer
   ↓
Show answer
   ↓
Show source document + page
```

Example:

``` text
Question:
Patient has severe dehydration. What should be done?

Answer:
[Guideline-grounded response]

Source:
IDSP National Guidelines
Page 14
```

The important product rule is:

**Never present the AI response as an unexplained medical answer.**

Show the source reference.

------------------------------------------------------------------------

# 18. Web vs Mobile

  Area                  Mobile              Web
  --------------------- ------------------- -------------------
  User                  ASHA worker         Health official
  Primary goal          Report + triage     Monitor
  Connectivity          Offline-first       Online
  Main screen           Report              Risk dashboard
  Main CTA              New Report          Explore Risk
  Navigation            Bottom tabs         Sidebar
  Density               Low                 High
  Risk classification   On-device           Displayed
  Sync                  Core feature        Background result
  Heatmap               No                  Yes
  Forecast              No                  Yes
  Case table            No                  Yes
  RAG                   Primary/secondary   Secondary
  Language toggle       Yes                 English initially
  Dispatch actions      No                  No

------------------------------------------------------------------------

# 19. Shared Product Rules

These must remain identical between platforms.

## Risk taxonomy

``` text
GREEN  → Low Risk
AMBER  → Medium Risk
RED    → High Risk
```

## Shared data

Both applications should ultimately use the same backend entities:

``` text
Worker
Health Center
Symptom Report
Triage Result
Outbreak Prediction
Disease
Location
```

## Shared states

``` text
Loading
Success
Error
Empty
Offline
Synced
Failed
```

------------------------------------------------------------------------

# 20. Component Structure

## Mobile components

``` text
mobile/components/
│
├── AppButton
├── SymptomCard
├── RiskBadge
├── TriageResult
├── ReportStepIndicator
├── SyncStatusBadge
├── SyncQueueItem
├── LanguageSelector
├── ChatMessage
├── SourceCitation
├── EmptyState
├── LoadingState
└── OfflineBanner
```

## Web components

``` text
web/components/
│
├── AppShell
├── Sidebar
├── TopBar
├── KPICard
├── RiskBadge
├── RiskMap
├── MapMarker
├── FilterPanel
├── CaseTable
├── CaseDrawer
├── ForecastChart
├── RiskLegend
├── ChatPanel
├── SourceCitation
├── AlertToast
├── EmptyState
└── LoadingState
```

------------------------------------------------------------------------

# 21. Backend Structure

The backend connects the two applications.

``` text
backend/
│
├── API
│   ├── auth
│   ├── reports
│   ├── triage
│   ├── sync
│   ├── cases
│   ├── predictions
│   └── rag
│
├── Services
│   ├── ReportService
│   ├── SyncService
│   ├── PredictionService
│   └── RAGService
│
├── Models
│   ├── Worker
│   ├── HealthCenter
│   ├── SymptomReport
│   ├── TriageResult
│   └── OutbreakPrediction
│
└── Database
    ├── PostgreSQL
    └── PostGIS
```

------------------------------------------------------------------------

# 22. Suggested API Structure

``` text
/v1/auth
    POST /login

/v1/reports
    POST /
    GET /
    GET /{id}

/v1/sync
    POST /reports

/v1/cases
    GET /
    GET /{id}

/v1/predictions
    GET /
    GET /{location}

/v1/rag
    POST /query
```

The mobile application should not directly access PostgreSQL.

``` text
Mobile
   ↓
FastAPI
   ↓
PostgreSQL
```

Likewise:

``` text
Web
   ↓
FastAPI
   ↓
PostgreSQL / PostGIS
```

------------------------------------------------------------------------

# 23. Database Concept

Core entities:

``` text
HEALTH_CENTER
     │
     ├──────── SYMPTOM_REPORT
     │                │
     │                └── TRIAGE_RESULT
     │
     └──────── OUTBREAK_PREDICTION
```

Example report:

``` text
SymptomReport
├── report_id
├── worker_id
├── center_id
├── patient_age
├── fever
├── diarrhea
├── vomiting
├── symptom_onset
├── location
└── created_at
```

The original blueprint already defines PostgreSQL/PostGIS tables for
health centers, symptom reports, and outbreak predictions.

------------------------------------------------------------------------

# 24. AI Components

There are three separate AI capabilities.

## AI 1 --- Offline Triage

``` text
Symptoms
   ↓
On-device classifier
   ↓
Green / Amber / Red
```

This must work without internet.

Prototype implementation can use a lightweight classifier exported to a
mobile-compatible format.

------------------------------------------------------------------------

## AI 2 --- Clinical RAG

``` text
Question
   ↓
Embedding
   ↓
Qdrant
   ↓
Relevant guideline sections
   ↓
LLM
   ↓
Grounded response + citation
```

Medical knowledge should come from the selected official guideline
corpus.

------------------------------------------------------------------------

## AI 3 --- Outbreak Forecast

``` text
Historical Symptoms
       +
Weather Data
       ↓
Forecast Model
       ↓
Risk Probability
       ↓
Village / Cluster
       ↓
Dashboard Map
```

For the prototype, the forecast can be demonstrated with a trained/demo
model and precomputed results where full model training is impractical.

------------------------------------------------------------------------

# 25. Recommended Project Folder Structure

``` text
smart-health-monitor/
│
├── web/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── cases/
│   │   ├── forecasts/
│   │   └── assistant/
│   ├── lib/
│   ├── hooks/
│   └── public/
│
├── mobile/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── reports/
│   │   ├── triage/
│   │   ├── sync/
│   │   ├── assistant/
│   │   └── profile/
│   ├── db/
│   ├── models/
│   ├── hooks/
│   └── assets/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── core/
│   ├── migrations/
│   └── tests/
│
├── ai/
│   ├── triage/
│   ├── forecast/
│   └── rag/
│
├── shared/
│   ├── types/
│   ├── constants/
│   └── risk/
│
├── database/
│   ├── schema/
│   └── seed/
│
└── docs/
    ├── product/
    ├── ux/
    ├── architecture/
    └── api/
```

------------------------------------------------------------------------

# 26. Build Order

Do NOT start by building every screen independently.

Build one complete vertical slice first.

## Phase 1 --- Design Foundation

Build:

-   Colors
-   Typography
-   Risk states
-   Buttons
-   Cards
-   Inputs
-   Navigation
-   Loading/error/offline states

Output:

**Shared design system**

------------------------------------------------------------------------

## Phase 2 --- Mobile Report Flow

Build:

``` text
Login
 ↓
Report Home
 ↓
New Report
 ↓
Symptoms
 ↓
Duration
 ↓
Triage
 ↓
Result
 ↓
Save
```

Do not build the entire assistant or profile first.

------------------------------------------------------------------------

## Phase 3 --- Offline Queue

Add:

``` text
Save locally
 ↓
Queue
 ↓
Offline indicator
 ↓
Connectivity detection
 ↓
Sync
 ↓
Synced
```

This is one of the most important prototype features.

------------------------------------------------------------------------

## Phase 4 --- Backend

Connect:

``` text
Mobile
  ↓
API
  ↓
Database
```

Verify that a real report can travel through the complete pipeline.

------------------------------------------------------------------------

## Phase 5 --- Web Dashboard

Build:

``` text
Dashboard
 ↓
Map
 ↓
Cases
 ↓
Case Detail
```

At this point the complete vertical slice becomes:

``` text
ASHA
 ↓
Report
 ↓
Offline Triage
 ↓
Sync
 ↓
Backend
 ↓
Database
 ↓
Official Dashboard
 ↓
Case appears
```

This should be your first fully working demo.

------------------------------------------------------------------------

## Phase 6 --- Forecast

Add:

``` text
Forecast Model
 ↓
Predictions API
 ↓
Forecast Page
 ↓
Map Risk Layer
```

------------------------------------------------------------------------

## Phase 7 --- RAG Assistant

Add:

``` text
Guidelines
 ↓
Embeddings
 ↓
Qdrant
 ↓
LLM
 ↓
RAG Assistant
```

------------------------------------------------------------------------

## Phase 8 --- Language Support

Add localization:

``` text
English
Hindi
```

Structure it so Assamese/Bengali can be added later.

------------------------------------------------------------------------

## Phase 9 --- Polish

Add:

-   Animations
-   Haptic feedback where appropriate
-   Better empty states
-   Better loading states
-   Sync animation
-   Triage reveal animation
-   Map transitions
-   Responsive behavior
-   Error handling

------------------------------------------------------------------------

# 27. What MUST Work in the Prototype

These are the highest-priority features.

### Must work

-   ASHA login/demo login
-   Create symptom report
-   Offline report creation
-   Offline Green/Amber/Red triage
-   Local report queue
-   Sync when connection returns
-   Backend report ingestion
-   Database persistence
-   Dashboard case display
-   Risk map
-   Basic forecast visualization
-   Language toggle
-   Clear sync status

### Can be simulated

-   Large-scale forecast training
-   Full authentication infrastructure
-   Push notifications
-   SMS/IVR
-   Real deployment across many districts
-   Real response-team operations

### Future

-   Automated response dispatch
-   Real government-system integration
-   Large-scale multilingual medical corpus
-   Advanced epidemic forecasting
-   Full analytics
-   Production-grade identity/role management
-   National-scale deployment

------------------------------------------------------------------------

# 28. The Demo Path

The entire hackathon demonstration should ideally follow this sequence:

``` text
1. Open ASHA App
       ↓
2. Select Hindi/English
       ↓
3. Create patient report
       ↓
4. Turn OFF internet
       ↓
5. Submit symptoms
       ↓
6. Instant RED/AMBER/GREEN result
       ↓
7. Report saved locally
       ↓
8. Show "Pending Sync"
       ↓
9. Turn internet ON
       ↓
10. Report synchronizes
       ↓
11. Open Official Dashboard
       ↓
12. New case appears
       ↓
13. Open location on map
       ↓
14. Show risk/forecast
       ↓
15. Optionally demonstrate RAG assistant
```

This demonstrates the project's actual value rather than just showing
disconnected screens.

------------------------------------------------------------------------

# 29. Design Priorities

When deciding between two UI ideas, use these rules.

## Mobile

**Speed \> visual decoration**

**Clarity \> information density**

**Offline trust \> animations**

**Large controls \> compact layouts**

## Web

**Information density \> simplicity**

**Spatial context \> individual cards**

**Monitoring \> unnecessary actions**

**Map + cases + forecasts \> decorative dashboard widgets**

------------------------------------------------------------------------

# 30. Final Architecture

``` text
                       ┌─────────────────────┐
                       │   ASHA MOBILE APP   │
                       │                     │
                       │ Report              │
                       │ Offline Triage      │
                       │ Local Queue         │
                       │ Sync                │
                       │ RAG Assistant       │
                       └──────────┬──────────┘
                                  │
                              REST API
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │      FASTAPI        │
                       │                     │
                       │ Auth                │
                       │ Reports             │
                       │ Sync                │
                       │ Predictions         │
                       │ RAG                 │
                       └──────────┬──────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ PostgreSQL   │  │   Qdrant     │  │ Forecast     │
        │ + PostGIS    │  │ Medical RAG  │  │ Model        │
        └──────┬───────┘  └──────────────┘  └──────┬───────┘
               │                                    │
               └────────────────┬───────────────────┘
                                ▼
                     ┌─────────────────────┐
                     │ OFFICIAL WEB APP    │
                     │                     │
                     │ Risk Dashboard      │
                     │ Heatmap             │
                     │ Cases               │
                     │ Forecasts           │
                     │ RAG Assistant       │
                     └─────────────────────┘
```

------------------------------------------------------------------------

# 31. The One Rule for the Team

If a proposed feature does not strengthen this story:

**Field observation → immediate triage → reliable synchronization →
epidemiological monitoring**

then it should probably **not be a priority for the first prototype**.

Build the vertical slice first. Once that works end-to-end, add
forecasting, RAG, multilingual support, and visual polish around it.

That will produce a coherent product instead of two attractive apps that
happen to share a backend.
