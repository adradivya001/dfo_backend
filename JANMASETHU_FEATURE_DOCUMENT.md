# Janmasethu Domain - In-Depth Feature Specification

This document provides a detailed breakdown of every module implemented in the **Janmasethu** medical orchestration system. Each feature is defined by its **Definition**, **Purpose**, **Rationale (Why it was implemented)**, and the **Technical Endpoint** used to interact with it.

---
  
## 🏗️ PART 1: BACKEND CORE FEATURES (Control Tower Core)

### 1. Advanced RBAC (Role-Based Access Control)
- **Definition**: A security and visibility layer that restricts data access based on the clinician's role (CRO, Doctor, Nurse).
- **Purpose**: To ensure that only medical staff with the appropriate specialization can view or interact with specific patient categories.
- **Why Implemented**: To prevent "information overload" and clinical noise. Doctors should only see critical `RED` emergencies, while Nurses handle `YELLOW` urgent cases. It also prevents the AI from interfering once a human has established authority.
- **Endpoint**: `GET /janmasethu/threads` (Uses `x-user-role` header for filtering).

### 2. Clinical Context Review (Historical Context)
- **Definition**: A service that reconstructs the full chronological history of messages between a patient and the system.
- **Purpose**: To provide a clinician with the "backstory" of a patient's distress before they send a manual clinical response.
- **Why Implemented**: Medical safety requirement. A clinician cannot safely treat a patient without knowing what has already been discussed or recommended by the AI.
- **Endpoint**: `GET /janmasethu/context/:id` (Returns chronological USER/AI/HUMAN message types).

### 3. Medical SLA (Service Level Agreement) Worker
- **Definition**: A background process managed by `BullMQ` that monitors the time elapsed since a high-priority thread was assigned to a clinician.
- **Purpose**: To track a 5-minute response window for `RED` (Emergency) threads.
- **Why Implemented**: To guarantee that no emergency goes unhandled. If a doctor is busy or misses a notification, the system automatically detects the "breach" and reverts the thread back to the global queue for the CRO to reassign.
- **Endpoint**: Triggered internally via `POST /janmasethu/assign/:id` and monitored via audit logs.

### 4. Hybrid Risk Scoring Engine
- **Definition**: A weighted calculation engine that combines signals from Keywords, BERT Transformers, Sentiment Analysis, and History.
- **Purpose**: To assign a numerical "Risk Score" (0-100) to every incoming message to determine its clinical severity.
- **Why Implemented**: Single-signal detection (like just keywords) is prone to false positives/negatives. Aggregating multiple AI and heuristic signals provides a robust "Safety First" classification.
- **Endpoint**: `POST /janmasethu/channel/webhook` (Internal processing is triggered on message arrival).

### 5. BERT Model Semantic Integration
- **Definition**: Integration with a Deep Learning (BERT) transformer model specialized in clinical intent classification.
- **Purpose**: To understand the *meaning* and *risk level* of an incoming message beyond simple text matching.
- **Why Implemented**: Patients often use varying language to describe symptoms. The BERT model can identify that "I feel a heavy pressure in my chest" is high-risk even if the word "pain" isn't explicitly used.
- **Endpoint**: External `GET /predict` (called asynchronously by `BertRiskAnalyzer`).

### 6. High-Arousal Sentiment Detection
- **Definition**: A lexicon-based detector that identifies emotional distress and "high-arousal" urgency in patient language.
- **Purpose**: To calculate the "Emotional Distress Factor" of a thread.
- **Why Implemented**: A patient who is "scared" or "worried" requires faster human intervention than one who is simply asking for information, even if their symptoms seem similar.
- **Endpoint**: Integrated into the internal `evaluateThreadSentiment` pipeline.

### 7. Human Takeover & AI Suppression
- **Definition**: A locking mechanism that switches ownership from `AI` to `HUMAN` and disables automated responses.
- **Purpose**: To give clinicians exclusive control over the conversation.
- **Why Implemented**: Clinical liability. Once a doctor intervenes, the AI must be silenced to prevent conflicting or dangerous medical advice from being generated automatically.
- **Endpoint**: `POST /janmasethu/take-control/:id`.

---

## 💻 PART 2: FRONTEND CLINICAL DASHBOARD (Janmasethu Dashboard)

