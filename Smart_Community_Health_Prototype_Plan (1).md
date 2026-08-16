# Smart Community Health Monitoring & Early Warning System
## Comprehensive Web + Mobile Prototype Plan (SIH25001)

---

## 1. Project Understanding

### 1.1 Core Problem
ASHA workers in remote NE India log symptom data on paper; by the time it reaches central health authorities, outbreaks (Dengue, Cholera, Typhoid) have already spread. There's no predictive layer, no grounded clinical decision support, and no offline-first tooling for zero-connectivity zones.

### 1.2 Target Users (two distinct personas — this drives the whole architecture)
- **ASHA / frontline health worker (Mobile, offline-first)**: Low digital literacy, intermittent connectivity, needs speed and simplicity over density. Primary actions: log symptoms, get instant triage guidance, sync when online.
- **Health official / district administrator (Web dashboard)**: Desk-based, always online, needs data density — heatmaps, trend charts, risk lists, drill-downs. Primary actions: monitor outbreak risk, review flagged cases, dispatch response.

### 1.3 Main User Journeys
1. **ASHA logs a symptom report** → offline classifier gives instant Green/Amber/Red tag → queued for sync → syncs when connectivity returns.
2. **ASHA asks a clinical question** ("patient has severe dehydration, what next?") → RAG system returns grounded protocol with source citation.
3. **Official opens dashboard** → sees live risk heatmap → drills into a village cluster → sees 7–14 day forecast → dispatches alert/resource.
4. **System auto-generates risk predictions** weekly from aggregated symptom + weather data → surfaces on the map.

### 1.4 Core Features (prototype scope)
| Feature | Mobile | Web |
|---|---|---|
| Symptom report logging (offline-capable) | ✅ Primary | — |
| Offline Green/Amber/Red triage (on-device) | ✅ Primary | — |
| RAG clinical assistant (chat) | ✅ | ✅ (secondary) |
| Sync queue / status indicator | ✅ Primary | — |
| Outbreak risk heatmap (Leaflet) | — | ✅ Primary |
| 7–14 day forecast per village/cluster | — | ✅ Primary |
| Case list + filters (disease, district, risk) | — | ✅ Primary |
| Alert/dispatch workflow | — | ✅ |
| Auth (ASHA ID login / official login) | ✅ | ✅ |

### 1.5 MVP / Prototype Scope
For a hackathon-grade **prototype**, real vs. mocked matters more than feature count:
- **Real**: UI/UX flows end-to-end, offline-first sync simulation, a working RAG demo on a small manual excerpt, one live forecast model demo (even on synthetic data), Postgres schema wired to at least the reporting flow.
- **Mocked/simulated**: full LSTM training pipeline (show one trained demo model + pre-computed results for other regions), SMS/IVR fallback, full authentication/roles (can be simplified to a role switcher), push notification delivery (can be simulated in-app).

### 1.6 Technical Assumptions & Open Questions
**Assumptions**: single language (English) UI for prototype, English-only medical corpus for RAG demo, judges will see a live demo not real users, network can be toggled off to demonstrate offline mode.

**Open questions to resolve before build:**
- Is a live LSTM inference needed, or is a pre-computed forecast + "regenerate" button acceptable for the demo?
- Will ASHA app support regional languages (Assamese, Bengali, etc.) even at prototype stage, or English-only?
- Is patient data collection subject to any consent/PII handling requirement for the demo, or purely synthetic data?
- Single combined app with role-based views, or two separate apps (mobile for ASHA, web for officials) as the tech stack table implies? *(This plan assumes two separate apps, per your stack table.)*

---

## 2. Phased Product & Development Plan