### 8. Real-Time Clinical Queues (Polling Architecture)
- **Definition**: High-priority UI views (Doctor Queue, Nurse Queue) that synchronize with the backend every 5 seconds.
- **Purpose**: To provide clinicians with a "Live View" of their assigned cases.
- **Why Implemented**: Clinicians in a hospital environment need "Zero-Click" updates. They cannot afford to manually refresh the page to see if a new emergency has arrived.
- **Endpoint Connectivity**: `GET /janmasethu/threads` (Refetched automatically via `useQuery`).

### 9. Advanced Thread Workspace (3-Pane Clinical Console)
- **Definition**: A high-density clinical workspace replacing basic modals with a three-pane layout (Chat | Context/Journey | Actions).
- **Purpose**: To give clinicians simultaneous visibility into history, AI insights, and clinical management tools.
- **Why Implemented**: Speed of care. Clinicians can review a patient's risk profile and journey stage *while* typing a response, reducing cognitive load and error.
- **Endpoint Connectivity**: `POST /janmasethu/reply`, `GET /janmasethu/context/:id`.

### 10. CRO Assignment Portal & Auto-Assignment
- **Definition**: An administrative tool for the Chief Resident Officer and a smart auto-assignment engine.
- **Purpose**: To balance clinician workloads and ensure the best-fit specialist handles a case.
- **Why Implemented**: Efficient resource allocation. The system can automatically route a "Gestational Diabetes" query to an Endocrinologist if available, or allow the CRO to manually intervene.
- **Endpoint Connectivity**: `POST /janmasethu/assign/:id`, `POST /janmasethu/assign/auto/:id`.

---

## 🏥 PART 3: DIGITAL FRONT OFFICE (DFO) EXTENSIONS

### 11. Unified Patient Identity & Profile
- **Definition**: A master patient index that maps multiple communication channels (WhatsApp, Web) to a single medical profile.
- **Purpose**: To ensure "One Patient, One Record" across the entire Digital Front Office.
- **Why Implemented**: Patients often switch devices or platforms. Tracking their journey requires a persistent medical ID (`patient_id`) regardless of the ingestion channel.
- **Endpoint**: `POST /janmasethu/patients` (Sync/Register).

### 12. Patient Journey Tracker (Longitudinal Evolution)
- **Definition**: A clinical state machine tracking a patient's progression through Fertility, Pregnancy (0-40 weeks), and Postpartum phases.
- **Purpose**: To categorize patients and provide context-specific risk thresholds.
- **Why Implemented**: A "fever" at week 38 of pregnancy is clinically distinct from a fever during the fertility stage. The system must know the patient's current journey stage to assess risk accurately.
- **Endpoint**: `PATCH /janmasethu/patients/:id/journey`.

### 13. Patient-Aware Risk Scoring (Dynamic Context)
- **Definition**: An enhancement to the risk engine that weights BERT scores against the patient's medical history and pregnancy stage.
- **Purpose**: To provide a more precise "Clinical Severity" score.
- **Why Implemented**: To prioritize high-risk patients (e.g., those with a history of pre-eclampsia) higher in the queue even if their current sentiment seems moderate.
- **Endpoint**: `GET /janmasethu/risk/:patient_id` (Returns longitudinal trend logs).

### 14. Integrated Care Delivery (Appointments & Consultations)
- **Definition**: Direct integration of medical scheduling and clinical consultation logging into the chat workspace.
- **Purpose**: To turn conversations into actionable clinical events.
- **Why Implemented**: To close the "Care Loop". Instead of asking a patient to call for an appointment, a nurse can book it directly from the dashboard, and a doctor can start a consultation immediately.
- **Endpoints**: `POST /janmasethu/appointments`, `POST /janmasethu/consultations/start`.

### 15. Clinical Intelligence & SLA Analytics
- **Definition**: A real-time analytics suite for monitoring DFO performance and medical safety KPIs.
- **Purpose**: Provide visibility into response times (SLA), risk distribution, and channel volume.
- **Why Implemented**: To identify operational bottlenecks. If the "Nurse Queue" is consistently breaching its 5-minute SLA, the CRO knows they need to reassign resources.
- **Endpoint**: `GET /janmasethu/analytics/overview`.

---

> [!IMPORTANT]
> **Production Integrity**: Every feature listed above is designed with transactional safety (Supabase atomic updates) to ensure that clinical state remains consistent even under high concurrency.

---
*Updated: 2026-03-27 | DFO v1.2 Release Implementation*