| Phase | Objectives | Key Deliverables | Tools | Complexity | Exit Criteria |
|---|---|---|---|---|---|
| **1. Product Definition** | Lock personas, journeys, MVP scope | This doc, feature matrix, open-questions resolved | Notion/Docs | Low | Scope signed off by team |
| **2. UX / User Flows** | Map every screen-to-screen flow | Flow diagrams (ASHA + official) | FigJam/Whimsical | Low–Med | Flows reviewed, no dead ends |
| **3. Information Architecture** | Define data entities, navigation trees | Sitemap, entity-relationship diagram | FigJam | Low | IA matches DB schema |
| **4. Design System** | Tokens, components, states | Figma library, Storybook (optional) | Figma, Figma AI | Med | Components cover 90% of screens |
| **5. Web Prototype** | Build official dashboard | Next.js app, map, charts, mock API | Next.js, Tailwind, shadcn | Med–High | All core screens navigable |
| **6. Mobile Prototype** | Build ASHA app | Expo app, offline queue, triage demo | Expo/React Native | Med–High | Offline flow demoable |
| **7. Backend/API Mock** | Serve realistic data to both apps | FastAPI + mock/real endpoints | FastAPI, Postgres | Med | Both apps hit real endpoints |
| **8. AI Integration** | RAG demo, forecast demo, edge classifier | Working RAG query, 1 forecast, .tflite stub | HF API, Qdrant, Colab | High | 3 AI features demoable live |
| **9. Testing & Refinement** | Fix flow breaks, polish interactions | Bug list, refined micro-interactions | Manual QA | Med | No broken flows in demo path |
| **10. Demo Prep** | Script, rehearse, fallback plan | Slide deck, demo script, recorded backup | Canva/PPT, screen recorder | Low–Med | Full run-through under time limit |

**Sequencing rule**: Phases 1–4 are strictly sequential (each depends on the last). Phases 5 and 6 can run **in parallel** once phase 4 delivers the design system, since they share tokens but not code. Phase 7 should start alongside 5/6, not after. Phase 8 (AI) is the highest-risk phase — start a spike on it as early as phase 2, in parallel, so you're not discovering LLM/RAG integration problems on day 3 of a 1-day hackathon.

---

## 3. Frontend & Visual Design Direction

### 3.1 Philosophy: two apps, two moods
This product has a rare, genuine UX split — lean into it rather than reusing one visual language everywhere:
- **ASHA mobile app**: **High clarity, low density, high contrast, large touch targets.** Minimal ornamentation. This is a field tool used in bright sunlight, sometimes with shaking hands, by someone who wants to complete a task in 20 seconds. Glassmorphism, blur, and translucency are *actively harmful* here — they reduce contrast exactly where you need it most. Flat, opaque, high-contrast cards; bold color-coded risk states (Green/Amber/Red as literal, unambiguous UI states, not just accents).
- **Official web dashboard**: **Data-dense, layered, premium.** This is where glassmorphism, blur, and elevation genuinely earn their place — floating filter panels over a map, translucent overlays on heatmaps, layered side panels that don't fully obscure the map underneath. The user is stationary, well-lit, and needs to hold spatial context (the map) while manipulating controls on top of it.

**Rule of thumb applied consistently**: glass/blur only when a surface floats *over* something the user needs to keep visual continuity with (map, chart, background content). Never on primary data-entry forms, never on the mobile triage flow, never where legibility is safety-critical.

### 3.2 Color System
- **Semantic risk colors are the backbone of the whole product** — define them once, use everywhere identically:
  - Green `#16A34A` (low risk) / Amber `#F59E0B` (medium) / Red `#DC2626` (high) — WCAG AA-checked against both light backgrounds and dark map overlays.
- **Web (official) palette**: deep navy/slate base (`#0B1220` dark mode, `#F8FAFC` light mode surfaces), a single confident accent (teal `#0D9488` or indigo `#4F46E5`) for interactive elements, neutral grays for structure.
- **Mobile (ASHA) palette**: warmer, higher-contrast, fewer colors total — white/near-white surfaces, one accent, and the three risk colors doing most of the communicative work.
- Both apps share the same risk-color tokens (non-negotiable — an Amber in the field must mean the same Amber on the dashboard).

### 3.3 Typography
- **Web**: Inter or Geist for UI text (excellent at small sizes/data density); a slightly warmer secondary (e.g., Public Sans) only if you want a "civic/government-trustworthy" feel for headers.
- **Mobile**: Same family as web (Inter) but with a **larger base scale** (18px body minimum vs. 14–16px on web) — legibility for outdoor/low-literacy contexts outweighs information density.
- Type scale: 12/14/16/18/20/24/32/40 (px), 1.25–1.5 line-height for body, tighter for numerals in data tables/charts.

### 3.4 Spacing, Radius, Elevation
- **Spacing**: 4px base unit, scale 4/8/12/16/24/32/48/64.
- **Radius**: Web — 8px (cards), 12px (modals/panels), 999px (pills/badges). Mobile — larger, 16px cards, 999px for the risk-tag chips (the single most important visual element in the app should read instantly).
- **Elevation (web only)**: 3-tier shadow system — resting (subtle), raised (hover/active panels), floating (modals, the glassmorphic filter panel over the map). Mobile uses flat elevation + color, not shadow, to preserve outdoor legibility.

### 3.5 Component Library (shared conceptually, implemented per-platform)
Cards, risk badges, data tables (web), list rows (mobile), map with clustering, filter sidebar (web) / bottom sheet (mobile), forecast chart (line/area, web), symptom report form (mobile, chunked into steps not one long form), sync-status indicator (mobile — persistent, unmissable), RAG chat bubble UI (both), toast/alert system, empty/loading/offline states (critical — design these explicitly, not as an afterthought).

### 3.6 Motion Principles
- **Web**: purposeful, moderate (200–300ms) — panel slide-ins, map marker pulse on new high-risk report, chart transitions on filter change. Motion should communicate *state change*, not decorate.
- **Mobile**: fast and confident (150–200ms) — this app must feel instantaneous. The one motion moment worth investing real design time in: the **triage result reveal** (symptom form → risk classification), since that's the emotional payoff moment of the entire app. Also: a satisfying, unambiguous "queued for sync" → "synced" transition, since trust in the offline queue is core to adoption.

### 3.7 Responsive Breakpoints (web)
`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536` — but design the dashboard **desktop-first** (officials use it on desktop/laptop); tablet is a secondary target, phone-web is out of scope for the prototype (the phone experience *is* the native mobile app).

---

## 4. Web Prototype — Stack & Structure

### 4.1 Stack Recommendation
**Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion (Motion) + Leaflet.js + Recharts.**

| Option | Verdict | Why |
|---|---|---|
| Next.js | ✅ Recommended | File-based routing, server components for data-heavy dashboard pages, trivial Vercel deploy matches your stated free-tier target |
| Plain React (CRA/Vite) | Skip | No real benefit over Next.js for this use case; you'd rebuild routing/deploy conveniences by hand |
| TypeScript | ✅ Required, not optional | Your schema (symptom reports, predictions) has real shape; catching field-name mismatches at compile time saves hackathon hours |
| Tailwind CSS | ✅ Recommended | Fastest path to the premium, consistent design system in section 3 |
| shadcn/ui | ✅ Recommended | Unstyled-but-accessible primitives you fully own and can restyle to match your (non-generic) design system — avoids the "obviously a template" look |
| Framer Motion (Motion) | ✅ Recommended, used sparingly | For the panel/marker/chart transitions in 3.6 |
| Three.js | ❌ Skip | No genuine use case here — a 2D risk heatmap doesn't need 3D; adding it would be complexity without payoff |
| Leaflet.js | ✅ Required | You already specified it; free, lightweight, excellent for choropleth/heatmap + clustering |

### 4.2 Page Structure & Navigation
```
/                     → Login / role select
/dashboard            → Home: risk heatmap + summary KPIs (default landing)
/dashboard/cases      → Case list, filterable (disease, district, risk, date)
/dashboard/cases/[id] → Case detail
/dashboard/forecasts  → 7–14 day forecast explorer per village/cluster
/dashboard/assistant  → RAG clinical assistant (secondary surface)
/dashboard/settings   → Districts, thresholds, notification prefs
```
Persistent left sidebar nav (collapsible) + top bar with global search and district/date-range filters that persist across the dashboard sub-pages.

### 4.3 Core Screens
1. **Heatmap home** — full-bleed Leaflet map, floating (glassmorphic) filter panel top-left, KPI strip top-right (active alerts, cases this week, districts at high risk), marker clustering with risk-color coding.
2. **Case list** — dense table, sortable, risk-badge column, quick-filter chips, row click → detail drawer (not full navigation — keeps map context if opened from map).
3. **Forecast explorer** — village/cluster picker → line/area chart of risk probability over next 7–14 days, confidence band, contributing factors (rainfall, temp, humidity) as small multiples underneath.
4. **RAG assistant** — chat interface, each answer shows source citation (document + page) as a collapsible reference chip — this *is* the "hallucination-free" story, make it visually explicit.

### 4.4 Reusable Components
`RiskBadge`, `MapMarkerCluster`, `FilterPanel` (glass), `KPICard`, `ForecastChart`, `CaseTable`, `CaseDrawer`, `ChatBubble`+`SourceCitation`, `EmptyState`, `AlertToast`.

### 4.5 Responsive Behavior
Sidebar collapses to icon-only at `lg`; filter panel becomes a full-width top sheet below `md`; table becomes stacked cards below `md`. Given the desktop-first assumption (4.7 above), phone breakpoints just need to be "not broken," not optimized.

---

## 5. Mobile Prototype — Stack & Structure

### 5.1 Stack Recommendation
**Expo (React Native) + TypeScript + NativeWind (Tailwind for RN) + expo-sqlite (offline cache) + Reanimated.**

| Option | Verdict | Why |
|---|---|---|
| React Native / Expo | ✅ Recommended for prototype | Fastest path to a polished, installable demo on real devices/judge phones via Expo Go or EAS build; strong offline/local-storage story with expo-sqlite; shares TS types and design tokens with the Next.js web app |
| Flutter | Viable alternative, not recommended here | Excellent for polish and offline (matches your original doc's Flutter+sqflite choice) — but forces a second language (Dart) and zero code/type sharing with your web stack; only pick this if your team already has strong Flutter skills |
| Native iOS/Android | ❌ Skip for prototype | Far too slow to build two native codebases in hackathon timelines |

*Note: your uploaded blueprint specifies Flutter — that's a legitimate, defensible choice if the team already knows Dart well and wants to stay closest to a production-realistic offline architecture. Expo is the better call specifically **for prototyping speed and TypeScript code-sharing with the web dashboard**; treat this as the one open decision to make as a team before Phase 5/6 kicks off.*

### 5.2 Navigation
Bottom tab bar (Report / Assistant / Sync Status / Profile) — flat, shallow hierarchy. No deep nested stacks; ASHA workers should never be more than 2 taps from logging a report.

### 5.3 Core Screens
1. **New report** — chunked, single-question-per-screen (not one long form) with big tap targets: symptoms (multi-select icons), duration, onset date, patient basics. Ends in an **immediate on-device risk reveal** (Green/Amber/Red) before any network call.
2. **Assistant (RAG chat)** — same chat pattern as web, degrades gracefully offline (shows cached/common protocols, or a clear "needs connection" state rather than failing silently).
3. **Sync status** — a persistent, always-visible queue indicator (badge on tab bar + dedicated screen) showing pending/synced reports. This screen is disproportionately important for trust — design it like a delivery-tracking screen, not a settings page.
4. **Profile/district** — worker ID, assigned center, simple stats (reports this week).

### 5.4 Gestures & Interactions
Swipe-to-dismiss on toasts, pull-to-refresh on sync screen, haptic feedback on risk-result reveal (distinct haptic per Green/Amber/Red if the platform supports it — reinforces the result non-visually, useful in bright sunlight), large primary CTA buttons fixed to the bottom of the screen (thumb-reachable).

### 5.5 Shared vs. Independent
- **Shared**: color tokens, risk taxonomy/logic, TypeScript types for API payloads, RAG chat component *pattern* (not code, since RN/Next render differently), API client logic.
- **Independent**: navigation paradigm (tabs vs. sidebar), density, motion timing, form patterns (chunked mobile vs. single-page web), glassmorphism usage (web only).

---

## 6. AI Tools by Stage

| Stage | Recommended Tool(s) | Best for | Avoid using for | Cost |
|---|---|---|---|---|
| Product research/planning | Claude (Opus/Sonnet), ChatGPT | Structuring ambiguous requirements, this doc, competitive analysis | Final UX decisions without human review | Paid tiers for best quality |
| UX/UI design | Figma + Figma AI | Rapid layout variants, restyling components | Producing final pixel-perfect brand identity untouched | Figma free tier + paid AI credits |
| Wireframing | Figma, Whimsical, or Claude (text-based flow descriptions) | Fast low-fidelity flow validation | Skipping wireframes entirely and jumping to hi-fi | Free–low cost |
| UI generation | v0 (Vercel), Figma AI | Generating first-draft React/Tailwind screens from prompts/designs, fast scaffolding | Final production code without review — always refactor into your design system | Free tier + paid |
| Frontend coding | **Claude Code** or Cursor | Implementing the actual Next.js/Expo apps against your design system, multi-file refactors, wiring API calls | Generating novel visual design decisions (feed it your design system instead) | Paid (usage-based/subscription) |
| Mobile development | Claude Code / Cursor (same as above, RN-aware) | Expo app logic, offline queue, native module glue | Complex native-module debugging without device testing | Paid |
| Backend/API generation | Claude Code / Cursor | FastAPI routes, Postgres/PostGIS queries, Qdrant integration glue code | Trusting generated SQL migrations without review (data safety) | Paid |
| Image/visual asset generation | Any current image model your team has access to (check current availability — model landscape changes fast) | Hero illustrations, empty-state art, demo backdrop imagery | Icons (use an icon library instead — inconsistent style otherwise) | Varies |
| Icons/illustrations | Lucide (icon library), unDraw/Humaaans (illustration sets) | Consistent, free, on-brand iconography | AI-generating icons one at a time (inconsistent stroke/weight) | Free |
| Testing/debugging | Claude Code / Cursor | Reading stack traces, writing test cases, catching offline-sync edge cases | Replacing manual on-device testing of offline mode — must test for real | Paid |
| Documentation | Claude/ChatGPT | README, API docs, judge-facing one-pager | — | Free–paid |
| Code review | Claude Code, GitHub Copilot review, CodeRabbit | Catching schema mismatches, security issues in a rushed hackathon codebase | Sole reviewer on anything touching patient data handling | Free–paid |
| Deployment | Vercel (web), EAS/Expo (mobile), Render/Koyeb (API) | One-command deploys matching your zero-cost stack | — | Free tiers |

**Don't-recommend-because-popular calls**: Skip Bolt/Lovable for this project specifically — they're strong for single-shot full-stack scaffolds of *simple* CRUD apps, but this product's differentiators (offline-first sync, on-device TFLite classifier, RAG with citations, geospatial map) are exactly the parts those tools handle worst; you'd spend more time fighting the scaffold than you'd save. Use v0 narrowly for isolated UI screens, not the whole app.

---

## 7. Recommended AI-Powered Workflow

```
Idea (this doc)
   → Product definition (Claude, human review)
   → UX flows (Whimsical/FigJam, human-led)
   → UI design system + key screens (Figma + Figma AI, human-led)
   → UI-to-code first draft (v0, for isolated dashboard/screen components)
   → Real implementation + wiring (Claude Code, iterative, in your actual repo)
   → Backend/API + AI integration glue (Claude Code)
   → Testing on real devices, especially offline mode (manual, human)
   → Refinement (Claude Code for fixes, human for taste/polish calls)
   → Deployment (Vercel/EAS/Render — scripted, low-AI-involvement)
   → Demo prep (Claude for script/one-pager, human for delivery/rehearsal)
```
**Handoff rule**: never hand raw AI-generated UI (from v0/Figma AI) directly to users — always route it through the "real implementation" step where a human reconciles it against the section-3 design system, or you'll end up with a visibly inconsistent, template-y product (the opposite of your stated "premium, polished" goal).

---

## 8. Architecture (Prototype-Practical, Extensible)

- **Frontend (web)**: Next.js on Vercel, calling FastAPI via REST (typed with a shared OpenAPI spec if time allows).
- **Mobile**: Expo app, local `expo-sqlite` queue for offline reports, background sync task on reconnect, bundled TFLite (or ONNX-equivalent) model for on-device Green/Amber/Red triage.
- **Backend**: FastAPI (Render/Koyeb) — REST endpoints for reports, predictions, RAG queries; async where it touches the LLM/vector calls.
- **Database**: PostgreSQL + PostGIS (Railway/Aiven) per your original schema — this part of your blueprint is already solid and production-realistic; keep it as-is.
- **Vector DB**: Qdrant Cloud free tier for the medical-manual embeddings.
- **Auth**: For a prototype, a **simplified JWT auth with two hardcoded roles** (ASHA / official) is sufficient — don't over-invest in a full auth provider (Auth0/Clerk) unless the team has spare time; it demos identically either way.
- **API layer**: Single FastAPI service, versioned routes (`/v1/...`), OpenAPI docs auto-generated (useful for both your own frontend work and judge Q&A).
- **State management (web)**: React Query/TanStack Query for server state (maps naturally onto your REST API + caching needs) + minimal local UI state (no need for Redux/Zustand at this scope).
- **State management (mobile)**: Same TanStack Query pattern where online, backed by the local sqlite queue when offline — this is the one place where getting the "single source of truth" model right matters most; design it explicitly (see risk in section 9).
- **File/image storage**: Not core to MVP; if needed (e.g., photo of a symptom/wound), Cloudflare R2 or Supabase Storage free tier.
- **Analytics**: Skip a dedicated analytics vendor for the prototype; log key events (report submitted, sync completed, RAG query) to your own Postgres table — enough for a "here's our usage" demo slide without adding a new vendor dependency.
- **AI APIs**: Hugging Face Inference API (Llama-3-8B-Instruct) for RAG generation, SentenceTransformers for embeddings, Colab-trained LSTM served via FastAPI, TFLite model bundled in the mobile app.

---

## 9. Development Strategy for a Small Team

- **Build first**: the data model + one end-to-end vertical slice (mobile report → API → Postgres → web dashboard shows it live). This proves the architecture and gives you something demoable within hours, before any AI features are wired in.
- **Mock**: LSTM training at scale (train once on Colab, cache results, add a "regenerate" button for theater); SMS/IVR channels; full multi-role auth; push notifications (simulate in-app).
- **Real**: the offline queue and sync (this is your single biggest differentiator — do not fake it), the RAG citation flow on at least one real medical-manual excerpt, the map + risk visualization.
- **Shared between web/mobile**: design tokens, TypeScript API types, risk-color taxonomy, API client patterns.
- **AI-generatable**: boilerplate CRUD routes, component scaffolding, test cases, documentation.
- **Needs human judgment**: the visual design system (section 3), the offline-sync UX (trust-critical), what to say in the demo about clinical safety (do not let AI improvise medical claims in the demo script).
- **Biggest technical risks**: (1) offline sync conflict resolution (what happens if two workers edit overlapping data — decide the merge rule *before* you build it, even if the rule is "last write wins" for the prototype); (2) LLM latency/rate limits on Hugging Face's free inference tier live during a judged demo — **always have a cached fallback response** for your top 3–5 demo queries; (3) TFLite model bundling/build issues on Expo — validate this early, it's the part most likely to eat unplanned hours.
- **Biggest UX risks**: officials' dashboard becoming cluttered as you add features (protect the heatmap home screen's clarity above all else); ASHA app forms feeling long/bureaucratic (chunk aggressively, default/pre-fill wherever possible); the RAG assistant giving an answer with no visible citation (undermines your entire "hallucination-free" pitch — never let this ship unlabeled).

---

## 10. Final Roadmap

| Phase | Deliverables | Priority |
|---|---|---|
| **1. Foundation** | Repo setup, Postgres+PostGIS schema live, FastAPI skeleton, design tokens defined | P0 |
| **2. UX & Design System** | Flows for both apps, Figma component library, risk-color/typography/spacing systems locked | P0 |
| **3. Web Prototype** | Heatmap home, case list, forecast explorer, all wired to mock/real API | P0 |
| **4. Mobile Prototype** | Report flow with on-device triage reveal, sync queue screen, offline demo working | P0 |
| **5. AI Features** | RAG assistant with citations (both apps), one live forecast demo, TFLite classifier bundled | P1 |
| **6. Testing & Polish** | Offline mode tested on real device with airplane mode, micro-interactions refined, empty/error states designed | P1 |
| **7. Demo/Presentation** | Script, slide deck, recorded backup video, rehearsed run-through under time limit | P0 |

---

## Summary Recommendations

1. **Overall tech stack**: Next.js/TS/Tailwind/shadcn (web) + Expo/TS/NativeWind (mobile) + FastAPI + PostgreSQL/PostGIS + Qdrant + Hugging Face Inference, deployed on Vercel/EAS/Render — all free-tier, as originally specified.
2. **Design stack**: Figma (system + Figma AI for variants) → v0 for isolated first-draft screens → Claude Code for real implementation against the system in section 3.
3. **AI stack**: Claude Code for building, HF Inference + Qdrant for the RAG feature, Colab-trained LSTM for forecasting, TFLite for edge triage.
4. **Development workflow**: vertical slice first, design system before screens, AI features developed in parallel from day one (not bolted on last), offline-sync built and tested for real.
5. **MVP priorities**: offline report + on-device triage (mobile) and live heatmap + RAG citations (web) are the non-negotiable demo beats; forecast chart and case-list polish are second-tier.
6. **Biggest mistakes to avoid**: treating glassmorphism as a default rather than a deliberate choice (wrong on mobile); faking the offline sync instead of building it for real; letting the RAG assistant answer without a visible source citation; leaving AI integration to the last few hours instead of spiking it early.
7. **Suggested folder structure**:
```
/apps
  /web        (Next.js)
  /mobile     (Expo)
/packages
  /design-tokens   (shared colors/type/spacing, consumed by both apps)
  /api-types       (shared TS types for API payloads)
/services
  /api        (FastAPI)
  /ml         (LSTM training notebooks, TFLite export scripts)
/docs
```
8. **Team workflow (2–4 people)**: one person owns mobile, one owns web, one owns backend/AI integration, and (if a 4th) one floats on design system + demo prep — but everyone should touch the design tokens package first, together, before splitting off, so the two apps don't visually diverge.
9. **"Prototype complete" means**: a judge can watch the full vertical slice live — ASHA logs a report offline, sees an instant triage result, goes back online and it syncs, the web dashboard reflects it on the map within seconds, an official asks the RAG assistant a clinical question and gets a cited answer, and the forecast chart shows a believable 7-day risk curve for at least one real or synthetic village — without you needing to explain away a broken flow.
